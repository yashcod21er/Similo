// Offline tooling for the evaluation set (not part of the product).
//
// Renders every fictional page in ai/eval/data/pages/ to a 1280x800 JPEG screenshot, pulls out
// the title, visible text, form flags and images the way the capture step does, and writes one
// request fixture per case to ai/eval/data/cases/<id>.json (contract 1 "candidate" shape).
//
// Run from the repository root:
//   node ai/eval/tools/render-pages.mjs [--only id1,id2] [--preview <folder for JPEG previews>]
//
// Pages are loaded with file:// only and any other network request makes the script fail, so
// nothing leaves this PC. Uses the installed Edge (channel "msedge").
import { chromium } from 'playwright';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', 'data');
const casesDir = path.join(dataDir, 'cases');
const pagesDir = path.join(dataDir, 'pages');

const MAX_SCREENSHOT_BYTES = 150 * 1024; // keep the committed data small
const MAX_IMAGE_BYTES = 512 * 1024; // contract limit per element image
const MAX_IMAGES = 12;
const MAX_TEXT = 20_000;

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const previewDir = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;

const manifest = JSON.parse(await readFile(path.join(dataDir, 'manifest.json'), 'utf8'));

if (!only) {
  await rm(casesDir, { recursive: true, force: true });
}
await mkdir(casesDir, { recursive: true });
if (previewDir) await mkdir(previewDir, { recursive: true });

// Runs inside the page: title, text, form flags and the list of images/favicon to fetch.
function extractFromPage(candidateDomain) {
  const hostOk = (host) => host === candidateDomain || host.endsWith('.' + candidateDomain);
  const base = `https://${candidateDomain}/`;
  const text = (document.body.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
  const paymentName = /card.?number|cvv|cvc|expir|iban|security.?code|cc-/i;
  const inputs = [...document.querySelectorAll('input, select')];
  const hasPasswordField = inputs.some((el) => el.type === 'password');
  const hasPaymentField = inputs.some(
    (el) =>
      /^cc-/.test(el.getAttribute('autocomplete') || '') ||
      paymentName.test([el.name, el.id, el.placeholder].join(' ')),
  );
  const submitsToOtherDomain = [...document.forms].some((form) => {
    const action = form.getAttribute('action');
    if (!action) return false;
    try {
      return !hostOk(new URL(action, base).hostname);
    } catch {
      return false;
    }
  });
  const images = [...document.images]
    .filter((img) => {
      const box = img.getBoundingClientRect();
      return img.complete && img.naturalWidth >= 16 && box.width >= 16 && box.height >= 16;
    })
    .map((img) => ({
      src: img.getAttribute('src') || '',
      hint: [img.alt, img.className, img.id, img.getAttribute('src')].join(' '),
      inHeader: Boolean(img.closest('header, nav, .logobox')),
    }));
  const iconLink = document.querySelector('link[rel~="icon"]');
  return {
    title: document.title,
    text,
    forms: { hasPasswordField, hasPaymentField, submitsToOtherDomain },
    images,
    favicon: iconLink ? iconLink.getAttribute('href') : null,
  };
}

async function readPng(folder, src) {
  if (!src || /^(https?:|data:)/i.test(src)) return null;
  const file = path.resolve(folder, src);
  if (!file.startsWith(folder)) return null;
  const bytes = await readFile(file).catch(() => null);
  if (!bytes || bytes.length > MAX_IMAGE_BYTES) return null;
  return bytes.toString('base64');
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const summary = [];
try {
  for (const item of manifest.cases) {
    if (only && !only.has(item.id)) continue;
    let page = null;
    if (item.pageDir) {
      const folder = path.join(pagesDir, item.pageDir);
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        locale: 'en-US',
      });
      const tab = await context.newPage();
      const outside = [];
      tab.on('request', (req) => {
        if (!req.url().startsWith('file:')) outside.push(req.url());
      });
      await tab.goto(pathToFileURL(path.join(folder, 'index.html')).href, { waitUntil: 'load' });
      const info = await tab.evaluate(extractFromPage, item.domain);
      if (outside.length > 0) throw new Error(`${item.id} tried to load ${outside[0]}`);

      let quality = 72;
      let shot = await tab.screenshot({ type: 'jpeg', quality });
      while (shot.length > MAX_SCREENSHOT_BYTES && quality > 30) {
        quality -= 8;
        shot = await tab.screenshot({ type: 'jpeg', quality });
      }
      if (shot.length > MAX_SCREENSHOT_BYTES) throw new Error(`${item.id} screenshot too large`);
      if (previewDir) await writeFile(path.join(previewDir, `${item.id}.jpg`), shot);

      const images = [];
      const favicon = await readPng(folder, info.favicon);
      if (favicon) images.push({ kind: 'favicon', imageBase64: favicon });
      const seen = new Set();
      for (const img of info.images) {
        if (images.length >= MAX_IMAGES || seen.has(img.src)) continue;
        seen.add(img.src);
        const data = await readPng(folder, img.src);
        if (!data) continue;
        const isLogo = /logo|brand/i.test(img.hint) || img.inHeader;
        images.push({ kind: isLogo ? 'logo' : 'image', imageBase64: data });
      }
      page = {
        finalUrl: `https://${item.domain}/`,
        title: info.title.slice(0, 300),
        text: info.text.slice(0, MAX_TEXT),
        screenshotBase64: shot.toString('base64'),
        images,
        forms: info.forms,
        certificateIssuedAt: null,
      };
      summary.push({
        id: item.id,
        kb: Math.round(shot.length / 1024),
        quality,
        images: images.map((i) => i.kind).join(','),
        forms: Object.entries(info.forms)
          .filter(([, v]) => v)
          .map(([k]) => k.replace(/^has|Field$/g, ''))
          .join(','),
        textChars: info.text.length,
      });
      await context.close();
    }
    const fixture = {
      id: item.id,
      brandId: item.brandId,
      label: item.label,
      meta: {
        registeredDaysAgo: item.registeredDaysAgo,
        certificateDaysAgo: item.certificateDaysAgo,
      },
      candidate: {
        domain: item.domain,
        domainScore: item.domainScore,
        registeredAt: null, // filled in by the runner from meta.registeredDaysAgo
        page,
      },
    };
    await writeFile(path.join(casesDir, `${item.id}.json`), JSON.stringify(fixture) + '\n');
  }
} finally {
  await browser.close();
}

console.table(summary);
const files = await readdir(casesDir);
console.log(`${files.length} case files in ${casesDir}`);
