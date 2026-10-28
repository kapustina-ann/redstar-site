const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { webkit, chromium } = require('C:/Users/kapus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const files = ['', 'glass/'].flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.html')).map(f => dir + f));

(async () => {
  let checked = 0;
  for (const [name, engine, options] of [['WebKit', webkit, {}], ['Chrome', chromium, {channel: 'chrome'}]]) {
    const browser = await engine.launch(options);
    const jobs = files.flatMap(file => [320, 390, 768, 1381, 1440].map(width => ({file, width})));
    async function worker() {
      const page = await browser.newPage();
      // Inspect local build only; maps and other external services are outside this test.
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        const file = path.join(root, decodeURIComponent(url.pathname));
        return url.hostname === 'audit.local' && fs.existsSync(file) && fs.statSync(file).isFile()
          ? route.fulfill({path: file}) : /fonts\.(googleapis|gstatic)\.com/.test(url.hostname) ? route.continue() : route.abort();
      });
      while (jobs.length) {
        const {file, width} = jobs.shift();
        await page.setViewportSize({width, height: 844});
        await page.goto('https://audit.local/' + file, {waitUntil: 'domcontentloaded'});
        if (file.endsWith('blog.html')) await page.waitForURL('**/zhurnal.html');
        if (file.endsWith('keys-podmoskovie.html')) await page.waitForURL('**/keys-fid-vrachey.html');
        if (file.endsWith('keys-psm.html')) await page.waitForURL('**/keysy.html');
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(Array.from(document.images).map(img => {
            img.loading = 'eager';
            return img.decode().catch(() => {});
          }));
        });
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 2,
          headingCount: document.querySelectorAll('h1').length,
          footerCount: document.querySelectorAll('footer.footer').length,
          broken: Array.from(document.images).filter(i => i.getBoundingClientRect().width > 0 && !i.naturalWidth).map(i => i.getAttribute('src')),
          intrusiveDecoration: Array.from(document.querySelectorAll('.hero--dark .hero__sphere')).some(e => Number(getComputedStyle(e).opacity) > .2)
        }));
        const label = `${name} ${file} ${width}px`;
        assert.equal(result.overflow, false, label + ': horizontal page overflow');
        assert.equal(result.headingCount, 1, label + ': main heading');
        assert.equal(result.footerCount, 1, label + ': footer');
        assert.deepEqual(result.broken, [], label + ': missing images');
        assert.equal(result.intrusiveDecoration, false, label + ': bright decoration over text');
        checked++;
      }
      await page.close();
    }
    await Promise.all([worker(), worker(), worker()]);
    await browser.close();
    console.log(`PASS ${name}: ${files.length} pages at 320, 390, 768, 1381 and 1440px`);
  }
  console.log(`PASS ${checked} layout checks`);
})().catch(error => { console.error(error); process.exit(1); });
