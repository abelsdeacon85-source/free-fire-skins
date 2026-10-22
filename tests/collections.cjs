// Start the static site server before running. Supabase is mocked; no real
// credentials, uploads, or published submissions are used by this test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const catalog = require('../catalog.json');
const collections = require('../collections.json');
const base = (process.env.SITE_URL || 'http://127.0.0.1:8000/').replace(/\/?$/, '/');
const service = 'https://ff-collections-test.supabase.co';
const publicKey = 'sb_publishable_test_browser_only';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const ownerId = '00000000-0000-4000-8000-000000000001';
const expectedBrands = ['Money Heist', 'Justin Bieber', 'CR7', 'Street Fighter', 'Mc Laren', 'Spider-man', 'Naruto Shippuden', 'Venom', 'One Punch Man', 'Jujutsu Kaisen', 'BLUE LOCK', 'MAMA', 'Infinix', 'SAMSUNG', 'Red Bull', 'BEN 10', 'Devil May Cry 5', 'BTS', 'Lamborghini', 'Digimon', 'Choppy Cuts', "Assassin's Creed", 'Attack On Titans', 'Puma', 'Alok', 'J. Balvin', "Carla's Dream", 'Gillette', 'Pringles', 'Brazil FC', 'Corinthians', 'Shopee', 'ROG', 'JKT48', 'GINTAMA', 'SNICKERS', 'KSHMR', 'Soul Land', 'Nailoong', 'Squid Game', 'NANYANG', 'Demon Slayer', 'Ragnarok', 'HRK'];
const expectedVehicles = ['Sports Car', 'Motorbike', 'Monster Truck', 'Pickup truck', 'Jeep', 'Amphibian', 'Tuk Tuk', 'Horse'];

