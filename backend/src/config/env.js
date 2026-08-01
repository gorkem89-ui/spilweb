import dotenv from 'dotenv';

dotenv.config();

export const env = {
  appName: process.env.APP_NAME || 'Spilweb',
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  jwtSecret: process.env.JWT_SECRET || 'development_access_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'development_refresh_secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  uploadPath: process.env.UPLOAD_PATH || 'uploads',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'spilweb',
    user: process.env.DB_USER || 'spilweb',
    password: process.env.DB_PASSWORD ?? 'spilweb_password'
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT || 1025),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Spilweb <no-reply@spilweb.net.tr>',
    to:
      process.env.SMTP_TO ||
      process.env.SMTP_USER ||
      process.env.SMTP_FROM ||
      'info@spilweb.net.tr'
  }
};
