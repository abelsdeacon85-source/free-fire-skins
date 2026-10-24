// Requires Playwright and Chromium. Start the Python server before running.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const catalog = require('../catalog.json');
const base = (process.env.SITE_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const languageKey = 'ff-skin-vault-language';
const catalogKey = 'ff-skin-vault-catalog-v1';
const locales = ['en', 'ar', 'hi', 'es', 'pt'];
const dictionaries = Object.fromEntries(locales.map(locale => [locale, JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'locales', locale + '.json'), 'utf8'))]));
const t = (locale, key, values = {}) => (dictionaries[locale][key] || key).replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
const m4a1 = catalog.guns.find(gun => gun.id === 'm4a1');
const category = catalog.categories.find(item => item.id === m4a1.category);
const emptyGun = catalog.guns.find(gun => !gun.skins.length);
const totalSkins = catalog.guns.reduce((count, gun) => count + gun.skins.length, 0);

function checkDictionaries() {
 const keys = Object.keys(dictionaries.en).sort();
 assert(keys.length > 150, 'The dictionaries must cover the full site.');
 for (const locale of locales) {
  const dictionary = dictionaries[locale];
  assert.deepEqual(Object.keys(dictionary).sort(), keys, locale + ' dictionary keys');
  for (const key of keys) {
   assert.equal(typeof dictionary[key], 'string', locale + ': ' + key);
   assert(dictionary[key].trim(), locale + ': empty translation for ' + key);
   assert.deepEqual((dictionary[key].match(/\{\w+\}/g) || []).sort(), (key.match(/\{\w+\}/g) || []).sort(), locale + ': placeholders for ' + key);
   if (locale === 'en') assert.equal(dictionary[key], key, 'English must preserve the existing UI.');
  }
  if (locale !== 'en') {
   for (const key of ['Explore', 'Manage catalog', 'Damage', 'Search skins', 'No matching skins', 'Precision, power, and versatility.']) {
    assert.notEqual(dictionary[key], key, locale + ': untranslated ' + key);
   }
  }
  for (const type of new Set(catalog.guns.flatMap(gun => gun.skins.flatMap(skin => skin.attributes.map(attribute => attribute.type))))) {
   assert(Object.hasOwn(dictionary, type), locale + ': missing catalog attribute ' + type);
  }
 }
}

