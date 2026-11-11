const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '_site', 'photography', 'index.html');
const html = fs.readFileSync(file, 'utf8');

console.log('File size:', html.length, 'bytes');

// Check navbar and aria-current
const navMatches = html.match(/<a href="\/photography\/"[^>]*aria-current="page"[^>]*>Studio &amp; Portraits<\/a>/);
console.log('Navbar active link (Studio & Portraits):', !!navMatches);

// Check FAQ schema
const faqSchemaMatches = html.match(/"@type":\s*"FAQPage"/);
console.log('FAQPage JSON-LD schema present:', !!faqSchemaMatches);

// Check LocalBusiness schema
const businessSchemaMatches = html.match(/"@type":\s*\[\s*"LocalBusiness"/);
console.log('LocalBusiness JSON-LD schema present:', !!businessSchemaMatches);

// Check 50% deposit in FAQ
const depositInFaq = html.includes('50% deposit secures your studio session');
console.log('Explicit phrase "50% deposit secures your studio session" present:', depositInFaq);

// Check WhatsApp number in all wa.me links
const waLinks = html.match(/https:\/\/wa\.me\/[0-9]+[^"'\s]*/g) || [];
console.log('Total WhatsApp links found:', waLinks.length);
let waValid = true;
waLinks.forEach((link, idx) => {
  if (!link.includes('2348168204080')) {
    console.error(`Invalid WA link #${idx}:`, link);
    waValid = false;
  }
});
console.log('All WhatsApp links valid (+234 816 820 4080):', waValid);

// Check key sections
const sections = [
  'photography-hero-section',
  'credibility-strip',
  'portfolio-section',
  'portfolio-lightbox',
  'wedding-stories-section',
  'studio-pricing-section',
  'about-section',
  'reviews-editorial-section',
  'faq-section',
  'studio-contact-section',
  'inquiry-form',
  'final-conversion-section',
  'footer'
];

console.log('\nChecking sections:');
sections.forEach(s => {
  console.log(` - ${s}: ${html.includes(s) ? 'FOUND' : 'MISSING'}`);
});

// Check TODOs
const todos = (html.match(/TODO[^<]*/g) || []);
console.log('\nTODO placeholders found:', todos.length);
todos.forEach(t => console.log('   *', t.trim()));
