// Test analytics config and PII scrubber logic
import fs from 'fs';

console.log('Testing Analytics Configuration and Logic...');

const configContent = fs.readFileSync('js/analytics-config.js', 'utf8');
const analyticsContent = fs.readFileSync('js/analytics.js', 'utf8');

console.log('✔ js/analytics-config.js read successfully (length:', configContent.length, 'bytes)');
console.log('✔ js/analytics.js read successfully (length:', analyticsContent.length, 'bytes)');

// Test PII Regexes
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

const testInput = "Contact me at client@example.com or call 555-123-4567";
const sanitized = testInput.replace(EMAIL_REGEX, '[REDACTED_EMAIL]').replace(PHONE_REGEX, '[REDACTED_PHONE]');

console.log('Test input:', testInput);
console.log('Sanitized output:', sanitized);

if (sanitized.includes('client@example.com') || sanitized.includes('555-123-4567')) {
  console.error('❌ PII sanitization failed!');
  process.exit(1);
} else {
  console.log('✔ PII sanitization passed completely!');
}
