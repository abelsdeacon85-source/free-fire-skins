'use strict';

// Emotes have a single start/stop control. Original animated GIFs are never shown
// until requested; their first frame stays on a canvas while idle.
(() => {
 const labels = Object.freeze({
  play: 'Play emote', stop: 'Stop and reset emote', loading: 'Loading emote…',
  gifUpload: 'Upload the GIF file to enable playback.',
  failed: 'This emote could not be played.', unsupported: 'Unsupported emote file.'
 });
 const players = new Set();
 let activePlayer = null;

 function gifInformation(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 14 || !/^GIF8[79]a$/.test(String.fromCharCode(...bytes.subarray(0, 6)))) throw new Error('Invalid GIF');
  let position = 13, delay = 100, duration = 0, frames = 0;
  const width = bytes[6] | bytes[7] << 8, height = bytes[8] | bytes[9] << 8;
  if (!width || !height || width * height > 32000000) throw new Error('Invalid GIF dimensions');
  const take = length => {
   if (position + length > bytes.length) throw new Error('Truncated GIF');
   const start = position; position += length; return start;
  };
  const table = packed => { if (packed & 128) take(3 * 2 ** ((packed & 7) + 1)); };
  const blocks = () => { let length; do { length = bytes[take(1)]; take(length); } while (length); };
  table(bytes[10]);
  while (position < bytes.length) {
   const marker = bytes[take(1)];
   if (marker === 0x3b) break;
   if (marker === 0x21) {
    const label = bytes[take(1)];
    if (label === 0xf9) {
     if (bytes[take(1)] !== 4) throw new Error('Invalid GIF control');
     const start = take(4), centiseconds = bytes[start + 1] | bytes[start + 2] << 8;
     // Browser GIF playback clamps zero/10 ms frames to 100 ms.
     delay = centiseconds <= 1 ? 100 : centiseconds * 10;
     if (bytes[take(1)] !== 0) throw new Error('Invalid GIF control');
    } else blocks();
   } else if (marker === 0x2c) {
    const start = take(9); table(bytes[start + 8]); take(1); blocks();
    duration += delay; frames += 1; delay = 100;
   } else throw new Error('Invalid GIF block');
  }
  if (!frames) throw new Error('Empty GIF');
  return {width, height, duration, frames};
 }

 function acceptableSource(source, kind) {
  if (typeof source !== 'string' || !source.trim()) return false;
  try {
   const url = new URL(source, document.baseURI);
   if (url.protocol === 'data:') return (kind === 'gif' ? /^data:image\/gif[;,]/i : /^data:video\/(?:mp4|webm|ogg)[;,]/i).test(source);
   if (url.protocol === 'blob:') return url.origin === location.origin;
   return url.protocol === 'http:' || url.protocol === 'https:';
  } catch { return false; }
 }

 function create({src, kind, name = ''} = {}) {
  const element = document.createElement('div'); element.className = 'emote-player';
  const media = document.createElement(kind === 'video' ? 'video' : 'canvas');
  media.className = kind === 'video' ? 'emote-player-video' : 'emote-player-poster';
  media.setAttribute('aria-hidden', 'true'); media.tabIndex = -1;
  if (name) { media.dataset.i18nSkip = ''; media.setAttribute('title', String(name)); }
  const button = document.createElement('button'); button.type = 'button'; button.className = 'emote-player-toggle'; button.disabled = true;
  const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.dataset.i18nSkip = '';
  button.append(icon);
  const status = document.createElement('span'); status.className = 'emote-player-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  element.append(media, button, status);
  let disposed = false, playing = false, ready = false, timer = null, blob = null, information = null, animation = null, animationURL = null, attempt = 0;
  const controller = new AbortController();
  const ownedURLs = new Set();
  const makeURL = value => { const url = URL.createObjectURL(value); ownedURLs.add(url); return url; };
  const releaseURL = url => { if (url && ownedURLs.delete(url)) URL.revokeObjectURL(url); };
  const showControl = () => {
   button.setAttribute('aria-label', playing ? labels.stop : labels.play);
   button.setAttribute('title', playing ? labels.stop : labels.play);
   icon.textContent = playing ? '■' : '▶';
   element.dataset.playing = String(playing);
  };
  showControl(); status.textContent = labels.loading;

  function stop() {
   attempt += 1;
   clearTimeout(timer); timer = null;
   playing = false;
   if (kind === 'video') {
    media.pause();
    try { media.currentTime = 0; } catch { /* Metadata may not have loaded. */ }
   }
   if (animation) { animation.removeAttribute('src'); animation.remove(); animation = null; }
   releaseURL(animationURL); animationURL = null;
   if (kind === 'gif') media.hidden = false;
   if (activePlayer === api) activePlayer = null;
   showControl();
  }
  function fail(message) {
   if (disposed) return;
   stop(); ready = false; button.disabled = true; status.textContent = message;
  }
  function prepareVideo() {
   media.controls = false; media.autoplay = false; media.loop = false; media.preload = 'metadata'; media.playsInline = true;
   media.disablePictureInPicture = true; media.disableRemotePlayback = true;
   media.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
   media.setAttribute('disablepictureinpicture', ''); media.setAttribute('disableremoteplayback', '');
   media.style.pointerEvents = 'none';
   media.addEventListener('contextmenu', event => event.preventDefault());
   media.addEventListener('loadedmetadata', () => {
    if (disposed) return;
    ready = true; button.disabled = false; status.textContent = '';
   }, {once: true});
   media.addEventListener('ended', stop);
   media.addEventListener('error', () => fail(labels.failed));
   media.src = src;
  }
  async function drawPoster(buffer) {
   if ('ImageDecoder' in window) {
    let decoder, frame;
    try {
     decoder = new ImageDecoder({data: new Uint8Array(buffer), type: 'image/gif', preferAnimation: false});
     await decoder.tracks.ready;
     ({image: frame} = await decoder.decode({frameIndex: 0, completeFramesOnly: true}));
     if (!disposed) media.getContext('2d').drawImage(frame, 0, 0, media.width, media.height);
     return;
    } catch { /* Older browsers use the image-load first-frame fallback below. */ }
    finally { frame?.close(); decoder?.close(); }
   }
   const url = makeURL(blob), firstFrame = new Image(); firstFrame.decoding = 'sync';
   try {
    await new Promise((resolve, reject) => {
     firstFrame.onload = () => {
      try { if (!disposed) media.getContext('2d').drawImage(firstFrame, 0, 0, media.width, media.height); resolve(); }
      catch (error) { reject(error); }
     };
     firstFrame.onerror = reject; firstFrame.src = url;
    });
   } finally { firstFrame.removeAttribute('src'); releaseURL(url); }
  }
  async function prepareGIF() {
   try {
    const response = await fetch(src, {signal: controller.signal});
    if (!response.ok) throw new Error('GIF request failed');
    const buffer = await response.arrayBuffer();
    if (disposed) return;
    information = gifInformation(buffer); blob = new Blob([buffer], {type: 'image/gif'});
    media.width = information.width; media.height = information.height;
    await drawPoster(buffer);
    if (disposed) return;
    ready = true; button.disabled = false; status.textContent = '';
   } catch {
    if (!disposed) fail(labels.gifUpload);
   }
  }
  async function play() {
   if (disposed || !ready) return;
   if (playing) { stop(); return; }
   if (activePlayer && activePlayer !== api) activePlayer.stop();
   activePlayer = api; playing = true; status.textContent = ''; showControl();
   const currentAttempt = ++attempt;
   if (kind === 'video') {
    try {
     media.currentTime = 0;
     // This call remains inside the click handler, so videos may play with sound.
     await media.play();
     if (disposed || (currentAttempt !== attempt && !playing)) media.pause();
    } catch { if (!disposed && currentAttempt === attempt) { stop(); status.textContent = labels.failed; } }
   } else {
    // A new blob URL and image element start each request from frame zero,
    // regardless of the original GIF's loop count or the browser image cache.
    animationURL = makeURL(blob); animation = new Image(); animation.className = 'emote-player-animation';
    animation.setAttribute('aria-hidden', 'true'); animation.dataset.i18nSkip = ''; animation.draggable = false;
    animation.onload = () => {
     if (disposed || currentAttempt !== attempt || !playing) return;
     media.hidden = true;
     timer = setTimeout(stop, information.duration);
    };
    animation.onerror = () => { if (currentAttempt === attempt) fail(labels.failed); };
    element.insertBefore(animation, media); animation.src = animationURL;
   }
  }
  button.addEventListener('click', play);
  function dispose() {
   if (disposed) return;
   stop(); disposed = true; controller.abort(); button.disabled = true;
   button.removeEventListener('click', play);
   if (kind === 'video') { media.removeAttribute('src'); media.load(); }
   for (const url of ownedURLs) URL.revokeObjectURL(url);
   ownedURLs.clear(); blob = null; players.delete(api);
  }
  const api = {element, stop, dispose};
  players.add(api);
  if (!['gif', 'video'].includes(kind) || !acceptableSource(src, kind)) fail(labels.unsupported);
  else if (kind === 'video') prepareVideo();
  else prepareGIF();
  return api;
 }
 function stopAll() { for (const player of players) player.stop(); }
 document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
 window.addEventListener('pagehide', stopAll);
 window.FFMediaPlayer = Object.freeze({create});
})();