async function checkSelector(page, locale) {
 const select = page.locator('#language-select');
 await select.waitFor();
 assert.equal(await select.inputValue(), locale);
 const options = await select.locator('option').evaluateAll(nodes => nodes.map(node => ({ value: node.value, label: node.textContent })));
 assert.deepEqual(options.map(option => option.value), locales);
 for (const [index, [flag, script]] of [['🇬🇧', /English/], ['🇸🇦', /[\u0600-\u06ff]/], ['🇮🇳', /[\u0900-\u097f]/], ['🇪🇸', /Español/], ['🇵🇹', /Português/]].entries()) {
  assert(options[index].label.includes(flag), 'Missing flag for ' + locales[index]);
  assert.match(options[index].label, script, 'Native language label for ' + locales[index]);
 }
 assert.equal(await select.getAttribute('aria-label'), t(locale, 'Language'));
 assert.equal(await page.locator('html').getAttribute('lang'), locale);
 assert.equal(await page.locator('html').getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
}

async function switchLanguage(page, locale) {
 await page.locator('#language-select').selectOption(locale);
 await page.waitForFunction(expected => document.documentElement.lang === expected, locale);
 await page.getByRole('link', { name: t(locale, 'Manage catalog'), exact: true }).first().waitFor();
 await checkSelector(page, locale);
}

async function checkChrome(page, locale) {
 await checkSelector(page, locale);
 const nav = page.locator('header nav');
 assert.equal(await nav.getAttribute('aria-label'), t(locale, 'Main'));
 assert.equal(await nav.locator('a[href="index.html"]').textContent(), t(locale, 'Explore'));
 assert.equal(await nav.locator('a[href="editor.html"]').textContent(), t(locale, 'Manage catalog'));
 assert.equal(await page.locator('.skip-link').textContent(), t(locale, 'Skip to content'));
 assert.deepEqual(await page.locator('footer p').allTextContents(), [
  t(locale, 'Free Fire Skin Vault · Community fan project'),
  t(locale, 'Not affiliated with Garena. Skin availability and stats may change. Check details in game.')
 ]);
}

async function waitHeading(page, text) {
 await page.getByRole('heading', { name: text, exact: true }).waitFor();
}

async function checkCount(page, locale, count, total) {
 await page.getByText(t(locale, 'Showing {count} of {total} skins', { count, total }), { exact: true }).waitFor();
 assert.equal(await page.locator('.skin-card').count(), count);
}

(async () => {
 checkDictionaries();
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
 const errors = [];
 const contexts = [];
 async function newPage() {
  const context = await browser.newContext({ acceptDownloads: true });
  contexts.push(context);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page };
 }
 try {
  const { page } = await newPage();
  for (const locale of locales) {
   await page.goto(base);
   await page.locator('.category').first().waitFor();
   await switchLanguage(page, locale);
   await waitHeading(page, t(locale, 'Find your next\nfavorite skin.'));
   await checkChrome(page, locale);
   assert.equal(await page.evaluate(key => localStorage.getItem(key), languageKey), locale);
   assert.deepEqual(await page.locator('.stats strong').allTextContents(), [String(catalog.guns.length), String(totalSkins)]);
   await page.getByText(t(locale, '{count} categories', { count: catalog.categories.length }), { exact: true }).waitFor();
   for (const item of catalog.categories) {
    const card = page.locator('.category[href="' + item.id + '.html"]');
    assert.equal(await card.locator('h3').textContent(), t(locale, item.name));
    const guns = catalog.guns.filter(gun => gun.category === item.id);
    assert.deepEqual(await card.locator('p').allTextContents(), [t(locale, item.description), t(locale, '{guns} guns · {skins} skin entries', { guns: guns.length, skins: guns.reduce((count, gun) => count + gun.skins.length, 0) })]);
   }
   await page.reload();
   await waitHeading(page, t(locale, 'Find your next\nfavorite skin.'));
   await checkChrome(page, locale);
   await page.locator('.category[href="' + category.id + '.html"]').click();
   await waitHeading(page, t(locale, category.name));
   await checkChrome(page, locale);
   const categoryGuns = catalog.guns.filter(gun => gun.category === category.id);
   assert.deepEqual(await page.locator('.gun-card h3').allTextContents(), categoryGuns.map(gun => gun.name));
   const gunSearch = page.getByLabel(t(locale, 'Search guns'), { exact: true });
   assert.equal(await gunSearch.getAttribute('placeholder'), t(locale, 'Try M4A1…'));
   await gunSearch.fill('no-localized-gun-exists');
   await waitHeading(page, t(locale, 'No guns found'));
   await page.getByText(t(locale, 'Try a different search.'), { exact: true }).waitFor();
   await gunSearch.fill('M4A1');
   assert.equal(await page.locator('.gun-card').count(), 1);
   await page.locator('.gun-card').click();
   await waitHeading(page, t(locale, '{gun} skins', { gun: m4a1.name }));
   await checkChrome(page, locale);
   await checkCount(page, locale, m4a1.skins.length, m4a1.skins.length);
   assert.deepEqual(await page.locator('.skin-card .skin-name').allTextContents(), m4a1.skins.map(skin => skin.name));
   for (const skin of m4a1.skins) {
    const card = page.locator('.skin-card').filter({ has: page.getByRole('heading', { name: skin.name, exact: true }) });
    assert.deepEqual(await card.locator('.attribute > span').allTextContents(), skin.attributes.map(attribute => t(locale, attribute.type)));
   }
   assert.equal(await page.locator('#rarity-filter option[value="rare"]').textContent(), t(locale, 'Rare'));
   assert.equal(await page.locator('#sort-filter option[value="rare-to-common"]').textContent(), t(locale, 'Rarity: high to low'));
   const skinSearch = page.getByLabel(t(locale, 'Search skins'), { exact: true });
   assert.equal(await skinSearch.getAttribute('placeholder'), t(locale, 'Search by skin name…'));
   await page.locator('#rarity-filter').selectOption('rare');
   await checkCount(page, locale, m4a1.skins.filter(skin => skin.rarity === 'rare').length, m4a1.skins.length);
   await skinSearch.fill('no-localized-skin-exists');
   await waitHeading(page, t(locale, 'No matching skins'));
   await page.getByText(t(locale, 'Try another name or rarity.'), { exact: true }).waitFor();
   await checkCount(page, locale, 0, m4a1.skins.length);
   await page.goto(base + emptyGun.id + '.html');
   await waitHeading(page, t(locale, 'This collection is waiting for you.'));
   await page.getByText(t(locale, 'No skins have been entered for this gun yet.'), { exact: true }).waitFor();
   await page.getByRole('link', { name: t(locale, 'Add the first skin'), exact: true }).waitFor();
   await checkCount(page, locale, 0, 0);
  }

  // Changing locale preserves filter selections, query text, and the document.
  await page.goto(base + 'm4a1.html');
  await switchLanguage(page, 'es');
  await page.locator('#rarity-filter').selectOption('rare');
  await page.locator('#sort-filter').selectOption('name');
  const rareSkin = m4a1.skins.find(skin => skin.rarity === 'rare');
  await page.getByLabel(t('es', 'Search skins'), { exact: true }).fill(rareSkin.name);
  await page.evaluate(() => { window.languageTestDocument = 'preserved'; });
  const searchHandle = await page.getByLabel(t('es', 'Search skins'), { exact: true }).elementHandle();
  await switchLanguage(page, 'ar');
  assert.equal(await page.evaluate(() => window.languageTestDocument), 'preserved');
  assert(await searchHandle.evaluate(node => node.isConnected));
  assert.equal(await page.getByLabel(t('ar', 'Search skins'), { exact: true }).inputValue(), rareSkin.name);
  assert.equal(await page.locator('#rarity-filter').inputValue(), 'rare');
  assert.equal(await page.locator('#sort-filter').inputValue(), 'name');
  await checkCount(page, 'ar', m4a1.skins.filter(skin => skin.rarity === 'rare' && skin.name.toLowerCase().includes(rareSkin.name.toLowerCase())).length, m4a1.skins.length);
  await switchLanguage(page, 'pt');
  assert(await searchHandle.evaluate(node => node.isConnected));
  assert.equal(await page.getByLabel(t('pt', 'Search skins'), {exact: true}).inputValue(), rareSkin.name);
  assert.equal(await page.locator('#rarity-filter').inputValue(), 'rare');
  assert.equal(await page.locator('#sort-filter').inputValue(), 'name');
  await checkCount(page, 'pt', m4a1.skins.filter(skin => skin.rarity === 'rare' && skin.name.toLowerCase().includes(rareSkin.name.toLowerCase())).length, m4a1.skins.length);

  for (const width of [320, 390]) {
   await page.setViewportSize({ width, height: 844 });
   for (const locale of ['ar', 'pt']) {
    await switchLanguage(page, locale);
    for (const route of ['index.html', category.id + '.html', 'm4a1.html', 'editor.html?gun=m4a1']) {
     await page.goto(base + route);
     await page.locator('main h1').waitFor();
     await checkChrome(page, locale);
     assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, locale + ' layout overflow at ' + width + 'px on ' + route);
     assert.equal(await page.locator('.category h3').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth + 1)), true, locale + ' category names fit their cards at ' + width + 'px');
    }
   }
  }

  // This context owns the test draft; the browsing and failure cases remain isolated.
  const { page: editor } = await newPage();
  await editor.goto(base + 'editor.html?gun=m4a1');
  await editor.getByLabel('Skin name', { exact: true }).waitFor();
  await switchLanguage(editor, 'ar');
  const fixtureName = 'Localization Damage +2 fixture';
  const fixtureImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  await editor.getByLabel(t('ar', 'Skin name'), { exact: true }).fill(fixtureName);
  await editor.getByLabel(t('ar', 'Rarity'), { exact: true }).selectOption('epic');
  await editor.getByLabel(t('ar', 'Image URL or relative path'), { exact: true }).fill(fixtureImage);
  await editor.getByLabel(t('ar', 'Source link (optional)'), { exact: true }).fill('https://example.com/localization-fixture');
  await editor.getByLabel(t('ar', 'I checked this skin and its attributes against the source'), { exact: true }).check();
  await editor.getByRole('button', { name: t('ar', '+ Add attribute'), exact: true }).click();
  await editor.getByLabel(t('ar', 'Attribute'), { exact: true }).selectOption('Damage');
  await editor.getByLabel(t('ar', 'Change'), { exact: true }).selectOption('2');
  await editor.getByLabel(t('ar', 'Video timestamp (optional)'), { exact: true }).fill('1:24');
  const nameHandle = await editor.getByLabel(t('ar', 'Skin name'), { exact: true }).elementHandle();
  await editor.evaluate(() => { window.languageTestDocument = 'preserved'; });
  await switchLanguage(editor, 'hi');
  assert.equal(await editor.evaluate(() => window.languageTestDocument), 'preserved');
  assert(await nameHandle.evaluate(node => node.isConnected));
  assert.equal(await editor.getByLabel(t('hi', 'Skin name'), { exact: true }).inputValue(), fixtureName);
  assert.equal(await editor.getByLabel(t('hi', 'Gun'), { exact: true }).inputValue(), 'm4a1');
  assert.equal(await editor.getByLabel(t('hi', 'Rarity'), { exact: true }).inputValue(), 'epic');
  assert.equal(await editor.getByLabel(t('hi', 'Image URL or relative path'), { exact: true }).inputValue(), fixtureImage);
  assert.equal(await editor.getByLabel(t('hi', 'Source link (optional)'), { exact: true }).inputValue(), 'https://example.com/localization-fixture');
  assert(await editor.getByLabel(t('hi', 'I checked this skin and its attributes against the source'), { exact: true }).isChecked());
  assert.equal(await editor.getByLabel(t('hi', 'Video timestamp (optional)'), { exact: true }).inputValue(), '1:24');
  assert.equal(await editor.getByLabel(t('hi', 'Attribute'), { exact: true }).inputValue(), 'Damage');
  assert.equal(await editor.getByLabel(t('hi', 'Attribute'), { exact: true }).locator('option[value="Damage"]').textContent(), t('hi', 'Damage'));
  assert.equal(await editor.getByLabel(t('hi', 'Change'), { exact: true }).inputValue(), '2');
  await switchLanguage(editor, 'pt');
  assert(await nameHandle.evaluate(node => node.isConnected));
  assert.equal(await editor.getByLabel(t('pt', 'Skin name'), {exact: true}).inputValue(), fixtureName);
  assert.equal(await editor.getByLabel(t('pt', 'Rarity'), {exact: true}).inputValue(), 'epic');
  assert.equal(await editor.getByLabel(t('pt', 'Image URL or relative path'), {exact: true}).inputValue(), fixtureImage);
  assert.equal(await editor.getByLabel(t('pt', 'Video timestamp (optional)'), {exact: true}).inputValue(), '1:24');
  assert.equal(await editor.getByLabel(t('pt', 'Attribute'), {exact: true}).inputValue(), 'Damage');
  assert.equal(await editor.getByLabel(t('pt', 'Change'), {exact: true}).inputValue(), '2');
  await editor.getByRole('button', {name: t('pt', 'Save skin'), exact: true}).click();
  await editor.getByText(t('pt', 'Add a YouTube link before entering a timestamp.'), {exact: true}).waitFor();
  await switchLanguage(editor, 'hi');
  await editor.getByRole('button', { name: t('hi', 'Save skin'), exact: true }).click();
  await editor.getByText(t('hi', 'Add a YouTube link before entering a timestamp.'), { exact: true }).waitFor();
  await editor.getByLabel(t('hi', 'Video timestamp (optional)'), { exact: true }).fill('');
  await editor.getByRole('button', { name: t('hi', 'Save skin'), exact: true }).click();
  await editor.locator('.edit-item').filter({ hasText: fixtureName }).waitFor();
  await editor.getByText(t('hi', 'Saved in this browser. Export a backup when you finish.'), { exact: true }).waitFor();
  const stored = await editor.evaluate(key => JSON.parse(localStorage.getItem(key)), catalogKey);
  const savedSkin = stored.guns.find(gun => gun.id === 'm4a1').skins.find(skin => skin.name === fixtureName);
  assert(savedSkin);
  assert.equal(savedSkin.rarity, 'epic');
  assert.deepEqual(savedSkin.attributes, [{ type: 'Damage', value: 2 }]);
  assert.deepEqual(stored.categories, catalog.categories, 'Category IDs, names, and descriptions must remain canonical.');
  assert.deepEqual(stored.guns.map(gun => [gun.id, gun.name, gun.category]), catalog.guns.map(gun => [gun.id, gun.name, gun.category]));
  assert.deepEqual(stored.guns.find(gun => gun.id === 'm4a1').skins.filter(skin => skin.name !== fixtureName), m4a1.skins, 'Published skin names and attributes must remain unchanged.');
  const downloadPromise = editor.waitForEvent('download');
  await editor.getByRole('button', { name: t('hi', 'Export catalog'), exact: true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'catalog.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(await download.path(), 'utf8')), stored);
  await editor.goto(base + 'm4a1.html');
  await waitHeading(editor, fixtureName);
  const savedCard = editor.locator('.skin-card').filter({ has: editor.getByRole('heading', { name: fixtureName, exact: true }) });
  assert.equal(await savedCard.locator('.attribute > span').textContent(), t('hi', 'Damage'));
  assert.equal(await savedCard.locator('.plus').textContent(), '++');

  const { page: invalid } = await newPage();
  await invalid.context().addInitScript(key => localStorage.setItem(key, 'unsupported-locale'), languageKey);
  await invalid.goto(base);
  await waitHeading(invalid, t('en', 'Find your next\nfavorite skin.'));
  await checkChrome(invalid, 'en');
  await switchLanguage(invalid, 'es');

  const { page: unavailable } = await newPage();
  await unavailable.context().addInitScript(() => {
   for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, { configurable: true, value() { throw new DOMException('Storage disabled for regression test', 'SecurityError'); } });
  });
  await unavailable.goto(base + 'm4a1.html');
  await waitHeading(unavailable, 'M4A1 skins');
  await checkChrome(unavailable, 'en');
  await unavailable.getByLabel('Search skins', { exact: true }).fill('no-localized-skin-exists');
  await waitHeading(unavailable, 'No matching skins');

  const { page: failed } = await newPage();
  await failed.goto(base + 'm4a1.html');
  await failed.locator('.skin-card').first().waitFor();
  await switchLanguage(failed, 'es');
  await failed.getByLabel(t('es', 'Search skins'), { exact: true }).fill(rareSkin.name);
  await failed.locator('#rarity-filter').selectOption('rare');
  await failed.route(/\/locales\/hi\.json(?:\?.*)?$/, route => route.abort('failed'));
  await failed.locator('#language-select').selectOption('hi');
  await failed.getByText(t('es', 'Unable to change language. Please try again.'), { exact: true }).waitFor();
  await checkChrome(failed, 'es');
  assert.equal(await failed.evaluate(key => localStorage.getItem(key), languageKey), 'es');
  assert.equal(await failed.getByLabel(t('es', 'Search skins'), { exact: true }).inputValue(), rareSkin.name);
  assert.equal(await failed.locator('#rarity-filter').inputValue(), 'rare');
  await switchLanguage(failed, 'ar');
  await waitHeading(failed, t('ar', '{gun} skins', { gun: 'M4A1' }));

  // A superseded initial request must not keep the catalog waiting.
  const { page: delayed } = await newPage();
  await delayed.context().addInitScript(key => localStorage.setItem(key, 'ar'), languageKey);
  let releaseArabic;
  const heldArabic = new Promise(resolve => { releaseArabic = resolve; });
  await delayed.route(/\/locales\/ar\.json(?:\?.*)?$/, async route => { await heldArabic; await route.continue(); });
  await delayed.goto(base);
  try {
   await switchLanguage(delayed, 'en');
   await waitHeading(delayed, t('en', 'Find your next\nfavorite skin.'));
   const response = delayed.waitForResponse(/\/locales\/ar\.json/);
   releaseArabic();
   await (await response).finished();
   await checkChrome(delayed, 'en');
  } finally { releaseArabic(); }

  const { page: catalogFailure } = await newPage();
  await catalogFailure.context().addInitScript(key => localStorage.setItem(key, 'ar'), languageKey);
  await catalogFailure.route(/\/catalog\.json(?:\?.*)?$/, route => route.abort('failed'));
  await catalogFailure.goto(base);
  await waitHeading(catalogFailure, t('ar', 'Unable to load the catalog'));
  await catalogFailure.getByText(t('ar', '{error} Serve this site through an HTTP server, rather than opening the HTML file directly.', {error: t('ar', 'Unexpected error. Please try again.')}), {exact: true}).waitFor();
  assert.deepEqual(errors, [], 'No uncaught browser errors, including storage and locale request failures.');
  console.log('PASS: complete locale dictionaries, all five flag selectors, translated navigation/categories/counts/attributes/search/empty states, persistence, in-place form and filter preservation, canonical editor storage/export, Arabic RTL and mobile layout, and storage/network fallback.');
 } finally {
  await Promise.all(contexts.map(context => context.close()));
  await browser.close();
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
