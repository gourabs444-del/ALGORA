import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { inquiryRoutes } from './routes/inquiries.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      ...(env.NODE_ENV !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
    genReqId: (request) =>
      request.headers['x-request-id'] ?? crypto.randomUUID(),
    trustProxy: true, // needed for correct IP behind reverse proxy / Cloudflare
  });

  /* ── Security plugins ─────────────────────────────────────────────── */
  app.register(helmet, {
    contentSecurityPolicy: false, // disabled so API responses aren't restricted
  });

  app.register(cors, {
    origin:      env.FRONTEND_ORIGIN,
    methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: false,
  });

  /* ── Rate limiting ────────────────────────────────────────────────── */
  app.register(rateLimit, {
    max:        10,
    timeWindow: '1 hour',
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      error: `Too many requests. You have exceeded ${context.max} requests per hour. Try again later.`,
    }),
  });

  /* ── Health check ─────────────────────────────────────────────────── */
  app.get('/health', async () => ({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  }));

  /* ── API Routes ───────────────────────────────────────────────────── */
  app.register(inquiryRoutes);

  /* ── Global error handler ─────────────────────────────────────────── */
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, reqId: request.id }, error.message);

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error:  'Validation failed',
        fields: error.flatten().fieldErrors,
      });
    }

    // Known HTTP errors from Fastify
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message });
    }

    // Unexpected server errors — don't leak internals
    return reply.code(500).send({ error: 'An internal server error occurred.' });
  });

  return app;
}
