# Free Fire Skin Vault

A static fan website: choose a category, choose a weapon, and browse skins and attribute changes. It works without an account, database, or build step.

## Run the website

From this folder, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the site through that server rather than opening the HTML file directly. The catalog is loaded from `catalog.json`.

## Add skins without coding

1. Choose **Manage catalog** in the top navigation.
2. Select a gun, enter the skin name and rarity, and add its attribute changes. Positive values mean increases; negative values mean decreases. These are the game's displayed change indicators, not percentages.
3. Add an image using a local upload (PNG, JPG, GIF, or WebP, up to 2 MB), an HTTPS URL, or a relative image path. Use images you have permission to publish. Empty or unavailable images show a text placeholder.
4. Include a source link. For YouTube, paste the video in **YouTube video link** and enter the moment showing the attribute panel in **Video timestamp**, such as `1:24`. Watch, Shorts, live, and youtu.be links are supported. A timestamp already in the link is also supported. Mark an entry as checked only after confirming the exact skin and its stats. Evolution levels can have different attributes; enter the level in the skin name when necessary.
5. Save the skin. To change an existing entry, use **Edit** beside it. To add a weapon, expand **Add a gun**.
6. **Export catalog** downloads a `catalog.json` backup. Uploaded images are included in that file.

Edits are saved in this browser only. They are not automatically shared with other visitors, devices, or browsers. Clearing browser data can erase your draft, so export backups. If storage is full, export immediately to preserve the changes that remain in memory.

## Publish changes

Replace the repository's `catalog.json` with the exported file, then deploy the entire folder to a static host such as GitHub Pages. Keep the JSON filename exactly `catalog.json`. New guns use `gun.html?id=their-id`, so they don't require another HTML file. **Import a catalog backup** restores a complete catalog in the current browser; export first to preserve your previous draft.

There is no public editing endpoint or shared database. A future authenticated admin service would be needed to publish editor changes directly from the website.

## Catalog coverage and accuracy

The catalog has 11 categories, 77 weapons/items, and 137 skin entries imported from the original project. The 15 added weapons have pictures and empty skin collections, with categories checked against Garena’s official weapon list (see [category sources](docs/weapon-categories.md)). This is not a complete or independently verified list of Free Fire skins. Weapons without entered skins show an explicit empty collection instead of a broken page.

Original image files were missing from the repository. The uploaded plain-gun archive now supplies 74 matched base weapon pictures; these appear on category cards and are separate from skin images. No gun-skin artwork has been invented. The first SCAR batches supply 24 skin pictures (11 animated GIFs and 13 JPEGs); additional skin pictures can be added through the editor. Two SCAR entries originally in the XM8 script have been moved to SCAR; other original skin stats remain unverified. Attribute spelling and display are standardized, and empty attribute slots are ignored.

During initial setup, the official Garena website and community wiki were inaccessible. Garena’s weapon catalog is now accessible and was used to verify categories for the added weapons. New skin attributes should be added from in-game evidence or a reliable source, not guessed. Existing `js_*.js` files are preserved as legacy reference; the website now uses `app.js` and `catalog.json`.

## Files

- `index.html`: category selection.
- Category pages such as `rifles.html`: weapon selection.
- `gun.html?id=m4a1` and legacy gun URLs such as `m4a1.html`: skin collections.
- `editor.html`: local catalog editing and backups.
- `catalog.json`: shared category, weapon, and skin data.
- `app.js`: shared navigation, rendering, filters, and editor.
- `styles.css`: responsive site styling.

All text from imported catalogs is rendered as text, not executable HTML. Imports are validated, including unique IDs, supported rarities, attribute ranges, and safe image/source URLs.

## Development checks

With the server running and Playwright/Chromium available:

```sh
node tests/smoke.cjs
node tests/video.cjs
node tests/gun-images.cjs
node tests/new-weapons.cjs
node tests/skin-images.cjs
```

The browser smoke test checks all catalog routes, the skin collections, search/filter/sort, editor persistence, new guns, editing/deletion, export/import/reset, mobile overflow, and browser errors. It uses an isolated browser session and does not change the published catalog. The video test checks URL/timestamp validation, edits, source synchronization, media backups, and unavailable thumbnails using synthetic fixture IDs; it does not claim to have researched live videos.

## Pictures and attributes from YouTube

Use a video that clearly shows the exact gun, skin name, skin level, and the in-game attribute panel. Copy the displayed increases/decreases into the editor and retain the video link with its timestamp. Adding a video link does not automatically verify stats or extract them from the video.

A saved YouTube link displays a small source-video preview and a **Watch source** link at the selected timestamp. The video thumbnail is labeled as a source preview and is separate from the actual skin picture. The thumbnail loads from YouTube only for entries with a video source; unavailable thumbnails keep the watch link accessible.

Upload a screenshot of the skin in the editor's image field. If you have a local video, this helper extracts a frame using ffmpeg without overwriting existing files:

```sh
python3 scripts/extract-video-frame.py /path/to/video.mp4 00:01:24 /path/to/skin.png
```

The helper reads a local file; it does not fetch YouTube videos. Attribute values still need to be read and checked from the captured frame. Each gun collection also includes a YouTube search link as a starting point for finding reference videos.

During this update, requests to YouTube and its thumbnail host returned a proxy 403. Required network domains have been saved in the environment draft: `youtube.com`, `www.youtube.com`, `youtu.be`, `i.ytimg.com`, and `*.googlevideo.com`, preserving the Garena/wiki domains. Apply the settings before retrying research. No new video-derived skin images or stats have been added while access remains blocked.

## Gun pictures and bulk image folders

Category pages show a picture on each weapon card. Set the gun's dedicated picture using **Manage catalog → Gun selection picture**: select a gun, upload a picture or enter its image path, and click **Save gun picture**. If no dedicated gun picture is set, the first skin image is used and labeled **Skin preview**. Missing pictures show a clear placeholder. Exporting the catalog includes gun pictures as well as skin pictures.

To have images matched in bulk, zip your existing image folders and upload the ZIP in chat, keeping the original filenames. A structure such as `M4A1/skin-name.png`, `AK47/skin-name.gif`, and `guns/xm8.png` helps distinguish weapons and skins. Existing folder names are fine; they do not need to be renamed before uploading. Unclear names need to be checked before assigning an image. Pictures alone do not supply verified attribute values.
