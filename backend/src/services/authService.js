import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const publicUserFields =
  'u.id, u.uuid, u.first_name AS firstName, u.last_name AS lastName, u.email, u.status, u.language, r.name AS role';

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${publicUserFields}, u.password_hash AS passwordHash
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.email = :email
     LIMIT 1`,
    { email }
  );

  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${publicUserFields}
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = :id
     LIMIT 1`,
    { id }
  );

  return rows[0] || null;
}

export async function registerUser(payload) {
  const existing = await findUserByEmail(payload.email);
  const isEnglish = (payload.locale || payload.language) === 'en';

  if (existing) {
    const error = new Error(
      isEnglish ? 'This email address is already registered.' : 'Bu e-posta adresi zaten kayıtlı.'
    );
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, language, status)
       VALUES (:firstName, :lastName, :email, :passwordHash, :language, 'active')`,
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        passwordHash,
        language: payload.language || 'tr'
      }
    );

    const [roles] = await connection.execute('SELECT id FROM roles WHERE name = :name LIMIT 1', {
      name: 'customer'
    });

    if (roles[0]) {
      await connection.execute('INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)', {
        userId: result.insertId,
        roleId: roles[0].id
      });
    }

    await connection.execute(
      `INSERT INTO user_subscriptions (user_id, status)
       VALUES (:userId, 'demo')
       ON DUPLICATE KEY UPDATE status = 'demo', updated_at = CURRENT_TIMESTAMP`,
      { userId: result.insertId }
    );

    await connection.commit();
    const user = await findUserById(result.insertId);

    return {
      user,
      ...(await issueTokens(user)),
      message: isEnglish ? 'Your demo account is ready.' : 'Demo hesabınız hazır.'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  if (user.status === 'pending' && user.role === 'customer') {
    await pool.execute("UPDATE users SET status = 'active' WHERE id = :id", { id: user.id });
    user.status = 'active';
  }

  if (user.status !== 'active') {
    const error = new Error('Your account is currently unavailable.');
    error.status = 403;
    throw error;
  }

  await pool.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id', {
    id: user.id
  });

  delete user.passwordHash;
  return { user, ...(await issueTokens(user)) };
}

export async function issueTokens(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES (:userId, :token, :expiresAt)`,
    {
      userId: user.id,
      token: refreshToken,
      expiresAt
    }
  );

  return { accessToken, refreshToken };
}

export async function refreshTokens(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const [rows] = await pool.execute(
    `SELECT * FROM refresh_tokens
     WHERE user_id = :userId AND token = :token AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    {
      userId: decoded.sub,
      token: refreshToken
    }
  );

  if (!rows[0]) {
    const error = new Error('Refresh token is invalid or expired.');
    error.status = 401;
    throw error;
  }

  const user = await findUserById(decoded.sub);
  return { user, ...(await issueTokens(user)) };
}

export async function changeUserPassword(userId, { currentPassword, newPassword, locale }) {
  const isEnglish = locale === 'en';
  const [rows] = await pool.execute(
    `SELECT id, password_hash AS passwordHash
     FROM users
     WHERE id = :userId
     LIMIT 1`,
    { userId }
  );
  const user = rows[0];

  if (!user) {
    const error = new Error(isEnglish ? 'User account could not be found.' : 'Kullanıcı hesabı bulunamadı.');
    error.status = 404;
    throw error;
  }

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    const error = new Error(isEnglish ? 'The current password is incorrect.' : 'Mevcut parola yanlış.');
    error.status = 422;
    throw error;
  }

  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    const error = new Error(
      isEnglish
        ? 'The new password must be different from the current password.'
        : 'Yeni parola mevcut paroladan farklı olmalıdır.'
    );
    error.status = 422;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE users
       SET password_hash = :passwordHash, updated_at = CURRENT_TIMESTAMP
       WHERE id = :userId`,
      { passwordHash, userId }
    );
    await connection.execute('DELETE FROM refresh_tokens WHERE user_id = :userId', { userId });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return {
    message: isEnglish
      ? 'Your password was changed. Please sign in again.'
      : 'Parolanız değiştirildi. Lütfen yeniden giriş yapın.'
  };
}
