import { Router } from 'express';
import {
  activateSubscription,
  activityLogs,
  analytics,
  apiKeys,
  backups,
  createBackup,
  createContent,
  createPageBlock,
  dashboard,
  notifications,
  pageBuilder,
  saveApiKey,
  saveThemeSetting,
  listContent,
  messages,
  settings,
  systemHealth,
  themeSettings,
  users
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/errorHandler.js';
import { contentRules } from '../validators/adminValidators.js';

const router = Router();

router.use(requireAuth, requireRole(['super_admin', 'admin', 'editor']));

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard summary
 *     tags: [Admin]
 */
router.get('/dashboard', dashboard);
router.get('/content/:type', listContent);
router.post('/content/:type', contentRules, validateRequest, createContent);
router.get('/messages', messages);
router.get('/users', users);
router.post(
  '/users/:userId/subscription/activate',
  requireRole(['super_admin', 'admin']),
  activateSubscription
);
router.get('/settings', settings);
router.get('/page-builder/:pageKey', pageBuilder);
router.post('/page-builder/:pageKey/blocks', createPageBlock);
router.get('/theme', themeSettings);
router.post('/theme', saveThemeSetting);
router.get('/analytics', analytics);
router.get('/notifications', notifications);
router.get('/activity-logs', activityLogs);
router.get('/backups', backups);
router.post('/backups', createBackup);
router.get('/api-keys', apiKeys);
router.post('/api-keys', saveApiKey);
router.get('/system-health', systemHealth);

export default router;
