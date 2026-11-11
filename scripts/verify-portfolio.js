const fs = require('fs');
const path = require('path');

const siteDir = path.join(process.cwd(), '_site');
let errors = [];

// 1. Check all HTML files for visible TODO and Abuja
function walkHtml(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkHtml(full);
    } else if (file.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('TODO')) {
        errors.push('Found TODO in ' + full);
      }
      if (content.includes('Abuja') || content.includes('abuja')) {
        errors.push('Found Abuja in ' + full);
      }
    }
  });
}
walkHtml(siteDir);

// 2. Check photography page portfolio
const photoHtml = fs.readFileSync(path.join(siteDir, 'photography', 'index.html'), 'utf8');
const portfolioData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', '_data', 'portfolio.json'), 'utf8'));

console.log('Portfolio data items count:', portfolioData.length);
portfolioData.forEach(item => {
  const relImg = item.image.replace(/^\//, '');
  const relLg = item.largeImage.replace(/^\//, '');
  if (!fs.existsSync(path.join(siteDir, relImg))) {
    errors.push('Missing gallery file in _site: ' + relImg);
  }
  if (!fs.existsSync(path.join(siteDir, relLg))) {
    errors.push('Missing lightbox file in _site: ' + relLg);
  }
  if (!photoHtml.includes(item.id) && !photoHtml.includes(item.title)) {
    errors.push('Missing item in photography/index.html: ' + item.id);
  }
});

// 3. Check filters
['all', 'weddings', 'studio', 'couples', 'family', 'children', 'birthdays', 'corporate'].forEach(cat => {
  const searchStr = `data-filter="${cat}"`;
  if (!photoHtml.includes(searchStr)) {
    errors.push('Missing filter button for: ' + cat);
  }
});

// 4. Check lightbox markup
if (!photoHtml.includes('id="portfolio-lightbox"')) {
  errors.push('Missing #portfolio-lightbox markup');
}

// 5. Check home hero image
const homeHtml = fs.readFileSync(path.join(siteDir, 'index.html'), 'utf8');
if (!homeHtml.includes('/assets/portfolio/weddings-traditional-01.webp')) {
  errors.push('Home hero image not updated to weddings-traditional-01.webp');
}

// 6. Check studio hero image
if (!photoHtml.includes('/assets/portfolio/studio-portrait-01.webp')) {
  errors.push('Studio hero image not updated to studio-portrait-01.webp');
}

// 7. Check blog covers
const blog1Html = fs.readFileSync(path.join(siteDir, 'blog', 'how-much-does-wedding-photography-cost-in-ibadan-2026', 'index.html'), 'utf8');
if (!blog1Html.includes('/assets/portfolio/weddings-traditional-01.webp')) {
  errors.push('Blog post 1 heroImage not updated');
}

const blog2Html = fs.readFileSync(path.join(siteDir, 'blog', 'how-to-choose-a-wedding-photographer-in-ibadan', 'index.html'), 'utf8');
if (!blog2Html.includes('/assets/portfolio/couples-01.webp')) {
  errors.push('Blog post 2 heroImage not updated');
}

const blog3Html = fs.readFileSync(path.join(siteDir, 'blog', 'traditional-engagement-photography-oyo-state', 'index.html'), 'utf8');
if (!blog3Html.includes('/assets/portfolio/weddings-traditional-03.webp')) {
  errors.push('Blog post 3 heroImage not updated');
}

// 8. Check Instagram link below gallery
if (!photoHtml.includes('See more on Instagram')) {
  errors.push('Missing "See more on Instagram" link in photography page');
}

if (errors.length) {
  console.error('Validation errors found:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('ALL 8 VERIFICATION CHECKS PASSED PERFECTLY!');
}
