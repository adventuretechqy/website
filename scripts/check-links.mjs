// Scan all HTML files in the project, extract internal links (href/src),
// and report which ones point to non-existent files (dead links).
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Collect all local files (relative to root)
const allFiles = [];
const seen = new Set();
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (seen.has(p)) continue;
    seen.add(p);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === 'original-website' || entry === '.git' || entry === 'node_modules' || entry === '.workbuddy' || entry === 'UI Design') continue;
      walk(p);
    } else {
      allFiles.push(p);
    }
  }
}
walk(root);

const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
const fileSet = new Set(allFiles.map(f => f.replace(/\\/g, '/')));

let totalLinks = 0;
const deadLinks = [];
const results = [];

for (const htmlFile of htmlFiles) {
  const content = readFileSync(htmlFile, 'utf8');
  const base = dirname(htmlFile);
  // match href="..." and src="..." that are not external/anchor/mailto/tel/data/javascript
  const re = /(?:href|src)\s*=\s*"([^"]+)"/g;
  let m;
  const pageDead = new Set();
  while ((m = re.exec(content)) !== null) {
    const link = m[1];
    if (!link) continue;
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|#top)/i.test(link)) continue;
    if (link.includes('fonts.googleapis')) continue;
    // strip query / hash
    const pathPart = link.split('#')[0].split('?')[0];
    if (!pathPart) continue;
    totalLinks++;
    const target = resolve(base, pathPart);
    // normalize to root-relative
    const rel = target.replace(/\\/g, '/');
    if (!fileSet.has(rel)) {
      if (!pageDead.has(link)) {
        pageDead.add(link);
        deadLinks.push({ page: htmlFile.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', ''), link });
      }
    }
  }
  if (pageDead.size) {
    results.push({ page: htmlFile.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', ''), dead: [...pageDead] });
  }
}

console.log('=== Total HTML files scanned:', htmlFiles.length);
console.log('=== Total internal links:', totalLinks);
console.log('=== Pages with dead links:', results.length);
for (const r of results) {
  console.log(`\n[${r.page}]`);
  for (const d of r.dead) console.log('   ->', d);
}
console.log('\n=== Dead link summary (unique):', [...new Set(deadLinks.map(d => d.link))].length);
