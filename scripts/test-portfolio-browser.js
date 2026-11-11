const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\DPLANNER STUDIO 2\\.gemini\\antigravity\\brain\\191b3b72-2dc8-46eb-a2f7-3ac9c467d77f';
const SITE_DIR = path.join(__dirname, '..', '_site');
const PORT = 8092;

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

async function testPage(urlPath, width, height, screenshotName, interactCallback) {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + process.env.TEMP + '\\vp-test-' + Date.now(),
    '--window-size=' + width + ',' + height,
    `http://127.0.0.1:${PORT}${urlPath}`
  ]);

  return new Promise((resolve, reject) => {
    let handled = false;

    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 1200));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9223/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs.find(t => t.url.includes(urlPath));
          if (!tab) throw new Error('Target tab not found for ' + urlPath);

          const ws = new WebSocket(tab.webSocketDebuggerUrl);
          await new Promise(r => ws.onopen = r);

          await runCdpCommand(ws, 'Page.enable');
          await runCdpCommand(ws, 'Runtime.enable');
          await runCdpCommand(ws, 'DOM.enable');

          if (interactCallback) {
            await interactCallback(ws);
          }

          // Capture screenshot
          const shot = await runCdpCommand(ws, 'Page.captureScreenshot', { format: 'png' });
          if (shot && shot.data) {
            const outPath = path.join(ARTIFACTS_DIR, screenshotName);
            fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
            console.log(`Saved screenshot: ${outPath} (${width}x${height})`);
          }

          ws.close();
          chrome.kill();
          resolve();
        } catch (err) {
          chrome.kill();
          reject(err);
        }
      }
    });

    chrome.on('error', reject);
  });
}

async function main() {
  const server = await startServer();

  try {
    // 1. Photography page desktop (1280x900)
    console.log('Testing /photography/ on desktop...');
    await testPage('/photography/', 1280, 900, 'portfolio_desktop_1280px.png', async (ws) => {
      // Check filter counts and test interaction
      const evalRes = await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `(() => {
          const items = document.querySelectorAll('.portfolio-folio-item');
          const tabs = document.querySelectorAll('.portfolio-tab-btn');
          const heroImg = document.querySelector('.hero-feature-media img')?.src;
          return {
            itemCount: items.length,
            tabCount: tabs.length,
            heroImg: heroImg
          };
        })()`,
        returnByValue: true
      });
      console.log('Desktop /photography/ DOM inspection:', evalRes.result.value);

      // Scroll down to portfolio
      await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `document.getElementById('portfolio').scrollIntoView();`
      });
      await new Promise(r => setTimeout(r, 600));
    });

    // 2. Photography page - Test Category Filter (Weddings filter)
    console.log('Testing category filter (weddings)...');
    await testPage('/photography/', 1280, 900, 'portfolio_filter_weddings.png', async (ws) => {
      // Allow defer scripts to finish loading
      await new Promise(r => setTimeout(r, 1200));
      await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `(() => {
          const weddingTab = document.querySelector('.portfolio-tab-btn[data-filter="weddings"]');
          if (weddingTab) weddingTab.click();
          document.getElementById('portfolio').scrollIntoView();
        })()`
      });
      await new Promise(r => setTimeout(r, 600));
      const res = await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `(() => {
          const visible = Array.from(document.querySelectorAll('.portfolio-folio-item')).filter(el => el.style.display !== 'none');
          return { visibleCount: visible.length, categories: visible.map(v => v.getAttribute('data-category')) };
        })()`,
        returnByValue: true
      });
      console.log('Weddings filter active:', res.result.value);
    });

    // 3. Photography page - Test Lightbox Modal
    console.log('Testing lightbox modal interaction...');
    await testPage('/photography/', 1280, 900, 'portfolio_lightbox_open.png', async (ws) => {
      // Allow defer scripts to finish loading
      await new Promise(r => setTimeout(r, 1200));
      await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `(() => {
          const firstItem = document.querySelector('.portfolio-folio-item');
          const trigger = firstItem.querySelector('.folio-lightbox-trigger');
          if (trigger) trigger.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 800));
      const lbRes = await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `(() => {
          const lb = document.getElementById('portfolio-lightbox');
          const img = lb?.querySelector('.lightbox-image');
          const title = lb?.querySelector('.lightbox-title')?.textContent;
          const counter = lb?.querySelector('.lightbox-counter')?.textContent;
          return {
            isOpen: lb?.classList.contains('is-open'),
            title: title,
            counter: counter,
            imgSrc: img?.src
          };
        })()`,
        returnByValue: true
      });
      console.log('Lightbox state:', lbRes.result.value);
    });

    // 4. Photography page mobile (390x844)
    console.log('Testing /photography/ on mobile 390px...');
    await testPage('/photography/', 390, 844, 'portfolio_mobile_390px.png', async (ws) => {
      await runCdpCommand(ws, 'Runtime.evaluate', {
        expression: `document.getElementById('portfolio').scrollIntoView();`
      });
      await new Promise(r => setTimeout(r, 600));
    });

    // 5. Home page desktop (1280x900) to verify new hero photo
    console.log('Testing / (home) on desktop...');
    await testPage('/', 1280, 900, 'home_hero_desktop_1280px.png');

    console.log('All browser verification tests completed successfully!');
  } finally {
    server.close();
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