function backend() {
 const rows = new Map(), files = new Map(), signatures = new Map(), requests = [];
 let visitors = 0, signaturesIssued = 0;
 const state = {rows, requests, failNextReview: false};
 const userFor = token => token === 'owner-token' ? ownerId : /^visitor-token-\d+$/.test(token) ? 'visitor-' + token.split('-').pop() : null;
 const auth = (id, token, email = '') => ({access_token: token, refresh_token: 'refresh-' + token, expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: {id, email, is_anonymous: !email}});
 state.route = async route => {
  const req = route.request(), url = new URL(req.url()), method = req.method();
  const headers = req.headers(), token = (headers.authorization || '').replace(/^Bearer /, ''), uid = userFor(token), reviewer = token === 'owner-token';
  const body = () => JSON.parse(req.postData() || '{}');
  const json = (value, status = 200) => route.fulfill({status, contentType: 'application/json', body: JSON.stringify(value)});
  requests.push({path: url.pathname, query: url.search, method, uid, reviewer});
  if (!(method === 'GET' && url.pathname.startsWith('/storage/v1/object/sign/'))) assert.equal(headers.apikey, publicKey, 'Only the public publishable key is sent to the upload service.');
  if (url.pathname === '/auth/v1/signup') {
   const number = ++visitors; return json(auth('visitor-' + number, 'visitor-token-' + number));
  }
  if (url.pathname === '/auth/v1/token') {
   const value = body();
   if (value.email === 'owner@example.test' && value.password === 'test-owner-password') return json(auth(ownerId, 'owner-token', value.email));
   if (value.email === 'visitor@example.test' && value.password === 'test-visitor-password') return json(auth('visitor-99', 'visitor-token-99', value.email));
   return json({message: 'Invalid login credentials'}, 400);
  }
  if (url.pathname === '/auth/v1/logout') return json({});
  if (url.pathname === '/rest/v1/rpc/ff_is_reviewer') return json(reviewer);
  if (url.pathname === '/rest/v1/ff_submissions' && method === 'POST') {
   if (!uid) return json({message: 'Authentication required'}, 401);
   const value = body(), extension = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm'}[value.mime_type];
   const row = {...value, uploader_id: uid, status: 'uploading', storage_path: `${uid}/${value.id}/media.${extension}`, created_at: new Date().toISOString()};
   rows.set(row.id, row); return route.fulfill({status: 201, body: ''});
  }
  if (url.pathname === '/rest/v1/ff_submissions' && method === 'GET') {
   const filtered = [...rows.values()].filter(row => {
    if (row.status !== 'approved' && !reviewer && row.uploader_id !== uid) return false;
    return ['status', 'section', 'collection_id'].every(key => !url.searchParams.has(key) || url.searchParams.get(key) === 'eq.' + row[key]);
   });
   const offset = Number(url.searchParams.get('offset')) || 0, limit = Number(url.searchParams.get('limit')) || 100;
   return json(filtered.slice(offset, offset + limit));
  }
  if (url.pathname === '/rest/v1/ff_submissions' && method === 'DELETE') {
   const id = (url.searchParams.get('id') || '').replace(/^eq\./, ''), row = rows.get(id);
   if (row && row.uploader_id === uid && row.status === 'uploading') rows.delete(id);
   return route.fulfill({status: 204});
  }
  if (url.pathname === '/rest/v1/rpc/ff_finalize_submission') {
   const row = rows.get(body().submission_id);
   if (!row || row.uploader_id !== uid || !files.has(row.storage_path)) return json({message: 'Upload is incomplete'}, 400);
   row.status = 'pending'; return json(null);
  }
  if (url.pathname === '/rest/v1/rpc/ff_review_submission') {
   if (!reviewer) return json({message: 'Owner only'}, 403);
   if (state.failNextReview) { state.failNextReview = false; return json({message: 'Try again'}, 503); }
   const value = body(), row = rows.get(value.submission_id);
   if (!row || row.status !== 'pending') return json({message: 'Already reviewed'}, 409);
   row.status = value.decision; return json(null);
  }
  const signPrefix = '/storage/v1/object/sign/ff-review-media/';
  if (url.pathname.startsWith(signPrefix)) {
   const storagePath = decodeURIComponent(url.pathname.slice(signPrefix.length));
   const row = [...rows.values()].find(item => item.storage_path === storagePath);
   if (method === 'POST') {
    if (!row || !files.has(storagePath) || (row.status !== 'approved' && !reviewer && row.uploader_id !== uid)) return json({message: 'Private file'}, 403);
    const signature = 'signed-' + ++signaturesIssued; signatures.set(signature, storagePath);
    return json({signedURL: '/object/sign/ff-review-media/' + storagePath + '?token=' + signature});
   }
   // Signed media requests use the URL token, without API or auth headers.
   if (method === 'GET' && signatures.get(url.searchParams.get('token')) === storagePath && files.has(storagePath)) {
    const file = files.get(storagePath); return route.fulfill({status: 200, contentType: file.mime, body: file.buffer});
   }
   return json({message: 'Invalid signature'}, 403);
  }
  const objectPrefix = '/storage/v1/object/ff-review-media/';
  if (url.pathname.startsWith(objectPrefix) && method === 'POST') {
   const storagePath = decodeURIComponent(url.pathname.slice(objectPrefix.length)), row = [...rows.values()].find(item => item.storage_path === storagePath);
   if (!row || row.uploader_id !== uid || row.status !== 'uploading') return json({message: 'Private file'}, 403);
   files.set(storagePath, {buffer: req.postDataBuffer(), mime: headers['content-type']}); return json({Key: storagePath});
  }
  if (url.pathname === '/storage/v1/object/ff-review-media' && method === 'DELETE') {
   for (const storagePath of body().prefixes) files.delete(storagePath); return json([]);
  }
  throw Error('Unexpected mocked API request: ' + method + ' ' + url.pathname);
 };
 return state;
}

