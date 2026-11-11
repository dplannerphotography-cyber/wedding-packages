const fs = require('fs');

const items = JSON.parse(fs.readFileSync('src/_data/portfolio.json', 'utf8'));
const patterns = [/honor/i, /honour/i, /award/i, /title/i, /medal/i, /distinguished/i, /official/i, /matriarch/i, /dignitary/i];

console.log('Total items in portfolio.json:', items.length);

items.forEach(item => {
  const fields = ['title', 'caption', 'alt', 'tag', 'specs'];
  const text = fields.map(f => item[f] || '').join(' ');
  const matched = patterns.filter(p => p.test(text));
  if (matched.length > 0) {
    console.log(`Matched ID: ${item.id}`);
    fields.forEach(f => {
      console.log(`  ${f}: ${item[f]}`);
    });
    console.log('---');
  }
});
