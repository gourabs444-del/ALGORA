import {
  createInquiryHandler,
  getAllInquiriesHandler,
  getInquiryByIdHandler,
  updateInquiryStatusHandler,
  updateInquiryFinancialsHandler,
  deleteInquiryHandler,
} from '../controllers/inquiry.js';
import { requireAdmin } from '../middleware/admin.js';

export async function inquiryRoutes(app) {
  // POST /api/inquiry - Public endpoint for project inquiry submission
  app.post('/api/inquiry', createInquiryHandler);

  // GET /api/inquiry/track/:id - Public status lookup by Reference ID / Lead ID
  app.get('/api/inquiry/track/:id', getInquiryByIdHandler);

  // GET /api/inquiries - Admin only list all inquiries
  app.get('/api/inquiries', { preHandler: requireAdmin }, getAllInquiriesHandler);

  // GET /api/inquiry/:id - Admin only get single inquiry
  app.get('/api/inquiry/:id', { preHandler: requireAdmin }, getInquiryByIdHandler);

  // PATCH /api/inquiry/:id/status - Admin only update inquiry status
  app.patch('/api/inquiry/:id/status', { preHandler: requireAdmin }, updateInquiryStatusHandler);

  // PATCH /api/inquiry/:id/financials - Admin only update contract amount, payments & CRM notes
  app.patch('/api/inquiry/:id/financials', { preHandler: requireAdmin }, updateInquiryFinancialsHandler);

  // DELETE /api/inquiry/:id - Admin only delete inquiry
  app.delete('/api/inquiry/:id', { preHandler: requireAdmin }, deleteInquiryHandler);
}
