import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function createTransporter() {
  const auth =
    env.smtp.user && env.smtp.password
      ? {
          user: env.smtp.user,
          pass: env.smtp.password
        }
      : undefined;

  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth
  });
}

export function buildNotificationMailOptions({ subject, text, replyTo, replyToName }) {
  const safeSubject = String(subject || 'Spilweb notification')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 190);
  const safeReplyName = String(replyToName || '')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 120);

  return {
    from: env.smtp.from,
    to: env.smtp.to,
    replyTo: replyTo
      ? {
          name: safeReplyName || replyTo,
          address: replyTo
        }
      : undefined,
    subject: safeSubject,
    text
  };
}

export async function sendNotificationMail(payload) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail(buildNotificationMailOptions(payload));
  } catch (error) {
    logger.warn(`SMTP notification skipped: ${error.message}`);
  }
}
