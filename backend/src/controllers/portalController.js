import { pool } from '../config/database.js';
import {
  ensureDemoSubscription,
  getServicePlans
} from '../services/subscriptionService.js';

export async function dashboard(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [subscription, plans] = await Promise.all([
      ensureDemoSubscription(req.user.sub),
      getServicePlans()
    ]);

    if (subscription.status !== 'active') {
      return res.json({
        mode: 'demo',
        subscription,
        plans,
        stats: { projects: 1, quotes: 0, invoices: 0, tickets: 0 },
        projects: [
          {
            id: 'demo-project',
            name: 'Spilweb Demo Project',
            status: 'demo',
            progress: 68,
            dueDate: null
          }
        ],
        notifications: [
          {
            id: 'demo-welcome',
            title: 'Demo hesabınız hazır',
            message: 'Bir hizmet paketi seçerek satın alma talebi oluşturabilirsiniz.',
            createdAt: new Date().toISOString()
          }
        ]
      });
    }
    const [[stats]] = await pool.execute(
      `SELECT
        (SELECT COUNT(*) FROM projects WHERE customer_id = :customerId AND status != 'archived') AS projects,
        (SELECT COUNT(*) FROM crm_quotes WHERE customer_id = :customerId AND status IN ('draft', 'sent')) AS quotes,
        (SELECT COUNT(*) FROM invoices WHERE customer_id = :customerId AND status IN ('sent', 'overdue')) AS invoices,
        (SELECT COUNT(*) FROM support_tickets WHERE customer_id = :customerId AND status != 'closed') AS tickets`,
      { customerId }
    );

    const [projects] = await pool.execute(
      `SELECT id, name, status, progress, due_date AS dueDate
       FROM projects
       WHERE customer_id = :customerId
       ORDER BY updated_at DESC
       LIMIT 4`,
      { customerId }
    );

    const [notifications] = await pool.execute(
      `SELECT id, title, message, created_at AS createdAt
       FROM customer_notifications
       WHERE customer_id = :customerId
       ORDER BY created_at DESC
       LIMIT 5`,
      { customerId }
    );

    return res.json({ mode: 'active', subscription, plans, stats, projects, notifications });
  } catch (error) {
    return next(error);
  }
}

export async function plans(req, res, next) {
  try {
    return res.json({ data: await getServicePlans() });
  } catch (error) {
    return next(error);
  }
}

export async function requestPlan(req, res, next) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [planRows] = await connection.execute(
      `SELECT id, slug, title_tr AS titleTr, price, currency
       FROM service_plans
       WHERE slug = :slug AND status = 'active'
       LIMIT 1`,
      { slug: req.params.slug }
    );
    const plan = planRows[0];

    if (!plan) {
      const error = new Error('Service plan not found.');
      error.status = 404;
      throw error;
    }

    const customerId = await ensureCustomerWithConnection(connection, req.user.sub);

    await connection.execute(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, requested_at)
       VALUES (:userId, :planId, 'pending', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         plan_id = VALUES(plan_id),
         status = 'pending',
         requested_at = CURRENT_TIMESTAMP,
         activated_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      { userId: req.user.sub, planId: plan.id }
    );

    await connection.execute(
      `INSERT INTO crm_quotes (customer_id, title, amount, currency, status)
       VALUES (:customerId, :title, :amount, :currency, 'sent')`,
      {
        customerId,
        title: `${plan.titleTr} satın alma talebi`,
        amount: plan.price,
        currency: plan.currency
      }
    );

    await connection.commit();
    return res.status(201).json({
      message: 'Your purchase request was received. The service will open after payment confirmation.',
      subscription: await ensureDemoSubscription(req.user.sub)
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function projects(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT id, name, description, status, priority, progress, start_date AS startDate, due_date AS dueDate
       FROM projects
       WHERE customer_id = :customerId
       ORDER BY updated_at DESC`,
      { customerId }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function tasks(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date AS dueDate,
        p.name AS projectName
       FROM project_tasks t
       INNER JOIN projects p ON p.id = t.project_id
       WHERE p.customer_id = :customerId
       ORDER BY t.sort_order ASC, t.due_date ASC`,
      { customerId }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function quotes(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT id, title, amount, currency, status, created_at AS createdAt
       FROM crm_quotes
       WHERE customer_id = :customerId
       ORDER BY created_at DESC`,
      { customerId }
    );

    return res.json({ data: rows.map(formatMoneyRow) });
  } catch (error) {
    return next(error);
  }
}

export async function invoices(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT id, invoice_number AS invoiceNumber, amount, currency, due_date AS dueDate, status
       FROM invoices
       WHERE customer_id = :customerId
       ORDER BY due_date DESC`,
      { customerId }
    );

    return res.json({ data: rows.map(formatMoneyRow) });
  } catch (error) {
    return next(error);
  }
}

export async function tickets(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT id, subject, category, status, created_at AS createdAt
       FROM support_tickets
       WHERE customer_id = :customerId
       ORDER BY created_at DESC`,
      { customerId }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function createTicket(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const { subject, category, message } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO support_tickets (customer_id, subject, category, status)
       VALUES (:customerId, :subject, :category, 'new')`,
      { customerId, subject, category }
    );

    await pool.execute(
      `INSERT INTO support_messages (ticket_id, sender_type, message)
       VALUES (:ticketId, 'customer', :message)`,
      { ticketId: result.insertId, message }
    );

    return res.status(201).json({ message: 'Support ticket created.', id: result.insertId });
  } catch (error) {
    return next(error);
  }
}

export async function files(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT
        f.id,
        f.file_name AS fileName,
        f.size_label AS size,
        f.created_at AS createdAt,
        p.name AS projectName
       FROM project_files f
       INNER JOIN projects p ON p.id = f.project_id
       WHERE p.customer_id = :customerId
       ORDER BY f.created_at DESC`,
      { customerId }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function calendar(req, res, next) {
  try {
    const customerId = await ensureCustomer(req.user.sub);
    const [rows] = await pool.execute(
      `SELECT id, title, description, event_date AS date, event_type AS eventType
       FROM calendar_events
       WHERE customer_id = :customerId
       ORDER BY event_date ASC`,
      { customerId }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

async function ensureCustomer(userId) {
  const [rows] = await pool.execute('SELECT id FROM customers WHERE user_id = :userId LIMIT 1', {
    userId
  });

  if (rows[0]) {
    return rows[0].id;
  }

  const [created] = await pool.execute(
    `INSERT INTO customers (user_id, company_name, status)
     VALUES (:userId, 'Spilweb Customer', 'active')`,
    { userId }
  );

  return created.insertId;
}

async function ensureCustomerWithConnection(connection, userId) {
  const [rows] = await connection.execute(
    'SELECT id FROM customers WHERE user_id = :userId LIMIT 1',
    { userId }
  );

  if (rows[0]) {
    return rows[0].id;
  }

  const [created] = await connection.execute(
    `INSERT INTO customers (user_id, company_name, status)
     VALUES (:userId, 'Spilweb Customer', 'active')`,
    { userId }
  );

  return created.insertId;
}

function formatMoneyRow(row) {
  return {
    ...row,
    amount: `${row.amount} ${row.currency || 'TRY'}`
  };
}
