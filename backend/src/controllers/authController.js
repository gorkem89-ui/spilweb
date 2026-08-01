import {
  changeUserPassword,
  findUserById,
  loginUser,
  refreshTokens,
  registerUser
} from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const data = await registerUser(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const data = await refreshTokens(req.body.refreshToken);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function profile(req, res, next) {
  try {
    const user = await findUserById(req.user.sub);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res) {
  return res.json({ message: 'Logged out. Remove tokens on the client.' });
}

export async function forgotPassword(req, res) {
  return res.json({
    message: 'Password reset email scaffold is ready. SMTP template integration comes next.'
  });
}

export async function resetPassword(req, res) {
  return res.json({
    message: 'Password reset scaffold is ready. Token persistence comes next.'
  });
}

export async function changePassword(req, res, next) {
  try {
    const data = await changeUserPassword(req.user.sub, req.body);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
