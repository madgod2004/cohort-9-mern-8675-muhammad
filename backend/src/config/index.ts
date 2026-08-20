import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

// the placeholder in .env.example is long enough to pass the length check, so
// reject it by name in case it is ever copied unchanged into a real .env
const PLACEHOLDER_SECRET = 'replace-with-a-random-string-of-at-least-32-characters';

// the duration grammar jsonwebtoken accepts, e.g. 30s, 15m, 7d
const DURATION = /^\d+\s*(ms|s|m|h|d|w|y)$/;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MONGO_URI: z.string().startsWith('mongodb://'),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine((s) => s !== PLACEHOLDER_SECRET, 'must not be the example placeholder value'),
  JWT_EXPIRES_IN: z.string().regex(DURATION, 'must be a duration like 30m or 7d').default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:\n');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  bcryptRounds: env.BCRYPT_ROUNDS,
});
