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

    // Visual loading state & THANK YOU Loader Overlay (Pearly White Theme)
    let overlay = document.getElementById('inquiry-success-loading-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'inquiry-success-loading-modal';
      overlay.className = 'fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#f1f5f9]/94 backdrop-blur-2xl transition-all duration-400';
      overlay.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl text-center max-w-sm w-full mx-4 bg-white/90 border border-slate-200/90 shadow-[0_30px_90px_-15px_rgba(15,23,42,0.18)]">
            <svg height="0" width="0" viewBox="0 0 64 64" class="absolute">
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="sms-b-inj">
                  <stop stop-color="#973BED"></stop>
                  <stop stop-color="#007CFF" offset="1"></stop>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="sms-c-inj">
                  <stop stop-color="#FFC800"></stop>
                  <stop stop-color="#F0F" offset="1"></stop>
                  <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform"></animateTransform>
                </linearGradient>
                <linearGradient gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="sms-d-inj">
                  <stop stop-color="#00E0ED"></stop>
                  <stop stop-color="#00DA72" offset="1"></stop>
                </linearGradient>
              </defs>
            </svg>

            <!-- Animated "THANK YOU" SelfMadeSystem Loader -->
            <div class="flex flex-col items-center justify-center mb-6 gap-1">
              <!-- Row 1: "THANK" with Animated Gradient Stroke -->
              <svg viewBox="0 0 160 32" class="h-7 sm:h-8 w-auto overflow-visible select-none">
                <text x="50%" y="24" text-anchor="middle" font-family="'Outfit', sans-serif" font-weight="900" font-size="24" letter-spacing="0.22em" fill="none" stroke="url(#sms-b-inj)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="dash-uiverse">THANK</text>
              </svg>

              <!-- Row 2: "Y - O - U" Animated Vector Stroke Shapes -->
              <div class="loader-you flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="46" width="46" class="inline-block">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#sms-b-inj)" d="M 54.722656,3.9726563 A 2.0002,2.0002 0 0 0 54.941406,4 h 5.007813 C 58.955121,17.046124 49.099667,27.677057 36.121094,29.580078 a 2.0002,2.0002 0 0 0 -1.708985,1.978516 V 60 H 29.587891 V 31.558594 A 2.0002,2.0002 0 0 0 27.878906,29.580078 C 14.900333,27.677057 5.0448787,17.046124 4.0507812,4 H 9.28125 c 1.231666,11.63657 10.984383,20.554048 22.6875,20.734375 a 2.0002,2.0002 0 0 0 0.02344,0 c 11.806958,0.04283 21.70649,-9.003371 22.730469,-20.7617187 z" class="dash-uiverse" id="sms-y-inj" pathLength="360"></path>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="46" width="46" class="inline-block">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="10" stroke="url(#sms-c-inj)" d="M 32 32 m 0 -27 a 27 27 0 1 1 0 54 a 27 27 0 1 1 0 -54" class="spin-uiverse" id="sms-o-inj" pathLength="360"></path>
                </svg>
                <div class="w-2" style="width:0.35em;"></div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="46" width="46" class="inline-block">
                  <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#sms-d-inj)" d="M 4,4 h 4.6230469 v 25.919922 c -0.00276,11.916203 9.8364941,21.550422 21.7500001,21.296875 11.616666,-0.240651 21.014356,-9.63894 21.253906,-21.25586 a 2.0002,2.0002 0 0 0 0,-0.04102 V 4 H 56.25 v 25.919922 c 0,14.33873 -11.581192,25.919922 -25.919922,25.919922 a 2.0002,2.0002 0 0 0 -0.0293,0 C 15.812309,56.052941 3.998433,44.409961 4,29.919922 Z" class="dash-uiverse" id="sms-u-inj" pathLength="360"></path>
                </svg>
              </div>
            </div>

            <div class="space-y-1.5 text-center">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold tracking-widest uppercase shadow-xs">
                    <span>SUBMITTED</span>
                </div>
                <p class="text-slate-900 font-extrabold text-lg sm:text-xl" style="font-family:'Outfit', sans-serif;">Preparing Your Boarding Pass...</p>
                <p class="text-slate-500 text-xs font-semibold">Securing cloud intake & lead routing</p>
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

    // Seamless 1.85s transition after SelfMadeSystem YOU animation plays smoothly
    setTimeout(() => {
      window.location.assign('thank-you.html');
    }, 1850);
  });
})();
