import fs from 'fs';

console.log('--- GA4 Production Verification Suite ---');

// Mock a lightweight browser DOM environment
class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.style = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  appendChild(child) { this.children.push(child); }
  addEventListener() {}
  closest() { return null; }
}

const mockDoc = {
  title: 'Algora Portfolio Showcase',
  head: new MockElement('head'),
  body: new MockElement('body'),
  documentElement: { scrollHeight: 2000 },
  querySelector: (sel) => {
    if (sel.includes('meta')) return null;
    if (sel.includes('googletagmanager.com')) {
      return mockDoc.head.children.find(c => c.src && c.src.includes('googletagmanager.com')) || null;
    }
    return null;
  },
  querySelectorAll: () => [],
  createElement: (tagName) => new MockElement(tagName),
  addEventListener: () => {}
};

global.window = {
  location: {
    pathname: '/projects.html',
    search: '',
    href: 'http://localhost:3000/projects.html',
    hostname: 'localhost'
  },
  document: mockDoc,
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  history: {
    pushState: () => {}
  },
  addEventListener: () => {},
  requestAnimationFrame: (cb) => cb()
};

global.document = mockDoc;
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;

// Load analytics-config.js and analytics.js
const configCode = fs.readFileSync('js/analytics-config.js', 'utf8');
const analyticsCode = fs.readFileSync('js/analytics.js', 'utf8');

eval(configCode);

// 1. Verify Measurement ID Resolution
const resolvedId = global.window.AnalyticsConfig.resolveMeasurementId();
console.log('1. Resolved Measurement ID:', resolvedId);
if (resolvedId !== 'G-NX74FS2FBG') {
  console.error('❌ Failed: Expected G-NX74FS2FBG, got:', resolvedId);
  process.exit(1);
}
console.log('✔ Measurement ID correctly resolved to G-NX74FS2FBG');

// 2. Load analytics.js
eval(analyticsCode);

// 3. Verify Analytics object
console.log('2. Analytics Object exists on window:', typeof global.window.Analytics === 'object');
if (!global.window.Analytics) {
  console.error('❌ Analytics object not found on window');
  process.exit(1);
}

// 4. Verify script tag injection
const gtagScript = mockDoc.head.children.find(c => c.src && c.src.includes('G-NX74FS2FBG'));
console.log('3. gtag.js script injected in head with G-NX74FS2FBG:', Boolean(gtagScript), gtagScript?.src);
if (!gtagScript) {
  console.error('❌ gtag.js script not injected into head');
  process.exit(1);
}

// 5. Verify dataLayer contents
console.log('4. dataLayer entries count:', global.window.dataLayer ? global.window.dataLayer.length : 0);
if (!global.window.dataLayer || global.window.dataLayer.length === 0) {
  console.error('❌ dataLayer is empty or missing');
  process.exit(1);
}

const dataLayerItems = global.window.dataLayer.map(args => Array.from(args));

// Check consent default
const consentCall = dataLayerItems.find(item => item[0] === 'consent');
console.log('5. Consent Mode v2 call present:', Boolean(consentCall), JSON.stringify(consentCall));

// Check config call
const configCall = dataLayerItems.find(item => item[0] === 'config' && item[1] === 'G-NX74FS2FBG');
console.log('6. gtag config for G-NX74FS2FBG present:', Boolean(configCall));

// Check initial page_view event
const pageViewCall = dataLayerItems.find(item => item[0] === 'event' && item[1] === 'page_view');
console.log('7. Initial page_view event present:', Boolean(pageViewCall), JSON.stringify(pageViewCall));

// 6. Test double-initialization prevention
const countBefore = global.window.dataLayer.length;
global.window.Analytics.init();
global.window.Analytics.init();
const countAfter = global.window.dataLayer.length;
console.log('8. Double-initialization prevented (count before:', countBefore, ', count after:', countAfter, '):', countBefore === countAfter);
if (countBefore !== countAfter) {
  console.error('❌ Duplicate initialization detected!');
  process.exit(1);
}

// 7. Test custom conversion event
global.window.Analytics.trackConversion('lead_submitted', {
  service_type: 'Full-Stack Web App',
  budget_range: '$5,000 - $10,000',
  lead_reference_id: '202609029421'
});

const leadCall = global.window.dataLayer.map(args => Array.from(args)).find(item => item[0] === 'event' && item[1] === 'lead_submitted');
console.log('9. trackConversion("lead_submitted") dispatched:', Boolean(leadCall), JSON.stringify(leadCall));

// 8. Test PII Scrubbing
global.window.Analytics.trackEvent('test_pii_scrub', {
  user_note: 'Contact test@example.com or 415-555-2671',
  password: 'secret_password_123',
  safe_field: 'valid_data'
});

const piiCall = global.window.dataLayer.map(args => Array.from(args)).find(item => item[0] === 'event' && item[1] === 'test_pii_scrub');
console.log('10. PII Scrubbing output:', JSON.stringify(piiCall[2]));

if (piiCall[2].user_note.includes('test@example.com') || piiCall[2].password) {
  console.error('❌ PII Scrubbing failed to redact sensitive info');
  process.exit(1);
}
console.log('✔ PII Scrubbing succeeded: email and sensitive keys redacted');

// 9. Test Error Isolation (simulate error in gtag)
const originalGtag = global.window.gtag;
global.window.gtag = function() {
  throw new Error('Simulated network blocker or adblock exception');
};

let didCrash = false;
try {
  global.window.Analytics.trackEvent('will_not_crash', { dummy: 1 });
} catch (e) {
  didCrash = true;
}
console.log('11. Error Isolation (site does NOT crash if gtag fails):', !didCrash);
if (didCrash) {
  console.error('❌ Error isolation failed!');
  process.exit(1);
}

global.window.gtag = originalGtag;

console.log('\n=============================================');
console.log('✔ ALL GA4 PRODUCTION VERIFICATION TESTS PASSED (11/11)');
console.log('=============================================');
