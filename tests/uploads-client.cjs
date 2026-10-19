/* No dependencies or live credentials required: run node tests/uploads-client.cjs. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'uploads.js'), 'utf8');
const PUBLIC_CONFIG = { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_example_public_key' };
const VISITOR = '00000000-0000-4000-8000-000000000001';
const OWNER = '00000000-0000-4000-8000-000000000002';
const gif = new Blob(['GIF89a12345678'], { type: 'image/gif' });
const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
const mp4 = new Blob([new Uint8Array([0, 0, 0, 24]), 'ftypisom123456789'], { type: 'video/mp4' });
const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;

async function harness(options = {}) {
  const config = options.config || PUBLIC_CONFIG;
  const calls = [];
  const store = new Map();
  if (options.session) store.set(`ff-upload-session:${config.url}`, JSON.stringify(options.session));
  const state = { failPath: '', failNetwork: '', ...options };
  const context = {
    window: {}, Blob, URL, crypto, Date, atob, Uint8Array,
    sessionStorage: {
      getItem(key) { if (state.storageDisabled) throw Error('Storage disabled'); return store.get(key) || null; },
      setItem(key, value) { if (state.storageDisabled) throw Error('Storage disabled'); store.set(key, value); },
      removeItem(key) { if (state.storageDisabled) throw Error('Storage disabled'); store.delete(key); },
    },
    async fetch(url, request = {}) {
      calls.push({ url, request });
      if (state.failNetwork && url.includes(state.failNetwork)) throw Error('Network is offline');
      if (state.failPath && url.includes(state.failPath)) return new Response('{}', { status: 403 });
      if (url === 'uploads-config.json') {
        if (state.configMalformed) return new Response('<html>Unavailable</html>');
        return Response.json(config);
      }
      if (url === 'collections.json' || url === 'catalog.json') return Response.json(JSON.parse(fs.readFileSync(path.join(root, url), 'utf8')));
      if (url.includes('/auth/v1/signup')) return Response.json({ access_token: 'anonymous-token', refresh_token: 'refresh-token', expires_in: 3600, user: { id: VISITOR, is_anonymous: true } });
      if (url.includes('/auth/v1/token?grant_type=password')) return Response.json({ access_token: 'owner-token', refresh_token: 'owner-refresh', expires_in: 3600, user: { id: OWNER, email: 'owner@example.test' } });
      if (url.includes('/auth/v1/token?grant_type=refresh_token')) return new Response('{}', { status: 401 });
      if (url.includes('/rpc/ff_is_reviewer')) return Response.json(request.headers.Authorization === 'Bearer owner-token');
      if (url.includes('/rest/v1/ff_submissions?select=')) return Response.json([{
        id: 'submission-id', section: 'emotes', collection_id: 'all', name: 'Wave', kind: 'gif',
        storage_path: 'owner/submission-id/media.gif', status: url.includes('pending') ? 'pending' : 'approved', created_at: '2026-10-19T12:00:00Z',
      }]);
      if (url.includes('/object/sign/')) return Response.json({ signedURL: state.signedURL || '/object/sign/ff-review-media/owner/submission-id/media.gif?token=PUBLIC_SIGNED_LINK' });
      return new Response(null, { status: 204 });
    },
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: 'uploads.js' });
  await context.window.FFUploads.ready;
  return { api: context.window.FFUploads, calls, store, state };
}

function requests(calls, fragment) { return calls.filter(call => call.url.includes(fragment)); }

(async () => {
  // Public defaults stay safe, including accidental secret/service-role keys.
  for (const config of [
    { url: '', publishableKey: '' },
    { ...PUBLIC_CONFIG, url: 'http://example.supabase.co' },
    { ...PUBLIC_CONFIG, url: 'https://user:password@example.supabase.co' },
    { ...PUBLIC_CONFIG, url: 'https://example.supabase.co/private/path' },
    { ...PUBLIC_CONFIG, url: 'https://example.supabase.co?token=private' },
    { ...PUBLIC_CONFIG, publishableKey: 'sb_secret_NEVER_PUT_THIS_ON_THE_WEBSITE' },
    { ...PUBLIC_CONFIG, publishableKey: jwt('service_role') },
    { ...PUBLIC_CONFIG, publishableKey: jwt('authenticated') },
    { ...PUBLIC_CONFIG, publishableKey: 'not-a-public-key' },
  ]) {
    const { api, calls } = await harness({ config });
    assert.equal(api.configured, false);
    await assert.rejects(api.listApproved('emotes', 'all'), /Uploads are not connected/);
    assert.equal(calls.length, 1, 'An invalid config must never contact the service.');
  }
  for (const options of [{ configMalformed: true }, { failNetwork: 'uploads-config.json' }]) {
    assert.equal((await harness(options)).api.configured, false);
  }
  assert.equal((await harness({ config: { ...PUBLIC_CONFIG, publishableKey: jwt('anon') } })).api.configured, true);

  const { api, calls, store, state } = await harness();
  assert.equal(api.configured, true);
  assert.equal(await api.isReviewer(), false);
  const approved = await api.listApproved('emotes', 'all');
  assert.equal(approved.length, 1);
  assert.equal(approved[0].collectionId, 'all');
  assert.equal(approved[0].src, `${PUBLIC_CONFIG.url}/storage/v1/object/sign/ff-review-media/owner/submission-id/media.gif?token=PUBLIC_SIGNED_LINK`);
  assert.equal(requests(calls, '/auth/v1/').length, 0, 'Browsing must not create a visitor account.');
  for (const call of calls.filter(call => call.url.startsWith(PUBLIC_CONFIG.url))) {
    assert.equal(call.request.headers.Authorization, undefined, 'Public reads use the public API key only.');
    assert.equal(call.request.headers.apikey, PUBLIC_CONFIG.publishableKey);
  }

  // Reject invalid payloads before creating anonymous users or uploading bytes.
  const input = { section: 'emotes', collectionId: 'all', name: 'Wave', file: gif };
  await assert.rejects(api.submit({ ...input, name: 'X' }), /between 2 and 120/);
  await assert.rejects(api.submit({ ...input, collectionId: 'invented' }), /valid category/);
  await assert.rejects(api.submit({ ...input, file: new Blob(['<html>bad</html>'], { type: 'image/gif' }) }), /supported/);
  await assert.rejects(api.submit({ ...input, file: new Blob(['GIF89a1234'], { type: 'image/png' }) }), /supported/);
  await assert.rejects(api.submit({ ...input, file: png }), /Emotes must be GIF/);
  await assert.rejects(api.submit({ section: 'vehicles', collectionId: 'horse', name: 'Horse', file: mp4 }), /Choose a PNG/);
  const oversized = new class extends Blob { get size() { return 20 * 1024 * 1024 + 1; } }(['GIF89a']);
  await assert.rejects(api.submit({ ...input, file: oversized }), /20 MB or smaller/);
  assert.equal(requests(calls, '/auth/v1/signup').length, 0);

  const signsBeforeSubmit = requests(calls, '/object/sign/').length;
  state.failPath = '/object/sign/';
  const receipt = await api.submit(input);
  state.failPath = '';
  assert.equal(receipt.status, 'pending');
  assert.equal(receipt.kind, 'gif');
  assert.equal(receipt.src, undefined, 'A successful receipt does not need a media URL.');
  assert.equal(requests(calls, '/object/sign/').length, signsBeforeSubmit, 'Submitting must succeed after finalization without a signing request.');
  assert.equal(api.user.isAnonymous, true);
  assert.equal(requests(calls, '/auth/v1/signup').length, 1);
  assert.equal(requests(calls, '/auth/v1/signup')[0].request.headers.Authorization, undefined);
  assert.equal(requests(calls, '/rpc/ff_finalize_submission')[0].request.headers.Authorization, 'Bearer anonymous-token');
  const insert = requests(calls, '/rest/v1/ff_submissions').find(call => call.request.method === 'POST');
  assert.equal(JSON.parse(insert.request.body).status, undefined, 'Visitors must not choose their approval status.');
  assert.equal(JSON.parse(insert.request.body).owner_id, undefined, 'The server owns user identity.');
  await assert.rejects(api.listPending(), /Only the website owner/);
  await assert.rejects(api.review(receipt.id, 'approved'), /Only the website owner/);

  await api.login('owner@example.test', 'test-password');
  assert.equal(await api.isReviewer(), true);
  assert.equal((await api.listPending()).length, 1);
  await api.review('submission-id', 'approved');
  assert.equal(requests(calls, '/rpc/ff_review_submission')[0].request.headers.Authorization, 'Bearer owner-token');
  assert.deepEqual(Object.keys(api.user).sort(), ['email', 'id', 'isAnonymous']);
  assert.ok(!JSON.stringify(api.user).includes('owner-token'), 'UI-facing user data must not expose tokens.');

  state.failPath = '/rpc/ff_finalize_submission';
  await assert.rejects(api.submit({ section: 'vehicles', collectionId: 'horse', name: 'Horse', file: gif }), /could not be submitted/);
  assert.equal(calls.some(call => call.url.includes('/storage/v1/object/') && call.request.method === 'DELETE'), false, 'Browser cleanup must never delete storage objects.');
  assert.ok(calls.some(call => call.url.includes('/rest/v1/ff_submissions?id=eq.') && call.request.method === 'DELETE'));
  state.failPath = '';
  await api.logout();
  assert.equal(api.user, null);
  assert.equal(store.size, 0);

  // A failed published read must be visible, never mistaken for an empty gallery.
  state.failPath = '/rest/v1/ff_submissions?select=';
  await assert.rejects(api.listApproved('emotes', 'all'), /gallery could not be loaded/);
  state.failPath = '/object/sign/';
  await assert.rejects(api.listApproved('emotes', 'all'), /gallery could not be loaded/);
  state.failPath = '';
  state.signedURL = 'https://untrusted.example/private-media';
  await assert.rejects(api.listApproved('emotes', 'all'), /gallery could not be loaded/);

  // Public metadata AND signing must ignore expired/revoked visitor/owner tokens.
  for (const [id, isAnonymous] of [[VISITOR, true], [OWNER, false]]) {
    const stored = { access_token: 'revoked-access', refresh_token: 'revoked-refresh', expires_at: 1, user: { id, email: isAnonymous ? '' : 'owner@example.test', isAnonymous } };
    const stale = await harness({ session: stored });
    assert.equal((await stale.api.listApproved('emotes', 'all')).length, 1);
    assert.equal(requests(stale.calls, '/auth/v1/').length, 0, 'Public galleries must not refresh stale sessions.');
    assert.ok(stale.calls.filter(call => call.url.startsWith(PUBLIC_CONFIG.url)).every(call => !call.request.headers.Authorization));
    await assert.rejects(stale.api.isReviewer(), /session expired/);
    assert.equal(stale.api.user, null, 'A rejected refresh must discard the stale session.');
    assert.equal((await stale.api.listApproved('emotes', 'all')).length, 1);
  }
  const revokedButUnexpired = await harness({ session: { access_token: 'revoked-access', refresh_token: 'revoked-refresh', expires_at: Date.now() / 1000 + 3600, user: { id: OWNER } } });
  assert.equal((await revokedButUnexpired.api.listApproved('emotes', 'all')).length, 1);
  assert.ok(revokedButUnexpired.calls.filter(call => call.url.startsWith(PUBLIC_CONFIG.url)).every(call => !call.request.headers.Authorization));

  const memoryOnly = await harness({ storageDisabled: true });
  await memoryOnly.api.login('owner@example.test', 'test-password');
  assert.equal(await memoryOnly.api.isReviewer(), true);
  await memoryOnly.api.logout();
  assert.equal(memoryOnly.api.user, null);

  console.log('Uploads client: safe configuration, public galleries with stale sessions, file validation, anonymous submission, owner review, private signing, cleanup and logout passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
