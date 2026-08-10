import { registerHandler, loginHandler, meHandler } from '../controllers/auth.js';

export async function authRoutes(app) {
  // POST /api/auth/register - User registration
  app.post('/api/auth/register', registerHandler);

  // POST /api/auth/login - User authentication
  app.post('/api/auth/login', loginHandler);

  // GET /api/auth/me - Current user profile
  app.get('/api/auth/me', meHandler);
}
