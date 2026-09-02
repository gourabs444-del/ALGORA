/**
 * analytics.js
 * Production-Grade Google Analytics 4 (GA4) Tracking & Measurement Engine.
 *
 * Capabilities:
 *  - Dynamic, non-blocking asynchronous gtag.js loader
 *  - Safe fallback & error isolation (zero UI disruption on failure)
 *  - PII (Personally Identifiable Information) scrubber
 *  - GA4 Consent Mode v2 integration
 *  - Automatic SPA / Route / Hash page-view tracking
 *  - Automatic 25%, 50%, 75%, 90% scroll-depth tracking
 *  - Automatic Outbound & Download link interception
 *  - Declarative HTML attribute tracking (data-analytics-*)
 *  - Comprehensive Conversion & Interaction API
 *  - Real-time Debug Mode for GA4 DebugView & console inspections
 */

(() => {
  'use strict';

  // Prevent multiple initializations
  if (window.Analytics && window.Analytics.__initialized) {
    return;
  }

  /* ── 1. STATE & ENVIRONMENT CONFIGURATION ────────────────────────── */
  const state = {
    initialized: false,
    measurementId: null,
    debugMode: false,
    currentPagePath: window.location.pathname,
    scrollThresholdsTracked: new Set(),
    activeTimeOnPage: 0,
    startTime: Date.now()
  };

  // Determine Debug Mode
  try {
    const urlParams = new URLSearchParams(window.location.search);
    state.debugMode =
      urlParams.get('debug_ga') === 'true' ||
      urlParams.get('ga_debug') === 'true' ||
      localStorage.getItem('ga_debug') === 'true' ||
      window.GA_DEBUG === true ||
      (window.location.hostname === 'localhost' && urlParams.get('prod_ga') !== 'true');
  } catch (e) {
    state.debugMode = false;
  }

  /* ── 2. PII SCRUBBER & SANITIZATION ───────────────────────────────── */
  const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const SENSITIVE_KEYS = ['password', 'pwd', 'token', 'auth', 'secret', 'credit_card', 'card', 'cvv', 'ssn'];

  /**
   * Sanitizes parameter values by removing emails, phone numbers, and sensitive keys.
   * @param {Record<string, any>} params
   * @returns {Record<string, any>}
   */
  function sanitizeParams(params) {
    if (!params || typeof params !== 'object') return {};

    const clean = {};
    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();

      // Drop sensitive keys completely
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        continue;
      }

      if (typeof value === 'string') {
        // Scrub emails and phone numbers from strings
        clean[key] = value
          .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
          .replace(PHONE_REGEX, '[REDACTED_PHONE]')
          .slice(0, 500); // GA4 parameter length limit safety
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      } else if (Array.isArray(value)) {
        clean[key] = value.slice(0, 10).map(item => (typeof item === 'string' ? item.slice(0, 100) : item));
      } else if (value && typeof value === 'object') {
        clean[key] = JSON.stringify(value).slice(0, 500);
      }
    }

    return clean;
  }

  /* ── 3. CONSOLE LOGGER FOR DEBUGGING ──────────────────────────────── */
  function debugLog(type, eventName, payload) {
    if (!state.debugMode) return;
    const badgeStyle = 'background:#8b5cf6;color:#ffffff;font-weight:bold;padding:2px 6px;border-radius:4px;';
    const nameStyle = 'color:#06b6d4;font-weight:bold;';
    console.groupCollapsed(`%cGA4%c ${eventName} %c(${type})`, badgeStyle, nameStyle, 'color:#94a3b8;');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Measurement ID:', state.measurementId || '(Mock / Debug Mode)');
    console.table(payload);
    console.groupEnd();
  }

  /* ── 4. GA4 SCRIPT INJECTION & GTAG BOOTSTRAP ─────────────────────── */
  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
  }

  function injectGoogleTag(measurementId) {
    if (!measurementId || !measurementId.startsWith('G-')) {
      if (state.debugMode) {
        console.warn('[GA4] No valid Measurement ID (format: G-XXXXXXXXXX) found. Running in Mock/Debug mode.');
      }
      return;
    }

    // Check if script is already present
    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`);
    if (existing) return;

    ensureGtag();

    // Default Consent Mode v2 (Strict Privacy First)
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });

    window.gtag('js', new Date());

    // Basic GA4 Config with Debug Mode flag if enabled
    const configOptions = {
      send_page_view: false, // We control page_view for precise Single Page / MPA routing
      cookie_flags: 'SameSite=None;Secure'
    };

    if (state.debugMode) {
      configOptions.debug_mode = true;
    }

    window.gtag('config', measurementId, configOptions);

    // Asynchronously load the official Google Tag script without blocking render
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onerror = () => {
      console.warn('[GA4] Failed to load gtag.js (likely blocked by client privacy extension). Analytics is gracefully dormant.');
    };
    document.head.appendChild(script);
  }

  /* ── 5. CORE EVENT DISPATCHER ─────────────────────────────────────── */
  function trackEvent(eventName, rawParams = {}) {
    try {
      if (!eventName || typeof eventName !== 'string') return;

      const sanitized = sanitizeParams(rawParams);

      // Include contextual metadata
      const payload = {
        page_path: window.location.pathname + window.location.search,
        page_title: document.title || 'Algora Showcase',
        page_location: window.location.href,
        ...sanitized
      };

      if (state.debugMode) {
        payload.debug_mode = true;
        debugLog('Event', eventName, payload);
      }

      ensureGtag();
      window.gtag('event', eventName, payload);
    } catch (err) {
      // Analytics must never crash application logic
      if (state.debugMode) console.error('[GA4 Track Error]', err);
    }
  }

  /* ── 6. SPECIALIZED TRACKING METHODS ──────────────────────────────── */

  /**
   * Tracks a page view event.
   * @param {string} [title]
   * @param {string} [path]
   */
  function trackPageView(title, path) {
    const pagePath = path || window.location.pathname + window.location.search;
    const pageTitle = title || document.title || 'Algora Portfolio';

    state.currentPagePath = pagePath;
    state.scrollThresholdsTracked.clear(); // Reset scroll milestones for the new page view

    trackEvent('page_view', {
      page_title: pageTitle,
      page_path: pagePath,
      page_location: window.location.href
    });
  }

  /**
   * Tracks a primary or secondary conversion key event.
   * @param {string} conversionName
   * @param {Record<string, any>} [params]
   */
  function trackConversion(conversionName, params = {}) {
    trackEvent(conversionName, {
      is_conversion: true,
      conversion_type: conversionName,
      ...params
    });
  }

  /**
   * Tracks user interaction with high-intent Call-To-Action elements.
   * @param {string} ctaName
   * @param {string} [location]
   * @param {string} [destination]
   */
  function trackCTA(ctaName, location = 'body', destination = '') {
    trackEvent('cta_click', {
      cta_name: ctaName,
      cta_location: location,
      cta_destination: destination
    });
  }

  /**
   * Tracks form lifecycle events (start, submit, errors).
   */
  function trackFormStart(formName, serviceType = '') {
    trackEvent('form_start', {
      form_name: formName,
      service_type: serviceType
    });
  }

  function trackFormSubmit(formName, params = {}) {
    trackEvent('form_submit', {
      form_name: formName,
      ...params
    });
  }

  function trackFormError(formName, errorType, fieldName = '') {
    trackEvent('form_error', {
      form_name: formName,
      error_type: errorType,
      field_name: fieldName
    });
  }

  /**
   * Tracks catalog/portfolio search events.
   */
  function trackSearch(searchTerm, resultCount = 0, category = 'all') {
    if (!searchTerm || !searchTerm.trim()) return;
    trackEvent('search', {
      search_term: searchTerm.trim(),
      result_count: resultCount,
      search_category: category
    });
  }

  /**
   * Tracks filter tab and category accordion usage.
   */
  function trackFilter(filterCategory, filterValue) {
    trackEvent('filter_used', {
      filter_category: filterCategory,
      filter_value: filterValue
    });
  }

  /**
   * Tracks component code copying in UI detail sandbox.
   */
  function trackCodeCopy(componentId, componentTitle, codeLanguage = 'html') {
    trackConversion('code_copy', {
      component_id: componentId,
      component_title: componentTitle,
      code_language: codeLanguage
    });
  }

  /**
   * Tracks authentication actions (signup, login, logout).
   */
  function trackAuth(action, method = 'email') {
    const eventName =
      action === 'login' ? 'login_complete' : action === 'signup' ? 'signup_complete' : 'auth_action';
    trackConversion(eventName, {
      auth_action: action,
      auth_method: method
    });
  }

  /**
   * Tracks outbound link clicks.
   */
  function trackOutbound(url, label = '') {
    trackEvent('outbound_link_click', {
      link_url: url,
      link_domain: new URL(url, window.location.href).hostname,
      link_label: label
    });
  }

  /* ── 7. AUTO-INSTRUMENTATION: SCROLL, CLICKS & SPA ROUTING ────────── */

  function initScrollDepthTracker() {
    let ticking = false;
    const thresholds = [25, 50, 75, 90];

    const checkScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollTop = window.scrollY || window.pageYOffset;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      thresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !state.scrollThresholdsTracked.has(threshold)) {
          state.scrollThresholdsTracked.add(threshold);
          trackEvent('scroll_depth', {
            percent_scrolled: threshold,
            page_path: state.currentPagePath
          });
        }
      });
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(checkScroll);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function initDeclarativeClickListener() {
    document.addEventListener('click', event => {
      const target = event.target.closest('a, button, [data-analytics-cta], [data-analytics-event]');
      if (!target) return;

      // 1. Declarative Custom Event Attribute
      const customEvent = target.getAttribute('data-analytics-event');
      if (customEvent) {
        const customCategory = target.getAttribute('data-analytics-category') || 'general';
        const customLabel = target.getAttribute('data-analytics-label') || target.textContent.trim().slice(0, 50);
        trackEvent(customEvent, {
          event_category: customCategory,
          event_label: customLabel
        });
        return;
      }

      // 2. Declarative CTA Attribute
      const ctaName = target.getAttribute('data-analytics-cta');
      if (ctaName) {
        const location = target.getAttribute('data-analytics-section') || target.closest('section')?.id || 'header';
        const destination = target.getAttribute('href') || '';
        trackCTA(ctaName, location, destination);
        return;
      }

      // 3. Outbound Link Interception
      if (target.tagName === 'A' && target.href) {
        try {
          const destUrl = new URL(target.href, window.location.href);
          const isExternal = destUrl.hostname && destUrl.hostname !== window.location.hostname;
          if (isExternal && !destUrl.protocol.startsWith('javascript')) {
            trackOutbound(target.href, target.textContent.trim().slice(0, 50));
          }
        } catch (e) {}
      }
    });
  }

  function initSpaRouteListener() {
    // Listen for History API navigations (if SPA routing is introduced)
    if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') {
      const originalPushState = window.history.pushState;
      window.history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(() => trackPageView(), 50);
      };
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('popstate', () => {
        setTimeout(() => trackPageView(), 50);
      });

      // Hash change tracker for tab / in-page sections
      window.addEventListener('hashchange', () => {
        if (window.location.hash) {
          trackEvent('navigation_click', {
            nav_type: 'hash_anchor',
            destination_hash: window.location.hash
          });
        }
      });
    }
  }

  /* ── 8. INITIALIZATION RUNNER ──────────────────────────────────────── */
  function init(customOptions = {}) {
    if (state.initialized) return;

    // Resolve Measurement ID
    const resolvedId =
      customOptions.measurementId ||
      (window.AnalyticsConfig && window.AnalyticsConfig.resolveMeasurementId
        ? window.AnalyticsConfig.resolveMeasurementId()
        : null);

    state.measurementId = resolvedId;
    state.initialized = true;

    // Inject Google tag
    if (resolvedId) {
      injectGoogleTag(resolvedId);
    } else if (state.debugMode) {
      ensureGtag();
      console.log('%c[GA4 Analytics Initialized in Debug / Standby Mode]', 'color:#10b981;font-weight:bold;');
    }

    // Auto-record Initial Page View
    trackPageView();

    // Auto-bind behavioral listeners
    initScrollDepthTracker();
    initDeclarativeClickListener();
    initSpaRouteListener();

    if (state.debugMode) {
      console.log(`[GA4 Engine Active] ID: ${resolvedId || 'Standby'} | DebugView: ${state.debugMode ? 'ON' : 'OFF'}`);
    }
  }

  /* ── 9. PUBLIC API EXPOSURE ───────────────────────────────────────── */
  const Analytics = {
    __initialized: true,
    init,
    trackEvent,
    trackPageView,
    trackConversion,
    trackCTA,
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackSearch,
    trackFilter,
    trackCodeCopy,
    trackAuth,
    trackOutbound,
    getMeasurementId: () => state.measurementId,
    isDebug: () => state.debugMode,
    setConsent: consentOptions => {
      ensureGtag();
      window.gtag('consent', 'update', consentOptions);
    }
  };

  window.Analytics = Analytics;

  // Auto-boot upon DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
