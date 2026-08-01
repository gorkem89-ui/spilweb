import { resolveMx } from 'node:dns/promises';
import { body } from 'express-validator';

const trustedEmailDomains = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yandex.com',
  'yandex.com.tr',
  'ya.ru',
  'yahoo.com',
  'yahoo.com.tr',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'gmx.com',
  'aol.com'
]);

function message(req, turkish, english) {
  return (req.body.locale || req.body.language) === 'en' ? english : turkish;
}

export function isStrongPassword(value = '') {
  return (
    value.length >= 8 &&
    value.length <= 128 &&
    /\p{Lu}/u.test(value) &&
    /\p{Ll}/u.test(value) &&
    /\p{N}/u.test(value) &&
    /[^\p{L}\p{N}\s]/u.test(value)
  );
}

export async function isEmailDomainAllowed(domain) {
  const normalizedDomain = String(domain || '').trim().toLowerCase();

  if (trustedEmailDomains.has(normalizedDomain)) {
    return true;
  }

  const lookup = resolveMx(normalizedDomain)
    .then((records) => records.some((record) => Boolean(record.exchange)))
    .catch(() => false);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 3500));

  return Promise.race([lookup, timeout]);
}

export const registerRules = [
  body('firstName')
    .trim()
    .custom((value, { req }) => {
      const length = String(value || '').length;
      if (length < 2 || length > 80) {
        throw new Error(message(req, 'Ad alanı en az 2 karakter olmalıdır.', 'First name must be at least 2 characters.'));
      }
      return true;
    }),
  body('lastName')
    .trim()
    .custom((value, { req }) => {
      const length = String(value || '').length;
      if (length < 2 || length > 80) {
        throw new Error(message(req, 'Soyad alanı en az 2 karakter olmalıdır.', 'Last name must be at least 2 characters.'));
      }
      return true;
    }),
  body('email')
    .trim()
    .isLength({ max: 254 })
    .withMessage((_value, { req }) => message(req, 'E-posta adresi çok uzun.', 'The email address is too long.'))
    .bail()
    .isEmail()
    .withMessage((_value, { req }) => message(req, 'Geçerli bir e-posta adresi girin.', 'Enter a valid email address.'))
    .bail()
    .custom(async (value, { req }) => {
      const domain = value.slice(value.lastIndexOf('@') + 1).toLowerCase();

      if (!(await isEmailDomainAllowed(domain))) {
        throw new Error(
          message(
            req,
            'E-posta alan adı doğrulanamadı. Bilinen bir sağlayıcı veya geçerli bir kurumsal adres kullanın.',
            'The email domain could not be verified. Use a known provider or a valid business address.'
          )
        );
      }

      return true;
    })
    .toLowerCase(),
  body('password').custom((value, { req }) => {
    if (!isStrongPassword(value)) {
      throw new Error(
        message(
          req,
          'Şifre en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir.',
          'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'
        )
      );
    }
    return true;
  }),
  body('locale').optional().isIn(['tr', 'en']),
  body('language').optional().isIn(['tr', 'en'])
];

export const loginRules = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

export const refreshRules = [body('refreshToken').notEmpty().withMessage('Refresh token is required.')];

export const changePasswordRules = [
  body('currentPassword').custom((value, { req }) => {
    if (!value) {
      throw new Error(message(req, 'Mevcut parola zorunludur.', 'Current password is required.'));
    }
    return true;
  }),
  body('newPassword').custom((value, { req }) => {
    if (!isStrongPassword(value)) {
      throw new Error(
        message(
          req,
          'Yeni parola en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir.',
          'The new password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'
        )
      );
    }
    return true;
  }),
  body('confirmPassword').custom((value, { req }) => {
    if (!value || value !== req.body.newPassword) {
      throw new Error(
        message(req, 'Yeni parola tekrarı eşleşmiyor.', 'The new password confirmation does not match.')
      );
    }
    return true;
  }),
  body('locale').optional().isIn(['tr', 'en'])
];
