# Google Analytics 4 (GA4) Analytics & User Behavior Tracking

Production-grade analytics and behavioral measurement architecture for the Algora Portfolio & Digital Showcase.

---

## 1. System Architecture

The analytics system is built on a modular, privacy-first, non-blocking foundation located in `js/analytics-config.js` and `js/analytics.js`.

```mermaid
flowchart TD
    UserNav[User Navigation & Interactions] --> Core[Analytics Core Engine (js/analytics.js)]
    Core --> ConfigCheck{Valid GA4 Measurement ID?}
    ConfigCheck -- No --> Mock[Graceful Silent Dormancy / Dev Console]
    ConfigCheck -- Yes --> Sanitize[PII Sanitizer & Data Scrubber]
    Sanitize --> Gtag[gtag.js Dispatcher]
    Gtag --> GA4[Google Analytics 4 & DebugView]
    
    subgraph AutoInstrumentation [Automatic Behavioral Tracking]
        PageView[Page Views & SPA Route / Hash Navigation]
        Scroll[Scroll Depth: 25%, 50%, 75%, 90%]
        Outbound[Outbound & Social Links Interceptor]
        Declarative[Declarative data-analytics-* DOM Tracker]
    end

    AutoInstrumentation --> Core
```

### Key Architectural Tenets:
- **Zero Blocking**: Google tag (`gtag.js`) loads asynchronously; page rendering is never blocked.
- **Fail-Safe & Isolated**: If analytics fails or is blocked by an adblocker, all tracking methods gracefully no-op without throwing errors or interrupting application flow.
- **Strict PII Stripping**: Automatically strips emails, phone numbers, passwords, auth tokens, and credit card numbers from all event parameters before dispatch.
- **Google Consent Mode v2**: Initialized with privacy-first defaults (`analytics_storage: 'granted'`, `ad_storage: 'denied'`, `ad_user_data: 'denied'`, `ad_personalization: 'denied'`).

---

## 2. Environment Configuration

The system dynamically resolves the Measurement ID across environments using the following priority order:

1. `window.GA_MEASUREMENT_ID` (Explicit JavaScript global)
2. `window.ENV.NEXT_PUBLIC_GA_MEASUREMENT_ID` or `window.ENV.GA_MEASUREMENT_ID`
3. `<meta name="ga-measurement-id" content="G-XXXXXXXXXX">`
4. `localStorage.getItem('GA_MEASUREMENT_ID')` (Runtime override for testing)
5. Default fallback configured in `js/analytics-config.js`

### Environment Variables (`.env`):
```bash
# Production GA4 Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-NX74FS2FBG"
GA_MEASUREMENT_ID="G-NX74FS2FBG"
```

---

## 3. Event Catalog & Parameters

| Event Name | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `page_view` | Auto & Manual | Page view across MPA and client-side route changes | `page_title`, `page_path`, `page_location` |
| `cta_click` | Key Event / Secondary | Interaction with high-intent CTA buttons | `cta_name`, `cta_location`, `cta_destination` |
| `form_start` | Interaction | User begins interacting with a form | `form_name`, `service_type` |
| `form_submit` | Key Event | Form submission attempt | `form_name`, `service_type`, `budget_range`, `timeline`, `lead_reference_id` |
| `form_error` | Error | Form validation or submission error | `form_name`, `error_type`, `field_name` |
| `lead_submitted` | **Primary Conversion** | Successful project inquiry submission | `service_type`, `budget_range`, `timeline`, `lead_reference_id`, `value`, `currency` |
| `conversion_complete` | **Primary Conversion** | Confirmation view on thank you screen | `lead_reference_id`, `destination` |
| `code_copy` | Key Event / Secondary | Developer copies code from UI component sandbox | `component_id`, `component_title`, `code_language` |
| `select_content` | Interaction | User selects a UI card or showcase item | `content_type`, `item_id`, `item_name` |
| `search` | Interaction | Search queries in UI & project catalogs | `search_term`, `result_count`, `search_category` |
| `filter_used` | Interaction | Category tab, industry filter, or bookmark toggle | `filter_category`, `filter_value` |
| `scroll_depth` | Engagement | Scroll milestone reached (25%, 50%, 75%, 90%) | `percent_scrolled`, `page_path` |
| `signup_complete` | Key Event | User registers an account | `auth_action`, `auth_method` |
| `login_complete` | Key Event | User signs into account | `auth_action`, `auth_method` |
| `outbound_link_click` | Engagement | Clicks to external links (GitHub, LinkedIn, live client sites) | `link_url`, `link_domain`, `link_label` |

---

## 4. Conversion Funnels

### Primary Conversion Funnel: Project Inquiry & Client Acquisition
```
1. Landing / Showcase Page (index.html / projects.html)
   └─ Event: page_view
2. CTA Click ("Start a Project" / "Explore Projects")
   └─ Event: cta_click
3. Inquiry Form Open (start-project.html)
   └─ Event: form_start
4. Form Submission
   └─ Event: form_submit
5. Lead Generation & Success (thank-you-animation.html -> thank-you.html)
   └─ Event: lead_submitted & conversion_complete (Primary Key Events)
```

### Secondary Funnel: UI Component Adoption
```
1. UI Catalog Browse (ui.html)
   └─ Events: page_view, search, filter_used
2. Component Card Selection (ui.html)
   └─ Event: select_content
3. Sandbox Inspection & Code Copy (ui-detail.html)
   └─ Event: code_copy (Secondary Key Event)
```

---

## 5. Developer Guide & API Usage

The global `Analytics` object is accessible on `window.Analytics`:

### 1. Manual Event Dispatch:
```javascript
// Generic event
Analytics.trackEvent('custom_interaction', {
  feature_name: '3d_jellyfish_toggle',
  interaction_state: 'active'
});

// Call to action
Analytics.trackCTA('Book Consultation', 'hero_section', 'start-project.html');

// Conversion event
Analytics.trackConversion('lead_submitted', {
  service_type: 'High-Impact Digital Experience',
  budget_range: '$5,000 - $10,000'
});
```

### 2. Declarative HTML Tracking:
Add attributes directly to any HTML element without writing JavaScript:

```html
<!-- Track CTA click -->
<a href="start-project.html"
   data-analytics-cta="Start a Project"
   data-analytics-section="hero_header">
   Start a Project
</a>

<!-- Track Custom Event -->
<button data-analytics-event="theme_toggle"
        data-analytics-category="ui_preferences"
        data-analytics-label="dark_mode">
   Toggle Theme
</button>
```

---

## 6. Local Testing & Verification

### How to Enable Debug Mode:
1. Append `?debug_ga=true` to any URL (e.g. `http://localhost:5500/projects.html?debug_ga=true`) OR
2. In browser console, run:
   ```javascript
   localStorage.setItem('ga_debug', 'true');
   ```

### Verifying in GA4 DebugView:
When debug mode is active, the engine automatically sets `debug_mode: true` in all event payloads, routing live interaction data into **Google Analytics 4 → Admin → DebugView** with sub-second latency.
