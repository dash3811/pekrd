# Peak Events by KRD — website

Design-led event rental site for Peak Events by KRD (Austin, Texas). It's a static site with no framework and no database. A small Node script turns the content in `src/data.mjs` into plain HTML in `dist/`.

- 63 pages: home, rentals (all + 6 categories + 47 item pages), real events, custom builds, how it works, about, quote, privacy, terms, 404
- Quote-only shopping list ("Add to quote") saved in the visitor's browser, sent with the quote form
- Animations: monogram intro, headline word reveal, scroll reveals, parallax collage, card hover swap, fly-to-quote, chandelier sway, dance-floor flip, page-to-page view transitions. All respect "reduce motion".
- Plausible analytics, sitemap, Open Graph tags, LocalBusiness and Product structured data

## Deploy (no build step needed)

`dist/` is the finished website. Upload that folder to any static host.

**Netlify (easiest, also makes the quote form email you):**
1. Go to https://app.netlify.com/drop and drag the `dist` folder onto the page.
2. To use the custom domain, open Site settings → Domain management → add `peakeventsbykrd.com` and follow the DNS steps.
3. Quote requests appear under Forms → `quote`. Turn on email notifications there (Forms → Form notifications → Email) and enter the inbox that should receive quotes.

Or connect this GitHub repo in Netlify. `netlify.toml` already sets the publish folder to `dist`.

**GitHub Pages (free, publishes on every push):** set up in `.github/workflows/pages.yml`.
1. In the repo on GitHub, open Settings → Pages and set Source to **GitHub Actions** (one-time).
2. Re-run the latest "Publish to GitHub Pages" run under the Actions tab, or push any change. The site appears at `https://dash3811.github.io/pekrd/`.
3. Custom domain: in Settings → Pages → Custom domain, enter `peakeventsbykrd.com` and add the DNS records GitHub shows (four A records for the root domain, or a CNAME for `www` pointing to `dash3811.github.io`). Tick "Enforce HTTPS" once it's available. Links adjust automatically.
4. GitHub Pages can't receive form submissions, so set `formEndpoint` to a Formspree, Basin or Getform URL for the quote form.

**Vercel:** import this repo. `vercel.json` sets the output to `dist`. On Vercel the Netlify form won't work, so set `formEndpoint` (see below).

**Any other host (Squarespace-free hosting, cPanel, S3, etc.):** upload the contents of `dist/` to the web root and set `formEndpoint`.

## Editing content

All text, products, photos and contact details live in **`src/data.mjs`**. After editing:

```bash
node build.mjs      # requires Node 18+, rebuilds dist/
```

Preview locally: `npx serve dist` or `python3 -m http.server -d dist 8080`.

### Settings in `src/data.mjs` → `site`

| Field | What it does |
|---|---|
| `email`, `phone`, `instagram` | Shown in the footer, about and quote pages |
| `formEndpoint` | Leave empty on Netlify. Elsewhere, paste a Formspree / Basin / Getform URL so quotes are emailed |
| `plausibleDomain` | The domain added in your Plausible account. Set to `''` to turn analytics off |
| `lookbookUrl` | Link for "2025/26 Lookbook (PDF)" |

If no form service is connected, the form falls back to opening an email to `site.email` with the request filled in, so no inquiry is lost.

### Adding a product

Add an entry to `items` in `src/data.mjs`, drop a square image in `assets/img/products/<name>.webp` (white background, about 900×900), and rebuild.

```js
{ slug: 'new-chair', name: 'New Chair', category: 'chairs', style: ['modern'], material: 'Oak',
  desc: 'One or two sentences.', variants: [{ label: 'Natural', img: 'new-chair', swatch: '#C9A27A' }] }
```

Optional: `scene: '<event photo name>'` shows a styled photo on hover, and `custom: true` adds the "can be customized" note.

## Before launch: open items

- [ ] **Quote inbox.** Turn on Netlify form email notifications, or set `formEndpoint`.
- [ ] **Photos.** Images were captured from the lookbook PDF at web size. Replace them with the original high-res files, keeping the **same file names** in `assets/img/products/` and `assets/img/events/`. `tools/process_images.py` documents how each was made.
- [ ] **Testimonials** are samples, marked "Sample review" on the site. Replace them in `testimonials` and remove `placeholder: true`.
- [ ] **Instagram feed.** The grid shows recent event photos linking to the profile. For a live feed, paste a Behold or LightWidget embed in place of the `data-instagram-feed` block in `build.mjs`.
- [ ] **Privacy and Terms.** Plain-language starters. Have the client review them.
- [ ] **Service area, lead times and policies.** Add these to How It Works when known.
- [ ] **Plausible.** Create the site in Plausible with the same domain.
- [ ] **Search Console.** After launch, submit `https://peakeventsbykrd.com/sitemap.xml`.

## Project layout

```
src/data.mjs              all content
build.mjs                 page templates + generator
assets/css/site.css       design system and components
assets/js/site.js         quote list, animations, filters, form
assets/img/               products/, events/, favicon
tools/process_images.py   how the lookbook images were prepared
dist/                     the generated website (deploy this)
```
