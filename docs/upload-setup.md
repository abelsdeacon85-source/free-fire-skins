# Connect visitor uploads and your review inbox

The website runs on GitHub Pages. GitHub Pages cannot store visitor uploads by itself. The new galleries and sidebar work now; uploading and the owner inbox become available after you connect a Supabase project. Until then, the site displays a setup message instead of pretending an upload was saved.

You only need to do this once. Supabase stores the pictures, GIFs, videos, and approval decisions. Your existing gun catalog stays in the repository.

## 1. Create your upload service

1. Open [Supabase](https://supabase.com/dashboard) and create an account and a new project. Keep the database password somewhere private. Wait for the project to finish starting.
2. Open **Authentication → Sign In / Providers** and enable **Anonymous Sign-Ins**. This lets visitors submit without creating an account. It does not give them permission to publish anything.
3. Keep email/password sign-in enabled for your owner account. In **Authentication → Users**, use **Add user → Create new user** to create your owner account with your email and a strong password. Mark the email confirmed if that option is shown. This is the account you will use in the website's review inbox.
4. Open **SQL Editor → New query**. Open [setup.sql](../supabase/setup.sql) in this repository, copy the whole file, paste it into the query, and click **Run**. It creates only the site's `ff_*` tables, access rules, and private `ff-review-media` storage bucket. The script can be run again safely.
5. Still in the SQL Editor, run this separate query, replacing the example email with the exact email you used in step 3:

```sql
insert into public.ff_reviewers (user_id)
select id from auth.users
where lower(email) = lower('YOUR-OWNER-EMAIL')
on conflict (user_id) do nothing;
```

Check that your account was found:

```sql
select u.email
from public.ff_reviewers r
join auth.users u on u.id = r.user_id;
```

Only your email should be listed. To add by UUID instead, copy your user's ID from **Authentication → Users** and run:

```sql
insert into public.ff_reviewers (user_id)
values ('YOUR-USER-UUID')
on conflict (user_id) do nothing;
```

## 2. Connect the website

1. In Supabase, find your **Project URL** and **Publishable key** in the project's **Connect** panel or **Settings → API Keys**. A publishable key normally starts with `sb_publishable_`. The older public `anon` key also works.
2. In GitHub, open this repository and edit [uploads-config.json](../uploads-config.json). Replace the empty values:

```json
{
  "url": "https://YOUR-PROJECT.supabase.co",
  "publishableKey": "YOUR-PUBLIC-PUBLISHABLE-KEY"
}
```

3. Commit the file to `main`. Wait for GitHub Pages to update, then refresh your website.

The URL and publishable key are designed to be public. **Do not use a database password, `service_role` key, or `sb_secret_` key in this file.** Those bypass the approval rules. Your owner password belongs only in the review inbox sign-in form.

## 3. Try one upload and approve it

1. Open a collaboration, emotes, vehicle category, or gun page. Use **Add**, enter the item's name, and choose a file.
2. The submission goes into the private review inbox. It does not appear publicly yet.
3. Open the website's **Review inbox**, sign in using your owner email and password, and inspect the name and media.
4. Choose **Approve** to publish it, or **Reject** to keep it off the public website.
5. Refresh the public gallery in a separate private/incognito window. Only approved additions should appear.

Visitors can submit PNG, JPEG, WebP, or GIF pictures to guns, collaborations, and vehicles. Emotes accept GIF, MP4, or WebM files. Each file must be at most 20 MiB. Visitors can have up to ten unfinished or waiting submissions per anonymous session; the owner is exempt. File signatures and declared types are checked in the browser, and storage enforces type and size limits. Review every file before approving it.

Sessions stay in the current browser tab's session storage, with a memory fallback when storage is disabled. Signing out removes the session from the browser. Signed media links last one hour; refreshing the page requests fresh links. A rejected file stays private and is not added to the public galleries.

## Add the nine new collaborations to an existing project

If you already ran the earlier setup, open **Supabase → SQL Editor → New snippet** and run [add-collaborations.sql](../supabase/add-collaborations.sql). This small query adds only the nine new collaboration IDs: SNICKERS, KSHMR, Soul Land, Nailoong, Squid Game, NANYANG, Demon Slayer, Ragnarok, and HRK. Their Add forms can then submit files for review. The query can be run again safely, including if you already enabled the first three brands. New projects running the current `setup.sql` already include all nine.

The website pages and logos are published through GitHub; enabling their upload categories requires this database step in your Supabase project.

## Troubleshooting

- **“Uploads are not connected yet”**: check both config values, commit them, and refresh after Pages finishes deploying. The URL must use HTTPS. Private keys are rejected by the client.
- **“The upload failed”**: check that anonymous sign-ins are enabled and that the entire SQL setup completed. Also check your Supabase storage quota, project status, and authentication rate limits. If ten submissions are already waiting for this visitor, review those first.
- **“Only the website owner can review submissions”**: confirm the signed-in account appears in the reviewer query above. Creating an account alone does not make it a reviewer.
- **“The gallery could not be loaded”**: the service may be paused, unavailable, or misconfigured. The page displays the error so a failed request does not look like an empty gallery. Refresh after restoring the project.
- **You added a new gun or category later**: the SQL file includes the current 44 collaboration brands, eight vehicle categories, emotes, and 77 guns. Add new IDs to `ff_allowed_collections` in the SQL Editor. For example:

```sql
insert into public.ff_allowed_collections (section, collection_id)
values ('guns', 'new-gun-id')
on conflict (section, collection_id) do nothing;
```

The ID must match the item's ID in `catalog.json` or `collections.json` exactly. Do not add invented IDs for existing categories.

## Storage and maintenance

Keep `ff-review-media` **private**. Do not add public-read, visitor-update, or visitor-delete policies to it. The included policies let the public view approved files, uploaders view their own private submissions, and your reviewer account inspect pending files. Approving a submission changes its status; visitors cannot approve themselves, replace or delete approved media, or edit an approved name.

Check your Supabase usage and upload limits as the website grows. Anonymous sign-ins can be abused; Supabase supports CAPTCHA and rate limits if needed. When an upload fails, the browser tries to remove its unfinished submission row. Any leftover file stays private and can no longer be signed through the website after that row is removed. The browser deliberately cannot delete storage files: this prevents a delayed delete request from removing media after approval. Network failures can also leave an unfinished row. Inspect and clean up these files in the Supabase dashboard; do not delete media belonging to a pending or approved row. The client does not automatically erase rejected files or revoke approval.

No Supabase project is created by publishing this repository. This guide requires setup in your own account. The live inbox cannot be verified until that project is connected.
