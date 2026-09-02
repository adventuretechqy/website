// Fix fake news-card links (href="#") across the site.
// Each page's news section has 3 cards; map them (in DOM order) to real article files.
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// page path (relative to root) -> [article file (relative to that page), ...] in DOM order
const mapping = {
  'index.html': [
    'pages/blog/alumina-pharmaceutical-bottles.html',
    'pages/blog/silicon-nitride-sintering.html',
    'pages/blog/ceramic-microfluidic.html',
  ],
  'pages/about.html': [
    'blog/tct-asia.html',
    'blog/formnext.html',
    'blog/3d-print-ceramic.html',
  ],
  'pages/application.html': [
    'blog/catalyst-supports.html',
    'blog/market-forecast.html',
    'blog/gyroid-sioc.html',
  ],
  'pages/contact.html': [
    'blog/late-stage-sintering.html',
    'blog/microscale-printing.html',
    'blog/bioprinting.html',
  ],
  'pages/material.html': [
    'blog/silicon-nitride-sintering.html',
    'blog/ceramic-sintering.html',
    'blog/sicn-honeycomb.html',
  ],
  'pages/printers.html': [
    'blog/alumina-pharmaceutical-bottles.html',
    'blog/alumina-molds.html',
    'blog/ceramic-microfluidic.html',
  ],
  'pages/service.html': [
    'blog/zirconia-dental-crown.html',
    'blog/alumina-tpms-structure.html',
    'blog/zirconia-sheep-shoulder.html',
  ],
};

let total = 0;
for (const [relPage, articles] of Object.entries(mapping)) {
  const file = join(root, relPage);
  let content = readFileSync(file, 'utf8');
  let i = 0;
  // Replace only news-card placeholders, in order
  content = content.replace(/<a class="news-card" href="#">/g, () => {
    const href = articles[i++];
    if (!href) return '<a class="news-card" href="#">';
    total++;
    return `<a class="news-card" href="${href}">`;
  });
  writeFileSync(file, content, 'utf8');
  console.log(`[${relPage}] replaced ${i} link(s) -> ${articles.join(', ')}`);
}
console.log('Total links fixed:', total);
