import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';

export async function registerSecurityPlugins(app) {
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin:      env.FRONTEND_ORIGIN,
    methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: false,
  });

  await app.register(rateLimit, {
    max:          10,
    timeWindow:   '1 hour',
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      error: `Too many requests. You have exceeded ${context.max} requests per hour. Try again later.`,
    }),
  });
}
