// Build script: generate 19 real blog article detail pages from the
// original crawled site (original-website/) + two live-fetched articles.
// Run: node scripts/build-blog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, c) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), c, 'utf8'); };
const copyDir = (src, dst) => {
  fs.mkdirSync(path.join(ROOT, dst), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, src))) {
    const s = path.join(ROOT, src, f);
    if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(ROOT, dst, f));
  }
};
const listDir = (p) => fs.readdirSync(path.join(ROOT, p));

// ============================================================
// Article table — the 19 cards already on the listing pages.
// cardTitle must match the <h3> text exactly (used to wire hrefs).
// source: numeric prefix = local article (news-articles + _raw/_articles);
//         '_online_*' = raw HTML fetched from the live site.
// ============================================================
const ARTICLES = [
  { slug: 'alumina-pharmaceutical-bottles', category: 'Print Case', date: '2026-06-04', source: '005',
    cardTitle: 'DLP Ceramic 3D Printing of Alumina Pharmaceutical Bottles: A Technical Case Study' },
  { slug: 'silicon-nitride-sintering', category: 'Industry Dynamics', date: '2026-05-21', source: '014',
    cardTitle: 'Silicon Nitride Ceramic Sintering Processes: Engineering Density, Microstructure, and Performance' },
  { slug: 'ceramic-microfluidic', category: 'Print Case', date: '2026-05-13', source: '006',
    cardTitle: 'DLP 3D-Printed Ceramic Microfluidic Structures: Why Traditional Manufacturing Falls Short' },
  { slug: 'ceramic-sintering', category: 'Industry Dynamics', date: '2026-03-31', source: '000',
    cardTitle: 'Ceramic Sintering Process: Densification, Porosity Control, and Common Defects' },
  { slug: 'sicn-honeycomb', category: 'Industry Dynamics', date: '2026-03-26', source: '001',
    cardTitle: 'DLP 3D Printed SiCN Honeycomb Ceramics: The Next-Gen Stealth Material' },
  { slug: 'catalyst-supports', category: 'Industry Dynamics', date: '2026-03-24', source: '002',
    cardTitle: 'Catalyst Supports Explained: Materials, Structures, and the Role of Ceramic 3D Printing' },
  { slug: 'tct-asia', category: 'Enterprise News', date: '2026-03-20', source: '009',
    cardTitle: 'Ceramic 3D Printing at TCT Asia 2026: Technologies, Applications, and Future Opportunities' },
  { slug: 'market-forecast', category: 'Industry Dynamics', date: '2026-03-17', source: '003',
    cardTitle: 'Ceramic 3D Printing Market Forecast 2026–2033: Opportunities, Growth, and Key Applications' },
  { slug: 'gyroid-sioc', category: 'Industry Dynamics', date: '2026-03-13', source: '004',
    cardTitle: 'Gyroid-Structured SiOC Composites via DLP 3D Printing for Broadband Microwave Absorption' },
  { slug: 'late-stage-sintering', category: 'Industry Dynamics', date: '2026-03-12', source: '033',
    cardTitle: 'Advanced Insights into Late-Stage Sintering in High-Temperature Ceramics' },
  { slug: 'alumina-molds', category: 'Print Case', date: '2026-02-06', source: '007',
    cardTitle: 'High-Precision Alumina Ceramic Molds Manufactured via DLP 3D Printing Technology' },
  { slug: 'formnext', category: 'Enterprise News', date: '2025-11-24', source: '010',
    cardTitle: 'Formnext 2025: Face-To-Face with ADT Ceramic 3D Printing' },
  { slug: 'microscale-printing', category: 'Enterprise News', date: '2025-10-23', source: '011',
    cardTitle: 'A Novel High-Speed Microscale 3D Printing Technique for High-Resolution Fabrication of Shape Specific Particles' },
  { slug: 'bioprinting', category: 'Enterprise News', date: '2025-10-21', source: '012',
    cardTitle: '3D Bioprinting in Regenerative Medicine: The Potential for Organ and Tissue Regeneration' },
  { slug: 'graphene-curing', category: 'Enterprise News', date: '2025-09-19', source: '013',
    cardTitle: 'Optimization of Graphene-Modified Silicon-Based Ceramic Photopolymerization Curing Model and Ultra-High Precision Forming Strategy' },
  { slug: '3d-print-ceramic', category: 'Enterprise News', date: '2025-03-11', source: '019',
    cardTitle: '3D Print Ceramic: Advanced Applications' },
  { slug: 'zirconia-dental-crown', category: 'Print Case', date: '2025-02-12', source: '_online_dlp-ceramic-3d-printing-application-of-zirconia-dental',
    cardTitle: 'Print Case | Light-curing DLP ceramic 3D printing application of zirconia dental crown case' },
  { slug: 'alumina-tpms-structure', category: 'Print Case', date: '2025-02-10', source: '_online_dlp-light-curing-ceramic-3d-printing-alumina-tpms-structure-case',
    cardTitle: 'Print Case | DLP light-curing ceramic 3D printing alumina TPMS structure case' },
  { slug: 'zirconia-sheep-shoulder', category: 'Print Case', date: '2025-01-09', source: '008',
    cardTitle: 'DLP 3D Printing Zirconia Sheep Left and Right Shoulder Structure' },
];

