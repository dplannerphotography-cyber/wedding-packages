const https = require('https');
const { spawn } = require('child_process');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('Fetching https://dplanner.com.ng/photography/...');
  const res = await fetchUrl('https://dplanner.com.ng/photography/');
  console.log('Status:', res.status);

  const body = res.body;

  const hasTodo = /todo/i.test(body);
  console.log('Contains visible TODO (case-insensitive):', hasTodo);

  const hasLandmark = body.includes('besides Turaya Food Canteen');
  console.log('Contains verified landmark (besides Turaya Food Canteen):', hasLandmark);

  const hasDelivery = body.includes('3–4 weeks') || body.includes('3-4 weeks');
  console.log('Contains wedding delivery (3–4 weeks):', hasDelivery);

  const hasHighlight = body.includes('1 week');
  console.log('Contains highlight delivery (1 week):', hasHighlight);

  const hasSvgPlaceholder = body.includes('portrait-studio.svg') || body.includes('birthday-celebration.svg');
  console.log('Contains SVG placeholders:', hasSvgPlaceholder);

  const hasWeddingStories = body.includes('wedding-stories-section');
  console.log('Contains Wedding Stories section:', hasWeddingStories);

  // Phone-width tests via Headless Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=375,812',
    'https://dplanner.com.ng/photography/'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  const http = require('http');
  http.get('http://127.0.0.1:9223/json', (res2) => {
    let d = '';
    res2.on('data', chunk => d += chunk);
    res2.on('end', () => {
      try {
        const pages = JSON.parse(d);
        const wsUrl = pages[0]?.webSocketDebuggerUrl;
        if (!wsUrl) {
          console.log('Chrome WS not found');
          chrome.kill();
          return;
        }
        const WebSocket = require('ws');
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => {
          ws.send(JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: '({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > window.innerWidth })',
              returnByValue: true
            }
          }));
        });
        ws.on('message', (msg) => {
          const m = JSON.parse(msg);
          if (m.id === 1) {
            console.log('Live Phone-Width (375px) Overflow Check:', m.result.value);
            ws.close();
            chrome.kill();
          }
        });
      } catch (e) {
        console.error('Error connecting to Chrome:', e.message);
        chrome.kill();
      }
    });
  }).on('error', (e) => {
    console.error('Chrome HTTP error:', e.message);
    chrome.kill();
  });
}

verifyLive().catch(console.error);
