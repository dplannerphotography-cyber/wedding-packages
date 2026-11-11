const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const SITE_DIR = path.join(__dirname, '..', '_site');
const PORT = 8086;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
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

const testUrls = [
  '/blog/',
  '/blog/how-much-does-wedding-photography-cost-in-ibadan-2026/',
  '/blog/how-to-choose-a-wedding-photographer-in-ibadan/',
  '/blog/traditional-engagement-photography-oyo-state/'
];

const viewports = [
  { name: '320px', width: 320, height: 640 },
  { name: '375px', width: 375, height: 812 },
  { name: '414px', width: 414, height: 896 },
  { name: '1280px', width: 1280, height: 900 }
];

async function checkUrlViewport(url, vp) {
  return new Promise((resolve) => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9226',
      '--disable-gpu',
      '--no-sandbox',
      '--user-data-dir=' + process.env.TEMP + '\\blog-vp-' + vp.width + '-' + Date.now(),
      '--window-size=' + vp.width + ',' + vp.height,
      `http://127.0.0.1:${PORT}${url}`
    ]);

    let handled = false;
    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 800));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9226/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs.find(t => t.url.includes(url));
          if (!tab) throw new Error('Tab not found for ' + url);

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

          for (let i = 0; i < 20; i++) {
            const readyState = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
            if (readyState?.result?.result?.value === 'complete') break;
            await new Promise(r => setTimeout(r, 150));
          }

          const overflowCheck = await send('Runtime.evaluate', {
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
                return {
                  innerWidth: inner,
                  scrollWidth: scroll,
                  hasOverflow: scroll > inner,
                  offendingCount: offending.length
                };
              })()
            `,
            returnByValue: true
          });

          const res = overflowCheck?.result?.result?.value;
          ws.close();
          chrome.kill();
          resolve(res);
        } catch (e) {
          console.error(`Error on ${url} (${vp.name}):`, e.message);
          chrome.kill();
          resolve(null);
        }
      }
    });
  });
}

async function run() {
  const server = await startServer();
  let allPass = true;

  for (const url of testUrls) {
    console.log(`\nTesting URL: ${url}`);
    for (const vp of viewports) {
      const res = await checkUrlViewport(url, vp);
      console.log(`  - ${vp.name}: inner=${res?.innerWidth}px, scroll=${res?.scrollWidth}px, overflow=${res?.hasOverflow}, offending=${res?.offendingCount}`);
      if (res?.hasOverflow) allPass = false;
      await new Promise(r => setTimeout(r, 600));
    }
  }

  server.close();
  console.log(`\nFINAL OVERFLOW RESULT: ${allPass ? 'ALL PASSED (0 OVERFLOW)' : 'FAILURES DETECTED'}`);
}

run();
