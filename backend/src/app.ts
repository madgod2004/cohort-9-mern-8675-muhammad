import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { config } from './config';
import { isDBConnected } from './lib/db';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { noteRouter } from './routes/note.routes';

const app = express();

app.use(helmet());
// credentials:true is required for the browser to send the auth cookie
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  const dbConnected = isDBConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/notes', noteRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
