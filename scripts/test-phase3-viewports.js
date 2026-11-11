const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\DPLANNER STUDIO 2\\.gemini\\antigravity\\brain\\191b3b72-2dc8-46eb-a2f7-3ac9c467d77f';
const SITE_DIR = path.join(__dirname, '..', '_site');
const PORT = 8085;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml'
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

async function runOneViewport(vp) {
  return new Promise((resolve, reject) => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--no-sandbox',
      '--user-data-dir=' + process.env.TEMP + '\\vp-run-' + vp.width + '-' + Date.now(),
      '--window-size=' + vp.width + ',' + vp.height,
      `http://127.0.0.1:${PORT}/photography/`
    ]);

    let handled = false;

    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 800));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9222/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs.find(t => t.url.includes('/photography/'));
          if (!tab) throw new Error('Target tab not found');

          const ws = new WebSocket(tab.webSocketDebuggerUrl);
          let msgId = 1;
          const callbacks = new Map();
          ws.onmessage = e => {
            const msg = JSON.parse(e.data);
            if (msg.id && callbacks.has(msg.id)) {
              callbacks.get(msg.id)(msg);
              callbacks.delete(msg.id);
            }
          };
          await new Promise(r => ws.onopen = r);

          function send(method, params = {}) {
            return new Promise(r => {
              const id = msgId++;
              callbacks.set(id, r);
              ws.send(JSON.stringify({ id, method, params }));
            });
          }

          await send('Page.enable');
          await send('DOM.enable');

          // Wait until document.readyState === 'complete'
          for (let i = 0; i < 20; i++) {
            const readyState = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
            if (readyState.result.result.value === 'complete') break;
            await new Promise(r => setTimeout(r, 200));
          }

          // Check layout overflow
          const evalRes = await send('Runtime.evaluate', {
            expression: `
              (function() {
                const inner = window.innerWidth;
                const scroll = document.documentElement.scrollWidth;
                const offending = [];
                document.querySelectorAll('*').forEach(el => {
                  const r = el.getBoundingClientRect();
                  if (r.right > inner + 1) {
                    offending.push(el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''));
                  }
                });
                return JSON.stringify({
                  inner,
                  scroll,
                  hasOverflow: scroll > inner,
                  offendingCount: offending.length,
                  offendingSample: offending.slice(0, 5)
                });
              })()
            `,
            returnByValue: true
          });

          const res = JSON.parse(evalRes.result.result.value);
          console.log(`\n=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
          console.log(` - Inner Width: ${res.inner}px | Scroll Width: ${res.scroll}px`);
          const pass = !res.hasOverflow && res.scroll <= res.inner;
          console.log(` - Horizontal Overflow: ${pass ? 'PASS (0 overflow)' : 'FAIL (' + res.offendingCount + ' offending: ' + res.offendingSample.join(', ') + ')'}`);

          // Test lightbox open & close
          const lbTestRes = await send('Runtime.evaluate', {
            expression: `
              (function() {
                const trigger = document.querySelector('.folio-lightbox-trigger');
                const lb = document.getElementById('portfolio-lightbox');
                if (!trigger || !lb) return JSON.stringify({ ok: false, error: 'trigger or lb missing' });
                
                trigger.click();
                const isOpen = lb.classList.contains('is-open') && !lb.hasAttribute('hidden');
                
                // press escape
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                const isClosed = !lb.classList.contains('is-open') && lb.hasAttribute('hidden');
                
                return JSON.stringify({ ok: true, opened: isOpen, closed: isClosed });
              })()
            `,
            returnByValue: true
          });
          const lbRes = JSON.parse(lbTestRes.result.result.value);
          console.log(` - Lightbox Test: open=${lbRes.opened}, closeOnEscape=${lbRes.closed}`);

          // Test inquiry form prefill WhatsApp link
          const formTestRes = await send('Runtime.evaluate', {
            expression: `
              (function() {
                const form = document.getElementById('inquiry-form');
                if (!form) return JSON.stringify({ ok: false });
                form.querySelector('[name="client_name"]').value = 'Test Client';
                form.querySelector('[name="preferred_date"]').value = '20 Dec 2026';
                form.querySelector('[name="location"]').value = 'Ibadan';
                
                let capturedUrl = null;
                const origOpen = window.open;
                window.open = function(url) { capturedUrl = url; };
                
                document.getElementById('btn-inquiry-whatsapp').click();
                window.open = origOpen;
                
                return JSON.stringify({
                  ok: true,
                  hasWaLink: !!capturedUrl,
                  capturedUrl: capturedUrl
                });
              })()
            `,
            returnByValue: true
          });
          const formRes = JSON.parse(formTestRes.result.result.value);
          console.log(` - Form Test: WhatsApp prefill generated=${formRes.hasWaLink}`);
          if (formRes.hasWaLink) {
            console.log(`   URL: ${decodeURIComponent(formRes.capturedUrl).slice(0, 85)}...`);
          }

          // Capture screenshot
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          const filename = `phase3_screenshot_${vp.width}px.png`;
          fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), Buffer.from(shot.result.data, 'base64'));
          console.log(` - Screenshot captured: ${filename}`);

          ws.close();
          chrome.kill();
          resolve(pass);
        } catch (err) {
          chrome.kill();
          reject(err);
        }
      }
    });

    setTimeout(() => {
      if (!handled) {
        chrome.kill();
        reject(new Error(`Timeout waiting for DevTools on ${vp.name}`));
      }
    }, 14000);
  });
}

async function runAll() {
  const server = await startServer();

  const viewports = [
    { name: '320px (Narrow Mobile)', width: 320, height: 640 },
    { name: '360px (Standard Mobile)', width: 360, height: 740 },
    { name: '390px (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '414px (iPhone Plus/Max)', width: 414, height: 896 },
    { name: '768px (Tablet)', width: 768, height: 1024 },
    { name: '1280px (Desktop)', width: 1280, height: 900 }
  ];

  let overallPass = true;
  for (const vp of viewports) {
    try {
      const pass = await runOneViewport(vp);
      if (!pass) overallPass = false;
    } catch(e) {
      console.error(`Failed on ${vp.name}:`, e.message);
      overallPass = false;
    }
  }

  server.close();

  console.log(`\n==========================================`);
  console.log(`FINAL RESULT: ${overallPass ? 'ALL 6 VIEWPORTS PASSED (0 HORIZONTAL OVERFLOW)' : 'FAILED'}`);
  console.log(`==========================================`);
}

runAll();