async function configure(context, state) {
 await context.route('**/uploads-config.json', route => route.fulfill({contentType: 'application/json', body: JSON.stringify({url: service, publishableKey: publicKey})}));
 await context.route(service + '/**', state.route);
}
async function ready(page, file, heading) {
 await page.goto(base + file); await page.getByRole('heading', {name: heading, exact: true}).waitFor();
 await page.evaluate(() => FFUploads.ready);
}
const card = (page, name) => page.locator('.media-card').filter({has: page.getByRole('heading', {name, exact: true})});
async function add(page, button, label, name, file) {
 await page.getByRole('button', {name: button, exact: true}).click();
 const dialog = page.getByRole('dialog'); await dialog.getByLabel(label, {exact: true}).fill(name);
 await dialog.locator('input[type=file]').setInputFiles(file); return dialog;
}
async function submit(dialog) {
 await dialog.getByRole('button', {name: 'Submit for review', exact: true}).click();
 await dialog.getByRole('status').filter({hasText: 'Submitted for review. It will appear after the owner approves it.'}).waitFor();
 await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
}

(async () => {
 assert.deepEqual(collections.collaborations.map(item => item.name), expectedBrands);
 assert.deepEqual(collections.vehicles.map(item => item.name), expectedVehicles);
 const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-collections-test-'));
 const gifPath = path.join(directory, 'emote.gif'), videoPath = path.join(directory, 'emote.mp4');
 execFileSync('python3', ['-c', 'from PIL import Image\nimport sys\nf=[Image.new("RGB",(32,32),c) for c in ("red","green")]\nf[0].save(sys.argv[1],save_all=True,append_images=f[1:],duration=[200,200],loop=0)', gifPath]);
 execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=32x32:r=10:d=0.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', videoPath]);
 const imageFile = {name: 'mask.png', mimeType: 'image/png', buffer: png};
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
 const errors = [], state = backend();
 try {
  // An empty upload configuration leaves a working browse-only site and
  // explicitly disables submission rather than pretending it was received.
  const offline = await browser.newContext();
  await offline.route('**/uploads-config.json', route => route.fulfill({contentType: 'application/json', body: '{"url":"","publishableKey":""}'}));
  const offlinePage = await offline.newPage(); offlinePage.on('pageerror', error => errors.push(error.message));
  await ready(offlinePage, 'collaboration.html?id=money-heist', 'Money Heist');
  assert.equal(await offlinePage.evaluate(() => FFUploads.configured), false);
  await offlinePage.getByRole('button', {name: 'Add item', exact: true}).click();
  assert.equal(await offlinePage.getByRole('dialog').getByRole('button', {name: 'Submit for review', exact: true}).isDisabled(), true);
  await offlinePage.getByRole('dialog').getByRole('status').filter({hasText: 'Uploads are not connected yet.'}).waitFor();
  await offlinePage.getByRole('dialog').getByRole('button', {name: 'Cancel', exact: true}).click();
  await ready(offlinePage, 'review.html', 'Review inbox');
  assert.equal(await offlinePage.getByRole('link', {name: 'View setup instructions', exact: true}).count(), 1);
  await offline.close();

  const visitor = await browser.newContext(), owner = await browser.newContext(), publicVisitor = await browser.newContext();
  for (const context of [visitor, owner, publicVisitor]) await configure(context, state);
  const page = await visitor.newPage(), ownerPage = await owner.newPage(), publicPage = await publicVisitor.newPage();
  for (const current of [page, ownerPage, publicPage]) current.on('pageerror', error => errors.push(error.message));
  await ready(page, 'collaborations.html', 'FF x collaborations');
  assert.equal(await page.locator('.collection-card').count(), expectedBrands.length);
  assert.deepEqual(await page.locator('.collection-name').allTextContents(), expectedBrands);
  assert.equal(await page.locator('.collection-art img').count(), collections.collaborations.filter(entry => entry.artwork).length, 'Every supplied logo is shown.');
  await page.locator('.collection-art img').evaluateAll(async images => {
   for (const image of images) image.loading = 'eager';
   await Promise.all(images.map(image => image.decode()));
  });
  for (const entry of collections.collaborations) {
   const card = page.locator(`.collection-card[href="collaboration.html?id=${entry.id}"]`);
   if (!entry.artwork) {
    assert.equal(await card.locator('img').count(), 0, entry.name + ' waits for its supplied logo');
    assert.equal(await card.locator('.collection-monogram').isVisible(), true, entry.name + ' has readable initials');
    continue;
   }
   assert.equal(await card.locator('img').getAttribute('src'), entry.artwork, entry.name + ' logo path');
   assert.equal(await card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0), true, entry.name + ' logo loads');
   assert.equal(await card.locator('.collection-monogram').isVisible(), false, entry.name + ' logo replaces its initials');
  }
  assert.equal(await page.locator('.collection-monogram').count(), expectedBrands.length);
  await page.getByRole('searchbox').fill('naruto'); assert.equal(await page.locator('.collection-card').count(), 1);
  await page.getByRole('searchbox').fill('');
  for (const entry of collections.collaborations) {
   await ready(page, 'collaboration.html?id=' + entry.id, entry.name);
   assert.equal(await page.getByRole('button', {name: 'Add item', exact: true}).count(), 1, entry.name + ' add button');
  }
  await ready(page, 'vehicles.html', 'Vehicle skins');
  assert.deepEqual(await page.locator('.collection-name').allTextContents(), expectedVehicles);
  for (const entry of collections.vehicles) {
   await ready(page, 'vehicle.html?id=' + entry.id, entry.name);
   assert.equal(await page.getByRole('button', {name: 'Add vehicle skin', exact: true}).count(), 1, entry.name + ' add button');
  }

  await ready(page, 'collaboration.html?id=money-heist', 'Money Heist');
  let dialog = await add(page, 'Add item', 'Product name or type', 'Money Heist mask', imageFile);
  await dialog.locator('img').waitFor(); assert.equal(await dialog.locator('[name=attributes], .attribute-row').count(), 0);
  await submit(dialog);
  assert.equal([...state.rows.values()].filter(row => row.status === 'pending').length, 1);
  assert.equal(await page.getByRole('heading', {name: 'Money Heist mask', exact: true}).count(), 0, 'Submission receipt does not publish a pending item.');
  await page.reload(); await page.getByRole('heading', {name: 'Money Heist', exact: true}).waitFor();
  assert.equal(await card(page, 'Money Heist mask').count(), 0, 'A visitor cannot publish by refreshing.');
  await ready(publicPage, 'collaboration.html?id=money-heist', 'Money Heist');
  assert.equal(await card(publicPage, 'Money Heist mask').count(), 0, 'An independent visitor never sees pending additions.');

  await ready(page, 'vehicle.html?id=sports-car', 'Sports Car');
  await submit(await add(page, 'Add vehicle skin', 'Vehicle skin name', 'Unapproved sports car', imageFile));
  assert.equal(await page.locator('.media-card').count(), 0);

  // Client validation prevents malformed media and invalid categories from
  // creating even an uploading record. Database permissions are tested by the
  // separate moderation-sql test, rather than inferred from this mock.
  const beforeInvalid = state.rows.size;
  const invalidMessages = await page.evaluate(async bytes => {
   const results = [];
   const check = async input => { try { await FFUploads.submit(input); results.push('UNEXPECTED SUCCESS'); } catch (error) { results.push(error.message); } };
   const file = new File([new Uint8Array(bytes)], 'valid.png', {type: 'image/png'});
   await check({section: 'collaborations', collectionId: 'money-heist', name: 'x', file});
   await check({section: 'vehicles', collectionId: 'invented-category', name: 'Invalid', file});
   await check({section: 'emotes', collectionId: 'all', name: 'Static emote', file});
   await check({section: 'vehicles', collectionId: 'sports-car', name: 'Forged PNG', file: new File(['not a picture'], 'fake.png', {type: 'image/png'})});
   await check({section: 'vehicles', collectionId: 'sports-car', name: 'Oversized file', file: new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'big.png', {type: 'image/png'})});
   return results;
  }, [...png]);
  assert.deepEqual(invalidMessages, ['Enter a name between 2 and 120 characters.', 'Choose a valid category before submitting.', 'Emotes must be GIF, MP4, or WebM files.', 'Choose a supported picture, GIF, MP4, or WebM file.', 'Files must be 20 MB or smaller.']);
  assert.equal(state.rows.size, beforeInvalid);
  const pendingId = [...state.rows.values()][0].id;
  assert.match(await page.evaluate(async id => { try { await FFUploads.review(id, 'approved'); return 'UNEXPECTED SUCCESS'; } catch (error) { return error.message; } }, pendingId), /Only the website owner/);
  assert.equal(state.rows.get(pendingId).status, 'pending');

  await ready(ownerPage, 'review.html', 'Review inbox');
  await ownerPage.getByLabel('Email', {exact: true}).fill('owner@example.test');
  await ownerPage.getByLabel('Password', {exact: true}).fill('incorrect');
  await ownerPage.getByRole('button', {name: 'Sign in', exact: true}).click();
  await ownerPage.locator('.review-panel .form-status').filter({hasText: 'Sign-in failed.'}).waitFor();
  assert.equal(await ownerPage.locator('.media-card').count(), 0);
  await ownerPage.getByLabel('Email', {exact: true}).fill('visitor@example.test');
  await ownerPage.getByLabel('Password', {exact: true}).fill('test-visitor-password');
  await ownerPage.getByRole('button', {name: 'Sign in', exact: true}).click();
  await ownerPage.locator('.review-panel .form-status').filter({hasText: 'Only the website owner can review submissions.'}).waitFor();
  assert.equal(await ownerPage.locator('.media-card').count(), 0);
  await ownerPage.getByLabel('Email', {exact: true}).fill('owner@example.test');
  await ownerPage.getByLabel('Password', {exact: true}).fill('test-owner-password');
  await ownerPage.getByRole('button', {name: 'Sign in', exact: true}).click();
  await card(ownerPage, 'Money Heist mask').waitFor();
  assert.equal(await ownerPage.locator('.media-card').count(), 2);
  assert.equal(await card(ownerPage, 'Money Heist mask').locator('img').evaluate(image => image.complete && image.naturalWidth > 0), true, 'The owner can inspect the private picture before deciding.');
  state.failNextReview = true;
  await card(ownerPage, 'Money Heist mask').getByRole('button', {name: 'Approve and publish', exact: true}).click();
  await ownerPage.locator('.review-panel .form-status').filter({hasText: 'This submission could not be reviewed.'}).waitFor();
  assert.equal(state.rows.get(pendingId).status, 'pending', 'A failed approval must not claim publication.');
  assert.equal(await card(ownerPage, 'Money Heist mask').getByRole('button', {name: 'Approve and publish', exact: true}).isEnabled(), true, 'Approval can be retried after a service error.');
  await card(ownerPage, 'Money Heist mask').getByRole('button', {name: 'Approve and publish', exact: true}).click();
  await ownerPage.locator('.review-panel .form-status').filter({hasText: 'Approved and published.'}).waitFor();
  assert.equal(state.rows.get(pendingId).status, 'approved');
  assert.equal(await card(ownerPage, 'Money Heist mask').count(), 0);
  await card(ownerPage, 'Unapproved sports car').getByRole('button', {name: 'Reject', exact: true}).click();
  await ownerPage.getByRole('heading', {name: 'All caught up.', exact: true}).waitFor();
  assert.equal([...state.rows.values()].find(row => row.name === 'Unapproved sports car').status, 'rejected');
  await publicPage.reload(); await card(publicPage, 'Money Heist mask').waitFor();
  assert.equal(await card(publicPage, 'Money Heist mask').locator('img').evaluate(image => image.complete && image.naturalWidth > 0), true);
  assert.equal(await publicPage.locator('.media-card').count(), 1);
  await ready(publicPage, 'vehicle.html?id=sports-car', 'Sports Car');
  assert.equal(await publicPage.locator('.media-card').count(), 0, 'Rejected vehicle skins remain private.');

  await ready(page, 'emotes.html', 'Emotes');
  await page.getByRole('button', {name: 'Add emote', exact: true}).click();
  dialog = page.getByRole('dialog'); await dialog.getByLabel('Emote name', {exact: true}).fill('Test wave');
  await dialog.locator('input[type=file]').setInputFiles({name: 'static.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([255, 216, 255, 217])});
  await dialog.getByRole('status').filter({hasText: 'Emotes must be GIF, MP4, or WebM files.'}).waitFor();
  assert.equal(await dialog.locator('input[type=file]').evaluate(input => input.files.length), 0);
  await dialog.locator('input[type=file]').setInputFiles(gifPath);
  await dialog.locator('.emote-player-toggle:not(:disabled)').waitFor();
  assert.equal(await dialog.locator('.emote-player img').count(), 0, 'A GIF preview is still until the play button is pressed.');
  assert.equal(await dialog.locator('.emote-player-toggle').count(), 1);
  await submit(dialog);
  dialog = await add(page, 'Add emote', 'Emote name', 'Test video emote', videoPath);
  await dialog.locator('.emote-player-toggle:not(:disabled)').waitFor();
  assert.equal(await dialog.locator('video').evaluate(video => !video.controls && video.paused && video.currentTime === 0), true);
  assert.equal(await dialog.locator('input[type=range], progress').count(), 0);
  await submit(dialog);
  assert.equal(await page.locator('.media-card').count(), 0);
  await ownerPage.reload(); await card(ownerPage, 'Test wave').waitFor();
  assert.equal(await card(ownerPage, 'Test video emote').locator('video').evaluate(video => !video.controls && !video.autoplay && !video.loop), true);
  for (const name of ['Test wave', 'Test video emote']) await card(ownerPage, name).getByRole('button', {name: 'Approve and publish', exact: true}).click();
  await ready(publicPage, 'emotes.html', 'Emotes');
  await card(publicPage, 'Test wave').locator('.emote-player-toggle:not(:disabled)').waitFor();
  await card(publicPage, 'Test video emote').locator('.emote-player-toggle:not(:disabled)').waitFor();
  assert.equal(await publicPage.locator('.media-card').count(), 2);
  assert.equal(await publicPage.locator('video[controls], input[type=range], progress').count(), 0);
  assert.equal(await publicPage.locator('.emote-player-toggle').count(), 2);

  const gun = catalog.guns.find(item => item.id === 'm4a1');
  await ready(page, 'm4a1.html', 'M4A1 skins');
  await submit(await add(page, 'Submit a gun skin', 'Skin name', 'Community M4A1 fixture', imageFile));
  await ready(publicPage, 'm4a1.html', 'M4A1 skins');
  assert.equal(await publicPage.getByRole('heading', {name: 'Community M4A1 fixture', exact: true}).count(), 0);
  assert.equal(await publicPage.locator('.skin-card').count(), gun.skins.length);
  await ownerPage.reload(); await card(ownerPage, 'Community M4A1 fixture').waitFor();
  await card(ownerPage, 'Community M4A1 fixture').getByRole('button', {name: 'Approve and publish', exact: true}).click();
  await publicPage.reload(); await publicPage.getByRole('heading', {name: 'Community M4A1 fixture', exact: true}).waitFor();
  assert.equal(await publicPage.locator('.skin-card').count(), gun.skins.length + 1);
  const gunCard = publicPage.locator('.skin-card').filter({hasText: 'Community M4A1 fixture'});
  assert.equal(await gunCard.locator('.attribute').count(), 0);
  assert.equal(await gunCard.locator('.badge').textContent(), 'Rarity not checked');

  // The sidebar is operable on a narrow screen and follows Arabic direction.
  // Read translations from the dictionaries so tests also cover dynamic nodes.
  const mobile = await browser.newContext({viewport: {width: 320, height: 740}}); await configure(mobile, state);
  const mobilePage = await mobile.newPage(); mobilePage.on('pageerror', error => errors.push(error.message));
  await ready(mobilePage, 'collaborations.html', 'FF x collaborations');
  for (const locale of ['en', 'ar', 'hi', 'es']) {
   const dictionary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'locales', locale + '.json'), 'utf8'));
   const translated = key => dictionary[key] || key;
   for (const key of ['FF x collaborations', 'Emotes', 'Add emote', 'Emote name', 'Submit for review', 'Browse', 'Sports Car']) assert.ok(Object.hasOwn(dictionary, key), locale + ': translation missing for ' + key);
   await mobilePage.locator('#language-select').selectOption(locale);
   await mobilePage.waitForFunction(code => document.documentElement.lang === code, locale);
   await mobilePage.getByRole('heading', {name: translated('FF x collaborations'), exact: true}).waitFor();
   assert.equal(await mobilePage.locator('html').getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
   assert.equal(await mobilePage.locator('.site-sidebar').evaluate(aside => aside.inert), true);
   await mobilePage.locator('.sidebar-toggle').click();
   assert.equal(await mobilePage.locator('.sidebar-toggle').getAttribute('aria-expanded'), 'true');
   assert.equal(await mobilePage.locator('.site-sidebar').evaluate(aside => aside.inert), false);
   assert.equal(await mobilePage.locator('header').evaluate(header => header.inert), true);
   assert.equal(await mobilePage.locator('.page-content').evaluate(content => content.inert), true);
   await mobilePage.waitForFunction(() => document.activeElement === document.querySelector('.sidebar-close'));
   assert.equal(await mobilePage.locator('.sidebar-close').evaluate(button => document.activeElement === button), true);
   assert.equal(await mobilePage.locator('.sidebar-link[href="emotes.html"]').textContent(), translated('Emotes'));
   await mobilePage.keyboard.press('Shift+Tab');
   assert.equal(await mobilePage.locator('.sidebar-link').last().evaluate(link => document.activeElement === link), true);
   await mobilePage.keyboard.press('Tab');
   assert.equal(await mobilePage.locator('.sidebar-close').evaluate(button => document.activeElement === button), true);
   await mobilePage.keyboard.press('Escape');
   assert.equal(await mobilePage.locator('.sidebar-toggle').evaluate(button => document.activeElement === button), true);
   assert.equal(await mobilePage.locator('.site-sidebar').evaluate(aside => aside.inert), true);
   assert.equal(await mobilePage.locator('header').evaluate(header => header.inert), false);
   assert.equal(await mobilePage.locator('.page-content').evaluate(content => content.inert), false);
   assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, locale + ': no horizontal overflow at 320px');
   assert.deepEqual(await mobilePage.locator('.collection-name').allTextContents(), expectedBrands, 'Brand names retain their canonical spelling in every language.');
   await ready(mobilePage, 'emotes.html', translated('Emotes'));
   await mobilePage.getByRole('button', {name: translated('Add emote'), exact: true}).click();
   const translatedDialog = mobilePage.getByRole('dialog');
   await translatedDialog.getByLabel(translated('Emote name'), {exact: true}).waitFor();
   assert.equal(await translatedDialog.getByRole('button', {name: translated('Submit for review'), exact: true}).count(), 1);
   assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, locale + ': translated form fits at 320px');
   await translatedDialog.getByRole('button', {name: translated('Cancel'), exact: true}).click();
   await ready(mobilePage, 'vehicles.html', translated('Vehicle skins'));
   assert.deepEqual(await mobilePage.locator('.collection-name').allTextContents(), expectedVehicles.map(translated));
   await ready(mobilePage, 'collaborations.html', translated('FF x collaborations'));
  }
  await mobile.close();
  await ownerPage.getByRole('button', {name: 'Sign out', exact: true}).click();
  await ownerPage.getByRole('heading', {name: 'Owner sign-in', exact: true}).waitFor();
  assert.equal(await ownerPage.locator('.media-card').count(), 0);
  assert.ok(state.requests.some(req => req.path === '/rest/v1/ff_submissions' && req.method === 'GET' && req.query.includes('status=eq.approved') && !req.uid), 'Approved additions are loaded by visitors with no owner session.');
  assert.deepEqual(errors, []);
  console.log('PASS: 44 collaboration brands, eight vehicle categories, all Add buttons, safe disconnected setup, private visitor submissions, owner-only preview/approval/rejection, retry after approval error, published cross-context galleries, GIF/video emote submission, invalid media/size/category rejection, moderated gun skins, mobile keyboard sidebar and four languages.');
 } finally { await browser.close(); fs.rmSync(directory, {recursive: true, force: true}); }
})().catch(error => {console.error(error); process.exitCode = 1;});
