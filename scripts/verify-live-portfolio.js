const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\DPLANNER STUDIO 2\\.gemini\\antigravity\\brain\\191b3b72-2dc8-46eb-a2f7-3ac9c467d77f';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url + '?_t=' + Date.now(), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
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

async function captureLivePage(url, width, height, screenshotName, interact) {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + process.env.TEMP + '\\vp-live-' + Date.now(),
    '--window-size=' + width + ',' + height,
    url
  ]);

  return new Promise((resolve, reject) => {
    let handled = false;
    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 2500));
          const tabs = await new Promise(res => {
            http.get('http://127.0.0.1:9227/json/list', r => {
              let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b)));
            });
          });
          const tab = tabs.find(t => t.url.includes('dplanner.com.ng'));
          if (!tab) throw new Error('Live tab not found');

          const ws = new WebSocket(tab.webSocketDebuggerUrl);
          await new Promise(r => ws.onopen = r);

          await runCdpCommand(ws, 'Page.enable');
          await runCdpCommand(ws, 'Runtime.enable');
          await runCdpCommand(ws, 'DOM.enable');

          if (interact) {
            await interact(ws);
          }

          const shot = await runCdpCommand(ws, 'Page.captureScreenshot', { format: 'png' });
          if (shot && shot.data) {
            fs.writeFileSync(path.join(ARTIFACTS_DIR, screenshotName), Buffer.from(shot.data, 'base64'));
            console.log(`Saved live screenshot: ${screenshotName} (${width}x${height})`);
          }

          ws.close();
          chrome.kill();
          resolve();
        } catch (e) {
          chrome.kill();
          reject(e);
        }
      }
    });
    chrome.on('error', reject);
  });
}

async function main() {
  console.log('Polling live site for deployment of commit 0283d6d...');
  const targetUrl = 'https://dplanner.com.ng/photography/';
  let deployed = false;

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetchUrl(targetUrl);
      if (res.statusCode === 200 && res.data.includes('studio-portrait-01.webp') && res.data.includes('studio-portrait-10')) {
        console.log(`Live site updated! (Detected at check #${i + 1})`);
        deployed = true;
        break;
      }
    } catch (e) {
      console.log('Poll attempt error:', e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }

  if (!deployed) {
    console.error('Timed out waiting for GitHub Actions live deployment.');
    process.exit(1);
  }

  // 1. Live gallery at mobile width (390x844 - iPhone 14/15 size)
  console.log('Capturing live photography page at 390px mobile width (cards visible)...');
  await captureLivePage(targetUrl, 390, 844, 'live_photography_mobile_390px.png', async (ws) => {
    await runCdpCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const item = document.querySelector('.portfolio-folio-item');
        if (item) item.scrollIntoView({ block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));
  });

  // 2. Live gallery at 375px mobile width (iPhone SE / older phone standard)
  console.log('Capturing live photography page at 375px mobile width...');
  await captureLivePage(targetUrl, 375, 667, 'live_photography_mobile_375px.png', async (ws) => {
    await runCdpCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const p = document.getElementById('portfolio');
        if (p) p.scrollIntoView();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));
  });

  // 3. Live desktop view (1280x900)
  console.log('Capturing live photography page on desktop (1280px)...');
  await captureLivePage(targetUrl, 1280, 900, 'live_photography_desktop_1280px.png', async (ws) => {
    await runCdpCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const p = document.getElementById('portfolio');
        if (p) p.scrollIntoView();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));
  });

  console.log('All live checks completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
