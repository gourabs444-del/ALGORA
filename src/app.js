import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { registerSecurityPlugins } from './plugins/security.js';
import { inquiryRoutes } from './routes/inquiries.js';
import { authRoutes } from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

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

  /* ── Static Files Plugin ───────────────────────────────────────────── */
  app.register(fastifyStatic, {
    root: rootDir,
    prefix: '/',
  });

  /* ── JWT Authentication Plugin ────────────────────────────────────── */
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  /* ── Health check ─────────────────────────────────────────────────── */
  app.get('/health', async () => ({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  }));

  /* ── API Routes ───────────────────────────────────────────────────── */
  app.register(inquiryRoutes);
  app.register(authRoutes);

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

export default buildApp;
