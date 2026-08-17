import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { isDBConnected } from './lib/db';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json());

app.get('/health', (req, res) => {
  const dbConnected = isDBConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
