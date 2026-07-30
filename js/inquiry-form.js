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

    // Map HTML name "project-type" → JSON key "projectType"
    if ('project-type' in raw) {
      raw.projectType = raw['project-type'];
      delete raw['project-type'];
    }

    // Set loading state
    const originalText = submitBtn.textContent.trim();
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Submitting…`;

    try {
      const response = await fetch(`${apiBase}/api/inquiry`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(raw),
      });

      const result = await response.json();

      if (response.status === 201 && result.success) {
        // Success — store lead ID and redirect
        sessionStorage.setItem('inquiryLeadId', result.leadId || '');
        window.location.assign('thank-you.html');
        return;
      }

      // Validation errors from Zod (400)
      if (response.status === 400 && result.fields) {
        Object.entries(result.fields).forEach(([field, messages]) => {
          showFieldError(field, messages);
        });
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        // Scroll to first error
        const firstError = form.querySelector('[data-error]');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Rate limit (429)
      if (response.status === 429) {
        throw new Error('Too many submissions. Please wait an hour and try again.');
      }

      // Duplicate (409)
      if (response.status === 409) {
        throw new Error('This inquiry was already submitted recently. Please wait 10 minutes before resubmitting.');
      }

      // Generic error
      throw new Error(result.error || 'Something went wrong. Please try again.');

    } catch (error) {
      // Network or fetch failure
      const message = error.name === 'TypeError'
        ? 'Could not connect to the server. Please check your connection and try again.'
        : error.message;

      // Show a toast-style error at the top of the form
      const existing = form.querySelector('#form-global-error');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'form-global-error';
      toast.style.cssText = `
        background: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: 12px;
        padding: 14px 18px;
        color: #b91c1c;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
        margin-bottom: 16px;
      `;
      toast.textContent = `⚠️  ${message}`;
      form.prepend(toast);

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      // Auto-dismiss toast after 8 seconds
      setTimeout(() => toast.remove(), 8000);
    }
  });
})();
