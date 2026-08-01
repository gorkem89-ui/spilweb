import { pool } from '../config/database.js';

const allowedContentTypes = new Set(['pages', 'services', 'portfolio', 'blog']);

export async function dashboard(req, res, next) {
  try {
    const [statsRows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM content_items WHERE type = 'services') AS services,
        (SELECT COUNT(*) FROM content_items WHERE type = 'portfolio') AS portfolio,
        (SELECT COUNT(*) FROM content_items WHERE type = 'blog') AS posts,
        (SELECT COUNT(*) FROM contact_messages WHERE type = 'contact') AS messages,
        (SELECT COUNT(*) FROM contact_messages WHERE type = 'quote') AS quotes
    `);

    const [recentMessages] = await pool.query(`
      SELECT id, type, name, email, subject, service, status, created_at AS createdAt
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 6
    `);

    return res.json({
      stats: statsRows[0],
      recentMessages,
      system: [
        { label: 'API', value: 'ok' },
        { label: 'Database', value: 'ok' },
        { label: 'Sprint', value: '4' }
      ]
    });
  } catch (error) {
    return next(error);
  }
}

export async function listContent(req, res, next) {
  try {
    const type = normalizeContentType(req.params.type);
    const [rows] = await pool.execute(
      `SELECT id, type, title, slug, excerpt, status, updated_at AS updatedAt
       FROM content_items
       WHERE type = :type
       ORDER BY updated_at DESC`,
      { type }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function createContent(req, res, next) {
  try {
    const type = normalizeContentType(req.params.type);
    const { title, slug, excerpt, body, status } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO content_items (type, title, slug, excerpt, body, status)
       VALUES (:type, :title, :slug, :excerpt, :body, :status)`,
      {
        type,
        title,
        slug,
        excerpt: excerpt || null,
        body: body || null,
        status: status || 'draft'
      }
    );

    return res.status(201).json({
      message: 'Content item created.',
      id: result.insertId
    });
  } catch (error) {
    return next(error);
  }
}