const CAT_KEY = { 'Print Case': 'print-case', 'Industry Dynamics': 'industry', 'Enterprise News': 'enterprise' };

// ============================================================
// Locate source files
// ============================================================
function findLocalRaw(prefix) {
  const f = listDir('original-website/_raw/_articles').find((n) => n.startsWith(prefix + '-'));
  if (!f) throw new Error('raw html not found for prefix ' + prefix);
  return 'original-website/_raw/_articles/' + f;
}
function findLocalMd(prefix) {
  const f = listDir('original-website/news-articles').find((n) => n.startsWith(prefix + '-'));
  if (!f) throw new Error('content.md not found for prefix ' + prefix);
  return 'original-website/news-articles/' + f + '/content.md';
}

// ============================================================
// Metadata extraction
// ============================================================
function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}
function extractDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '';
}
function extractAuthor(html) {
  const m = html.match(/e_text-22 s_title">\s*([\s\S]*?)\s*<\/p>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : 'ADT';
}

// ============================================================
// Body extraction + cleaning
// ============================================================
function extractBody(html) {
  const open = '<div class="e_richText-24 s_title">';
  const i = html.indexOf(open);
  if (i < 0) throw new Error('body container not found');
  const start = i + open.length;
  const close = html.indexOf('<div class="e_container-27', start);
  if (close < 0) throw new Error('body close marker not found');
  return html.slice(start, close).replace(/<\/div>\s*$/, '');
}

function stripTags(text) {
  return text.replace(/<[^>]+>/g, '');
}

function cleanBody(raw, slug, imageResolver) {
  // 1) rewrite images (remote -> local), preserving alt text
  let h = raw;
  const imgRe = /<img\b[^>]*>/g;
  const imgs = [];
  let m;
  while ((m = imgRe.exec(raw))) imgs.push(m[0]);
  for (let k = 0; k < imgs.length; k++) {
    const tag = imgs[k];
    const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1] || '';
    const alt = (tag.match(/\balt="([^"]*)"/) || [])[1] || '';
    const local = imageResolver(slug, k, src);
    const repl = `<img src="${local}" alt="${alt}" loading="lazy">`;
    h = h.replace(tag, repl);
  }

  // 2) remove leftover <link>/<style>/<script> injected by the source CMS
  h = h.replace(/<link\b[^>]*>/g, '');
  h = h.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
  h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

  // 3) unwrap figure / font / span wrappers (keep inner content)
  h = h.replace(/<\/?figure\b[^>]*>/g, '');
  h = h.replace(/<font\b[^>]*>/g, '').replace(/<\/font>/g, '');
  h = h.replace(/<span\b[^>]*>/g, '').replace(/<\/span>/g, '');
  h = h.replace(/<b\b[^>]*>/g, '<strong>').replace(/<\/b>/g, '</strong>');

  // 4) heading-vs-paragraph heuristic: the source mislabels long paragraphs as <h2>
  h = h.replace(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/g, (all, lvl, inner) => {
    const text = stripTags(inner).replace(/&nbsp;/g, ' ').trim();
    if (!text) return '';
    // The source CMS sometimes wraps a full paragraph in <h2> — only long
    // blocks get downgraded; genuine (short) headings are kept as-is.
    if (text.length > 110) return `<p>${inner}</p>`;
    return `<h${lvl}>${inner}</h${lvl}>`;
  });

  // 5) strip leftover attributes on structural tags
  h = h.replace(/<(p|ul|ol|li|strong|em|i|blockquote|h[1-6])\b[^>]*>/g, '<$1>');
  h = h.replace(/<a\b[^>]*href="([^"]*)"[^>]*>/g, '<a href="$1">');

  // 6) drop empty paragraphs / headings
  h = h.replace(/<(p|h[1-6])>\s*(&nbsp;|\s)*<\/\1>/g, '');

  // 7) normalize whitespace: one block tag per line
  h = h.replace(/>\s+</g, '><');
  h = h.replace(/></g, '>\n<');

  // 8) decode a few entities to keep prose clean
  h = h.replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');

  return h.trim();
}

