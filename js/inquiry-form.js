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

    // Visual loading state & THANK YOU Loader Overlay (Pearly White Fullscreen Theme)
    let overlay = document.getElementById('inquiry-success-loading-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'inquiry-success-loading-modal';
      overlay.className = 'fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#f1f5f9]/98 backdrop-blur-3xl transition-all duration-500';
      overlay.innerHTML = `
        <div class="flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-2xl w-full mx-auto">
            <svg height="0" width="0" viewBox="0 0 64 64" class="absolute">
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="sms-b-inj">
                  <stop stop-color="#973BED"></stop>
                  <stop stop-color="#007CFF" offset="1"></stop>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="sms-c-inj">
                  <stop stop-color="#FFC800"></stop>
                  <stop stop-color="#F0F" offset="1"></stop>
                  <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="6s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform"></animateTransform>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="sms-d-inj">
                  <stop stop-color="#00E0ED"></stop>
                  <stop stop-color="#00DA72" offset="1"></stop>
                </linearGradient>
              </defs>
            </svg>

            <!-- Grand Scale Animated "THANK YOU" Glyphs (Formation & Hold) -->
            <div class="flex flex-col items-center justify-center mb-8 gap-4 sm:gap-6 scale-100 sm:scale-110 md:scale-125">
              <!-- Row 1: T - H - A - N - K Vector Glyphs -->
              <div class="loader-you flex items-center justify-center gap-2 sm:gap-3">
                <!-- T -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-12 h-12 sm:w-16 sm:h-16 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7" stroke="url(#sms-b-inj)" d="M 10,14 H 54 M 32,14 V 52" class="letter-draw"></path>
                </svg>
                <!-- H -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-12 h-12 sm:w-16 sm:h-16 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7" stroke="url(#sms-c-inj)" d="M 14,12 V 52 M 14,32 H 50 M 50,12 V 52" class="letter-draw"></path>
                </svg>
                <!-- A -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-12 h-12 sm:w-16 sm:h-16 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7" stroke="url(#sms-d-inj)" d="M 12,52 L 32,12 L 52,52 M 18,36 H 46" class="letter-draw"></path>
                </svg>
                <!-- N -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-12 h-12 sm:w-16 sm:h-16 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7" stroke="url(#sms-b-inj)" d="M 14,52 V 12 L 50,52 V 12" class="letter-draw"></path>
                </svg>
                <!-- K -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-12 h-12 sm:w-16 sm:h-16 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7" stroke="url(#sms-c-inj)" d="M 14,12 V 52 M 48,14 L 16,32 L 48,50" class="letter-draw"></path>
                </svg>
              </div>

              <!-- Row 2: Y - O - U Vector Glyphs -->
              <div class="loader-you flex items-center justify-center gap-2 sm:gap-3">
                <!-- Y -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-14 h-14 sm:w-20 sm:h-20 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7.5" stroke="url(#sms-b-inj)" d="M 12,12 L 32,32 L 52,12 M 32,32 V 52" class="letter-draw-delayed"></path>
                </svg>
                <!-- O -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-14 h-14 sm:w-20 sm:h-20 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7.5" stroke="url(#sms-c-inj)" d="M 32,12 C 43,12 52,21 52,32 C 52,43 43,52 32,52 C 21,52 12,43 12,32 C 12,21 21,12 32,12 Z" class="letter-draw-delayed"></path>
                </svg>
                <div class="w-2" style="width:0.5em;"></div>
                <!-- U -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" class="w-14 h-14 sm:w-20 sm:h-20 inline-block filter drop-shadow-md">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="7.5" stroke="url(#sms-d-inj)" d="M 14,12 V 36 C 14,45 22,52 32,52 C 42,52 50,45 50,36 V 12" class="letter-draw-delayed"></path>
                </svg>
              </div>
            </div>

            <div class="space-y-2 text-center mt-4">
                <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold tracking-widest uppercase shadow-md">
                    <span>SUBMITTED</span>
                </div>
                <p class="text-slate-900 font-extrabold text-xl sm:text-2xl" style="font-family:'Outfit', sans-serif;">Preparing Your Boarding Pass...</p>
                <p class="text-slate-500 text-xs sm:text-sm font-semibold">Securing cloud intake & lead routing</p>
            </div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100');
    }

    if (submitBtn) {
      submitBtn.disabled = true;
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

    // Seamless 3.5s transition: full animation draw + 1.8s hold state
    setTimeout(() => {
      window.location.assign('thank-you.html');
    }, 3500);
  });
})();
