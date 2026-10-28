import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '5000', 10);

const WEAK_SECRETS = ['secret', 'password', 'changeme', 'change_me', 'dev_hrms_secret', 'hrms'];

function assertEnvSafety() {
  if (NODE_ENV !== 'production') return;

  const errors = [];

  const secret = process.env.JWT_SECRET || '';
  if (!secret) {
    errors.push('JWT_SECRET is required');
  } else if (secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  } else if (
    WEAK_SECRETS.some((s) => secret.toLowerCase().includes(s)) ||
    new Set(secret).size < 10
  ) {
    errors.push('JWT_SECRET looks like a weak/dev value — generate one with: node -e \"console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))\"');
  }

  if (!process.env.MONGODB_URI) errors.push('MONGODB_URI is required in production');
  if (!process.env.CLIENT_URL) errors.push('CLIENT_URL is required in production');
  if (!process.env.SMTP_HOST) {
    errors.push('SMTP_HOST is required in production (password reset emails)');
  }

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
}

async function main() {
  try {
    assertEnvSafety();
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`HumanLine API listening on http://localhost:${PORT} (${NODE_ENV})`);
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
