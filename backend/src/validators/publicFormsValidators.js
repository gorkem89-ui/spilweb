import { body } from 'express-validator';

export const contactRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject is required.'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.')
];

export const quoteRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required.'),
  body('company').optional({ nullable: true }).trim().isLength({ max: 190 }),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('service').trim().isLength({ min: 2 }).withMessage('Service is required.'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.')
];
