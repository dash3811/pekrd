// Static site generator for peakeventsbykrd.com. No dependencies.
// Usage: node build.mjs   → writes the finished site to ./dist
import { mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, categories, items, looks, testimonials } from './src/data.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'dist');
const VERSION = '3';
// BASE_PATH lets the site live in a sub-folder, e.g. BASE_PATH=/pekrd/ for github.io/pekrd. Default is the domain root.
// Preview mode: SITE_URL points canonical/OG links at the preview host; NOINDEX=1 hides it from search engines and skips analytics.
const PREVIEW = process.env.NOINDEX === '1';
if (process.env.SITE_URL) site.url = process.env.SITE_URL.replace(/\/+$/, '');
if (PREVIEW) site.plausibleDomain = '';
const BASE = ('/' + (process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const P = (n) => `/assets/img/products/${n}.webp`;
const E = (n) => `/assets/img/events/${n}.webp`;
const catBy = Object.fromEntries(categories.map((c) => [c.slug, c]));
const itemBy = Object.fromEntries(items.map((i) => [i.slug, i]));
const itemUrl = (i) => `/rentals/${i.category}/${i.slug}/`;
const STYLES = ['classic', 'modern', 'organic', 'garden', 'statement', 'bistro', 'rustic', 'coastal', 'formal', 'vintage'];

const monogram = (cls = '') => `<svg class="${cls}" viewBox="0 0 120 160" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
  <path d="M34 12 V112 M24 112 H44 M24 12 H34"/>
  <path d="M34 12 H60 C80 12 90 24 90 38 C90 54 78 64 60 64 H34"/>
  <path d="M58 56 V148 M48 148 H58 M48 56 H58"/>
  <path d="M58 56 H100 V66 M58 100 H92 M58 148 H104 V136"/>
</svg>`;

const icon = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8a3 3 0 016 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  ig: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
};

function head({ title, description, path, image, jsonld }) {
  const full = title ? `${title} | ${site.name}` : `${site.name} | Event Rentals in Austin, Texas`;
  const desc = description || site.description;
  const og = site.url + (image || E('candlelit-hall'));
  return `<!doctype html>
<html lang="en" data-base="/">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">${PREVIEW ? '\n<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="canonical" href="${site.url}${path}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${og}">
<meta property="og:url" content="${site.url}${path}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F6F1EA">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap">
<link rel="stylesheet" href="/assets/css/site.css?v=${VERSION}">
${site.plausibleDomain ? `<script defer data-domain="${esc(site.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>` : ''}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>`;
}

const NAV = [
  ['Rentals', '/rentals/'],
  ['Real Events', '/real-events/'],
  ['Custom Builds', '/custom-builds/'],
  ['How It Works', '/how-it-works/'],
  ['About', '/about/'],
];

function header(active) {
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(site.name)} home">${monogram()}<span class="brand-name">Peak Events<small>by KRD</small></span></a>
    <nav class="nav" id="nav" aria-label="Main">
      ${NAV.map(([l, h]) => `<a href="${h}"${active === h ? ' aria-current="page"' : ''}>${l}</a>`).join('\n      ')}
    </nav>
    <div class="header-actions">
      <a class="quote-bag" href="/quote/">${icon.bag}<span class="label">Quote</span><span class="quote-count is-empty" aria-label="items in quote">0</span></a>
      <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="foot-cta">
      <h2>Let's set a beautiful table.</h2>
      <a class="btn btn--light" href="/quote/">Start a quote</a>
    </div>
    <div class="foot-grid">
      <div class="foot-brand">${monogram()}<p>Design-led event rentals for weddings and celebrations in ${esc(site.city)} and beyond.</p></div>
      <div><h4>Rentals</h4><ul>${categories.map((c) => `<li><a href="/rentals/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></div>
      <div><h4>Explore</h4><ul>
        <li><a href="/real-events/">Real Events</a></li><li><a href="/custom-builds/">Custom Builds</a></li><li><a href="/how-it-works/">How It Works</a></li><li><a href="/about/">About</a></li>
        <li><a href="${site.lookbookUrl}" target="_blank" rel="noopener">2025/26 Lookbook (PDF)</a></li></ul></div>
      <div><h4>Say hello</h4><ul>
        <li><a href="mailto:${site.email}">${esc(site.email)}</a></li>
        <li><a href="tel:${site.phoneHref}">${esc(site.phone)}</a></li>
        <li><a href="https://instagram.com/${site.instagram}" target="_blank" rel="noopener">@${site.instagram}</a></li></ul></div>
    </div>
    <div class="foot-legal"><span>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</span><span><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></span></div>
  </div>
</footer>
<div class="quote-bar" aria-hidden="false"><span class="quote-bar-count">0 items in your quote</span><a class="btn btn--light btn--sm" href="/quote/">Review quote</a></div>
<div id="live" class="sr-only" aria-live="polite"></div>
<script src="/assets/js/site.js?v=${VERSION}" defer></script>
</body>
</html>`;
}

function page(meta, active, body, bodyClass = '') {
  return `${head(meta)}
<body class="${bodyClass}">
${header(active)}
<main id="main">
${body}
</main>
${footer()}`;
}

function write(path, html) {
  const file = join(OUT, path, path.endsWith('.html') ? '' : 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  // Point root-relative links (href="/…", src="/…", data-img="/…") at BASE
  if (BASE !== '/') html = html.replace(/(=")\/(?!\/)/g, '$1' + BASE);
  writeFileSync(file, html);
}

// ---------- Components ----------
function card(i, idx = 0) {
  const v = i.variants[0];
  const alt = `${i.name} ${catBy[i.category].name.toLowerCase().replace(/s$/, '')}${i.variants.length > 1 || v.label !== 'Standard' ? ', ' + v.label.toLowerCase() : ''}`;
  const search = [i.name, i.material, catBy[i.category].name, ...i.style, ...i.variants.map((x) => x.label)].join(' ').toLowerCase();
  const swatches = i.variants.length > 1
    ? `<div class="swatches" role="group" aria-label="Finish">${i.variants.map((x, n) => `<button type="button" class="swatch" style="--c:${x.swatch}" aria-pressed="${n === 0}" aria-label="${esc(x.label)}" data-img="${P(x.img)}" data-label="${esc(x.label)}" data-alt="${esc(i.name + ', ' + x.label.toLowerCase())}"></button>`).join('')}</div>`
    : `<span class="card-meta">${esc(v.label === 'Standard' ? (i.seats || i.material) : v.label)}</span>`;
  return `<article class="card${i.sway ? ' sway' : ''}" data-item data-cat="${i.category}" data-style="${i.style.join(' ')}" data-search="${esc(search)}" data-reveal style="--d:${(idx % 4) * 70}ms">
  <a class="card-media" href="${itemUrl(i)}" tabindex="-1" aria-hidden="true">
    <img class="cut" src="${P(v.img)}" alt="${esc(alt)}" width="900" height="900" loading="lazy" decoding="async" style="view-transition-name:p-${i.slug}">
    ${i.scene ? `<img class="scene" src="${E(i.scene)}" alt="" loading="lazy" decoding="async">` : ''}
  </a>
  <div class="card-body">
    <h3 style="margin:0"><a class="card-title" href="${itemUrl(i)}">${esc(i.name)}</a></h3>
    <div class="card-row">${swatches}
      <button type="button" class="add" data-add data-slug="${i.slug}" data-name="${esc(i.name)}" data-variant="${esc(v.label === 'Standard' ? '' : v.label)}" data-img="${P(v.img)}" data-url="${itemUrl(i)}"><span aria-hidden="true">+</span> <span class="add-label">Add to quote</span></button>
    </div>
  </div>
</article>`;
}

function catalogTools(fixedCat) {
  const catChips = fixedCat
    ? [`<a class="chip" href="/rentals/">All</a>`, ...categories.map((c) => `<a class="chip" href="/rentals/${c.slug}/"${c.slug === fixedCat ? ' aria-current="page"' : ''}>${esc(c.name)}</a>`)]
    : [`<button type="button" class="chip" data-filter-cat="all" aria-pressed="true">All</button>`, ...categories.map((c) => `<button type="button" class="chip" data-filter-cat="${c.slug}" aria-pressed="false">${esc(c.name)}</button>`)];
  const usedStyles = STYLES.filter((s) => items.some((i) => (!fixedCat || i.category === fixedCat) && i.style.includes(s)));
  return `<div class="catalog-tools"><div class="wrap">
  <div class="chips" role="group" aria-label="Category">${catChips.join('')}</div>
  <label class="search"><span class="sr-only">Search rentals</span>${icon.search}<input type="search" placeholder="Search rentals" autocomplete="off"></label>
  ${usedStyles.length > 1 ? `<div class="chips style-chips" role="group" aria-label="Style"><button type="button" class="chip" data-filter-style="all" aria-pressed="true">Any style</button>${usedStyles.map((s) => `<button type="button" class="chip" data-filter-style="${s}" aria-pressed="false">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>` : ''}
</div></div>`;
}

// ---------- Pages ----------
function home() {
  const collage = [
    // [look img, left%, top%, width%, height(px), speed]
    ['candlelit-hall', 0, 4, 34, 0.67, 0.94],
    ['garden-snapdragons', 30, 0, 21, 1.34, 1.06],
    ['limestone-steps', 55, 6, 30, 0.67, 0.96],
    ['pink-porch', 85, 0, 15, 1.5, 1.1],
    ['sunroom-cane', 4, 48, 19, 1.45, 1.08],
    ['lakeside-dinner', 26, 54, 22, 1.3, 0.92],
    ['tropical-cane-bistro', 51, 46, 20, 1.25, 1.05],
    ['terracotta-limestone', 75, 42, 22, 1.35, 0.95],
  ];
  const lookBy = Object.fromEntries(looks.map((l) => [l.img, l]));
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: site.name, url: site.url,
    image: site.url + E('candlelit-hall'), email: site.email, telephone: site.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Austin', addressRegion: 'TX', addressCountry: 'US' },
    sameAs: [`https://instagram.com/${site.instagram}`], description: site.description,
  };
  const body = `
<div class="intro" aria-hidden="true">${monogram()}</div>
<section class="hero">
  <div class="hero-media"><img src="${E('candlelit-hall')}" alt="A long candlelit dinner table lined with white wishbone chairs and yellow wildflowers" width="1288" height="859" fetchpriority="high"></div>
  <div class="wrap hero-inner">
    <span class="eyebrow">Event rentals · ${esc(site.city)}</span>
    <h1 data-split>Rentals with a point of view</h1>
    <p data-reveal style="--d:500ms">Design-led chairs, tables, draped chandeliers and custom facades for weddings and celebrations that look as considered as they feel.</p>
    <div class="hero-ctas" data-reveal style="--d:650ms"><a class="btn btn--light" href="/rentals/">Browse rentals</a><a class="btn btn--outline-light" href="/quote/">Start a quote</a></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="center">
      <span class="eyebrow" data-reveal>The collection</span>
      <h2 data-reveal>Shop by category</h2>
      <p class="lede" data-reveal>Every piece is chosen for how it photographs, how it feels to sit with, and how well it plays with others.</p>
    </div>
    <div class="cats" data-stagger>
      ${categories.map((c) => { const i = items.find((x) => x.variants.some((v) => v.img === c.cover)); return `<a class="cat" href="/rentals/${c.slug}/" data-reveal><div class="cat-media${c.slug === 'lighting' ? ' sway-on' : ''}"><img src="${P(c.cover)}" alt="" width="900" height="900" loading="lazy"></div><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p></a>`; }).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section--white">
  <div class="wrap">
    <div class="split" style="align-items:end">
      <div><span class="eyebrow" data-reveal>Real events</span><h2 data-reveal>Set by us, styled by you</h2></div>
      <div><p class="lede" data-reveal>A few of our favorite tables from around the Hill Country. Hover a photo to see the look, then shop the pieces.</p><a class="link" href="/real-events/" data-reveal>See all real events</a></div>
    </div>
    <div class="collage">
      ${collage.map(([img, l, t, w, ratio, sp]) => { const lk = lookBy[img]; return `<figure data-reveal><div data-speed="${sp}"><a href="/real-events/#${img}" style="aspect-ratio:${ratio > 1 ? '4/5' : '4/3'}"><img src="${E(img)}" alt="${esc(lk.title + ': ' + lk.note)}" loading="lazy" decoding="async"><span class="cap">${esc(lk.title)}</span></a></div></figure>`; }).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section--oak">
  <div class="wrap split">
    <div>
      <span class="eyebrow" data-reveal>Custom builds</span>
      <h2 data-reveal>Your bar, your colors</h2>
      <p class="lede" style="color:#E7E1D3" data-reveal>Any facade can be built as a bar or stage front, and any color or fabric can be customized. Pick a style, choose a palette, and we'll bring it to life.</p>
      <a class="btn btn--light" href="/custom-builds/" data-reveal>Design a custom build</a>
    </div>
    <div class="facade-strip" data-stagger>
      ${['facade-trellis-blue', 'facade-ribbed-pink', 'facade-cane-green', 'facade-skirt-stripes', 'facade-traditional-white', 'facade-rustic-light', 'facade-panel-dark', 'facade-marble-black'].map((f) => `<div class="tile" data-reveal><img src="${P(f)}" alt="" loading="lazy"></div>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="eyebrow" data-reveal>How it works</span>
    <h2 data-reveal>Three easy steps</h2>
    <div class="steps" data-stagger>
      <div class="step" data-reveal><h3>Browse</h3><p>Explore the collection and add the pieces you love to your quote list, with quantities and finishes.</p></div>
      <div class="step" data-reveal><h3>Request a quote</h3><p>Tell us your date, venue and guest count. We'll confirm availability and send a tailored quote.</p></div>
      <div class="step" data-reveal><h3>We deliver</h3><p>We deliver, place and pick up, so all you have to do is enjoy the day.</p></div>
    </div>
  </div>
</section>

<section class="section section--white">
  <div class="wrap center">
    <span class="eyebrow" data-reveal>Kind words</span>
    <h2 data-reveal>From our clients</h2>
    <div class="quotes" data-stagger>
      ${testimonials.map((t) => `<figure class="quote" data-reveal><blockquote>“${esc(t.quote)}”</blockquote><figcaption>${esc(t.who)}${t.placeholder ? '<br><span class="sample-tag">Sample review</span>' : ''}</figcaption></figure>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap center">
    <span class="eyebrow" data-reveal>On Instagram</span>
    <h2 data-reveal><a href="https://instagram.com/${site.instagram}" target="_blank" rel="noopener" style="text-decoration:none">@${site.instagram}</a></h2>
    <!-- To show a live feed, replace this grid with the embed code from a feed service such as Behold or LightWidget. -->
    <div class="insta" data-instagram-feed data-stagger>
      ${['tablescape-above', 'umbrella-aisle', 'draped-pergola', 'garden-arbor', 'sculpted-wishbone', 'overhead-rows'].map((n) => `<a href="https://instagram.com/${site.instagram}" target="_blank" rel="noopener" data-reveal><img src="${E(n)}" alt="${esc(looks.find((l) => l.img === n).title)} on Instagram" loading="lazy"></a>`).join('')}
    </div>
  </div>
</section>`;
  write('', page({ path: '/', jsonld }, '/', body, 'page-home'));
}

function rentalsIndex() {
  const body = `
<div class="wrap page-head">
  <span class="script script-reveal">The Collection</span>
  <h1 data-reveal>Rentals</h1>
  <p class="lede" data-reveal>Browse every piece, filter by style, and add what you love to your quote. Pricing is tailored to your date, quantities and delivery, so every quote is custom.</p>
</div>
${catalogTools(null)}
<section class="wrap" data-catalog style="padding-bottom:96px">
  <p class="result-count" aria-live="polite"></p>
  <div class="grid">${items.map(card).join('\n')}</div>
</section>`;
  write('rentals', page({ title: 'Rentals', description: 'Browse chairs, dining tables, draped chandeliers, bar facades, acrylic staging and folding tables for rent in Austin, Texas.', path: '/rentals/' }, '/rentals/', body));
}

function categoryPage(c) {
  const list = items.filter((i) => i.category === c.slug);
  const extra = c.slug === 'staging'
    ? `<div class="wrap" style="margin-top:56px"><div class="split"><div class="checker" aria-hidden="true">${Array.from({ length: 32 }, (_, n) => `<i style="--i:${n}"></i>`).join('')}</div><div><h2 data-reveal>Make the floor yours</h2><p class="lede" data-reveal>Every acrylic piece can be custom vinyl wrapped with a monogram, pattern or color.</p><a class="link" href="/custom-builds/">Plan a custom piece</a></div></div></div>`
    : c.slug === 'facades'
      ? `<div class="wrap" style="margin-top:56px"><div class="split"><div><h2 data-reveal>Any style, any palette</h2><p class="lede" data-reveal>Any facade can be created in bar or stage form, and colors and fabrics can be customized too.</p></div><div><a class="btn" href="/custom-builds/" data-reveal>Design a custom build</a></div></div></div>`
      : '';
  const body = `
<div class="wrap page-head">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/rentals/">Rentals</a> / ${esc(c.name)}</nav>
  <span class="script script-reveal">${esc(c.script)}</span>
  <h1 data-reveal>${esc(c.name)}</h1>
  <p class="lede" data-reveal>${esc(c.blurb)}</p>
</div>
${catalogTools(c.slug)}
<section class="wrap" data-catalog data-fixed-cat="${c.slug}">
  <p class="result-count" aria-live="polite"></p>
  <div class="grid">${list.map(card).join('\n')}</div>
</section>
${extra}
<div style="height:96px"></div>`;
  write(`rentals/${c.slug}`, page({ title: `${c.name} for Rent`, description: `${c.blurb} Event rentals in Austin, Texas.`, path: `/rentals/${c.slug}/`, image: P(c.cover) }, '/rentals/', body));
}

function productPage(i) {
  const c = catBy[i.category];
  const v = i.variants[0];
  const related = items.filter((x) => x.slug !== i.slug && (x.category === i.category || (i.category === 'chairs' && x.category === 'tables') || (i.category === 'tables' && x.category === 'chairs')))
    .sort((a, b) => (b.style.filter((s) => i.style.includes(s)).length) - (a.style.filter((s) => i.style.includes(s)).length)).slice(0, 4);
  const facts = [
    ['Category', c.name], ['Material', i.material],
    i.seats ? ['Seating', i.seats] : null,
    ['Finishes', i.variants.map((x) => x.label).join(', ')],
    ['Style', i.style.map((s) => s[0].toUpperCase() + s.slice(1)).join(', ')],
    i.custom ? ['Custom', 'Colors and fabrics can be customized'] : null,
    ['Dimensions & quantity', 'Confirmed with your quote'],
  ].filter(Boolean);
  const looksWith = looks.filter((l) => l.items.includes(i.slug));
  const jsonld = { '@context': 'https://schema.org', '@type': 'Product', name: i.name, description: i.desc, image: site.url + P(v.img), category: c.name, brand: { '@type': 'Brand', name: site.name } };
  const body = `
<div class="wrap page-head" style="padding-bottom:24px"><nav class="crumbs" aria-label="Breadcrumb"><a href="/rentals/">Rentals</a> / <a href="/rentals/${c.slug}/">${esc(c.name)}</a> / ${esc(i.name)}</nav></div>
<div class="wrap product" data-item>
  <div class="product-media">
    <div class="product-main${i.sway ? ' sway-on' : ''}"><img class="cut" src="${P(v.img)}" alt="${esc(i.name + ', ' + v.label.toLowerCase())}" width="900" height="900" style="view-transition-name:p-${i.slug}"></div>
    ${i.scene ? `<figure class="product-scene" style="margin:0"><img src="${E(i.scene)}" alt="${esc(i.name)} styled at a real event" loading="lazy"></figure>` : ''}
  </div>
  <div class="product-info">
    <span class="eyebrow">${esc(c.name)}</span>
    <h1>${esc(i.name)}</h1>
    <p class="lede">${esc(i.desc)}</p>
    ${i.variants.length > 1 ? `<span class="finish-label">Finish: <b>${esc(v.label)}</b></span><div class="swatches" role="group" aria-label="Finish">${i.variants.map((x, n) => `<button type="button" class="swatch" style="--c:${x.swatch}" aria-pressed="${n === 0}" aria-label="${esc(x.label)}" data-img="${P(x.img)}" data-label="${esc(x.label)}" data-alt="${esc(i.name + ', ' + x.label.toLowerCase())}"></button>`).join('')}</div>` : ''}
    <div class="qty-row">
      <div class="stepper" role="group" aria-label="Quantity"><button type="button" data-step="-" aria-label="Decrease quantity">−</button><input type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-step="+" aria-label="Increase quantity">+</button></div>
      <button type="button" class="btn" data-add data-slug="${i.slug}" data-name="${esc(i.name)}" data-variant="${esc(v.label === 'Standard' ? '' : v.label)}" data-img="${P(v.img)}" data-url="${itemUrl(i)}"><span class="add-label">Add to quote</span></button>
    </div>
    <p class="note">Quote only. We'll confirm availability, dimensions and delivery for your date.</p>
    <ul class="facts">${facts.map(([k, val]) => `<li><span>${esc(k)}</span><span>${esc(val)}</span></li>`).join('')}</ul>
    ${looksWith.length ? `<p class="note">Seen at: ${looksWith.map((l) => `<a href="/real-events/#${l.img}">${esc(l.title)}</a>`).join(', ')}</p>` : ''}
  </div>
</div>
<section class="section section--white">
  <div class="wrap"><span class="eyebrow">Pairs well with</span><h2>Complete the look</h2><div class="grid">${related.map(card).join('')}</div></div>
</section>`;
  write(`rentals/${c.slug}/${i.slug}`, page({ title: `${i.name} ${c.slug === 'chairs' ? 'Chair' : ''} Rental`.replace('  ', ' '), description: `${i.desc} Available to rent from ${site.name} in Austin, Texas.`, path: itemUrl(i), image: P(v.img), jsonld }, '/rentals/', body));
}

function realEvents() {
  const body = `
<div class="wrap page-head">
  <span class="script script-reveal">Real Events</span>
  <h1 data-reveal>Tables we've set</h1>
  <p class="lede" data-reveal>Weddings, dinners and celebrations across Austin and the Hill Country, and the pieces that made them. Tap a photo to see it larger, or shop the look.</p>
</div>
<section class="wrap" style="padding-bottom:96px">
  <div class="masonry">
    ${looks.map((l) => `<figure class="look" id="${l.img}" data-reveal>
      <button type="button" data-lightbox="${E(l.img)}" data-title="${esc(l.title)}" aria-label="View ${esc(l.title)} larger"><img src="${E(l.img)}" alt="${esc(l.title + ': ' + l.note)}" width="${l.w}" height="${l.h}" loading="lazy" decoding="async"></button>
      <figcaption class="look-body"><h3>${esc(l.title)}</h3><p>${esc(l.note)}</p><div class="look-shop">${l.items.map((s) => `<a href="${itemUrl(itemBy[s])}">Shop ${esc(itemBy[s].name)}</a>`).join('')}</div></figcaption>
    </figure>`).join('\n    ')}
  </div>
</section>`;
  write('real-events', page({ title: 'Real Events', description: 'Real weddings and events styled with Peak Events by KRD rentals across Austin and the Texas Hill Country.', path: '/real-events/', image: E('garden-snapdragons') }, '/real-events/', body));
}

function customBuilds() {
  const facades = items.filter((i) => i.category === 'facades');
  const palettes = [['Natural', '#D9C3A0'], ['Ivory', '#F3EEE4'], ['Blush', '#EBCFC3'], ['Sage', '#B9C9A4'], ['Powder blue', '#B7C9DC'], ['Terracotta', '#C2634A'], ['Espresso', '#3B2A22'], ['Black', '#1E1B19'], ['Your colors', 'conic-gradient(#C2634A,#EBCFC3,#B9C9A4,#B7C9DC,#C2634A)']];
  const body = `
<div class="wrap page-head">
  <span class="script script-reveal">Custom Builds</span>
  <h1 data-reveal>Design your bar or stage</h1>
  <p class="lede" data-reveal>Every facade can be created as a bar or stage front, and colors and fabrics can be customized. Acrylic pieces can be vinyl wrapped. Start here and we'll take it from there.</p>
</div>
<section class="wrap" style="padding-bottom:96px">
  <div class="builder" data-builder data-item>
    <div>
      <div class="builder-stage"><img src="${P(facades[0].variants[0].img)}" alt="${esc(facades[0].name)} facade"><div class="tint" style="--c:#D9C3A0"><i></i><span>Natural palette</span></div></div>
      <p class="note" style="margin-top:12px">The photo shows the base style. Your palette is noted on the request and confirmed with a mock-up.</p>
    </div>
    <div>
      <fieldset class="opt-group"><legend>1. Choose a style</legend><div class="opt-grid">
        ${facades.map((f, n) => `<div class="opt"><input type="radio" name="b-style" id="s-${f.slug}" value="${esc(f.name)}" data-img="${P(f.variants[0].img)}"${n === 0 ? ' checked' : ''}><label for="s-${f.slug}"><img src="${P(f.variants[0].img)}" alt="" loading="lazy">${esc(f.name)}</label></div>`).join('')}
      </div></fieldset>
      <fieldset class="opt-group"><legend>2. How will you use it?</legend><div class="pill-opts">
        ${['Bar', 'Stage front', 'Photo backdrop', 'Dessert or gift table'].map((u, n) => `<span><input type="radio" name="b-use" id="u-${n}" value="${u}"${n === 0 ? ' checked' : ''}><label for="u-${n}">${u}</label></span>`).join('')}
      </div></fieldset>
      <fieldset class="opt-group"><legend>3. Pick a palette</legend><div class="pill-opts">
        ${palettes.map(([p, c], n) => `<span><input type="radio" name="b-color" id="c-${n}" value="${p}" data-c="${c}"${n === 0 ? ' checked' : ''}><label for="c-${n}"><i style="--c:${c}"></i>${p}</label></span>`).join('')}
      </div></fieldset>
      <div class="field"><label for="b-notes">Anything else? (fabric, monogram, size)</label><textarea id="b-notes" rows="3" placeholder="For example: sage stripe fabric, gold monogram, 8 ft bar"></textarea></div>
      <button type="button" class="btn btn--terra" data-add-custom>Add this build to my quote</button>
    </div>
  </div>
</section>
<section class="section section--white"><div class="wrap"><span class="eyebrow">Start from a favorite</span><h2>Facade styles</h2><div class="grid">${facades.map(card).join('')}</div></div></section>`;
  write('custom-builds', page({ title: 'Custom Bars, Facades & Stages', description: 'Design a custom bar or stage facade in any of eight styles, in your colors and fabrics. Austin event rentals by Peak Events by KRD.', path: '/custom-builds/', image: P('facade-trellis-blue') }, '/custom-builds/', body));
}

function howItWorks() {
  const body = `
<div class="wrap page-head">
  <span class="script script-reveal">How It Works</span>
  <h1 data-reveal>Simple from first idea to final pickup</h1>
  <p class="lede" data-reveal>We keep renting easy so you can focus on the fun part: designing a beautiful event.</p>
</div>
<section class="wrap" style="padding-bottom:40px">
  <div class="steps steps--4" data-stagger>
    <div class="step" data-reveal><h3>Browse & build your list</h3><p>Add pieces to your quote with quantities and finishes. Not sure yet? Add what inspires you and we'll help narrow it down.</p></div>
    <div class="step" data-reveal><h3>Send your request</h3><p>Share your date, venue, guest count and any notes. Requests are free and there's no obligation.</p></div>
    <div class="step" data-reveal><h3>Get your custom quote</h3><p>We confirm availability and send a tailored quote, including delivery for your venue.</p></div>
    <div class="step" data-reveal><h3>We deliver & pick up</h3><p>Our team delivers, places and collects everything, so you never have to lift a chair.</p></div>
  </div>
</section>
<section class="section section--white">
  <div class="wrap split">
    <div class="product-scene" style="aspect-ratio:4/5"><img src="${E('umbrella-aisle')}" alt="Natural bentwood chairs in rows beneath fringed white umbrellas" loading="lazy"></div>
    <div class="prose">
      <span class="eyebrow">Good to know</span>
      <h2 style="margin-top:0">Delivery and details</h2>
      <ul>
        <li><b>Delivery only.</b> Every order is delivered and picked up by our team. We don't offer customer pickup, which keeps every piece in top condition.</li>
        <li><b>Quotes are tailored.</b> Pricing depends on your pieces, quantities, date and venue, so we quote every event individually.</li>
        <li><b>Book early for peak season.</b> Spring and fall weekends fill quickly in Austin, so reach out as soon as you have a date.</li>
        <li><b>Custom pieces take a little longer.</b> Wrapped or custom-built facades and floors need extra lead time; we'll confirm timing with your quote.</li>
      </ul>
      <a class="btn" href="/quote/">Start a quote</a>
    </div>
  </div>
</section>`;
  write('how-it-works', page({ title: 'How It Works', description: 'How renting from Peak Events by KRD works: browse, request a quote, and we deliver and pick up.', path: '/how-it-works/' }, '/how-it-works/', body));
}

function about() {
  const body = `
<div class="wrap page-head">
  <span class="script script-reveal">Our Story</span>
  <h1 data-reveal>Hello, we're Peak Events</h1>
</div>
<section class="wrap split" style="padding-bottom:96px;align-items:start">
  <div class="portrait" data-reveal><img src="${E('pink-porch')}" alt="Blush bentwood chairs around a printed table on a white porch" loading="lazy"></div>
  <div class="prose">
    <p class="lede" data-reveal>Peak Events by KRD was founded by ${esc(site.owner)} on a simple belief: rentals shouldn't be an afterthought. The right chair, the right table, the right light can set the entire mood of a celebration.</p>
    <p data-reveal>Based in ${esc(site.city)}, we curate a collection that feels collected rather than catalogued: warm bentwood and woven cane, sculptural burl and travertine tables, softly draped chandeliers and bar facades that can be rebuilt in your colors. Every piece is chosen for how it photographs, how it feels and how well it plays with others.</p>
    <p data-reveal>We work with couples, planners, designers and hosts to bring a vision to life, from intimate garden dinners to full Hill Country weddings. You bring the ideas. We'll bring the pieces, deliver them, set them and take them away when the last guest leaves.</p>
    <h2 data-reveal>What we care about</h2>
    <ul data-reveal>
      <li><b>Design first.</b> A tight, considered collection instead of endless options.</li>
      <li><b>Making it personal.</b> Custom facades, wraps and palettes so your event looks like you.</li>
      <li><b>Easy, warm service.</b> Clear quotes, quick answers and white-glove delivery.</li>
    </ul>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:28px" data-reveal><a class="btn" href="/rentals/">Browse rentals</a><a class="btn btn--ghost" href="/quote/">Start a quote</a></div>
  </div>
</section>`;
  write('about', page({ title: 'About', description: `Meet Peak Events by KRD, a design-led event rental company in ${site.city} founded by ${site.owner}.`, path: '/about/' }, '/about/', body));
}

function quote() {
  const today = new Date().toISOString().slice(0, 10);
  const body = `
<div class="wrap page-head">
  <span class="script script-reveal">Your Quote</span>
  <h1 data-reveal>Request a quote</h1>
  <p class="lede" data-reveal>Review your list, tell us about your event, and we'll reply with availability and a tailored quote.</p>
</div>
<section class="wrap quote-layout" data-quote-page>
  <div>
    <h2 style="font-size:30px">Your list</h2>
    <div class="empty" hidden><p class="lede" style="margin:0 auto 18px">Your quote list is empty.</p><a class="btn" href="/rentals/">Browse rentals</a></div>
    <ul class="qlist"></ul>
    <p class="note" style="margin-top:16px">Not sure about quantities? Give us your best guess and we'll help you plan.</p>
  </div>
  <form class="form" name="quote" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-endpoint="${esc(site.formEndpoint)}" data-email="${esc(site.email)}" novalidate>
    <input type="hidden" name="form-name" value="quote">
    <p class="hp"><label>Leave this empty <input name="bot-field"></label></p>
    <textarea id="q-items" name="items" hidden></textarea>
    <h2 style="font-size:30px">Event details</h2>
    <div class="row2">
      <div class="field"><label for="q-name">Your name</label><input id="q-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="q-email">Email</label><input id="q-email" name="email" type="email" autocomplete="email" required></div>
    </div>
    <div class="row2">
      <div class="field"><label for="q-phone">Phone</label><input id="q-phone" name="phone" type="tel" autocomplete="tel"></div>
      <div class="field"><label for="q-date">Event date</label><input id="q-date" name="date" type="date" min="${today}" required></div>
    </div>
    <div class="row2">
      <div class="field"><label for="q-venue">Venue or address</label><input id="q-venue" name="venue" required></div>
      <div class="field"><label for="q-guests">Guest count</label><input id="q-guests" name="guests" type="number" min="1" inputmode="numeric"></div>
    </div>
    <div class="field"><label for="q-type">Event type</label><select id="q-type" name="type"><option>Wedding</option><option>Rehearsal dinner</option><option>Shower or party</option><option>Corporate event</option><option>Other</option></select></div>
    <div class="field"><label for="q-msg">Tell us about your vision</label><textarea id="q-msg" name="message" placeholder="Colors, mood, timing, anything you're dreaming up"></textarea></div>
    <p class="note">All orders are delivered and picked up by our team.</p>
    <button class="btn btn--terra" type="submit" style="width:100%">Send my quote request</button>
    <div class="form-msg" role="status"></div>
  </form>
</section>`;
  write('quote', page({ title: 'Request a Quote', description: 'Request a custom event rental quote from Peak Events by KRD in Austin, Texas.', path: '/quote/' }, '', body, 'page-quote'));
}

function legal() {
  const updated = 'December 2026';
  const privacy = `
<div class="wrap page-head"><h1>Privacy Policy</h1><p class="muted">Last updated ${updated}</p></div>
<section class="wrap prose" style="padding-bottom:96px">
  <p>${esc(site.name)} ("we", "us") respects your privacy. This policy explains what we collect through this website and how we use it.</p>
  <h2>What we collect</h2>
  <ul><li><b>Quote requests.</b> When you submit a quote, we receive the details you enter: name, email, phone, event date, venue, guest count, your item list and message.</li>
  <li><b>Your quote list.</b> Items you add are saved in your own browser so your list is still there when you return. We can't see it until you send a request.</li>
  <li><b>Analytics.</b> We use Plausible Analytics, a privacy-friendly service that does not use cookies or collect personal data, to understand which pages are visited.</li></ul>
  <h2>How we use it</h2>
  <p>We use your information only to respond to your inquiry, prepare quotes, and deliver and coordinate your rental. We do not sell or rent your personal information.</p>
  <h2>Sharing</h2>
  <p>We share information only with service providers who help us run the website and our business (for example, website hosting and form delivery), and only as needed to provide those services.</p>
  <h2>Your choices</h2>
  <p>You can ask us to access, correct or delete the information you've shared by emailing <a href="mailto:${site.email}">${esc(site.email)}</a>. You can clear your saved quote list at any time by removing the items or clearing your browser data.</p>
  <h2>Contact</h2>
  <p>Questions? Email <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>
</section>`;
  const terms = `
<div class="wrap page-head"><h1>Website Terms</h1><p class="muted">Last updated ${updated}</p></div>
<section class="wrap prose" style="padding-bottom:96px">
  <p>By using this website you agree to these terms.</p>
  <h2>Quotes and availability</h2>
  <p>Items shown on this site are subject to availability. Submitting a quote request does not reserve items or create a booking. A booking is confirmed only when you accept a written quote and complete the steps in your rental agreement, which will govern your rental.</p>
  <h2>Product information</h2>
  <p>We work to show our pieces accurately, but colors, finishes and dimensions may vary slightly from photos and screens. Custom builds are confirmed with a mock-up or written description before production.</p>
  <h2>Content</h2>
  <p>All photos, text and design on this site belong to ${esc(site.name)} or are used with permission. Please don't reuse them without asking.</p>
  <h2>Contact</h2>
  <p>Questions about these terms? Email <a href="mailto:${site.email}">${esc(site.email)}</a>.</p>
</section>`;
  write('privacy', page({ title: 'Privacy Policy', path: '/privacy/' }, '', privacy));
  write('terms', page({ title: 'Website Terms', path: '/terms/' }, '', terms));
  write('404.html', page({ title: 'Page not found', path: '/404.html' }, '', `<div class="wrap page-head center"><span class="script">Oops</span><h1>We couldn't find that page</h1><p class="lede">It may have moved. Let's get you back to something beautiful.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:28px 0 96px"><a class="btn" href="/">Home</a><a class="btn btn--ghost" href="/rentals/">Browse rentals</a></div></div>`));
}

function extras() {
  const urls = ['/', '/rentals/', ...categories.map((c) => `/rentals/${c.slug}/`), ...items.map(itemUrl), '/real-events/', '/custom-builds/', '/how-it-works/', '/about/', '/quote/', '/privacy/', '/terms/'];
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFileSync(join(OUT, 'robots.txt'), PREVIEW ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
  writeFileSync(join(ROOT, 'assets/img/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#D0B89C"/><g transform="translate(13 6) scale(.32)" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"><path d="M34 12 V112 M34 12 H60 C80 12 90 24 90 38 C90 54 78 64 60 64 H34"/><path d="M58 56 V148 M58 56 H100 M58 100 H92 M58 148 H104"/></g></svg>`);
}

// ---------- Build ----------
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
extras();
cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });
home(); rentalsIndex(); categories.forEach(categoryPage); items.forEach(productPage);
realEvents(); customBuilds(); howItWorks(); about(); quote(); legal();
console.log(`Built ${items.length} item pages, ${categories.length} categories → dist/`);