// ============================================================
// Image resolution
// ============================================================
// Local articles: body images in content.md (in order) map 1:1 to body <img>.
function localBodyImages(mdPath) {
  const md = read(mdPath);
  const lines = md.split(/\r?\n/);
  let authorIdx = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === 'Author:') { authorIdx = i; break; }
  if (authorIdx < 0) return null;
  let i = authorIdx + 1;
  while (i < lines.length && lines[i].trim() === '') i++;
  i++; // author name
  while (i < lines.length && lines[i].trim() === '') i++;
  const out = [];
  for (; i < lines.length; i++) {
    if (lines[i].trim() === 'Previous Page') break;
    const mm = lines[i].match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mm && mm[1].includes('images/')) out.push(mm[1].replace('images/', '').trim());
  }
  return out;
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Referer': 'https://www.adventure-tech.cn/',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
};
function downloadImage(url) {
  // returns ArrayBuffer | null on failure. CDN requires browser headers.
  return fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' })
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
}

const remoteExt = (src) => { const p = src.split('?')[0]; const m = p.match(/\.([a-zA-Z0-9]+)$/); return m ? m[1] : 'jpg'; };

// ============================================================
// Template extraction (reuse printers detail page header/footer/floats)
// ============================================================
const TPL = read('pages/printers/dlp-standard.html');
function sliceBetween(src, from, to, includeTo = true) {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a + from.length);
  return src.slice(a, includeTo ? b + to.length : b);
}
const HEADER = sliceBetween(TPL, '<header class="site-header">', '</header>')
  .replace('<a class="active" href="../printers.html">Printers</a>', '<a href="../printers.html">Printers</a>')
  .replace('<a href="../blog.html">Blog</a>', '<a class="active" href="../blog.html">Blog</a>');
const CONTACT = sliceBetween(TPL, '<section class="section contact" id="contact">', '</section>');
const FOOTER = sliceBetween(TPL, '<!-- ============ Footer ============ -->', '</footer>');
const RAIL = sliceBetween(TPL, '<!-- ============ Floating rail ============ -->', '<script', false).replace(/\s*$/, '');