export async function messages(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT id, type, name, company, email, subject, service, message, status, created_at AS createdAt
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function users(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.status,
        r.name AS role,
        us.status AS subscriptionStatus,
        sp.slug AS planSlug,
        sp.title_tr AS planTitle,
        sp.price AS planPrice
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_subscriptions us ON us.user_id = u.id
      LEFT JOIN service_plans sp ON sp.id = us.plan_id
      ORDER BY u.created_at DESC
      LIMIT 100
    `);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function activateSubscription(req, res, next) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT us.plan_id AS planId, c.id AS customerId
       FROM users u
       LEFT JOIN user_subscriptions us ON us.user_id = u.id
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.id = :userId
       LIMIT 1`,
      { userId: req.params.userId }
    );

    if (!rows[0]?.planId) {
      const error = new Error('The customer must request a service plan before activation.');
      error.status = 422;
      throw error;
    }

    await connection.execute(
      `UPDATE user_subscriptions
       SET status = 'active', activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = :userId`,
      { userId: req.params.userId }
    );

    if (rows[0].customerId) {
      await connection.execute(
        `UPDATE crm_quotes
         SET status = 'approved', updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = :customerId AND status = 'sent'
         ORDER BY id DESC
         LIMIT 1`,
        { customerId: rows[0].customerId }
      );
    }

    await connection.commit();
    await logActivity(req, 'subscription.activated', 'users', req.params.userId);
    return res.json({ message: 'Paid service access activated.' });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function settings(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT `key`, `value`, type FROM settings ORDER BY `key` ASC');
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function pageBuilder(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT
        id,
        page_key AS pageKey,
        block_type AS blockType,
        title,
        subtitle,
        sort_order AS sortOrder,
        status
       FROM page_blocks
       WHERE page_key = :pageKey
       ORDER BY sort_order ASC, id ASC`,
      { pageKey: req.params.pageKey }
    );

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function createPageBlock(req, res, next) {
  try {
    const { blockType, title, subtitle } = req.body;
    const [[orderRow]] = await pool.execute(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM page_blocks WHERE page_key = :pageKey',
      { pageKey: req.params.pageKey }
    );

    const [result] = await pool.execute(
      `INSERT INTO page_blocks (page_key, block_type, title, subtitle, sort_order, status)
       VALUES (:pageKey, :blockType, :title, :subtitle, :sortOrder, 'draft')`,
      {
        pageKey: req.params.pageKey,
        blockType,
        title,
        subtitle: subtitle || null,
        sortOrder: orderRow.nextOrder
      }
    );

    await logActivity(req, 'page_block.created', 'page_blocks', result.insertId);
    return res.status(201).json({ message: 'Page block created.', id: result.insertId });
  } catch (error) {
    return next(error);
  }
}

export async function themeSettings(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT `key`, `value`, type FROM theme_settings ORDER BY `key` ASC'
    );
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function saveThemeSetting(req, res, next) {
  try {
    const { key, value } = req.body;
    await pool.execute(
      `INSERT INTO theme_settings (\`key\`, \`value\`, type)
       VALUES (:key, :value, 'string')
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = CURRENT_TIMESTAMP`,
      { key, value }
    );

    await logActivity(req, 'theme.updated', 'theme_settings', null, { key });
    return res.status(201).json({ message: 'Theme setting saved.' });
  } catch (error) {
    return next(error);
  }
}

export async function analytics(req, res, next) {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COALESCE(SUM(views), 0) AS views,
        COALESCE(SUM(unique_visitors), 0) AS visitors,
        COALESCE(SUM(conversions), 0) AS conversions,
        COALESCE(SUM(errors), 0) AS errors
      FROM analytics_daily
    `);

    const [topPages] = await pool.query(`
      SELECT path, SUM(views) AS views, SUM(unique_visitors) AS uniqueVisitors
      FROM analytics_daily
      GROUP BY path
      ORDER BY views DESC
      LIMIT 8
    `);

    return res.json({ summary, topPages });
  } catch (error) {
    return next(error);
  }
}

export async function notifications(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT id, title, message, icon, status, created_at AS createdAt
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function activityLogs(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id,
        a.action,
        a.entity_type AS entityType,
        a.entity_id AS entityId,
        a.created_at AS createdAt,
        u.email AS userEmail
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function backups(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT id, file_name AS fileName, includes, status, created_at AS createdAt
      FROM backup_jobs
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function createBackup(req, res, next) {
  try {
    const includes = Array.isArray(req.body.includes) ? req.body.includes : ['database'];
    const fileName = `spilweb-backup-${Date.now()}.zip`;

    const [result] = await pool.execute(
      `INSERT INTO backup_jobs (file_name, includes, status)
       VALUES (:fileName, :includes, 'queued')`,
      {
        fileName,
        includes: JSON.stringify(includes)
      }
    );

    await logActivity(req, 'backup.queued', 'backup_jobs', result.insertId);
    return res.status(201).json({ message: 'Backup job queued.', id: result.insertId });
  } catch (error) {
    return next(error);
  }
}

export async function apiKeys(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT id, provider, label, masked_value AS maskedValue, created_at AS createdAt
      FROM api_keys
      ORDER BY provider ASC, label ASC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function saveApiKey(req, res, next) {
  try {
    const { provider, label, maskedValue } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO api_keys (provider, label, masked_value)
       VALUES (:provider, :label, :maskedValue)`,
      { provider, label, maskedValue }
    );

    await logActivity(req, 'api_key.created', 'api_keys', result.insertId, { provider });
    return res.status(201).json({ message: 'API key saved.', id: result.insertId });
  } catch (error) {
    return next(error);
  }
}

export async function systemHealth(req, res) {
  const memory = process.memoryUsage();

  return res.json({
    data: [
      { key: 'api', label: 'API', value: 'online', status: 'ok', icon: 'bi bi-hdd-network' },
      { key: 'node', label: 'Node.js', value: process.version, status: 'ok', icon: 'bi bi-cpu' },
      {
        key: 'memory',
        label: 'Memory',
        value: `${Math.round(memory.rss / 1024 / 1024)} MB`,
        status: 'observed',
        icon: 'bi bi-memory'
      },
      { key: 'sprint', label: 'Sprint', value: '4', status: 'ok', icon: 'bi bi-flag' }
    ]
  });
}

async function logActivity(req, action, entityType, entityId, metadata = null) {
  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
     VALUES (:userId, :action, :entityType, :entityId, :ipAddress, :userAgent, :metadata)`,
    {
      userId: req.user?.sub || null,
      action,
      entityType,
      entityId,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  );
}

function normalizeContentType(type) {
  if (!allowedContentTypes.has(type)) {
    const error = new Error('Unsupported content type.');
    error.status = 404;
    throw error;
  }

  return type;
}
