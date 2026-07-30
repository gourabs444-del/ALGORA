/**
 * Generate the next Lead ID in the format: MC-YYYY-NNNNNN
 * Auto-increments based on inquiries created in the current calendar year.
 * Example: MC-2026-000001
 */
export async function nextLeadId(prisma) {
  const year = new Date().getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));

  const count = await prisma.inquiry.count({
    where: { createdAt: { gte: startOfYear } },
  });

  const sequence = String(count + 1).padStart(6, '0');
  return `MC-${year}-${sequence}`;
}
