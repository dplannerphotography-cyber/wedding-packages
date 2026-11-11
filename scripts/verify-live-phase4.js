const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verifyAll() {
  console.log('=== VERIFYING LIVE PRODUCTION DEPLOYMENT ===\n');

  // 1. robots.txt
  const robots = await fetchUrl('https://dplanner.com.ng/robots.txt');
  console.log('1. https://dplanner.com.ng/robots.txt -> Status:', robots.status);
  console.log('   Contains GPTBot:', robots.body.includes('User-agent: GPTBot'));
  console.log('   Contains ClaudeBot:', robots.body.includes('User-agent: ClaudeBot'));
  console.log('   Contains PerplexityBot:', robots.body.includes('User-agent: PerplexityBot'));
  console.log('   Contains llms.txt reference:', robots.body.includes('llms.txt'));

  // 2. llms.txt
  const llms = await fetchUrl('https://dplanner.com.ng/llms.txt');
  console.log('\n2. https://dplanner.com.ng/llms.txt -> Status:', llms.status);
  console.log('   Title:', llms.body.split('\n')[0]);
  console.log('   Contains Samuel Damilare:', llms.body.includes('Samuel Damilare'));
  console.log('   Contains Yemetu Studio:', llms.body.includes('Yemetu'));
  console.log('   Contains ₦180,000:', llms.body.includes('₦180,000'));

  // 3. llms-full.txt
  const llmsFull = await fetchUrl('https://dplanner.com.ng/llms-full.txt');
  console.log('\n3. https://dplanner.com.ng/llms-full.txt -> Status:', llmsFull.status);
  console.log('   Length (bytes):', llmsFull.body.length);
  console.log('   Contains Turaya Food Canteen:', llmsFull.body.includes('besides Turaya Food Canteen'));

  // 4. sitemap.xml
  const sitemap = await fetchUrl('https://dplanner.com.ng/sitemap.xml');
  console.log('\n4. https://dplanner.com.ng/sitemap.xml -> Status:', sitemap.status);
  console.log('   Contains /photography/:', sitemap.body.includes('https://dplanner.com.ng/photography/'));
  console.log('   Contains /weddings/classic/:', sitemap.body.includes('https://dplanner.com.ng/weddings/classic/'));

  // 5. /photography/ live JSON-LD
  const photo = await fetchUrl('https://dplanner.com.ng/photography/');
  console.log('\n5. https://dplanner.com.ng/photography/ -> Status:', photo.status);
  console.log('   Contains LocalBusiness JSON-LD:', photo.body.includes('"@type": [\n    "LocalBusiness"'));
  console.log('   Contains OfferCatalog JSON-LD:', photo.body.includes('"OfferCatalog"'));
  console.log('   Contains BreadcrumbList JSON-LD:', photo.body.includes('"BreadcrumbList"'));
  console.log('   Contains FAQPage JSON-LD:', photo.body.includes('"FAQPage"'));
  console.log('   Contains visible TODO (case-insensitive):', /todo/i.test(photo.body));
}

verifyAll().catch(console.error);
