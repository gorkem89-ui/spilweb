import { body } from 'express-validator';

export const ticketRules = [
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject is required.'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category is required.'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.')
];
