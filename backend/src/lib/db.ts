import mongoose from 'mongoose';

import { config } from '../config';
import { logger } from './logger';

mongoose.connection.on('connected', () => {
  logger.info({ db: mongoose.connection.name }, 'mongodb connected');
});

mongoose.connection.on('error', (err: Error) => {
  logger.error({ err }, 'mongodb connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('mongodb disconnected');
});

export async function connectDB(): Promise<void> {
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
