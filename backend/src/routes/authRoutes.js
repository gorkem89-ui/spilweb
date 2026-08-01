import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  profile,
  refresh,
  register,
  resetPassword
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/errorHandler.js';
import {
  changePasswordRules,
  loginRules,
  refreshRules,
  registerRules
} from '../validators/authValidators.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', registerRules, validateRequest, register);
router.post('/login', loginRules, validateRequest, login);
router.post('/refresh', refreshRules, validateRequest, refresh);
router.post('/logout', requireAuth, logout);
router.get('/profile', requireAuth, profile);
/**
 * @openapi
 * /api/auth/password:
 *   put:
 *     summary: Change the authenticated user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.put('/password', requireAuth, changePasswordRules, validateRequest, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
