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

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : Number(process.env.TRUST_PROXY) || 0);
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
    hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

const corsOrigins = CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

morgan.token('id', (req) => req.id || '-');
app.use(morgan(IS_PROD ? ':remote-addr :method :url :status :response-time ms - req/:id' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', env: NODE_ENV, time: new Date().toISOString() } });
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
