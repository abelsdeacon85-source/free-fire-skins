/* Public Supabase client for the approval inbox. Never put a secret key here. */
(() => {
  'use strict';
  const MAX_BYTES = 20 * 1024 * 1024;
  const BUCKET = 'ff-review-media';
  const SECTIONS = ['collaborations', 'emotes', 'vehicles', 'guns'];
  const MESSAGES = {
    setup: 'Uploads are not connected yet. The owner needs to finish upload setup.',
    network: 'The upload service could not be reached. Please try again.',
    load: 'The gallery could not be loaded. Please try again.',
    login: 'Sign-in failed. Check your email and password.',
    reviewer: 'Only the website owner can review submissions.',
    session: 'Your session expired. Please sign in again.',
    upload: 'The upload failed. Please try again.',
    finalize: 'The file was uploaded, but could not be submitted for review. Please try again.',
    review: 'This submission could not be reviewed. It may already have been reviewed.',
    file: 'Choose a supported picture, GIF, MP4, or WebM file.',
    emote: 'Emotes must be GIF, MP4, or WebM files.',
    picture: 'Choose a PNG, JPEG, WebP, or GIF picture.',
    size: 'Files must be 20 MB or smaller.',
    name: 'Enter a name between 2 and 120 characters.',
    collection: 'Choose a valid category before submitting.',
  };
  let config = null;
  let session = null;
  let refreshPromise = null;
  let collectionsPromise = null;
  const fail = key => new Error(MESSAGES[key]);
  const encodedPath = value => value.split('/').map(encodeURIComponent).join('/');
  const storageKey = () => `ff-upload-session:${config.url}`;

  function readSession(value) {
    if (!value || typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string' || !value.user || typeof value.user.id !== 'string') return null;
    return {
      access_token: value.access_token,
      refresh_token: value.refresh_token,
      expires_at: Number(value.expires_at) || Math.floor(Date.now() / 1000) + (Number(value.expires_in) || 3600),
      user: { id: value.user.id, email: value.user.email || '', isAnonymous: value.user.is_anonymous === true || value.user.isAnonymous === true },
    };
  }

  function saveSession(value) {
    session = readSession(value);
    try {
      if (session) sessionStorage.setItem(storageKey(), JSON.stringify(session));
      else sessionStorage.removeItem(storageKey());
    } catch (_) { /* Memory still works when browser storage is disabled. */ }
  }

  async function rawRequest(path, options = {}, errorKey = 'network', accessToken = null) {
    let response;
    try {
      response = await fetch(`${config.url}${path}`, {
        ...options,
        headers: {
          apikey: config.publishableKey,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(options.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
        },
      });
    } catch (_) { throw fail('network'); }
    if (!response.ok) throw fail(errorKey);
    if (response.status === 204) return null;
    let body;
    try { body = await response.text(); } catch (_) { throw fail('network'); }
    if (!body) return null;
    try { return JSON.parse(body); } catch (_) { throw fail(errorKey); }
  }

  async function activeSession() {
    if (!session) return null;
    if (session.expires_at > Date.now() / 1000 + 60) return session;
    if (!refreshPromise) {
      const token = session.refresh_token;
      refreshPromise = rawRequest('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', body: JSON.stringify({ refresh_token: token }),
      }, 'session').then(value => {
        if (!session || session.refresh_token !== token) return session;
        const next = readSession(value);
        if (!next) throw fail('session');
        saveSession(next);
        return session;
      }).catch(error => { if (session?.refresh_token === token) saveSession(null); throw error; }).finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }

  async function request(path, options, errorKey, publicRead = false) {
    await requireConfig();
    // Approved galleries are public. A stale owner/visitor session must never
    // prevent their metadata or media URLs from being fetched anonymously.
    const current = publicRead ? null : await activeSession();
    return rawRequest(path, options, errorKey, current?.access_token);
  }

  async function requireConfig() {
    await ready;
    if (!config) throw fail('setup');
  }

  function publicKey(value) {
    if (typeof value !== 'string' || value.length < 15 || value.startsWith('sb_secret_')) return false;
    if (value.startsWith('sb_publishable_')) return true;
    try {
      const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'anon';
    } catch (_) { return false; }
  }

  const ready = (async () => {
    try {
      const response = await fetch('uploads-config.json', { cache: 'no-store' });
      if (!response.ok) return;
      const value = await response.json();
      const url = new URL(value.url);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '') || !publicKey(value.publishableKey)) return;
      config = { url: url.origin, publishableKey: value.publishableKey };
      try { session = readSession(JSON.parse(sessionStorage.getItem(storageKey()))); } catch (_) { /* Empty or disabled browser storage. */ }
    } catch (_) { /* The site stays usable before uploads are connected. */ }
  })();

  async function ensureVisitor() {
    if (await activeSession()) return;
    const value = await rawRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ data: {} }) }, 'upload');
    if (!readSession(value)) throw fail('upload');
    saveSession(value);
  }

  async function validCollection(section, collectionId) {
    if (!SECTIONS.includes(section) || typeof collectionId !== 'string') return false;
    if (section === 'emotes') return collectionId === 'all';
    if (!collectionsPromise) {
      collectionsPromise = Promise.all(['collections.json', 'catalog.json'].map(async path => {
        try {
          const response = await fetch(path, { cache: 'no-store' });
          if (!response.ok) throw fail('collection');
          return await response.json();
        } catch (_) { throw fail('collection'); }
      })).catch(error => { collectionsPromise = null; throw error; });
    }
    const [collections, catalog] = await collectionsPromise;
    const list = section === 'guns' ? catalog.guns : collections[section];
    return Array.isArray(list) && list.some(item => item.id === collectionId);
  }

  async function inspectFile(file, section) {
    if (!(file instanceof Blob) || !file.size) throw fail('file');
    if (file.size > MAX_BYTES) throw fail('size');
    const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    const ascii = (offset, length) => String.fromCharCode(...bytes.slice(offset, offset + length));
    let mime = '';
    if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') mime = 'image/gif';
    else if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) mime = 'image/png';
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) mime = 'image/jpeg';
    else if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') mime = 'image/webp';
    else if (ascii(4, 4) === 'ftyp' && /^(isom|iso[2-9]|mp4[12]|avc1|M4V |dash)$/.test(ascii(8, 4))) mime = 'video/mp4';
    else if (bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163 && ascii(0, bytes.length).includes('webm')) mime = 'video/webm';
    const declared = String(file.type || '').toLowerCase();
    if (!mime || (declared && declared !== mime && !(declared === 'image/jpg' && mime === 'image/jpeg'))) throw fail('file');
    if (section === 'emotes' && mime !== 'image/gif' && !mime.startsWith('video/')) throw fail('emote');
    if (section !== 'emotes' && !mime.startsWith('image/')) throw fail('picture');
    return { mime, kind: mime === 'image/gif' ? 'gif' : mime.startsWith('video/') ? 'video' : 'image', extension: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }[mime] };
  }

  async function signedURL(path, publicRead = false) {
    const value = await request(`/storage/v1/object/sign/${BUCKET}/${encodedPath(path)}`, { method: 'POST', body: JSON.stringify({ expiresIn: 3600 }) }, 'load', publicRead);
    const signed = value?.signedURL || value?.signedUrl;
    if (typeof signed !== 'string') throw fail('load');
    const url = new URL(signed.startsWith('/object/') ? `/storage/v1${signed}` : signed, config.url);
    if (url.origin !== config.url || url.protocol !== 'https:') throw fail('load');
    return url.href;
  }

  async function normalized(row, publicRead = false) {
    return { id: row.id, section: row.section, collectionId: row.collection_id, name: row.name, kind: row.kind, src: await signedURL(row.storage_path, publicRead), status: row.status, createdAt: row.created_at };
  }

  async function listRows(query, publicRead = false) {
    const rows = [];
    for (let offset = 0; ; offset += 100) {
      const page = await request(`/rest/v1/ff_submissions?select=id,section,collection_id,name,kind,storage_path,status,created_at&${query}&order=created_at.desc,id.desc&limit=100&offset=${offset}`, {}, 'load', publicRead);
      if (!Array.isArray(page)) throw fail('load');
      rows.push(...page);
      if (page.length < 100) break;
    }
    // Fail the whole request if a private URL cannot be signed; never silently omit a card.
    const result = [];
    for (let start = 0; start < rows.length; start += 8) result.push(...await Promise.all(rows.slice(start, start + 8).map(row => normalized(row, publicRead))));
    return result;
  }

  const api = {
    ready,
    get configured() { return Boolean(config); },
    get user() { return session ? { ...session.user } : null; },
    async login(email, password) {
      await requireConfig();
      const value = await rawRequest('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: String(email || '').trim(), password: String(password || '') }) }, 'login');
      if (!readSession(value)) throw fail('login');
      saveSession(value);
      return api.user;
    },
    async logout() {
      await requireConfig();
      const token = session?.access_token;
      saveSession(null);
      if (token) await rawRequest('/auth/v1/logout', { method: 'POST' }, 'network', token);
    },
    async isReviewer() {
      await requireConfig();
      if (!session) return false;
      const result = await request('/rest/v1/rpc/ff_is_reviewer', { method: 'POST', body: '{}' }, 'reviewer');
      return result === true;
    },
    async listApproved(section, collectionId) {
      await requireConfig();
      if (!SECTIONS.includes(section)) throw fail('collection');
      let query = `status=eq.approved&section=eq.${encodeURIComponent(section)}`;
      if (collectionId !== undefined) query += `&collection_id=eq.${encodeURIComponent(collectionId)}`;
      return listRows(query, true);
    },
    async listPending() {
      if (!await api.isReviewer()) throw fail('reviewer');
      return listRows('status=eq.pending');
    },
    async submit({ section, collectionId, name, file }) {
      await requireConfig();
      name = String(name || '').trim();
      if (name.length < 2 || name.length > 120) throw fail('name');
      if (!await validCollection(section, collectionId)) throw fail('collection');
      const media = await inspectFile(file, section);
      await ensureVisitor();
      const id = crypto.randomUUID();
      const path = `${session.user.id}/${id}/media.${media.extension}`;
      await request('/rest/v1/ff_submissions', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id, section, collection_id: collectionId, name, kind: media.kind, mime_type: media.mime, byte_size: file.size }) }, 'upload');
      try {
        await request(`/storage/v1/object/${BUCKET}/${encodedPath(path)}`, { method: 'POST', headers: { 'Content-Type': media.mime, 'x-upsert': 'false' }, body: file }, 'upload');
        await request('/rest/v1/rpc/ff_finalize_submission', { method: 'POST', body: JSON.stringify({ submission_id: id }) }, 'finalize');
      } catch (error) {
        try {
          // Visitors cannot delete storage objects: a delayed Storage delete could
          // otherwise race with approval. Removing this unfinished row makes any
          // leftover object inaccessible; the owner can clean it up in Supabase.
          await request(`/rest/v1/ff_submissions?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }, 'upload');
        } catch (_) { /* Server policies retain private, unfinished uploads safely. */ }
        throw error;
      }
      // Finalization is the success boundary. The receipt does not need a media
      // URL; a later signing failure must not turn a saved submission into a
      // reported upload failure and encourage a duplicate retry.
      return { id, section, collectionId, name, kind: media.kind, status: 'pending', createdAt: new Date().toISOString() };
    },
    async review(id, decision) {
      if (decision !== 'approved' && decision !== 'rejected') throw fail('review');
      if (!await api.isReviewer()) throw fail('reviewer');
      await request('/rest/v1/rpc/ff_review_submission', { method: 'POST', body: JSON.stringify({ submission_id: id, decision }) }, 'review');
    },
  };
  window.FFUploads = Object.freeze(api);
})();
