import { IS_PROD_LIKE } from '../config/env.js';

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD_LIKE,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD_LIKE,
    path: '/',
  };
}
