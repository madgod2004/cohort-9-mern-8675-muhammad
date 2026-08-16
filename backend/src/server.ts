import type { Server } from 'node:http';
import app from './app';
import { config } from './config';
import { connectDB, disconnectDB } from './lib/db';
import { logger } from './lib/logger';

let server: Server | undefined;

async function start(): Promise<void> {
  try {
    await connectDB();
  } catch (err) {
    logger.fatal({ err }, 'failed to connect to mongodb, shutting down');
    process.exit(1);
  }

  server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
  });
}

async function shutdown(): Promise<void> {
  logger.info('shutting down');

  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }

  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown());

void start();
