// Verify direct network transport to Google Analytics 4 collect endpoint
const measurementId = 'G-NX74FS2FBG';
const protocolVersion = '2';
const clientId = '123456789.987654321';
const pageTitle = encodeURIComponent('Algora Portfolio Showcase');
const pageLocation = encodeURIComponent('https://algora.io/projects.html');

const collectUrl = `https://www.google-analytics.com/g/collect?v=${protocolVersion}&tid=${measurementId}&cid=${clientId}&en=page_view&dt=${pageTitle}&dl=${pageLocation}`;

console.log('Sending live network verification request to GA4 collect endpoint:');
console.log(collectUrl);

try {
  const res = await fetch(collectUrl, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  console.log('GA4 HTTP Status:', res.status, res.statusText);
  if (res.status === 200 || res.status === 204) {
    console.log('✔ Google Analytics 4 endpoint accepted the payload successfully (Status: ' + res.status + ')');
  } else {
    console.warn('Note: Status was', res.status);
  }
} catch (err) {
  console.error('Fetch error:', err);
}
