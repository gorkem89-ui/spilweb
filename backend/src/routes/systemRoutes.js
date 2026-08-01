import { Router } from 'express';
import { health } from '../controllers/healthController.js';
import { languages, settings } from '../controllers/systemController.js';

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Check API and database health
 *     tags: [System]
 */
router.get('/health', health);
router.get('/languages', languages);
router.get('/settings', settings);

export default router;
