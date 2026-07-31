import express from 'express';
import pinoHttp from 'pino-http';

import { logger } from './lib/logger';

const app = express();

app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;