// Browser acceptance for the workspace homepage. No build step or provider requests.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
const require = createRequire(import.meta.url);
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4187';
const out = new URL('../review/', import.meta.url).pathname;
await mkdir(out, { recursive: true });
const results = [];
const failures = [];
const browser = await chromium.launch({ headless: true });
async function pageFor(theme, width, options = {}) {
  const page = await browser.newPage({ viewport: { width, height: width < 720 ? 844 : 1000 }, reducedMotion: 'reduce', ...options });
  await page.addInitScript(t => localStorage.setItem('ive-theme', t), theme);
  return page;
}
async function checkPage(page, path, label, screenshots = false) {
  console.log('Checking ' + label);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  try {
    const response = await page.goto(base + path, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1, 'one h1');
    assert.ok(await page.locator('h1').isVisible(), 'visible heading');
    for (const section of await page.locator('main > section').all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await page.evaluate(async () => {
      const images = [...document.images].filter(i => i.getClientRects().length);
      images.forEach(i => { i.loading = 'eager'; });
      await Promise.race([
        Promise.all(images.map(i => i.decode().catch(() => {}))),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
    });
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      broken: [...document.images].filter(i => i.getClientRects().length && (!i.complete || !i.naturalWidth)).map(i => i.src),
      emptyLinks: [...document.querySelectorAll('a')].filter(a => !a.getAttribute('href')).length,
      ids: [...document.querySelectorAll('[id]')].map(e => e.id)
    }));
    assert.ok(state.overflow <= 1, `overflow: ${state.overflow}`);
    assert.deepEqual(state.broken, [], 'all visible images loaded');
    assert.equal(state.emptyLinks, 0);
    assert.equal(new Set(state.ids).size, state.ids.length, 'unique ids');
    assert.deepEqual(errors, [], 'no page, console or HTTP errors');
    await page.evaluate(() => scrollTo(0, 0));
    if (screenshots) {
      await page.screenshot({ path: out + label + '.png', fullPage: true });
      await page.screenshot({ path: out + label + '-hero.png' });
    }
    results.push({ label, path, pass: true });
  } catch (error) { failures.push({ label, error: error.message, errors }); }
}
for (const theme of ['dark', 'light']) {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    const page = await pageFor(theme, width);
    await checkPage(page, '/', `home-${theme}-${width}`, width === 390 || width === 1440);
    await page.close();
  }
}
for (const route of ['product.html', 'download.html', 'architecture.html', 'imprint.html', 'privacy.html', 'story.html', '404.html']) {
  for (const width of [390, 1440]) {
    const page = await pageFor(width === 390 ? 'light' : 'dark', width);
    await checkPage(page, '/' + route, `${route}-${width}`);
    await page.close();
  }
}
// Changed homepage controls, clipboard, motion preference, and no-JS content.
const page = await pageFor('dark', 1440);
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  for (const group of ['workspace', 'workflow']) {
    for (let i = 0; i < 3; i++) {
      await page.locator(`#${group}-tab-${i}`).click();
      assert.equal(await page.locator(`#${group}-tab-${i}`).getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator(`#${group}-panel-${i}`).isVisible(), true);
      assert.equal(await page.locator(`[id^="${group}-panel-"]:visible`).count(), 1);
      const frame = page.locator(`#${group}-panel-${i} iframe`);
      await frame.waitFor();
      await page.waitForFunction(id => document.querySelector(`#${id} iframe`)?.contentWindow.IVE_DEMO?.ready, `${group}-panel-${i}`);
    }
    await page.locator(`#${group}-tab-2`).press('Home');
    assert.equal(await page.locator(`#${group}-tab-0`).getAttribute('aria-selected'), 'true');
  }
  assert.equal(await page.evaluate(() => window.IVE.demos.some(d => d.frame?.playing)), false, 'reduced motion has no autoplay');
  await page.locator('#workspace-tab-0').scrollIntoViewIfNeeded();
  await page.locator('#workspace-panel-0 [data-demo-toggle]').click();
  await page.waitForFunction(() => window.IVE.demos.some(d => d.frame?.playing));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !window.IVE.demos.some(d => d.frame?.playing));
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('[data-copy]').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'curl -fsSL https://ive.dev/install.sh | bash');
  results.push({ label: 'tabs-keyboard-motion-clipboard', pass: true });
} catch (error) { failures.push({ label: 'interactions', error: error.message }); }
await page.close();
for (const width of [390, 1440]) {
  const nojs = await pageFor('dark', width, { javaScriptEnabled: false });
  await nojs.goto(base, { waitUntil: 'networkidle' });
  try {
    assert.equal(await nojs.locator('[data-ws-panel]:visible').count(), 6);
    assert.equal(await nojs.locator('[role="tablist"]:visible').count(), 0);
    assert.equal(await nojs.locator('#hero-title').isVisible(), true);
    results.push({ label: `no-js-${width}`, pass: true });
  } catch (error) { failures.push({ label: `no-js-${width}`, error: error.message }); }
  await nojs.close();
}
await browser.close();
// Safari engine verifies the final responsive CSS and initial paint independently.
try {
  const safari = await webkit.launch({ headless: true });
  for (const width of [390, 1440]) {
    const page = await safari.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await checkPage(page, '/', `webkit-${width}`);
    await page.close();
  }
  await safari.close();
} catch (error) { failures.push({ label: 'webkit', error: error.message }); }
const report = { date: new Date().toISOString(), base, passed: results.length, failures, results };
await writeFile(out + 'qa-workspace.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
