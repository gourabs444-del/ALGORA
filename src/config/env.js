import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  // Database
  DATABASE_URL:            z.string().url('DATABASE_URL must be a valid URL'),
  DIRECT_URL:              z.string().url('DIRECT_URL must be a valid URL'),

  // Email (Resend)
  RESEND_API_KEY:          z.string().min(3, 'RESEND_API_KEY is required'),
  ADMIN_EMAIL:             z.string().email('ADMIN_EMAIL must be a valid email'),
  FROM_EMAIL:              z.string().min(3, 'FROM_EMAIL is required'),

  // Security
  ADMIN_API_KEY:           z.string().min(24, 'ADMIN_API_KEY must be at least 24 characters'),
  FRONTEND_ORIGIN:         z.string().url('FRONTEND_ORIGIN must be a valid URL'),

  // Server
  PORT:                    z.coerce.number().int().positive().default(3000),
  NODE_ENV:                z.enum(['development', 'test', 'production']).default('development'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('❌  Environment validation failed:');
  result.error.issues.forEach(issue => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = result.data;
