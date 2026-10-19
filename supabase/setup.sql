-- Run this entire file in the SQL Editor of YOUR Supabase project.
-- Re-running it is safe. It changes only the ff_* tables/functions/policies
-- and the dedicated ff-review-media bucket. No service-role key is needed.
begin;

create table if not exists public.ff_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.ff_reviewers enable row level security;
revoke all on public.ff_reviewers from anon, authenticated;
grant select on public.ff_reviewers to authenticated;
drop policy if exists ff_reviewer_self on public.ff_reviewers;
create policy ff_reviewer_self on public.ff_reviewers for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.ff_is_reviewer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.ff_reviewers where user_id = auth.uid());
$$;
revoke all on function public.ff_is_reviewer() from public;
grant execute on function public.ff_is_reviewer() to anon, authenticated;

create table if not exists public.ff_allowed_collections (
  section text not null check (section in ('collaborations', 'emotes', 'vehicles', 'guns')),
  collection_id text not null check (collection_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  primary key (section, collection_id)
);
alter table public.ff_allowed_collections enable row level security;
revoke all on public.ff_allowed_collections from anon, authenticated;
grant select on public.ff_allowed_collections to anon, authenticated;
drop policy if exists ff_collections_read on public.ff_allowed_collections;
create policy ff_collections_read on public.ff_allowed_collections for select to anon, authenticated using (true);

-- BEGIN COLLECTION SEED (matches collections.json and catalog.json).
insert into public.ff_allowed_collections (section, collection_id) values
  ('collaborations', 'money-heist'),
  ('collaborations', 'justin-bieber'),
  ('collaborations', 'cr7'),
  ('collaborations', 'street-fighter'),
  ('collaborations', 'mc-laren'),
  ('collaborations', 'spider-man'),
  ('collaborations', 'naruto-shippuden'),
  ('collaborations', 'venom'),
  ('collaborations', 'one-punch-man'),
  ('collaborations', 'jujutsu-kaisen'),
  ('collaborations', 'blue-lock'),
  ('collaborations', 'mama'),
  ('collaborations', 'infinix'),
  ('collaborations', 'samsung'),
  ('collaborations', 'red-bull'),
  ('collaborations', 'ben-10'),
  ('collaborations', 'devil-may-cry-5'),
  ('collaborations', 'bts'),
  ('collaborations', 'lamborghini'),
  ('collaborations', 'digimon'),
  ('collaborations', 'choppy-cuts'),
  ('collaborations', 'assassins-creed'),
  ('collaborations', 'attack-on-titans'),
  ('collaborations', 'puma'),
  ('collaborations', 'alok'),
  ('collaborations', 'j-balvin'),
  ('collaborations', 'carlas-dream'),
  ('collaborations', 'gillette'),
  ('collaborations', 'pringles'),
  ('collaborations', 'brazil-fc'),
  ('collaborations', 'corinthians'),
  ('collaborations', 'shopee'),
  ('collaborations', 'rog'),
  ('collaborations', 'jkt48'),
  ('collaborations', 'gintama'),
  ('vehicles', 'sports-car'),
  ('vehicles', 'motorbike'),
  ('vehicles', 'monster-truck'),
  ('vehicles', 'pickup-truck'),
  ('vehicles', 'jeep'),
  ('vehicles', 'amphibian'),
  ('vehicles', 'tuk-tuk'),
  ('vehicles', 'horse'),
  ('emotes', 'all'),
  ('guns', 'xm8'),
  ('guns', 'm4a1'),
  ('guns', 'scar'),
  ('guns', 'ak47'),
  ('guns', 'groza'),
  ('guns', 'famas'),
  ('guns', 'an94'),
  ('guns', 'plasma'),
  ('guns', 'aug'),
  ('guns', 'parafal'),
  ('guns', 'kingfisher'),
  ('guns', 'g36'),
  ('guns', 'cg15'),
  ('guns', 'p90'),
  ('guns', 'mp40'),
  ('guns', 'ump'),
  ('guns', 'mp5'),
  ('guns', 'vss'),
  ('guns', 'thompson'),
  ('guns', 'vector'),
  ('guns', 'mac10'),
  ('guns', 'bizon'),
  ('guns', 'vsk94'),
  ('guns', 'kar98k'),
  ('guns', 'awm'),
  ('guns', 'm82b'),
  ('guns', 'healingsniper'),
  ('guns', 'm24'),
  ('guns', 'trogon'),
  ('guns', 'm590'),
  ('guns', 'spas12'),
  ('guns', 'm1014'),
  ('guns', 'mag7'),
  ('guns', 'm1887'),
  ('guns', 'chargebuster'),
  ('guns', 'usp'),
  ('guns', 'g18'),
  ('guns', 'desert-eagle'),
  ('guns', 'm500'),
  ('guns', 'm1917'),
  ('guns', 'usp-2'),
  ('guns', 'treatment-pistol'),
  ('guns', 'pan'),
  ('guns', 'bat'),
  ('guns', 'katana'),
  ('guns', 'parang'),
  ('guns', 'scythe'),
  ('guns', 'rgs50'),
  ('guns', 'mgl140'),
  ('guns', 'm79'),
  ('guns', 'sks'),
  ('guns', 'svd'),
  ('guns', 'woodpecker'),
  ('guns', 'ac80'),
  ('guns', 'm60'),
  ('guns', 'm249'),
  ('guns', 'kord'),
  ('guns', 'crossbow'),
  ('guns', 'grenade'),
  ('guns', 'gloo-wall'),
  ('guns', 'smoke-grenade'),
  ('guns', 'flash-freeze'),
  ('guns', 'rpk'),
  ('guns', 'gatling'),
  ('guns', 'ff-knife'),
  ('guns', 'shield-gun'),
  ('guns', 'treatment-laser'),
  ('guns', 'm7'),
  ('guns', 'fgl-24'),
  ('guns', 'm1873'),
  ('guns', 'hand-cannon'),
  ('guns', 'uzi'),
  ('guns', 'flamethrower'),
  ('guns', 'winchester'),
  ('guns', 'm14'),
  ('guns', 'skorp'),
  ('guns', 'hawk')
on conflict (section, collection_id) do nothing;
-- END COLLECTION SEED.

create table if not exists public.ff_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  section text not null,
  collection_id text not null,
  name text not null check (char_length(name) between 2 and 120 and name = btrim(name)),
  kind text not null check (kind in ('image', 'gif', 'video')),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm')),
  byte_size bigint not null check (byte_size between 1 and 20971520),
  storage_path text generated always as (
    owner_id::text || '/' || id::text || '/media.' || case mime_type
      when 'image/png' then 'png' when 'image/jpeg' then 'jpg'
      when 'image/webp' then 'webp' when 'image/gif' then 'gif'
      when 'video/mp4' then 'mp4' when 'video/webm' then 'webm' end
  ) stored,
  status text not null default 'uploading' check (status in ('uploading', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  foreign key (section, collection_id) references public.ff_allowed_collections(section, collection_id),
  constraint ff_kind_matches_mime check (
    (kind = 'image' and mime_type in ('image/png', 'image/jpeg', 'image/webp')) or
    (kind = 'gif' and mime_type = 'image/gif') or
    (kind = 'video' and mime_type in ('video/mp4', 'video/webm'))
  ),
  constraint ff_section_matches_media check (
    (section = 'emotes' and kind in ('gif', 'video')) or
    (section <> 'emotes' and kind in ('image', 'gif'))
  ),
  constraint ff_review_fields check (
    (status in ('uploading', 'pending') and reviewed_at is null and reviewed_by is null) or
    (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);
create index if not exists ff_submissions_gallery on public.ff_submissions(section, collection_id, status, created_at desc);
create index if not exists ff_submissions_owner on public.ff_submissions(owner_id, status);
create unique index if not exists ff_submissions_storage_path on public.ff_submissions(storage_path);
alter table public.ff_submissions enable row level security;
revoke all on public.ff_submissions from anon, authenticated;
grant select on public.ff_submissions to anon, authenticated;
grant insert (id, section, collection_id, name, kind, mime_type, byte_size) on public.ff_submissions to authenticated;
grant delete on public.ff_submissions to authenticated;

drop policy if exists ff_submission_read on public.ff_submissions;
create policy ff_submission_read on public.ff_submissions for select to anon, authenticated
  using (status = 'approved' or owner_id = (select auth.uid()) or (select public.ff_is_reviewer()));
drop policy if exists ff_submission_insert on public.ff_submissions;
create policy ff_submission_insert on public.ff_submissions for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'uploading' and reviewed_by is null and reviewed_at is null);
drop policy if exists ff_submission_cleanup on public.ff_submissions;
create policy ff_submission_cleanup on public.ff_submissions for delete to authenticated
  using (owner_id = (select auth.uid()) and status = 'uploading');

-- Protect payloads as well as the state machine. No browser has UPDATE privileges.
create or replace function public.ff_guard_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or new.owner_id <> auth.uid() or new.status <> 'uploading'
       or new.reviewed_by is not null or new.reviewed_at is not null then
      raise exception 'Submission ownership or status is invalid.';
    end if;
    -- Serialize this user's insert quota, including simultaneous browser tabs.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 0));
    if not public.ff_is_reviewer() and
       (select count(*) from public.ff_submissions where owner_id = new.owner_id and status in ('uploading', 'pending')) >= 10 then
      raise exception 'There are already ten submissions waiting for this visitor.';
    end if;
    return new;
  end if;
  if row(new.id, new.owner_id, new.section, new.collection_id, new.name, new.kind, new.mime_type, new.byte_size, new.created_at)
     is distinct from row(old.id, old.owner_id, old.section, old.collection_id, old.name, old.kind, old.mime_type, old.byte_size, old.created_at) then
    raise exception 'Submission content cannot be changed.';
  end if;
  if old.status = 'uploading' and new.status = 'pending' and old.owner_id = auth.uid()
     and new.reviewed_by is null and new.reviewed_at is null then return new; end if;
  if old.status = 'pending' and new.status in ('approved', 'rejected') and public.ff_is_reviewer()
     and new.reviewed_by = auth.uid() and new.reviewed_at is not null then return new; end if;
  raise exception 'This submission status change is not allowed.';
end;
$$;
revoke all on function public.ff_guard_submission() from public;
drop trigger if exists ff_guard_submission on public.ff_submissions;
create trigger ff_guard_submission before insert or update on public.ff_submissions
  for each row execute function public.ff_guard_submission();

-- The bucket is PRIVATE. Signing a URL must pass the SELECT policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ff-review-media', 'ff-review-media', false, 20971520,
  array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.ff_media_visible(object_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.ff_submissions s where s.storage_path = object_path
    and (s.status = 'approved' or s.owner_id = auth.uid() or public.ff_is_reviewer()));
$$;
create or replace function public.ff_media_uploadable(object_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.ff_submissions s where s.storage_path = object_path
    and s.owner_id = auth.uid() and s.status = 'uploading');
$$;
revoke all on function public.ff_media_visible(text), public.ff_media_uploadable(text) from public;
grant execute on function public.ff_media_visible(text) to anon, authenticated;
grant execute on function public.ff_media_uploadable(text) to authenticated;

drop policy if exists ff_media_read on storage.objects;
create policy ff_media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'ff-review-media' and public.ff_media_visible(name));
drop policy if exists ff_media_insert on storage.objects;
create policy ff_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'ff-review-media' and public.ff_media_uploadable(name));
drop policy if exists ff_media_cleanup on storage.objects;
-- There is deliberately no visitor UPDATE or DELETE policy. A delayed Storage
-- deletion must never be able to race with finalization or approval. Failed
-- uploads may leave private orphan objects for the owner to clean up manually.

create or replace function public.ff_submission_has_media(submission_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.ff_submissions s join storage.objects o
    on o.bucket_id = 'ff-review-media' and o.name = s.storage_path
    where s.id = submission_id and o.metadata->>'mimetype' = s.mime_type
      and (o.metadata->>'size')::numeric = s.byte_size);
$$;
revoke all on function public.ff_submission_has_media(uuid) from public;

create or replace function public.ff_finalize_submission(submission_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare item public.ff_submissions;
begin
  select * into item from public.ff_submissions where id = submission_id for update;
  if not found or item.owner_id is distinct from auth.uid() or item.status <> 'uploading' then
    raise exception 'Only the uploader can submit an unfinished upload.';
  end if;
  if not public.ff_submission_has_media(submission_id) then
    raise exception 'The uploaded media is missing or does not match the submission.';
  end if;
  update public.ff_submissions set status = 'pending' where id = submission_id;
end;
$$;
revoke all on function public.ff_finalize_submission(uuid) from public;
grant execute on function public.ff_finalize_submission(uuid) to authenticated;

create or replace function public.ff_review_submission(submission_id uuid, decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare item public.ff_submissions;
begin
  if not public.ff_is_reviewer() then raise exception 'Only a reviewer can approve or reject submissions.'; end if;
  if decision not in ('approved', 'rejected') or decision is null then raise exception 'Invalid review decision.'; end if;
  select * into item from public.ff_submissions where id = submission_id for update;
  if not found or item.status <> 'pending' then raise exception 'This submission is not waiting for review.'; end if;
  if decision = 'approved' and not public.ff_submission_has_media(submission_id) then
    raise exception 'The uploaded media is missing or does not match the submission.';
  end if;
  update public.ff_submissions set status = decision, reviewed_by = auth.uid(), reviewed_at = now()
    where id = submission_id;
end;
$$;
revoke all on function public.ff_review_submission(uuid, text) from public;
grant execute on function public.ff_review_submission(uuid, text) to authenticated;

commit;

-- AFTER creating your owner account in Authentication > Users, run:
-- insert into public.ff_reviewers (user_id)
-- select id from auth.users where lower(email) = lower('YOUR-OWNER-EMAIL')
-- on conflict (user_id) do nothing;
-- Never grant this role to visitor accounts. The allowlist is editable only from
-- the SQL dashboard, not by visitors or by the public website.
