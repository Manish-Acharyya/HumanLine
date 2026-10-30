import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { COOKIE_NAME, JWT_SECRET } from '../config/env.js';

function extractToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];

  return null;
}

export async function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'Account not found.');
    if (user.status !== 'active') {
      throw new ApiError(401, 'Account is inactive. Contact your administrator.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}
