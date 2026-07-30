/**
 * HTML email templates for admin notifications and client confirmations.
 * All user-supplied content is HTML-escaped before insertion.
 */

const esc = (value) =>
  String(value ?? '—').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const row = (label, value) =>
  `<tr>
    <td style="padding:8px 12px;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;border-bottom:1px solid #f3f4f6;">${esc(label)}</td>
    <td style="padding:8px 12px;color:#1f2937;vertical-align:top;border-bottom:1px solid #f3f4f6;">${esc(value)}</td>
  </tr>`;

/* ── Admin Notification Email ────────────────────────────────────────── */
export const adminEmail = (inquiry) => ({
  subject: `🆕 New Project Inquiry — ${inquiry.leadId}`,
  html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>New Project Inquiry</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#374151 100%);padding:32px 40px;">
        <p style="margin:0;color:#9ca3af;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Portfolio Inquiry System</p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">New Project Inquiry</h1>
        <p style="margin:8px 0 0;color:#d1d5db;font-size:14px;">A new client has submitted a project inquiry.</p>
      </td></tr>

      <!-- Lead ID Banner -->
      <tr><td style="background:#eff6ff;padding:16px 40px;border-bottom:1px solid #dbeafe;">
        <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:600;">
          Lead ID: <span style="font-family:monospace;font-size:15px;letter-spacing:0.05em;">${esc(inquiry.leadId)}</span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          Submitted: ${inquiry.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' })} IST
        </p>
      </td></tr>

      <!-- Contact Info -->
      <tr><td style="padding:32px 40px 0;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Contact Information</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          ${row('Name', inquiry.name)}
          ${row('Email', inquiry.email)}
          ${row('Company', inquiry.company || '—')}
        </table>
      </td></tr>

      <!-- Project Details -->
      <tr><td style="padding:24px 40px 0;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Project Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          ${row('Service', inquiry.service)}
          ${row('Project Type', inquiry.projectType)}
          ${row('Budget', inquiry.budget || '—')}
          ${row('Timeline', inquiry.timeline)}
          ${row('Status', inquiry.status)}
        </table>
      </td></tr>

      <!-- Description -->
      <tr><td style="padding:24px 40px 0;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Project Description</h2>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;">${esc(inquiry.description)}</div>
      </td></tr>

      <!-- Technical Info -->
      <tr><td style="padding:24px 40px;">
        <h2 style="margin:0 0 12px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Technical Details</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #f3f4f6;">
          ${row('IP Address', inquiry.ipAddress || '—')}
          ${row('User Agent', inquiry.userAgent || '—')}
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated message from Portfolio Inquiry System.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`,
});

/* ── Client Confirmation Email ───────────────────────────────────────── */
export const clientEmail = (inquiry) => ({
  subject: `We've received your inquiry — ${inquiry.leadId}`,
  html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Inquiry Received</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#374151 100%);padding:40px 40px 32px;text-align:center;">
        <div style="width:56px;height:56px;background:#ffffff20;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">✉️</div>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Thank you, ${esc(inquiry.name)}!</h1>
        <p style="margin:10px 0 0;color:#d1d5db;font-size:15px;line-height:1.6;">We've received your project inquiry and our team will be in touch within <strong style="color:#fff;">24 hours</strong>.</p>
      </td></tr>

      <!-- Lead ID -->
      <tr><td style="padding:28px 40px;text-align:center;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your Reference ID</p>
        <div style="display:inline-block;background:#eff6ff;border:2px solid #dbeafe;border-radius:999px;padding:10px 24px;">
          <span style="font-family:monospace;font-size:18px;font-weight:800;color:#1d4ed8;letter-spacing:0.08em;">${esc(inquiry.leadId)}</span>
        </div>
        <p style="margin:10px 0 0;color:#9ca3af;font-size:12px;">Keep this ID for your records.</p>
      </td></tr>

      <!-- Project Summary -->
      <tr><td style="padding:28px 40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Your Project Summary</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          ${row('Service', inquiry.service)}
          ${row('Project Type', inquiry.projectType)}
          ${row('Timeline', inquiry.timeline)}
          ${inquiry.budget ? row('Budget', inquiry.budget) : ''}
        </table>
      </td></tr>

      <!-- What's next -->
      <tr><td style="padding:0 40px 28px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">What Happens Next?</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;vertical-align:top;width:32px;"><span style="display:inline-block;width:24px;height:24px;background:#1a1a1a;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;">1</span></td>
            <td style="padding:10px 0 10px 12px;color:#374151;font-size:14px;border-bottom:1px solid #f3f4f6;">We review your inquiry carefully.</td>
          </tr>
          <tr>
            <td style="padding:10px 0;vertical-align:top;width:32px;"><span style="display:inline-block;width:24px;height:24px;background:#374151;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;">2</span></td>
            <td style="padding:10px 0 10px 12px;color:#374151;font-size:14px;border-bottom:1px solid #f3f4f6;">We contact you within 24 hours to schedule a call.</td>
          </tr>
          <tr>
            <td style="padding:10px 0;vertical-align:top;width:32px;"><span style="display:inline-block;width:24px;height:24px;background:#6b7280;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;">3</span></td>
            <td style="padding:10px 0 10px 12px;color:#374151;font-size:14px;">We discuss your goals and build the best plan of action.</td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#374151;font-size:13px;font-weight:600;">— The Portfolio Team</p>
        <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">Please do not reply to this email. Expect our call shortly.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`,
});
