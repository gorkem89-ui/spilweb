import { body } from 'express-validator';

export const contentRules = [
  body('title').trim().isLength({ min: 2 }).withMessage('Title is required.'),
  body('slug')
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain lowercase letters, numbers, and dashes only.'),
  body('excerpt').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('body').optional({ nullable: true }).trim(),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status.')
];
