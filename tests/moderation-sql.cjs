/* Install test-only dependency outside the site:
   npm install --prefix /tmp/ff-upload-tests --cache /tmp/ff-npm-cache @electric-sql/pglite
   node tests/moderation-sql.cjs
*/
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PGLITE_MODULE || '/tmp/ff-upload-tests/node_modules/@electric-sql/pglite');

(async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text, metadata jsonb);
    alter table storage.objects enable row level security;
    grant usage on schema auth, storage, public to anon, authenticated;
    grant select, insert, delete on storage.objects to anon, authenticated;
  `);
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/setup.sql'), 'utf8');
  await db.exec(sql);
  await db.exec(sql); // Scoped setup is safely repeatable.
  const visitor = '00000000-0000-4000-8000-000000000001';
  const stranger = '00000000-0000-4000-8000-000000000002';
  const reviewer = '00000000-0000-4000-8000-000000000003';
  const first = '00000000-0000-4000-8000-100000000001';
  const rejected = '00000000-0000-4000-8000-100000000002';
  const unfinished = '00000000-0000-4000-8000-100000000003';
  await db.query('insert into auth.users (id,email) values ($1,$2),($3,$4),($5,$6)', [visitor,'visitor@test',stranger,'stranger@test',reviewer,'owner@test']);
  await db.query('insert into public.ff_reviewers values ($1)', [reviewer]);
  async function as(role, id = '') {
    await db.exec(`reset role; set role ${role};`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  }
  async function count(table) { return Number((await db.query(`select count(*) as n from ${table}`)).rows[0].n); }
  async function insert(id, section='collaborations', collection='money-heist', kind='gif', mime='image/gif') {
    await db.query('insert into public.ff_submissions (id,section,collection_id,name,kind,mime_type,byte_size) values ($1,$2,$3,$4,$5,$6,128)', [id,section,collection,'Test media',kind,mime]);
  }
  async function media(id, owner=visitor, size=128) {
    await db.query("insert into storage.objects (bucket_id,name,metadata) values ('ff-review-media',$1,$2)", [`${owner}/${id}/media.gif`, { mimetype:'image/gif',size }]);
  }
  await as('anon');
  assert.equal(await count('public.ff_submissions'), 0);
  await assert.rejects(insert(first));
  await as('authenticated', visitor);
  assert.equal((await db.query('select public.ff_is_reviewer() as yes')).rows[0].yes, false);
  await assert.rejects(db.query('insert into public.ff_reviewers values ($1)', [visitor]));
  await assert.rejects(db.query("insert into public.ff_submissions (owner_id,section,collection_id,name,kind,mime_type,byte_size) values ($1,'collaborations','money-heist','Spoof','gif','image/gif',128)", [stranger]));
  await assert.rejects(db.query("insert into public.ff_submissions (status,section,collection_id,name,kind,mime_type,byte_size) values ('approved','collaborations','money-heist','Self approve','gif','image/gif',128)"));
  await assert.rejects(insert(first, 'emotes','all','image','image/png'));
  await assert.rejects(insert(first, 'guns','invented','gif','image/gif'));
  await insert(first);
  await assert.rejects(db.query("update public.ff_submissions set status='approved' where id=$1", [first]));
  await assert.rejects(db.query('select public.ff_finalize_submission($1)', [first]));
  await assert.rejects(db.query('select public.ff_review_submission($1,$2)', [first,'approved']));
  await as('authenticated', stranger);
  assert.equal(await count('public.ff_submissions'), 0);
  await assert.rejects(media(first));
  await assert.rejects(db.query('select public.ff_finalize_submission($1)', [first]));
  assert.equal((await db.query('select public.ff_media_visible($1) as yes',[`${visitor}/${first}/media.gif`])).rows[0].yes,false);
  await as('authenticated', visitor);
  await media(first, visitor, 129);
  await assert.rejects(db.query('select public.ff_finalize_submission($1)', [first]));
  await db.query('delete from storage.objects where name=$1', [`${visitor}/${first}/media.gif`]);
  assert.equal(await count('storage.objects'),1); // Visitors cannot delete even unfinished media.
  await as('postgres');
  await db.query('delete from storage.objects where name=$1', [`${visitor}/${first}/media.gif`]);
  await as('authenticated', visitor);
  await media(first);
  await db.query('select public.ff_finalize_submission($1)', [first]);
  assert.equal((await db.query('select status from public.ff_submissions where id=$1',[first])).rows[0].status,'pending');
  assert.equal(await count('storage.objects'),1);
  await assert.rejects(media(first)); // Cannot replace pending media via another insertion.
  await as('anon');
  assert.equal(await count('public.ff_submissions'),0);
  assert.equal(await count('storage.objects'),0);
  await as('authenticated', reviewer);
  assert.equal((await db.query('select public.ff_is_reviewer() as yes')).rows[0].yes,true);
  assert.equal(await count('public.ff_submissions'),1);
  assert.equal(await count('storage.objects'),1);
  await assert.rejects(db.query('select public.ff_review_submission($1,$2)', [first,'uploading']));
  await db.query('select public.ff_review_submission($1,$2)', [first,'approved']);
  await assert.rejects(db.query('select public.ff_review_submission($1,$2)', [first,'rejected']));
  await as('anon');
  assert.equal(await count('public.ff_submissions'),1);
  assert.equal(await count('storage.objects'),1);
  await as('authenticated', visitor);
  await db.query('delete from storage.objects where name=$1',[`${visitor}/${first}/media.gif`]);
  await db.query('delete from public.ff_submissions where id=$1',[first]);
  assert.equal(await count('storage.objects'),1);
  assert.equal(await count('public.ff_submissions'),1);
  await assert.rejects(db.query("update public.ff_submissions set name='Replaced' where id=$1",[first]));
  await insert(rejected);
  await media(rejected);
  await db.query('select public.ff_finalize_submission($1)',[rejected]);
  await insert(unfinished);
  await media(unfinished);
  await db.query('delete from storage.objects where name=$1',[`${visitor}/${unfinished}/media.gif`]);
  assert.equal(await count('storage.objects'),3); // Approved, pending, and unfinished remain.
  await db.query('delete from public.ff_submissions where id=$1',[unfinished]);
  assert.equal(await count('public.ff_submissions'),2);
  assert.equal(await count('storage.objects'),2); // The orphan is now private and unreachable.
  await as('authenticated', reviewer);
  await db.query('select public.ff_review_submission($1,$2)',[rejected,'rejected']);
  await as('anon');
  assert.equal(await count('public.ff_submissions'),1);
  assert.equal(await count('storage.objects'),1);
  await as('authenticated', stranger);
  assert.equal((await db.query('select public.ff_media_uploadable($1) as yes',[`${visitor}/${first}/media.gif`])).rows[0].yes,false);
  await as('postgres');
  assert.equal(Number((await db.query('select count(*) as n from storage.objects where name=$1',[`${visitor}/${unfinished}/media.gif`])).rows[0].n),1);
  const configured = (await db.query('select count(*) as n from public.ff_allowed_collections')).rows[0].n;
  assert.equal(Number(configured),121);
  const bucket = (await db.query("select * from storage.buckets where id='ff-review-media'")).rows[0];
  assert.equal(bucket.public,false);
  assert.equal(Number(bucket.file_size_limit),20*1024*1024);
  await db.close();
  console.log('Moderation SQL: setup rerun, RLS, ownership, spoofing, immutable approval, private media, missing/mismatched uploads, rejection and orphan isolation passed.');
})().catch(error => { console.error(error); process.exitCode=1; });
