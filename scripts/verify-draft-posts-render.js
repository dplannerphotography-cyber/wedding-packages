const { execSync } = require('child_process');
const fs = require('fs');

const p1 = 'src/blog/posts/best-pre-wedding-shoot-locations-ibadan.md';
const p2 = 'src/blog/posts/graduation-photoshoot-prices-ideas-ibadan.md';

const orig1 = fs.readFileSync(p1, 'utf8');
const orig2 = fs.readFileSync(p2, 'utf8');

try {
  fs.writeFileSync(p1, orig1.replace('draft: true', 'draft: false'));
  fs.writeFileSync(p2, orig2.replace('draft: true', 'draft: false'));

  console.log('Building with draft: false to test full template rendering...');
  const out = execSync('npm run build', { encoding: 'utf8' });
  console.log(out);

  const file1 = '_site/blog/best-pre-wedding-shoot-locations-ibadan/index.html';
  const file2 = '_site/blog/graduation-photoshoot-prices-ideas-ibadan/index.html';

  if (!fs.existsSync(file1)) throw new Error('Missing file 1: ' + file1);
  if (!fs.existsSync(file2)) throw new Error('Missing file 2: ' + file2);

  const h1 = fs.readFileSync(file1, 'utf8');
  const h2 = fs.readFileSync(file2, 'utf8');

  console.log('Post 1 generated length:', h1.length, 'contains title:', h1.includes('Best Pre-Wedding Shoot Locations in Ibadan'));
  console.log('Post 2 generated length:', h2.length, 'contains title:', h2.includes('Graduation Photoshoot Prices and Ideas in Ibadan'));

  if (/TODO/i.test(h1) && !/<!--.*TODO.*-->/i.test(h1)) throw new Error('Visible TODO in Post 1');
  if (/TODO/i.test(h2) && !/<!--.*TODO.*-->/i.test(h2)) throw new Error('Visible TODO in Post 2');
  if (/abuja/i.test(h1)) throw new Error('Abuja in Post 1');
  if (/abuja/i.test(h2)) throw new Error('Abuja in Post 2');

  console.log('Both posts render cleanly with zero errors, zero visible TODOs, zero Abuja!');
} finally {
  fs.writeFileSync(p1, orig1);
  fs.writeFileSync(p2, orig2);
  execSync('npm run build');
  console.log('Restored draft: true on both posts and rebuilt cleanly.');
}