function renderPage(art, bodyHtml, description) {
  const catFile = CAT_KEY[art.category];
  const title = art.title;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Adventure Technology</title>
  <meta name="description" content="${description}">
  <link rel="icon" href="../../images/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="../../style.css">
</head>
<body id="top">

${HEADER}

  <main>
    <!-- ============ Article Hero ============ -->
    <section class="page-hero page-hero-photo-blog">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="../../index.html">Home</a>
          <span>/</span>
          <a href="../blog.html">Blog</a>
          <span>/</span>
          <a href="../blog-${catFile}.html">${art.category}</a>
        </nav>
        <h1>${title}</h1>
        <p class="article-meta">
          <span class="article-tag">${art.category}</span>
          <span class="article-date">${art.date}</span>
          <span class="article-author">By ${art.author}</span>
        </p>
      </div>
    </section>

    <!-- ============ Article Body ============ -->
    <article class="section article">
      <div class="container">
        <div class="article-body">
${bodyHtml}
        </div>
        <div class="article-nav">
          <a class="btn btn-outline-dark" href="../blog.html">&#8592; Back to Blog</a>
          <a class="btn btn-primary" href="../blog-${catFile}.html">More ${art.category}</a>
        </div>
      </div>
    </article>

${CONTACT}
  </main>

${FOOTER}

${RAIL}
</body>
</html>
`;
}

// ============================================================
// Main
// ============================================================
const warnings = [];
const titleByCard = new Map(ARTICLES.map((a) => [a.cardTitle, a.slug]));

for (const art of ARTICLES) {
  const isOnline = art.source.startsWith('_online_');
  const rawPath = isOnline ? 'original-website/_raw/_articles/' + art.source + '.html' : findLocalRaw(art.source);
  const html = read(rawPath);
  art.title = extractTitle(html) || art.cardTitle.replace(/^Print Case \| /, '');
  art.author = extractAuthor(html);
  let description = extractDescription(html);
  if (!description) description = art.title;

  let imageResolver;
  if (isOnline) {
    // download remote images to images/blog/<slug>/
    imageResolver = (slug, k, src) => {
      const ext = remoteExt(src);
      const name = `img-${String(k + 1).padStart(2, '0')}.${ext}`;
      return `../../images/blog/${slug}/${name}`;
    };
  } else {
    const mdPath = findLocalMd(art.source);
    const localImgs = localBodyImages(mdPath);
    copyDir(mdPath.replace(/content\.md$/, 'images'), `images/blog/${art.slug}`);
    imageResolver = (slug, k) => `../../images/blog/${slug}/${(localImgs && localImgs[k]) || 'img-' + (k + 1) + '.jpg'}`;
  }

  const rawBody = extractBody(html);
  const bodyHtml = cleanBody(rawBody, art.slug, imageResolver);

  if (!isOnline) {
    const bodyImgs = (rawBody.match(/<img\b/g) || []).length;
    const mdPath = findLocalMd(art.source);
    const localImgs = localBodyImages(mdPath);
    if (localImgs && bodyImgs !== localImgs.length) {
      warnings.push(`${art.slug}: body img count ${bodyImgs} != content.md body images ${localImgs.length}`);
    }
  }
  write(`pages/blog/${art.slug}.html`, renderPage(art, bodyHtml, description));

  // download online images (async but sequential here is fine)
  if (isOnline) {
    const imgs = [...rawBody.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((m) => m[1]);
    for (let k = 0; k < imgs.length; k++) {
      const ext = remoteExt(imgs[k]);
      const name = `img-${String(k + 1).padStart(2, '0')}.${ext}`;
      const buf = await downloadImage(imgs[k]);
      if (buf) write(`images/blog/${art.slug}/${name}`, Buffer.from(buf));
      else warnings.push(`${art.slug}: download failed for ${imgs[k]}`);
    }
  }

  console.log(`OK  ${art.slug}  (${art.category})  images=${rawBody.match(/<img\b/g)?.length || 0}`);
}

// ============================================================
// Wire the listing-page card hrefs
// ============================================================
for (const page of ['blog.html', 'blog-industry.html', 'blog-print-case.html', 'blog-enterprise.html']) {
  const p = 'pages/' + page;
  let html = read(p);
  let changed = 0;
  html = html.replace(/<a class="news-card news-card--blog" href="#">([\s\S]*?<h3>([\s\S]*?)<\/h3>)/g, (full, pre, h3text) => {
    const t = h3text.trim();
    const slug = titleByCard.get(t);
    if (!slug) { warnings.push(`${page}: no slug for card "${t.slice(0, 50)}"`); return full; }
    changed++;
    return full.replace('href="#"', `href="blog/${slug}.html"`);
  });
  write(p, html);
  console.log(`WIRED ${page}: ${changed} cards`);
}

console.log('\nWARNINGS:');
console.log(warnings.length ? warnings.join('\n') : '(none)');
