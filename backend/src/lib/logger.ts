import pino from 'pino';

import { config } from '../config';

export const logger = pino({
  level: config.logLevel,
  transport: config.isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    censor: '[Redacted]',
  },
});
