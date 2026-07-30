import { ZodError } from 'zod';
import { inquirySchema, statusSchema } from '../validators/inquiry.js';
import {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} from '../services/inquiry.js';
import { requireAdmin } from '../middleware/admin.js';

export async function inquiryRoutes(app) {

  /* ── POST /api/inquiry ──────────────────────────────────────────────── */
  app.post('/api/inquiry', async (request, reply) => {
    let data;

    try {
      data = inquirySchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.code(400).send({
          error:  'Validation failed',
          fields: err.flatten().fieldErrors,
        });
      }
      throw err;
    }

    // Honeypot check
    if (data.website) {
      return reply.code(200).send({ success: true });
    }

    // Minimum form-fill time (anti-bot)
    const elapsed = Date.now() - data.formStartedAt;
    if (elapsed < 2500) {
      return reply.code(400).send({ error: 'Please take a moment to complete the form.' });
    }

    const inquiry = await createInquiry(data, request);

    return reply.code(201).send({
      success: true,
      leadId:  inquiry.leadId,
      message: 'Your inquiry has been received. We will contact you within 24 hours.',
    });
  });

  /* ── GET /api/inquiries ─────────────────────────────────────────────── */
  app.get('/api/inquiries', { preHandler: requireAdmin }, async (request, reply) => {
    const inquiries = await getAllInquiries();
    return reply.send({ count: inquiries.length, data: inquiries });
  });

  /* ── GET /api/inquiry/:id ───────────────────────────────────────────── */
  app.get('/api/inquiry/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const inquiry = await getInquiryById(request.params.id);
    if (!inquiry) {
      return reply.code(404).send({ error: 'Inquiry not found.' });
    }
    return reply.send(inquiry);
  });

  /* ── PATCH /api/inquiry/:id/status ─────────────────────────────────── */
  app.patch('/api/inquiry/:id/status', { preHandler: requireAdmin }, async (request, reply) => {
    let parsed;
    try {
      parsed = statusSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.code(400).send({ error: 'Validation failed', fields: err.flatten().fieldErrors });
      }
      throw err;
    }

    try {
      const updated = await updateInquiryStatus(request.params.id, parsed.status);
      return reply.send(updated);
    } catch {
      return reply.code(404).send({ error: 'Inquiry not found.' });
    }
  });

  /* ── DELETE /api/inquiry/:id ────────────────────────────────────────── */
  app.delete('/api/inquiry/:id', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      await deleteInquiry(request.params.id);
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Inquiry not found.' });
    }
  });
}
