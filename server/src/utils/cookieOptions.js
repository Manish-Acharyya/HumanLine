const IS_PROD = process.env.NODE_ENV === 'production';

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
  };
}
