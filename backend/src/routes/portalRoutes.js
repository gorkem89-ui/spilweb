import { Router } from 'express';
import {
  calendar,
  createTicket,
  dashboard,
  files,
  invoices,
  plans,
  projects,
  quotes,
  requestPlan,
  tasks,
  tickets
} from '../controllers/portalController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/errorHandler.js';
import { requirePaidSubscription } from '../middleware/subscription.js';
import { ticketRules } from '../validators/portalValidators.js';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/portal/dashboard:
 *   get:
 *     summary: Get customer portal dashboard
 *     tags: [Portal]
 */
router.get('/dashboard', dashboard);
router.get('/plans', plans);
router.post('/plans/:slug/request', requestPlan);
router.get('/projects', requirePaidSubscription, projects);
router.get('/tasks', requirePaidSubscription, tasks);
router.get('/quotes', requirePaidSubscription, quotes);
router.get('/invoices', requirePaidSubscription, invoices);
router.get('/tickets', requirePaidSubscription, tickets);
router.post('/tickets', requirePaidSubscription, ticketRules, validateRequest, createTicket);
router.get('/files', requirePaidSubscription, files);
router.get('/calendar', requirePaidSubscription, calendar);

export default router;
