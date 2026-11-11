const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

const viewports = [
  { name: '320px (Narrow Mobile)', width: 320, height: 640 },
  { name: '360px (Standard Mobile)', width: 360, height: 740 },
  { name: '390px (iPhone 12/13/14)', width: 390, height: 844 },
  { name: '414px (iPhone Plus/Max)', width: 414, height: 896 }
];

async function testLiveViewport(vp) {
  return new Promise((resolve) => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9224',
      '--disable-gpu',
      '--no-sandbox',
      '--user-data-dir=' + process.env.TEMP + '\\live-vp-' + vp.width + '-' + Date.now(),
      '--window-size=' + vp.width + ',' + vp.height,
      'https://dplanner.com.ng/photography/'
    ]);

    let handled = false;
    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 1200));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9224/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs.find(t => t.url.includes('/photography/'));
          if (!tab) throw new Error('Live tab not found');

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
          console.log(`Live Viewport ${vp.name} (${vp.width}px):`, res);

          ws.close();
          chrome.kill();
          resolve(res);
        } catch (e) {
          console.error(`Error on ${vp.name}:`, e.message);
          chrome.kill();
          resolve(null);
        }
      }
    });
  });
}

async function runAll() {
  for (const vp of viewports) {
    await testLiveViewport(vp);
    await new Promise(r => setTimeout(r, 1000));
  }
}

runAll();
