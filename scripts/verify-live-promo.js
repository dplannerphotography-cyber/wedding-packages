const { spawn } = require('child_process');
const http = require('http');

async function testLiveUrl(url) {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + process.env.TEMP + '\\live-promo-' + Date.now(),
    '--window-size=1280,900',
    url
  ]);

  return new Promise((resolve, reject) => {
    let handled = false;
    chrome.stderr.on('data', async (d) => {
      if (handled) return;
      if (d.toString().includes('DevTools listening')) {
        handled = true;
        try {
          await new Promise(r => setTimeout(r, 2000));
          const tabs = await new Promise((res, rej) => {
            http.get('http://127.0.0.1:9227/json/list', r => {
              let body = '';
              r.on('data', c => body += c);
              r.on('end', () => res(JSON.parse(body)));
            }).on('error', rej);
          });

          const tab = tabs[0];
          const ws = new WebSocket(tab.webSocketDebuggerUrl);
          await new Promise(r => ws.onopen = r);

          function runCdp(method, params = {}) {
            return new Promise((res) => {
              const id = Math.floor(Math.random() * 1000000);
              const h = (e) => {
                const m = JSON.parse(e.data);
                if (m.id === id) { ws.removeEventListener('message', h); res(m.result); }
              };
              ws.addEventListener('message', h);
              ws.send(JSON.stringify({ id, method, params }));
            });
          }

          await runCdp('Page.enable');
          await runCdp('Runtime.enable');
          await new Promise(r => setTimeout(r, 1000));

          const res = await runCdp('Runtime.evaluate', {
            expression: `
              (function() {
                const isPromoEnded = document.documentElement.classList.contains('promo-ended');
                const promoBanner = document.querySelector('.promo-banner');
                const bannerVisible = promoBanner ? (window.getComputedStyle(promoBanner).display !== 'none') : false;
                const postPromoEls = Array.from(document.querySelectorAll('.post-promo')).filter(el => {
                  const s = window.getComputedStyle(el);
                  return s.display !== 'none';
                });
                const promoOnlyEls = Array.from(document.querySelectorAll('.promo-only')).filter(el => {
                  const s = window.getComputedStyle(el);
                  return s.display !== 'none';
                });
                const countdown = document.querySelector('[data-countdown]');
                const countdownText = countdown ? countdown.innerText : '';

                return {
                  url: location.href,
                  isPromoEnded,
                  bannerVisible,
                  postPromoVisibleCount: postPromoEls.length,
                  promoOnlyVisibleCount: promoOnlyEls.length,
                  countdownText
                };
              })()
            `,
            returnByValue: true
          });

          ws.close();
          chrome.kill();
          resolve(res.result.value);
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
  console.log('Testing live Home page (current date)...');
  const home = await testLiveUrl('https://dplanner.com.ng/');
  console.log('Live Home Result:', home);

  console.log('Testing live Weddings page (current date)...');
  const weddings = await testLiveUrl('https://dplanner.com.ng/weddings/');
  console.log('Live Weddings Result:', weddings);
}

main().catch(console.error);
