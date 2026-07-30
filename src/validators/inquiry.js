import { z } from 'zod';

// Sanitize string: trim whitespace and strip < > characters
const sanitize = (value) => String(value ?? '').trim().replace(/[<>]/g, '');

const text = (min, max) =>
  z.string()
    .min(1, 'This field is required')
    .transform(sanitize)
    .pipe(z.string().min(min, `Must be at least ${min} characters`).max(max, `Must be at most ${max} characters`));

export const inquirySchema = z.object({
  // Honeypot — must be empty or absent
  website:       z.string().max(0, 'Bot detected').optional().default(''),

  // Anti-spam timing — must be more than 2.5 seconds after form load
  formStartedAt: z.coerce.number().int(),

  // Required fields
  name:          text(2, 120),
  email:         z.string().trim().email('Enter a valid email address').max(254).transform(v => v.toLowerCase()),
  service:       text(2, 100),
  projectType:   text(2, 100),
  timeline:      text(2, 100),
  description:   text(20, 5000),

  // Optional fields
  company:       z.string().trim().max(160).transform(sanitize).optional().or(z.literal('')),
  budget:        z.string().trim().max(100).transform(sanitize).optional().or(z.literal('')),
});

export const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'], {
    errorMap: () => ({ message: 'status must be one of: NEW, CONTACTED, IN_PROGRESS, COMPLETED, CLOSED' }),
  }),
});
