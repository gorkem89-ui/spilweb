import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'customer'
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function createRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      tokenType: 'refresh'
    },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}
