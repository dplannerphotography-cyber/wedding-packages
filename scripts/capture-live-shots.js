const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = 'C:\\Users\\DPLANNER STUDIO 2\\.gemini\\antigravity\\brain\\191b3b72-2dc8-46eb-a2f7-3ac9c467d77f';

async function takeScreenshot(name, width, height) {
  return new Promise((resolve) => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9225',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=' + width + ',' + height,
      'https://dplanner.com.ng/photography/'
    ]);

    let handled = false;
    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 1500));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9225/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs.find(t => t.url.includes('/photography/'));
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
            await new Promise(r => setTimeout(r, 200));
          }

          const shot = await send('Page.captureScreenshot', { format: 'png' });
          const buf = Buffer.from(shot.result.data, 'base64');
          const outPath = path.join(ARTIFACTS_DIR, name);
          fs.writeFileSync(outPath, buf);
          console.log(`Saved screenshot ${name} (${buf.length} bytes)`);

          ws.close();
          chrome.kill();
          resolve(outPath);
        } catch (e) {
          console.error(`Error taking screenshot ${name}:`, e.message);
          chrome.kill();
          resolve(null);
        }
      }
    });
  });
}

async function run() {
  await takeScreenshot('live_photography_mobile_375px.png', 375, 812);
  await takeScreenshot('live_photography_desktop_1280px.png', 1280, 900);
}

run();
