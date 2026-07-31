import Fastify from 'fastify';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { registerSecurityPlugins } from './plugins/security.js';
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
    trustProxy: true,
  });

  /* ── Security plugins ─────────────────────────────────────────────── */
  app.register(registerSecurityPlugins);

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

    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message });
    }

    return reply.code(500).send({ error: 'An internal server error occurred.' });
  });

  return app;
}
