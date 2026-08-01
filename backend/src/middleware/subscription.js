import { ensureDemoSubscription } from '../services/subscriptionService.js';

export async function requirePaidSubscription(req, res, next) {
  try {
    const subscription = await ensureDemoSubscription(req.user.sub);

    if (subscription?.status !== 'active') {
      return res.status(402).json({
        code: 'PAID_PLAN_REQUIRED',
        message: 'This module is available after your service payment is confirmed.'
      });
    }

    req.subscription = subscription;
    return next();
  } catch (error) {
    return next(error);
  }
}
