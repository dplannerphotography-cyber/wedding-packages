const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\DPLANNER STUDIO 2\\.gemini\\antigravity\\brain\\191b3b72-2dc8-46eb-a2f7-3ac9c467d77f';
const SITE_DIR = path.join(__dirname, '..', '_site');
const PORT = 8094;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      const filePath = path.join(SITE_DIR, reqPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found: ' + reqPath);
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Test server running at http://127.0.0.1:${PORT}/`);
      resolve(server);
    });
  });
}

function runCdpCommand(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function testPagePostPromo(urlPath, width, height, screenshotName) {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + process.env.TEMP + '\\promo-test-' + Date.now(),
    '--window-size=' + width + ',' + height,
    'about:blank'
  ]);

  return new Promise((resolve, reject) => {
    let handled = false;

    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 1000));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9225/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs[0];
          const ws = new WebSocket(tab.webSocketDebuggerUrl);
          await new Promise(r => ws.onopen = r);

          await runCdpCommand(ws, 'Page.enable');
          await runCdpCommand(ws, 'Runtime.enable');
          await runCdpCommand(ws, 'Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: width < 768
          });

          // Inject fake date: 2 Jan 2027
          const fakeScript = `
            (function() {
              const FAKE_NOW = new Date('2027-01-02T12:00:00+01:00').getTime();
              const origDateNow = Date.now;
              Date.now = function() { return FAKE_NOW; };
              const OrigDate = Date;
              function PatchedDate(...args) {
                if (args.length === 0) return new OrigDate(FAKE_NOW);
                return new OrigDate(...args);
              }
              PatchedDate.now = function() { return FAKE_NOW; };
              PatchedDate.parse = OrigDate.parse;
              PatchedDate.UTC = OrigDate.UTC;
              PatchedDate.prototype = OrigDate.prototype;
              window.Date = PatchedDate;
            })();
          `;
          await runCdpCommand(ws, 'Page.addScriptToEvaluateOnNewDocument', { source: fakeScript });

          // Navigate to target URL
          await runCdpCommand(ws, 'Page.navigate', { url: `http://127.0.0.1:${PORT}${urlPath}` });
          await new Promise(r => setTimeout(r, 1200));

          // Run checks
          const evalRes = await runCdpCommand(ws, 'Runtime.evaluate', {
            expression: `
              (function() {
                const isPromoEndedClass = document.documentElement.classList.contains('promo-ended');
                const promoOnlyVisible = Array.from(document.querySelectorAll('.promo-only')).filter(el => {
                  const rect = el.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                }).length;
                const postPromoVisible = Array.from(document.querySelectorAll('.post-promo')).filter(el => {
                  const rect = el.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                }).length;
                const countdownVisible = Array.from(document.querySelectorAll('[data-countdown]')).filter(el => {
                  const rect = el.getBoundingClientRect();
                  return !el.hidden && rect.width > 0 && rect.height > 0;
                }).length;
                const struckThroughVisible = Array.from(document.querySelectorAll('s, strike, del, .old-price, .addon-old-price')).filter(el => {
                  const rect = el.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                }).length;
                const bodyText = document.body.innerText;
                const hasExpiredPromoText = /promo ended/i.test(bodyText) || /was ₦/i.test(bodyText);

                return {
                  isPromoEndedClass,
                  promoOnlyVisible,
                  postPromoVisible,
                  countdownVisible,
                  struckThroughVisible,
                  hasExpiredPromoText
                };
              })()
            `,
            returnByValue: true
          });

          console.log(`[Check ${urlPath}]:`, evalRes.result ? evalRes.result.value : evalRes);

          // Capture screenshot
          const screenshotRes = await runCdpCommand(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true });
          const outPath = path.join(ARTIFACTS_DIR, screenshotName);
          fs.writeFileSync(outPath, Buffer.from(screenshotRes.data, 'base64'));
          console.log(`Saved screenshot to ${outPath}`);

          ws.close();
          chrome.kill();
          resolve(evalRes.result ? evalRes.result.value : null);
        } catch (err) {
          chrome.kill();
          reject(err);
        }
      }
    });

    chrome.on('error', reject);
    setTimeout(() => {
      if (!handled) {
        chrome.kill();
        reject(new Error('Chrome startup timed out'));
      }
    }, 15000);
  });
}

async function run() {
  const server = await startServer();
  try {
    console.log('Testing Home page desktop on Jan 2, 2027...');
    await testPagePostPromo('/', 1280, 900, 'post_promo_home_desktop.png');

    console.log('Testing Weddings page desktop on Jan 2, 2027...');
    await testPagePostPromo('/weddings/', 1280, 1000, 'post_promo_weddings_desktop.png');

    console.log('Testing Classic package page desktop on Jan 2, 2027...');
    await testPagePostPromo('/weddings/classic/', 1280, 900, 'post_promo_classic_desktop.png');

    console.log('Testing Weddings page mobile (390px) on Jan 2, 2027...');
    await testPagePostPromo('/weddings/', 390, 844, 'post_promo_weddings_mobile.png');

    console.log('All after-promo tests finished successfully!');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
