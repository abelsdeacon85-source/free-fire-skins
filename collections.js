'use strict';

(() => {
 const main = document.querySelector('main');
 const routes = new Set(['collaborations', 'collaboration', 'emotes', 'vehicles', 'vehicle', 'review']);
 const players = new Set();
 const t = (value, parameters) => window.SkinVaultI18n.t(value, parameters);
 const el = (tag, value, className, original = false) => {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  if (original) node.dataset.i18nSkip = '';
  return node;
 };
 const button = (label, action, className = '') => {
  const node = el('button', label, className); node.type = 'button'; node.addEventListener('click', action); return node;
 };
 const link = (label, href, className = '') => {
  const node = el('a', label, className); node.href = href; return node;
 };
 function safeSource(value) {
  if (typeof value !== 'string' || !value || value.includes('..')) return false;
  if (/^https:\/\//i.test(value)) { try { const url = new URL(value); return !url.username && !url.password; } catch { return false; } }
  return !/^(?:[a-z]+:|\/|\\)/i.test(value);
 }
 const disposePlayers = () => { for (const player of players) player.dispose(); players.clear(); };
 function emote(item) {
  const player = window.FFMediaPlayer.create({src: item.src, kind: item.kind, name: item.name}); players.add(player); return player;
 }

 // This navigation is shared by the original gun pages and every new gallery.
 function sidebar() {
  const header = document.querySelector('header'), footer = document.querySelector('footer');
  const layout = el('div', undefined, 'site-layout'), content = el('div', undefined, 'page-content');
  const aside = el('aside', undefined, 'site-sidebar'); aside.id = 'site-sidebar'; aside.setAttribute('aria-label', 'Browse');
  const heading = el('div', undefined, 'sidebar-heading');
  const close = button('×', () => setOpen(false), 'sidebar-close'); close.setAttribute('aria-label', 'Close navigation');
  heading.append(el('h2', 'Browse'), close); aside.append(heading);
  const nav = el('nav', undefined, 'sidebar-nav'); nav.setAttribute('aria-label', 'Collections');
  const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  const section = page.startsWith('collaboration') ? 'collaborations' : page === 'vehicle' || page === 'vehicles' ? 'vehicles' : page === 'emotes' ? 'emotes' : page === 'review' ? 'review' : 'guns';
  for (const [id, title, href] of [
   ['guns', 'Gun skins', 'index.html'], ['collaborations', 'FF x collaborations', 'collaborations.html'],
   ['emotes', 'Emotes', 'emotes.html'], ['vehicles', 'Vehicle', 'vehicles.html'], ['review', 'Review inbox', 'review.html']
  ]) {
   const item = link(title, href, 'sidebar-link'); if (section === id) item.setAttribute('aria-current', 'page'); nav.append(item);
  }
  aside.append(nav); content.append(main, footer); layout.append(aside, content); document.body.append(layout);
  const toggle = button('☰ Menu', () => setOpen(!document.body.classList.contains('sidebar-open')), 'sidebar-toggle');
  toggle.setAttribute('aria-controls', aside.id); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); header.append(toggle);
  const backdrop = button('', () => setOpen(false), 'sidebar-backdrop'); backdrop.setAttribute('aria-label', 'Close navigation'); backdrop.hidden = true; document.body.append(backdrop);
  const mobile = matchMedia('(max-width: 1099px)');
  function setOpen(open, focus = true) {
   open = mobile.matches && open;
   document.body.classList.toggle('sidebar-open', open); backdrop.hidden = !open;
   aside.inert = mobile.matches && !open; aside.setAttribute('aria-hidden', String(mobile.matches && !open));
   header.inert = open; content.inert = open;
   toggle.setAttribute('aria-expanded', String(open));
   if (focus) {
    if (open) requestAnimationFrame(() => {
     if (document.body.classList.contains('sidebar-open')) { getComputedStyle(aside).visibility; close.focus(); }
    });
    else if (mobile.matches) toggle.focus();
   }
  }
  document.addEventListener('keydown', event => {
   if (!document.body.classList.contains('sidebar-open')) return;
   if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
   if (event.key === 'Tab') {
    const nodes = [...aside.querySelectorAll('button, a[href]')], first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
   }
  });
  mobile.addEventListener('change', () => setOpen(false, false)); setOpen(false, false);
 }
 sidebar();

 let dataPromise;
 async function data() {
  if (!dataPromise) dataPromise = fetch('collections.json', {cache: 'no-cache'}).then(async response => {
   if (!response.ok) throw Error('The collections could not be loaded. Please refresh the page.');
   const value = await response.json();
   if (value.version !== 1 || !Array.isArray(value.collaborations) || !Array.isArray(value.vehicles) || !Array.isArray(value.items)) throw Error('The collections could not be loaded. Please refresh the page.');
   for (const list of [value.collaborations, value.vehicles]) {
    const ids = new Set();
    for (const entry of list) {
     if (!entry || !/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id) || typeof entry.name !== 'string' || typeof entry.artwork !== 'string' || (entry.artwork && !safeSource(entry.artwork))) throw Error('The collections could not be loaded. Please refresh the page.');
     ids.add(entry.id);
    }
   }
   return value;
  });
  return dataPromise;
 }
 let galleryError = false;
 async function items(section, collectionId) {
  const published = (await data()).items.filter(item => item.section === section && (collectionId === undefined || item.collectionId === collectionId));
  let online = [];
  await window.FFUploads.ready;
  if (window.FFUploads.configured) {
   try { online = (await window.FFUploads.listApproved(section, collectionId)).filter(item => item.status === 'approved'); }
   catch { galleryError = true; }
  }
  return [...new Map([...published, ...online].filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && ['image', 'gif', 'video'].includes(item.kind) && safeSource(item.src)).map(item => [item.id, item])).values()];
 }
 function notice(message) { const node = el('p', message, 'submission-notice'); main.append(node); return node; }
 function crumb(parts) {
  const nav = el('nav', undefined, 'crumbs'); nav.setAttribute('aria-label', 'Breadcrumb');
  [['Home', 'index.html'], ...parts].forEach(([name, href, original], index) => {
   if (index) nav.append(el('span', '/'));
   const node = href ? link(name, href) : el('span', name); if (original) node.dataset.i18nSkip = ''; nav.append(node);
  }); main.append(nav);
 }
 function hero(title, description, count, label, original = false) {
  const wrap = el('section', undefined, 'hero'), copy = el('div'), stats = el('div', undefined, 'stats');
  copy.append(el('p', 'THE COMMUNITY ARMORY', 'eyebrow'), el('h1', title, '', original), el('p', description));
  const stat = el('div'); stat.append(el('strong', String(count)), el('span', label)); stats.append(stat); wrap.append(copy, stats); main.append(wrap);
 }
 function empty(grid, title, message) {
  const node = el('div', undefined, 'empty-collection'); node.append(el('h2', title), el('p', message)); grid.append(node);
 }
 function toolbar(placeholder, add) {
  const bar = el('div', undefined, 'collection-toolbar'), label = el('label', 'Search');
  const input = el('input'); input.type = 'search'; input.placeholder = placeholder; label.append(input); bar.append(label);
  if (add) bar.append(button(add.title, add.action)); main.append(bar); return input;
 }
 function showGalleryError() {
  if (galleryError) notice('Community additions could not be loaded. Published items are still available.');
 }
 function collectionCard(collection, section, count) {
  const card = link('', `${section === 'collaborations' ? 'collaboration' : 'vehicle'}.html?id=${encodeURIComponent(collection.id)}`, 'collection-card');
  if (section === 'collaborations') card.classList.add('collaboration-card');
  const art = el('div', undefined, 'collection-art');
  const monogram = el('span', collection.name.split(/\s+/).map(word => word[0]).slice(0, 2).join(''), 'collection-monogram', true);
  monogram.setAttribute('aria-hidden', 'true'); art.append(monogram);
  if (collection.artwork) {
   const image = el('img'); image.src = collection.artwork; image.alt = ''; image.loading = 'lazy';
   image.addEventListener('error', () => image.remove()); art.append(image);
  }
  const overlay = el('div', undefined, 'collection-card-overlay');
  overlay.append(el('h2', collection.name, 'collection-name', section === 'collaborations'), el('p', `${count} items`, 'item-count'));
  card.append(art, overlay); return card;
 }
 async function collectionIndex(section) {
  const source = await data(), list = source[section], allItems = await items(section);
  const collaborations = section === 'collaborations';
  crumb([[collaborations ? 'FF x collaborations' : 'Vehicle']]);
  hero(collaborations ? 'FF x collaborations' : 'Vehicle skins', collaborations ? 'Explore the collaboration collections.' : 'Choose a vehicle to explore its skins.', list.length, collaborations ? 'COLLABORATIONS' : 'CATEGORIES');
  showGalleryError();
  const search = toolbar(collaborations ? 'Search collaborations…' : 'Search vehicles…');
  const grid = el('div', undefined, 'collection-grid'); main.append(grid);
  const render = () => {
   grid.replaceChildren(); const query = search.value.trim().toLocaleLowerCase();
   const visible = list.filter(entry => entry.name.toLocaleLowerCase().includes(query) || t(entry.name).toLocaleLowerCase().includes(query));
   for (const entry of visible) grid.append(collectionCard(entry, section, allItems.filter(item => item.collectionId === entry.id).length));
   if (!visible.length) empty(grid, 'Nothing found', 'Try a different search.');
  }; search.addEventListener('input', render); render();
 }
 function mediaCard(item, controlled) {
  const card = el('article', undefined, 'media-card'), art = el('div', undefined, 'media-art');
  if (controlled && ['gif', 'video'].includes(item.kind)) art.append(emote(item).element);
  else {
   const image = el('img'); image.src = item.src; image.alt = item.name; image.dataset.i18nSkip = ''; image.loading = 'lazy';
   image.addEventListener('error', () => art.replaceChildren(el('span', 'Image not added yet'))); art.append(image);
  }
  const info = el('div', undefined, 'media-info'); info.append(el('h2', item.name, 'media-name', true)); card.append(art, info); return card;
 }
 async function gallery(section, collectionId) {
  const source = await data(), isEmote = section === 'emotes';
  const entry = isEmote ? {id: 'all', name: 'Emotes'} : source[section].find(entry => entry.id === collectionId);
  if (!entry) { crumb([['Collection not found']]); hero('Collection not found', 'Choose a collection from the sidebar.', 0, 'ITEMS'); return; }
  const isBrand = section === 'collaborations', listing = await items(section, entry.id);
  crumb(isEmote ? [['Emotes']] : [[isBrand ? 'FF x collaborations' : 'Vehicle', isBrand ? 'collaborations.html' : 'vehicles.html'], [entry.name, null, isBrand]]);
  hero(entry.name, isEmote ? 'Press play to watch an emote. Stop resets it to the beginning.' : isBrand ? 'Pictures and GIFs from this collaboration.' : 'Explore this vehicle’s skin collection.', listing.length, 'ITEMS', isBrand);
  showGalleryError();
  notice('New additions are reviewed by the owner before they appear here.');
  const search = toolbar('Search items…', {title: isEmote ? 'Add emote' : isBrand ? 'Add item' : 'Add vehicle skin', action: () => openSubmission(section, entry.id)});
  const count = el('p', undefined, 'helper'); count.setAttribute('aria-live', 'polite'); const grid = el('div', undefined, 'media-grid'); main.append(count, grid);
  const render = () => {
   disposePlayers(); grid.replaceChildren(); const query = search.value.trim().toLocaleLowerCase(), found = listing.filter(item => item.name.toLocaleLowerCase().includes(query));
   count.textContent = `${found.length} items`;
   for (const item of found) grid.append(mediaCard(item, isEmote));
   if (!found.length) empty(grid, listing.length ? 'Nothing found' : 'This collection is waiting for you.', listing.length ? 'Try a different search.' : 'Approved additions will appear here. Add the first one for review.');
  }; search.addEventListener('input', render); render();
 }

 function openSubmission(section, collectionId) {
  const isEmote = section === 'emotes', isBrand = section === 'collaborations';
  const dialog = el('dialog', undefined, 'collection-dialog'), heading = el('div', undefined, 'dialog-heading');
  const title = isEmote ? 'Add emote' : isBrand ? 'Add item' : section === 'guns' ? 'Submit a gun skin' : 'Add vehicle skin';
  const titleNode = el('h2', title); titleNode.id = 'submission-title'; dialog.setAttribute('aria-labelledby', titleNode.id);
  const close = button('×', () => dialog.close(), 'dialog-close'); close.setAttribute('aria-label', 'Close'); heading.append(titleNode, close); dialog.append(heading);
  dialog.append(el('p', 'Your addition stays private until the owner approves it.', 'helper'));
  const form = el('form', undefined, 'media-form'); form.noValidate = true;
  const label = el('label', isBrand ? 'Product name or type' : isEmote ? 'Emote name' : section === 'guns' ? 'Skin name' : 'Vehicle skin name');
  const name = el('input'); name.type = 'text'; name.maxLength = 120; name.required = true; name.dir = 'auto'; label.append(name);
  const uploadLabel = el('label', isEmote ? 'Choose a GIF or video' : 'Choose a picture or GIF'), file = el('input'); file.type = 'file'; file.required = true;
  file.accept = isEmote ? 'image/gif,video/mp4,video/webm,.gif,.mp4,.webm' : 'image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif'; uploadLabel.append(file);
  const preview = el('div', undefined, 'submission-preview'), status = el('p', '', 'form-status'); status.setAttribute('role', 'status');
  const submit = el('button', 'Submit for review'); submit.type = 'submit';
  const cancel = button('Cancel', () => { if (!submitting) dialog.close(); }, 'secondary');
  const actions = el('div', undefined, 'actions'); actions.append(submit, cancel);
  form.append(label, uploadLabel, el('p', isEmote ? 'GIF, MP4, or WebM. Up to 20 MB per file.' : 'PNG, JPEG, WebP, or GIF. Up to 20 MB per file.', 'helper'), preview, status, actions); dialog.append(form); document.body.append(dialog);
  let previewURL = null, previewPlayer = null, submitting = false;
  const clearPreview = () => { if (previewPlayer) previewPlayer.dispose(); previewPlayer = null; if (previewURL) URL.revokeObjectURL(previewURL); previewURL = null; preview.replaceChildren(); };
  const report = (message, error = false) => { status.textContent = message; status.className = error ? 'form-status error' : 'form-status'; };
  file.addEventListener('change', () => {
   clearPreview(); report(''); const selected = file.files[0]; if (!selected) return;
   const kind = selected.type === 'image/gif' ? 'gif' : selected.type.startsWith('video/') ? 'video' : 'image';
   if (selected.size > 20 * 1024 * 1024) { report('Files must be 20 MB or smaller.', true); file.value = ''; return; }
   if (isEmote ? !['image/gif', 'video/mp4', 'video/webm'].includes(selected.type) : !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(selected.type)) {
    report(isEmote ? 'Emotes must be GIF, MP4, or WebM files.' : 'Choose a PNG, JPEG, WebP, or GIF picture.', true); file.value = ''; return;
   }
   previewURL = URL.createObjectURL(selected);
   if (isEmote) { previewPlayer = window.FFMediaPlayer.create({src: previewURL, kind, name: name.value}); preview.append(previewPlayer.element); }
   else { const image = el('img'); image.className = 'media-preview'; image.src = previewURL; image.alt = ''; preview.append(image); }
  });
  submit.disabled = true;
  void window.FFUploads.ready.then(() => { if (dialog.isConnected) { submit.disabled = !window.FFUploads.configured; if (!window.FFUploads.configured) report('Uploads are not connected yet. The owner needs to finish upload setup.', true); } });
  form.addEventListener('submit', async event => {
   event.preventDefault(); if (submitting || !window.FFUploads.configured) return;
   if (name.value.trim().length < 2) { report('Enter a name between 2 and 120 characters.', true); name.focus(); return; }
   if (!file.files[0]) { report('Choose a file first.', true); file.focus(); return; }
   submitting = true; for (const node of [submit, close, cancel, name, file]) node.disabled = true; form.setAttribute('aria-busy', 'true'); report('Uploading for review…');
   try {
    await window.FFUploads.submit({section, collectionId, name: name.value, file: file.files[0]});
    clearPreview(); form.reset(); report('Submitted for review. It will appear after the owner approves it.');
   } catch (error) { report(error.message, true); }
   finally { submitting = false; for (const node of [submit, close, cancel, name, file]) node.disabled = false; form.removeAttribute('aria-busy'); }
  });
  dialog.addEventListener('cancel', event => { if (submitting) event.preventDefault(); });
  dialog.addEventListener('close', () => { clearPreview(); dialog.remove(); });
  dialog.showModal(); name.focus(); return dialog;
 }

 async function reviewInbox() {
  await window.FFUploads.ready;
  crumb([['Review inbox']]); hero('Review inbox', 'Inspect visitor submissions before publishing them.', 0, 'PENDING');
  if (!window.FFUploads.configured) {
   notice('Uploads are not connected yet. The owner needs to finish upload setup.');
   main.append(link('View setup instructions', 'https://github.com/abelsdeacon85-source/free-fire-skins/blob/main/docs/upload-setup.md', 'button secondary')); return;
  }
  const panel = el('section', undefined, 'review-panel'); main.append(panel);
  let reviewer = false;
  try { reviewer = await window.FFUploads.isReviewer(); } catch { /* Show sign-in so an expired session can be renewed. */ }
  if (!reviewer) {
   panel.append(el('h2', 'Owner sign-in'), el('p', 'Sign in to review visitor submissions.', 'helper'));
   const form = el('form', undefined, 'media-form'), emailLabel = el('label', 'Email'), passwordLabel = el('label', 'Password');
   const email = el('input'), password = el('input'); email.type = 'email'; email.required = true; email.autocomplete = 'username'; password.type = 'password'; password.required = true; password.autocomplete = 'current-password';
   emailLabel.append(email); passwordLabel.append(password); const submit = el('button', 'Sign in'); submit.type = 'submit'; const status = el('p', '', 'form-status'); status.setAttribute('role', 'status'); form.append(emailLabel, passwordLabel, submit, status); panel.append(form);
   form.addEventListener('submit', async event => {
    event.preventDefault(); submit.disabled = true; status.textContent = 'Signing in…';
    try {
     await window.FFUploads.login(email.value, password.value); password.value = '';
     if (!await window.FFUploads.isReviewer()) { await window.FFUploads.logout(); throw Error('Only the website owner can review submissions.'); }
     disposePlayers(); main.replaceChildren(); await reviewInbox();
    } catch (error) { status.textContent = error.message; status.className = 'form-status error'; }
    finally { submit.disabled = false; }
   }); return;
  }
  panel.append(button('Sign out', async () => {
   try { await window.FFUploads.logout(); } catch { /* The local session is cleared even if the network is unavailable. */ }
   disposePlayers(); main.replaceChildren(); await reviewInbox();
  }, 'secondary'));
  const status = el('p', '', 'form-status'); status.setAttribute('role', 'status'); panel.append(status);
  let pending;
  try { pending = await window.FFUploads.listPending(); }
  catch (error) { status.textContent = error.message; status.className = 'form-status error'; return; }
  const total = main.querySelector('.stats strong'); total.textContent = String(pending.length);
  const source = await data(), grid = el('div', undefined, 'media-grid'); main.append(grid);
  function noPending() { if (!grid.children.length) empty(grid, 'All caught up.', 'No submissions are waiting for review.'); }
  for (const item of pending) {
   if (item.status !== 'pending') continue;
   const card = mediaCard(item, ['gif', 'video'].includes(item.kind)), info = card.querySelector('.media-info');
   const sectionName = {collaborations: 'FF x collaborations', emotes: 'Emotes', vehicles: 'Vehicle', guns: 'Gun skins'}[item.section] || 'Items';
   info.append(el('p', sectionName));
   const collection = source[item.section]?.find(entry => entry.id === item.collectionId);
   if (collection) info.append(el('p', collection.name, '', item.section === 'collaborations'));
   else if (item.section === 'guns') info.append(el('p', item.collectionId.toUpperCase(), '', true));
   const actions = el('div', undefined, 'actions');
   for (const [decision, title, className] of [['approved', 'Approve and publish', ''], ['rejected', 'Reject', 'danger']]) {
    actions.append(button(title, async () => {
     for (const node of actions.querySelectorAll('button')) node.disabled = true;
     try {
      await window.FFUploads.review(item.id, decision);
      const media = card.querySelector('.emote-player'); for (const player of players) if (player.element === media) { player.dispose(); players.delete(player); }
      card.remove(); total.textContent = String(Number(total.textContent) - 1);
      status.textContent = decision === 'approved' ? 'Approved and published.' : 'Submission rejected.'; noPending();
     } catch (error) { status.textContent = error.message; for (const node of actions.querySelectorAll('button')) node.disabled = false; }
    }, className));
   }
   info.append(actions); grid.append(card);
  }
  noPending();
 }

 async function route(page, id) {
  if (!routes.has(page)) return false;
  disposePlayers(); main.replaceChildren(); galleryError = false;
  main.append(el('p', 'Loading the collection…', 'loading'));
  try {
   await data(); main.replaceChildren();
   if (page === 'review') await reviewInbox();
   else if (page === 'collaborations' || page === 'vehicles') await collectionIndex(page);
   else if (page === 'emotes') await gallery('emotes', 'all');
   else await gallery(page === 'collaboration' ? 'collaborations' : 'vehicles', id);
  } catch {
   main.replaceChildren(el('h1', 'Unable to load the collection'), el('p', 'The collections could not be loaded. Please refresh the page.', 'notice'));
  }
  return true;
 }
 async function attachGun(gun, onChange) {
  await window.FFUploads.ready; if (!window.FFUploads.configured) return;
  try {
   const online = await window.FFUploads.listApproved('guns', gun.id); let changed = false;
   for (const item of online) {
    if (item.status !== 'approved' || !safeSource(item.src) || !['image', 'gif'].includes(item.kind)) continue;
    const id = `submission-${item.id}`, existing = gun.skins.find(skin => skin.id === id);
    if (existing) { if (!existing.imageOverride && existing.image !== item.src) { existing.image = item.src; changed = true; } }
    else { gun.skins.push({id, name: item.name, rarity: 'unknown', image: item.src, attributes: [], verified: false, source: ''}); changed = true; }
   }
   if (changed) onChange();
  } catch { notice('Community additions could not be loaded. Published items are still available.'); }
 }
 window.addEventListener('pagehide', disposePlayers);
 window.FFCollections = Object.freeze({route, openSubmission, attachGun});
})();
