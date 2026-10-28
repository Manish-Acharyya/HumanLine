import { connectDB } from './config/db.js';
import app from './app.js';

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '5000', 10);

function assertEnvSafety() {
  if (NODE_ENV === 'production' && (process.env.JWT_SECRET || '').includes('change_me')) {
    throw new Error('JWT_SECRET must be set to a strong value in production');
  }
}

async function main() {
  try {
    assertEnvSafety();
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`HumanLine API listening on http://localhost:${PORT} (${NODE_ENV})`);
    });

    const shutdown = (signal) => () => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown('SIGINT'));
    process.on('SIGTERM', shutdown('SIGTERM'));
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled rejection:', err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

main();
