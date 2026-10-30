import { connectDB, disconnectDB } from './config/db.js';
import { IS_PROD, IS_PROD_LIKE, NODE_ENV, JWT_SECRET, isWeakSecret } from './config/env.js';
import app from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

function assertEnvSafety() {
  const errors = [];
  const warnings = [];

  if (!process.env.MONGODB_URI) errors.push('MONGODB_URI is required (MongoDB connection string)');

  if (IS_PROD) {
    if (JWT_SECRET === null || isWeakSecret(process.env.JWT_SECRET || '')) {
      errors.push(
        'JWT_SECRET is required, must be >= 32 chars and high entropy — generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
      );
    }
    if (!process.env.CLIENT_URL) errors.push('CLIENT_URL is required in production (public frontend URL)');
    if (!process.env.SMTP_HOST) {
      warnings.push('SMTP_HOST not set — password-reset emails are disabled (POST /api/auth/forgot-password will return 503)');
    }
  } else {
    if (IS_PROD_LIKE) {
      warnings.push(
        'NODE_ENV is not "production" on a public host — hardening is engaged via the RENDER platform marker, but set NODE_ENV=production for the full production contract'
      );
      if (!process.env.CLIENT_URL) {
        warnings.push('CLIENT_URL not set — password-reset links fall back to http://localhost:5173');
      }
      if (!process.env.SMTP_HOST) {
        warnings.push('SMTP_HOST not set — password-reset emails are disabled (POST /api/auth/forgot-password will return 503)');
      }
    }
  }

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
  warnings.forEach((w) => console.warn(`[config] WARNING: ${w}`));
}

async function main() {
  try {
    assertEnvSafety();
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`HumanLine API listening on http://localhost:${PORT} (${NODE_ENV}${IS_PROD_LIKE ? ', production-like' : ''})`);
    });

    let shuttingDown = false;
    const shutdown = (signal) => () => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\n${signal} received, shutting down...`);

      const forceExit = setTimeout(() => process.exit(1), 10000);
      forceExit.unref();

      server.close(async () => {
        try {
          await disconnectDB();
        } catch {
          // ignore closing errors
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown('SIGINT'));
    process.on('SIGTERM', shutdown('SIGTERM'));
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled rejection:', err);
      shutdown('unhandledRejection')();
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

main();
