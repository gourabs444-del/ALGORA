import {
  createInquiryHandler,
  getAllInquiriesHandler,
  getInquiryByIdHandler,
  updateInquiryStatusHandler,
  deleteInquiryHandler,
} from '../controllers/inquiry.js';
import { requireAdmin } from '../middleware/admin.js';

export async function inquiryRoutes(app) {
  // POST /api/inquiry - Public endpoint for project inquiry submission
  app.post('/api/inquiry', createInquiryHandler);

  // GET /api/inquiries - Admin only list all inquiries
  app.get('/api/inquiries', { preHandler: requireAdmin }, getAllInquiriesHandler);

  // GET /api/inquiry/:id - Admin only get single inquiry
  app.get('/api/inquiry/:id', { preHandler: requireAdmin }, getInquiryByIdHandler);

  // PATCH /api/inquiry/:id/status - Admin only update inquiry status
  app.patch('/api/inquiry/:id/status', { preHandler: requireAdmin }, updateInquiryStatusHandler);

  // DELETE /api/inquiry/:id - Admin only delete inquiry
  app.delete('/api/inquiry/:id', { preHandler: requireAdmin }, deleteInquiryHandler);
}
