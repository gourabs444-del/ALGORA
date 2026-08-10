import { Resend } from 'resend';
import { env } from '../config/env.js';
import { prisma } from '../prisma/client.js';
import { nextLeadId } from '../utils/lead-id.js';
import { adminEmail, clientEmail } from '../emails/templates.js';

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Create a new project inquiry.
 * Handles:
 *  - Duplicate submission protection (same email + description within 10 mins)
 *  - Lead ID generation
 *  - Database persistence
 *  - Admin + client email dispatch via Resend
 */
export async function createInquiry(data, request) {
  // Duplicate submission guard (same email + same description within 10 minutes)
  const duplicate = await prisma.inquiry.findFirst({
    where: {
      email: data.email,
      description: data.description,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });

  if (duplicate) {
    const error = new Error('This inquiry was already submitted recently. Please wait 10 minutes before resubmitting.');
    error.statusCode = 409;
    throw error;
  }

  // Generate Lead ID
  const leadId = await nextLeadId(prisma);

  // Persist to database
  const inquiry = await prisma.inquiry.create({
    data: {
      leadId,
      name:        data.name,
      email:       data.email,
      company:     data.company  || null,
      service:     data.service,
      projectType: data.projectType,
      budget:      data.budget   || null,
      timeline:    data.timeline,
      description: data.description,
      ipAddress:   request.ip,
      userAgent:   request.headers['user-agent']?.slice(0, 1000) ?? null,
    },
  });

  // Send emails (non-blocking — log result but don't fail if emails bounce)
  const [adminResult, clientResult] = await Promise.allSettled([
    resend.emails.send({
      from:    env.FROM_EMAIL,
      to:      env.ADMIN_EMAIL,
      ...adminEmail(inquiry),
    }),
    resend.emails.send({
      from:    env.FROM_EMAIL,
      to:      inquiry.email,
      ...clientEmail(inquiry),
    }),
  ]);

  request.log.info(
    {
      leadId:         inquiry.leadId,
      adminEmail:     adminResult.status,
      clientEmail:    clientResult.status,
      adminEmailId:   adminResult.value?.data?.id,
      clientEmailId:  clientResult.value?.data?.id,
    },
    'Inquiry created and emails dispatched',
  );

  if (adminResult.status === 'rejected') {
    request.log.warn({ error: adminResult.reason }, 'Admin email failed to send');
  }

  if (clientResult.status === 'rejected') {
    request.log.warn({ error: clientResult.reason }, 'Client confirmation email failed to send');
  }

  return inquiry;
}

/**
 * Get all inquiries (admin only), newest first.
 */
export async function getAllInquiries() {
  return prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id:          true,
      leadId:      true,
      name:        true,
      email:       true,
      company:     true,
      service:     true,
      projectType: true,
      budget:      true,
      timeline:    true,
      status:      true,
      createdAt:   true,
    },
  });
}

/**
 * Get a single inquiry by ID or Lead ID.
 */
export async function getInquiryById(id) {
  return prisma.inquiry.findFirst({
    where: {
      OR: [
        { id },
        { leadId: id },
        { leadId: id.replace(/^LEAD-/i, '') },
      ],
    },
  });
}

/**
 * Update inquiry status (admin only).
 */
export async function updateInquiryStatus(id, status) {
  const existing = await getInquiryById(id);
  if (!existing) throw new Error('Inquiry not found');
  return prisma.inquiry.update({
    where: { id: existing.id },
    data:  { status, updatedAt: new Date() },
  });
}

/**
 * Update financial & CRM details (admin only).
 */
export async function updateInquiryFinancials(id, { contractAmount, addPayment, adminNotes, replyNotes, status }) {
  const existing = await getInquiryById(id);
  if (!existing) {
    const err = new Error('Inquiry not found');
    err.statusCode = 404;
    throw err;
  }

  let newContractAmount = contractAmount !== undefined ? Number(contractAmount) : (existing.contractAmount || 0);
  let newPaidAmount = existing.paidAmount || 0;
  let history = Array.isArray(existing.paymentHistory) ? existing.paymentHistory : [];

  if (addPayment && Number(addPayment.amount) > 0) {
    const amt = Number(addPayment.amount);
    newPaidAmount += amt;
    history.push({
      amount: amt,
      mode: addPayment.mode || 'UPI / Transfer',
      txnId: addPayment.txnId || `TXN-${Date.now()}`,
      note: addPayment.note || 'Payment recorded',
      date: new Date().toISOString()
    });
  }

  let paymentStatus = 'UNPAID';
  if (newPaidAmount > 0 && newPaidAmount < newContractAmount) {
    paymentStatus = 'PARTIALLY_PAID';
  } else if (newPaidAmount >= newContractAmount && newContractAmount > 0) {
    paymentStatus = 'FULLY_PAID';
  }

  const updateData = {
    contractAmount: newContractAmount,
    paidAmount: newPaidAmount,
    paymentStatus,
    paymentHistory: history,
  };

  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  if (replyNotes !== undefined) {
    updateData.replyNotes = replyNotes;
    updateData.repliedAt = new Date();
    if (!status) updateData.status = 'CONTACTED';
  }
  if (status) updateData.status = status;

  return prisma.inquiry.update({
    where: { id: existing.id },
    data: updateData,
  });
}

/**
 * Delete an inquiry (admin only).
 */
export async function deleteInquiry(id) {
  const existing = await getInquiryById(id);
  if (!existing) throw new Error('Inquiry not found');
  return prisma.inquiry.delete({ where: { id: existing.id } });
}
