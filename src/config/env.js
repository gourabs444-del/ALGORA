import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  // Database
  DATABASE_URL:            z.string().default('postgresql://placeholder:placeholder@localhost:5432/postgres'),
  DIRECT_URL:              z.string().default('postgresql://placeholder:placeholder@localhost:5432/postgres'),

  // Email (Resend)
  RESEND_API_KEY:          z.string().default('re_placeholder'),
  ADMIN_EMAIL:             z.string().default('admin@example.com'),
  FROM_EMAIL:              z.string().default('Portfolio <inquiries@example.com>'),

  // Security
  ADMIN_API_KEY:           z.string().default('default-admin-api-key-secret-minimum-24-chars'),
  FRONTEND_ORIGIN:         z.string().default('*'),

  // Server
  PORT:                    z.coerce.number().int().positive().default(3000),
  NODE_ENV:                z.enum(['development', 'test', 'production']).default('development'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.warn('⚠️  Environment validation warnings:');
  result.error.issues.forEach(issue => {
    console.warn(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
}

export const env = result.success ? result.data : schema.parse({});
