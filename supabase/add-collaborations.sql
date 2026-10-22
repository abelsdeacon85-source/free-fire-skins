-- Run in Supabase > SQL Editor for an already-configured website.
-- Re-running is safe. This only enables submissions to these ten collections.
insert into public.ff_allowed_collections (section, collection_id) values
  ('collaborations', 'snickers'),
  ('collaborations', 'kshmr'),
  ('collaborations', 'soul-land'),
  ('collaborations', 'nailoong'),
  ('collaborations', 'squid-game'),
  ('collaborations', 'nanyang'),
  ('collaborations', 'demon-slayer'),
  ('collaborations', 'ragnarok'),
  ('collaborations', 'hrk'),
  ('collaborations', 'club-america')
on conflict (section, collection_id) do nothing;
