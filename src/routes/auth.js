import { registerHandler, loginHandler, meHandler } from '../controllers/auth.js';

/**
 * JWT authentication hook — verifies the Bearer token and attaches
 * the decoded payload to `request.user` so downstream handlers can use it.
 */
async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized — valid Bearer token required.' });
  }
}

export async function authRoutes(app) {
  // POST /api/auth/register - User registration
  app.post('/api/auth/register', registerHandler);

  // POST /api/auth/login - User authentication
  app.post('/api/auth/login', loginHandler);

  // GET /api/auth/me - Current user profile (requires valid JWT)
  app.get('/api/auth/me', { preHandler: authenticate }, meHandler);
}
