/**
 * analytics-config.js
 * Central configuration, measurement ID resolution, and event dictionary for GA4.
 *
 * Measurement ID Resolution Order:
 *  1. window.GA_MEASUREMENT_ID (explicit global config)
 *  2. window.ENV?.NEXT_PUBLIC_GA_MEASUREMENT_ID || window.ENV?.GA_MEASUREMENT_ID
 *  3. <meta name="ga-measurement-id" content="G-XXXXXXXXXX">
 *  4. localStorage.getItem('GA_MEASUREMENT_ID') (for testing & runtime staging overrides)
 *  5. Default fallback ID (if configured)
 */

(() => {
  'use strict';

  // Fallback / Production Measurement ID (or placeholder ready for injection)
  const DEFAULT_MEASUREMENT_ID = 'G-NX74FS2FBG';

  /**
   * Resolves the active Google Analytics 4 Measurement ID from available sources.
   * @returns {string|null} The resolved G-XXXXXXXXXX ID or null if not configured.
   */
  function resolveMeasurementId() {
    // 1. Explicit window global
    if (typeof window.GA_MEASUREMENT_ID === 'string' && window.GA_MEASUREMENT_ID.trim()) {
      return window.GA_MEASUREMENT_ID.trim();
    }

    // 2. Next.js / Server-injected environment object
    if (window.ENV) {
      if (typeof window.ENV.NEXT_PUBLIC_GA_MEASUREMENT_ID === 'string' && window.ENV.NEXT_PUBLIC_GA_MEASUREMENT_ID.trim()) {
        return window.ENV.NEXT_PUBLIC_GA_MEASUREMENT_ID.trim();
      }
      if (typeof window.ENV.GA_MEASUREMENT_ID === 'string' && window.ENV.GA_MEASUREMENT_ID.trim()) {
        return window.ENV.GA_MEASUREMENT_ID.trim();
      }
    }

    // 3. HTML Meta tag: <meta name="ga-measurement-id" content="G-XXXXXXXXXX">
    const metaTag = document.querySelector('meta[name="ga-measurement-id"], meta[name="next-public-ga-measurement-id"]');
    if (metaTag && metaTag.getAttribute('content')) {
      const content = metaTag.getAttribute('content').trim();
      if (content && !content.startsWith('${') && !content.startsWith('__')) {
        return content;
      }
    }

    // 4. LocalStorage override (useful for developer testing and staging environments)
    try {
      const localId = localStorage.getItem('GA_MEASUREMENT_ID');
      if (localId && typeof localId === 'string' && localId.trim()) {
        return localId.trim();
      }
    } catch (e) {
      // Storage access may be restricted
    }

    // 5. Default project Measurement ID
    if (DEFAULT_MEASUREMENT_ID && DEFAULT_MEASUREMENT_ID.startsWith('G-')) {
      return DEFAULT_MEASUREMENT_ID;
    }

    return null;
  }

  // Export to global namespace
  window.AnalyticsConfig = {
    resolveMeasurementId,
    defaultId: DEFAULT_MEASUREMENT_ID,
    
    // Core Event Names Dictionary
    EVENTS: {
      PAGE_VIEW: 'page_view',
      CTA_CLICK: 'cta_click',
      NAVIGATION_CLICK: 'navigation_click',
      BUTTON_CLICK: 'button_click',
      FORM_START: 'form_start',
      FORM_SUBMIT: 'form_submit',
      FORM_ERROR: 'form_error',
      LEAD_SUBMITTED: 'lead_submitted',
      CONVERSION_COMPLETE: 'conversion_complete',
      SIGNUP_START: 'signup_start',
      SIGNUP_COMPLETE: 'signup_complete',
      LOGIN_START: 'login_start',
      LOGIN_COMPLETE: 'login_complete',
      OUTBOUND_LINK_CLICK: 'outbound_link_click',
      DOWNLOAD: 'file_download',
      SEARCH: 'search',
      FILTER_USED: 'filter_used',
      CODE_COPY: 'code_copy',
      VIEW_ITEM: 'view_item',
      SCROLL_DEPTH: 'scroll_depth',
      ERROR: 'error'
    },

    // Key Conversion Events Definition
    CONVERSIONS: {
      PRIMARY: ['lead_submitted', 'conversion_complete'],
      SECONDARY: ['code_copy', 'signup_complete', 'login_complete', 'cta_click']
    }
  };
})();
