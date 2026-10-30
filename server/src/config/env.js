import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(serverRoot, '.env') });

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = NODE_ENV === 'production';

// Production-like = NODE_ENV=production OR running on Render (RENDER is set by
// the platform). Security-sensitive behavior keys off this so a misconfigured
// dashboard (e.g. NODE_ENV left at "development") can never ship insecure
// cookies, open registration, leaked stack traces or token-in-response resets
// on a public host.
export const IS_PROD_LIKE = IS_PROD || Boolean(process.env.RENDER);

export const COOKIE_NAME = process.env.COOKIE_NAME || 'hrms_token';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const WEAK_SECRET_PATTERNS = ['secret', 'password', 'changeme', 'change_me', 'dev_hrms_secret', 'hrms'];

export function isWeakSecret(secret) {
  if (!secret || secret.length < 32) return true;
  if (WEAK_SECRET_PATTERNS.some((p) => secret.toLowerCase().includes(p))) return true;
  if (new Set(secret).size < 10) return true;
  return false;
}

function resolveJwtSecret() {
  const configured = process.env.JWT_SECRET || '';
  if (!isWeakSecret(configured)) return configured;

  // Strict production: index.js assertEnvSafety() refuses to start with a
  // clear message before any request is served, so null is never used to sign.
  if (IS_PROD) return null;

  if (IS_PROD_LIKE) {
    // Public host but NODE_ENV wasn't set to production. Never sign with a
    // known-weak secret (dev values are public in the README) — fall back to a
    // random per-boot secret so sessions only die on restart, and shout about it.
    console.warn(
      '[security] JWT_SECRET is missing or weak on a public host. Using a random ' +
        'per-boot secret (sessions reset whenever the service restarts). ' +
        'Set JWT_SECRET (>= 32 chars) in the environment to keep sessions stable.'
    );
    return crypto.randomBytes(48).toString('hex');
  }

  // Local development convenience.
  return 'dev_hrms_secret_change_me_in_production';
}

export const JWT_SECRET = resolveJwtSecret();
