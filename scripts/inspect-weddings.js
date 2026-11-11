const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--user-data-dir=' + process.env.TEMP + '\\vp-inspect-' + Date.now(),
  '--window-size=1280,900',
  'https://dplanner.com.ng/weddings/'
]);

chrome.stderr.on('data', async d => {
  if (d.toString().includes('DevTools listening')) {
    setTimeout(async () => {
      const tabs = await new Promise(r => http.get('http://127.0.0.1:9222/json/list', res => {
        let b = ''; res.on('data', c => b += c); res.on('end', () => r(JSON.parse(b)));
      }));
      const tab = tabs.find(t => t.url.includes('/weddings'));
      const ws = new WebSocket(tab.webSocketDebuggerUrl);
      let id = 1; const cbs = new Map();
      ws.onmessage = e => { const m = JSON.parse(e.data); if (cbs.has(m.id)) cbs.get(m.id)(m); };
      function send(m, p = {}) { return new Promise(r => { const i = id++; cbs.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); }); }
      await new Promise(r => ws.onopen = r);
      await send('Page.enable');
      
      const res = await send('Runtime.evaluate', {
        expression: `
          (function() {
            const els = Array.from(document.querySelectorAll('*')).filter(el => el.textContent.includes('Promo ended – message us'));
            return JSON.stringify(els.map(el => ({
              tag: el.tagName,
              classes: el.className,
              outerHTML: el.outerHTML.slice(0, 150),
              computedDisplay: window.getComputedStyle(el).display,
              parentTag: el.parentElement.tagName,
              parentClass: el.parentElement.className,
              parentDisplay: window.getComputedStyle(el.parentElement).display
            })));
          })()
        `,
        returnByValue: true
      });
      console.log('Elements with Promo ended:', JSON.parse(res.result.result.value));
      ws.close();
      chrome.kill();
    }, 2000);
  }
});
