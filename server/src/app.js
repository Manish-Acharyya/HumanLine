import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { IS_PROD_LIKE, NODE_ENV } from './config/env.js';

const app = express();

// Trust the platform proxy so rate limiting and logs see real client IPs.
// Render (and nginx/ALB) set X-Forwarded-For; without this, every user shares
// one IP for rate-limiting and hits 429 after a handful of login attempts.
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxy = 0;
if (trustProxyEnv !== undefined && trustProxyEnv !== '') {
  trustProxy = trustProxyEnv === 'true' ? 1 : trustProxyEnv === 'false' ? 0 : Number(trustProxyEnv) || 0;
} else if (process.env.RENDER) {
  trustProxy = 1;
}
app.set('trust proxy', trustProxy);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: IS_PROD_LIKE ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

const corsOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Same-origin requests are always allowed (the API also serves the built SPA),
// so login can never 500 because CLIENT_URL is stale or missing. Cross-origin
// requests get a clean CORS rejection (callback(null, false)), never a 500.
app.use((req, res, next) =>
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      try {
        if (new URL(origin).host === req.headers.host) return callback(null, true);
      } catch {
        // malformed Origin header — fall through to rejection
      }
      return callback(null, false);
    },
    credentials: true,
  })(req, res, next)
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

morgan.token('id', (req) => req.id || '-');
app.use(morgan(IS_PROD_LIKE ? ':remote-addr :method :url :status :response-time ms - req/:id' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', env: NODE_ENV, productionLike: IS_PROD_LIKE, time: new Date().toISOString() },
  });
});

app.use('/api', routes);

const clientDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'client',
  'dist'
);
const indexHtml = path.join(clientDist, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use(express.static(clientDist, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(indexHtml);
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
