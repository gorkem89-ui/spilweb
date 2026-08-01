import { pool } from '../config/database.js';

export async function ensureDemoSubscription(userId) {
  await pool.execute(
    `INSERT INTO user_subscriptions (user_id, status)
     VALUES (:userId, 'demo')
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    { userId }
  );

  return getUserSubscription(userId);
}

export async function getUserSubscription(userId) {
  const [rows] = await pool.execute(
    `SELECT
      us.status,
      us.requested_at AS requestedAt,
      us.activated_at AS activatedAt,
      us.expires_at AS expiresAt,
      sp.slug AS planSlug,
      sp.title_tr AS titleTr,
      sp.title_en AS titleEn,
      sp.original_price AS originalPrice,
      sp.price,
      sp.discount_percent AS discountPercent,
      sp.currency
     FROM user_subscriptions us
     LEFT JOIN service_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = :userId
     LIMIT 1`,
    { userId }
  );

  return rows[0] || null;
}

export async function getServicePlans() {
  const [rows] = await pool.query(
    `SELECT
      slug,
      title_tr AS titleTr,
      title_en AS titleEn,
      description_tr AS descriptionTr,
      description_en AS descriptionEn,
      original_price AS originalPrice,
      price,
      discount_percent AS discountPercent,
      currency,
      billing_type AS billingType,
      features_tr AS featuresTr,
      features_en AS featuresEn
     FROM service_plans
     WHERE status = 'active'
     ORDER BY sort_order ASC, id ASC`
  );

  return rows.map((row) => ({
    ...row,
    originalPrice: Number(row.originalPrice || row.price),
    price: Number(row.price),
    discountPercent: Number(row.discountPercent || 0),
    featuresTr: parseJson(row.featuresTr),
    featuresEn: parseJson(row.featuresEn)
  }));
}

function parseJson(value) {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}
