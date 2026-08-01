import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    return res.status(422).json({
      message: validationErrors[0]?.msg || 'Validation failed.',
      errors: validationErrors
    });
  }

  return next();
}

export function notFoundHandler(req, res) {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  if ((error.status || 500) >= 500) {
    logger.error(error);
  } else {
    logger.warn(error.message);
  }

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Internal server error.',
    stack: env.nodeEnv === 'production' ? undefined : error.stack
  });
}
