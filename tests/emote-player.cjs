const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');

(async () => {
 const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-emote-test-'));
 // Three clear first/second/third frames; the file loops forever so the player
 // must enforce one complete pass itself rather than relying on GIF metadata.
 execFileSync('python3', ['-c', 'from PIL import Image\nimport sys\nf=[Image.new("RGB",(96,96),c) for c in ("red","lime","blue")]\nf[0].save(sys.argv[1],save_all=True,append_images=f[1:],duration=[400,400,400],loop=0)', path.join(directory, 'fixture.gif')]);
 execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=96x96:r=10:d=1.2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1.2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(directory, 'fixture.mp4')]);
 const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'quiet', '-show_streams', '-of', 'json', path.join(directory, 'fixture.mp4')], {encoding: 'utf8'}));
 assert.ok(probe.streams.some(stream => stream.codec_type === 'audio'), 'The sound fixture must have a real audio stream.');
 const moduleSource = fs.readFileSync(path.join(__dirname, '..', 'media-player.js'));
 const server = http.createServer((request, response) => {
  if (request.url === '/media-player.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(moduleSource); return; }
  if (request.url === '/fixture.gif' || request.url === '/fixture.mp4') {
   response.setHeader('Content-Type', request.url.endsWith('.gif') ? 'image/gif' : 'video/mp4');
   response.end(fs.readFileSync(path.join(directory, request.url.slice(1)))); return;
  }
  if (request.url === '/missing.gif') { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', 'text/html');
  response.end('<!doctype html><html><body><style>.emote-player{width:96px;display:inline-block;vertical-align:top;margin:12px}.emote-player canvas,.emote-player img,.emote-player video{width:96px;height:96px;object-fit:contain}[hidden]{display:none!important}</style><div id="players"></div><script src="/media-player.js"></script></body></html>');
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
 try {
  const page = await browser.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => {
   window.liveURLs = new Set();
   const createURL = URL.createObjectURL.bind(URL), revokeURL = URL.revokeObjectURL.bind(URL);
   URL.createObjectURL = blob => {const url = createURL(blob); liveURLs.add(url); return url;};
   URL.revokeObjectURL = url => {liveURLs.delete(url); revokeURL(url);};
   window.gif = FFMediaPlayer.create({src: 'fixture.gif', kind: 'gif', name: 'GIF fixture'});
   window.video = FFMediaPlayer.create({src: 'fixture.mp4', kind: 'video', name: 'Video fixture'});
   document.querySelector('#players').append(gif.element, video.element);
  });
  const gif = page.locator('.emote-player').nth(0), video = page.locator('.emote-player').nth(1);
  await page.waitForFunction(() => [...document.querySelectorAll('.emote-player-toggle')].every(button => !button.disabled));
  assert.equal(await gif.locator('img').count(), 0, 'Idle GIF has no animated image element.');
  const pixel = () => page.evaluate(() => [...gif.element.querySelector('canvas').getContext('2d').getImageData(1, 1, 1, 1).data]);
  assert.deepEqual(await pixel(), [255, 0, 0, 255]);
  await page.waitForTimeout(1400);
  assert.deepEqual(await pixel(), [255, 0, 0, 255], 'Idle GIF stays on its first frame longer than a full cycle.');
  assert.equal(await video.locator('video').evaluate(media => media.paused && media.currentTime === 0 && !media.muted), true);
  assert.equal(await video.locator('video').evaluate(media => !media.controls && !media.autoplay && !media.loop && media.disablePictureInPicture && media.disableRemotePlayback), true);
  assert.equal(await video.locator('video').getAttribute('controlslist'), 'nodownload noplaybackrate noremoteplayback');
  assert.equal(await video.locator('input, progress, audio').count(), 0, 'There is no seek, rate, or volume UI.');
  assert.equal(await video.locator('video').evaluate(media => getComputedStyle(media).pointerEvents), 'none');
  assert.equal(await video.locator('video').evaluate(media => !media.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true}))), true);

  await gif.getByRole('button', {name: 'Play emote', exact: true}).click();
  await page.waitForFunction(() => gif.element.querySelector('canvas').hidden);
  const firstURL = await gif.locator('img').getAttribute('src');
  assert.ok(firstURL.startsWith('blob:'));
  await page.waitForTimeout(450);
  const frame = await gif.locator('img').screenshot();
  const color = JSON.parse(execFileSync('python3', ['-c', 'from PIL import Image\nimport io,sys,json\nprint(json.dumps(Image.open(io.BytesIO(sys.stdin.buffer.read())).convert("RGB").getpixel((1,1))))'], {input: frame, encoding: 'utf8'}));
  assert.ok(color[1] > 200 && color[0] < 20 && color[2] < 20, `Explicit GIF play advances to the green second frame, got ${color}`);
  await gif.getByRole('button', {name: 'Stop and reset emote', exact: true}).click();
  assert.equal(await gif.locator('img').count(), 0); assert.deepEqual(await pixel(), [255, 0, 0, 255]);
  await gif.getByRole('button', {name: 'Play emote', exact: true}).click();
  await page.waitForFunction(() => gif.element.querySelector('canvas').hidden);
  assert.notEqual(await gif.locator('img').getAttribute('src'), firstURL, 'Restart uses a fresh GIF animation, not a resumed cached timeline.');
  await page.waitForFunction(() => gif.element.dataset.playing === 'false', {timeout: 3000});
  assert.equal(await gif.locator('img').count(), 0, 'An infinitely looping GIF is stopped after one pass.');
  assert.deepEqual(await pixel(), [255, 0, 0, 255]);

  await video.getByRole('button', {name: 'Play emote', exact: true}).click();
  await page.waitForFunction(() => video.element.querySelector('video').currentTime > 0.15);
  assert.equal(await video.locator('video').evaluate(media => media.paused || media.muted), false, 'A user click starts audible video playback.');
  await video.getByRole('button', {name: 'Stop and reset emote', exact: true}).click();
  assert.equal(await video.locator('video').evaluate(media => media.paused && media.currentTime === 0), true);
  await video.getByRole('button', {name: 'Play emote', exact: true}).click();
  await page.waitForFunction(() => video.element.querySelector('video').currentTime > 0.05);
  assert.ok(await video.locator('video').evaluate(media => media.currentTime) < 0.3, 'A stopped video restarts from zero.');
  await page.waitForFunction(() => video.element.dataset.playing === 'false', {timeout: 3000});
  assert.equal(await video.locator('video').evaluate(media => media.paused && media.currentTime === 0), true, 'A completed video resets instead of remaining at its final frame.');

  await gif.getByRole('button', {name: 'Play emote', exact: true}).click();
  await video.getByRole('button', {name: 'Play emote', exact: true}).click();
  assert.equal(await gif.getAttribute('data-playing'), 'false', 'Starting a second emote resets the first.');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  assert.equal(await video.locator('video').evaluate(media => media.paused && media.currentTime === 0), true);
  await video.getByRole('button', {name: 'Play emote', exact: true}).click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, value: true}); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await video.locator('video').evaluate(media => media.paused && media.currentTime === 0), true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, value: false}); });
  await page.evaluate(() => {
   window.missing = FFMediaPlayer.create({src: '/missing.gif', kind: 'gif'});
   window.invalid = FFMediaPlayer.create({src: 'javascript:alert(1)', kind: 'video'});
   document.querySelector('#players').append(missing.element, invalid.element);
  });
  await page.getByRole('status').filter({hasText: 'Upload the GIF file to enable playback.'}).waitFor();
  await page.getByRole('status').filter({hasText: 'Unsupported emote file.'}).waitFor();
  await page.evaluate(() => {
   window.savedDecoder = window.ImageDecoder; delete window.ImageDecoder;
   window.fallback = FFMediaPlayer.create({src: 'fixture.gif', kind: 'gif'});
   document.querySelector('#players').append(fallback.element);
  });
  await page.waitForFunction(() => !fallback.element.querySelector('button').disabled);
  assert.deepEqual(await page.evaluate(() => [...fallback.element.querySelector('canvas').getContext('2d').getImageData(1, 1, 1, 1).data]), [255, 0, 0, 255], 'Browsers without ImageDecoder also get a still first-frame poster.');
  await page.evaluate(() => { window.ImageDecoder = savedDecoder; gif.dispose(); video.dispose(); missing.dispose(); invalid.dispose(); fallback.dispose(); });
  assert.equal(await page.evaluate(() => liveURLs.size), 0, 'All player-owned blob URLs are revoked.');
  assert.equal(await gif.getByRole('button').isDisabled(), true);
  assert.equal(await video.locator('video').getAttribute('src'), null);
  assert.equal(await gif.locator('img').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: still GIF poster, explicit one-pass GIF playback/restart, audible user-started video, stop and ended reset, no seek/native controls, one active emote, hidden/pagehide stop, safe failures, disposal.');
 } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); fs.rmSync(directory, {recursive: true, force: true}); }
})().catch(error => {console.error(error); process.exitCode = 1;});
