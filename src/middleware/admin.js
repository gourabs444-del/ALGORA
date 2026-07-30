import { env } from '../config/env.js';

/**
 * Middleware: Require valid Admin API Key in x-admin-api-key header.
 * Used to protect admin-only routes (GET all inquiries, PATCH status, DELETE).
 */
export async function requireAdmin(request, reply) {
  const key = request.headers['x-admin-api-key'];

  if (!key || key !== env.ADMIN_API_KEY) {
    return reply.code(401).send({ error: 'Unauthorized — valid x-admin-api-key header required.' });
  }
}
