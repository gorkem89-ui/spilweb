import { Router } from 'express';
import { contact, quote } from '../controllers/publicFormsController.js';
import { validateRequest } from '../middleware/errorHandler.js';
import { contactRules, quoteRules } from '../validators/publicFormsValidators.js';

const router = Router();

/**
 * @openapi
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Public Forms]
 */
router.post('/contact', contactRules, validateRequest, contact);

/**
 * @openapi
 * /api/quote:
 *   post:
 *     summary: Submit a quote request
 *     tags: [Public Forms]
 */
router.post('/quote', quoteRules, validateRequest, quote);

export default router;
