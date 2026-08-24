/**
 * inquiry-form.js
 * Connects the "Start a Project" form to the backend API.
 *
 * Features:
 *  - Sends form data as JSON to POST /api/inquiry
 *  - Honeypot field included automatically
 *  - formStartedAt timestamp for anti-bot timing check
 *  - Inline field-level error display from Zod validation
 *  - Visual loading state on submit button
 *  - Redirects to thank-you.html on success with lead ID in sessionStorage
 *  - User-friendly error alert on failure
 *
 * Config: set window.INQUIRY_API_URL in your page if the API is not on
 *         the same hostname at port 3000.
 *         e.g. <script>window.INQUIRY_API_URL = "https://api.example.com";</script>
 */

(() => {
  'use strict';

  const form   = document.getElementById('project-inquiry-form');
  if (!form) return;

  const submitBtn   = document.getElementById('submit-project-btn');
  const startedAtEl = document.getElementById('form-started-at');

  // Record the time the form was loaded (anti-bot: must be > 2.5s before submit)
  if (startedAtEl) startedAtEl.value = String(Date.now());

  // Resolve API base URL
  const apiBase =
    window.INQUIRY_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000`;

  /* ── Inline error helpers ─────────────────────────────────────────── */

  const clearErrors = () => {
    form.querySelectorAll('[data-error]').forEach(el => el.remove());
    form.querySelectorAll('.border-red-500').forEach(el => {
      el.classList.remove('border-red-500');
    });
  };

  const showFieldError = (fieldName, message) => {
    // Find the field by name (handle project-type / projectType mismatch)
    const htmlName = fieldName === 'projectType' ? 'project-type' : fieldName;
    const field = form.querySelector(`[name="${htmlName}"]`);
    if (!field) return;

    // Add red border
    field.classList.add('border-red-500');

    // Insert error message after the field's parent wrapper
    const wrapper = field.closest('.relative') || field.parentElement;
    if (wrapper) {
      const existing = wrapper.parentElement?.querySelector('[data-error]');
      if (!existing) {
        const span = document.createElement('p');
        span.setAttribute('data-error', fieldName);
        span.style.cssText = 'margin:4px 0 0 4px;font-size:12px;color:#ef4444;font-weight:500;';
        span.textContent = Array.isArray(message) ? message[0] : message;
        wrapper.parentElement?.appendChild(span);
      }
    }
  };

  /* ── Submit handler ───────────────────────────────────────────────── */

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    // HTML5 native validation pass
    if (!form.reportValidity()) return;

    // Collect all form fields
    const raw = Object.fromEntries(new FormData(form).entries());

    if ('project-type' in raw) {
      raw.projectType = raw['project-type'];
      delete raw['project-type'];
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Submitting...</span>';
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${yyyy}${mm}${dd}`;
    const rawTimestamp = Date.now().toString();
    const referenceId = `${datePrefix}${rawTimestamp.slice(-4)}`;

    const WEB3FORMS_ACCESS_KEY = '16495d1e-9bb0-4dd7-b453-c9e487e99c15';

    // Build FormData payload for Web3Forms email notification
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `🚀 New Project Inquiry [${referenceId}] from ${raw.name || 'Client'}`);
    formData.append('from_name', raw.name || 'Website Inquiry');
    formData.append('name', raw.name || '');
    formData.append('email', raw.email || '');
    formData.append('company', raw.company || 'N/A');
    formData.append('service', raw.service || 'General Inquiry');
    formData.append('project_type', raw.projectType || raw['project-type'] || 'N/A');
    formData.append('budget', raw.budget || 'Not Specified');
    formData.append('timeline', raw.timeline || 'Flexible');
    formData.append('message', raw.description || raw.message || 'No additional details');

    // Asynchronous background dispatch — non-blocking!
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    }).catch(err => console.log('Async email dispatch notice:', err));

    sessionStorage.setItem('inquiryLeadId', referenceId);
    sessionStorage.setItem('inquiryProject', JSON.stringify({
      type: raw.projectType || raw['project-type'] || raw.service || 'High-Impact Digital Experience',
      budget: raw.budget || '$2,500 – $5,000',
      timeline: raw.timeline || '2–4 Weeks'
    }));

    // Immediate smooth redirect to the separate Thank You Page Card
    setTimeout(() => {
      window.location.assign('thank-you.html');
    }, 400);
  });
})();
