# WordCraft for Nextcloud (`wordcraft`)

Edit **Office documents and PDFs directly in Nextcloud** using the open‑source,
Rust/WebAssembly editors from the [ArtCraft](https://github.com/storytold) project —
an OnlyOffice/Collabora‑style integration, but fully self‑contained (no separate document
server, no Docker, no external service).

| Type  | Editor     | Open | Save back | New document | Default on click |
|-------|------------|:----:|:---------:|:------------:|:----------------:|
| docx  | WordCraft  | ✅   | ✅        | ✅           | ✅ |
| xlsx  | GridCraft  | ✅   | ✅        | ✅           | ✅ |
| pptx  | DeckCraft  | ✅   | ✅        | ✅           | ✅ |
| pdf   | PdfCraft   | ✅   | ✅        | ✅           | ❌ (menu only — the built‑in viewer stays the click action) |

> ⚠️ **Unofficial.** This app is **not affiliated with or endorsed by ArtCraft / storytold**.
> "WordCraft", "GridCraft", "DeckCraft", "PdfCraft" are names of their projects; used here
> descriptively. The editors are **alpha** software — expect rough edges; no warranty.

## How it works

The app registers Nextcloud **file actions** and **"＋ New"** menu entries. Opening a file
shows the editor **embedded in an overlay** (with an "open in new tab / fullscreen" button).
The editors are **bundled inside this app** and served from its own web root
(`/apps/wordcraft/editors/<app>/`) — so the editor runs **same‑origin** with the Nextcloud
session, which is what makes loading and saving work without any extra login.

Two integration mechanisms (both documented in [UPDATING.md](UPDATING.md)):

- **host‑bridge** (GridCraft, PdfCraft): the editors ship a built‑in `?host=parent`
  `postMessage` bridge. The app sends the file in (`*:open`) and receives saves (`*:save`)
  and writes them back to Nextcloud over WebDAV. **No editor code patch needed.**
- **URL params** (WordCraft, DeckCraft): a small fork patch adds `?src=`/`?save=`/`?user=`
  so the editor fetches the file and `PUT`s it back over WebDAV itself (CSRF‑protected).

**DirectEditing** (since 1.3.0): the app also registers as a Nextcloud **editor** via the
`DirectEditing` API (`lib/DirectEditing/ArtCraftEditor.php`), so the **mobile/desktop clients**
and "Open with" offer ArtCraft for docx/xlsx/pptx (pdf optional), with four "New document"
creators. `open(token)` renders a full‑page host (`templates/directedit.php` +
`js/wordcraft-directedit.mjs`) that embeds the matching editor for the token's file.

Saving writes the file back via `remote.php/dav` with the session's `requesttoken`.
Recovery relies on Nextcloud's built‑in **file versions** (`files_versions`), which snapshot
every save.

## Requirements

- Nextcloud **30–33** (tested on 33), PHP 8.4.
- The editor static files served by the web server (the bundled `editors/.htaccess` sets the
  `application/wasm` MIME type, gzip and long‑cache headers — needs `mod_mime`, `mod_headers`,
  `mod_deflate` and `AllowOverride` on the Nextcloud web root).

## Install (prebuilt package)

```bash
tar xzf wordcraft-nc-<version>.tar.gz -C /path/to/nextcloud/apps/
sudo -u www-data php /path/to/nextcloud/occ app:enable wordcraft
```
The package ships the four editor builds in `editors/`. (This Nextcloud instance keeps custom
apps in `apps/` — `custom_apps/` is **not** in `apps_paths` here, so install into `apps/`.)

## Build from source

The big WASM editors are **not** in git (`editors/` is git‑ignored). To build/update them and
assemble the app, see **[UPDATING.md](UPDATING.md)** and `scripts/`.

## Repository layout

```
appinfo/info.xml            App manifest (id, version, NC compat)
lib/AppInfo/Application.php  Bootstrap: loads the Files script
lib/Listener/…              Loads js/wordcraft-main.mjs in the Files app
src/main.js                 File actions, "New" menu, overlay, bridge + URL glue
esbuild.mjs                 Bundles src/ → js/wordcraft-main.mjs (@nextcloud/files v4)
src/blank-*.b64             Minimal blank docx/xlsx/pptx/pdf templates (for "New")
editors/.htaccess           MIME + cache + gzip for the served editor assets
editors/<app>/              (git‑ignored) the four prebuilt WASM editors + their LICENSE files
patches/<app>-nextcloud.patch  The Nextcloud‑integration diff for each upstream editor
scripts/                    build + assemble + deploy helpers
UPDATING.md                 How to track upstream editor updates (read this for maintenance)
LICENSING.md                Licensing & attribution (editors are MIT/Apache; see file)
```

## License

App glue: **MIT** (see `LICENSE`). Bundled editors: **MIT OR Apache‑2.0** © ArtCraft Team,
retained in `editors/<app>/LICENSE-*`. Details in **[LICENSING.md](LICENSING.md)**.
