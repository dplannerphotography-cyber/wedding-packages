const fs = require('fs');
const path = require('path');

const patterns = [/award/i, /honour/i, /honor/i];
const ignore = ['node_modules', '.git', '_site', '.system_generated', 'brain'];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (ignore.includes(f)) continue;
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else if (/\.(html|njk|md|json|js)$/.test(f)) {
      if (full.includes('check-captions.js')) continue;
      const text = fs.readFileSync(full, 'utf8');
      patterns.forEach(p => {
        if (p.test(text)) {
          const lines = text.split('\n');
          lines.forEach((l, idx) => {
            if (p.test(l)) {
              console.log(`${full}:${idx + 1}: ${l.trim()}`);
            }
          });
        }
      });
    }
  }
}

walk('.');
