# Updating — tracking upstream editor releases

The four editors are **forks of fast‑moving alpha projects**. This file is the playbook to pull
a new upstream version, re‑apply our thin Nextcloud integration, rebuild, and re‑bundle.

Upstream repos:
- `https://github.com/storytold/wordcraft` (docx)
- `https://github.com/storytold/gridcraft` (xlsx)
- `https://github.com/storytold/deckcraft` (pptx)
- `https://github.com/storytold/pdfcraft` (pdf)

## What our patches change (so conflicts are trivial to resolve)

**GridCraft & PdfCraft — `patches/{gridcraft,pdfcraft}-nextcloud.patch` (tiny):**
Only `apps/<app>-web/index.html` — our animated loading bar. **No logic change**: these editors
already ship a built‑in host bridge (`?host=parent`) we drive from the app.

- Bridge protocol (verify it still matches `apps/<app>-web/src/*.rs` if saving breaks after an update):
  - iframe → parent: `{type:"<app>:ready", version}` — app is listening.
  - parent → iframe: `{type:"<app>:open", name, bytes}` (ArrayBuffer, transferred) — open this file.
  - iframe → parent: `{type:"<app>:save", name, bytes[, saveAs]}` — user saved; app `PUT`s to WebDAV.
  - Only the **same‑origin** parent window is honoured.

**WordCraft & DeckCraft — `patches/{wordcraft,deckcraft}-nextcloud.patch`:**
A thin fork patch (no host bridge upstream). It touches, in `apps/<app>-web/`:
- `src/web.rs`:
  - reads `?src=<url>` → `fetch`es the file → pushes it into the same **inbox** a drag‑drop uses
    (so the engine opens it exactly like a dropped file). `?name=` sets the file name;
    `?user=` sets the author/initials shown in the account badge (WordCraft).
  - the save/`download` service: when `?save=<url>` is set and the saved name equals the source
    name, it `PUT`s the bytes back over WebDAV instead of downloading — CSRF‑protected via
    `GET /index.php/csrftoken` → `requesttoken` header.
  - helper fns appended: `query_param`, `fetch_bytes/fetch_doc`, `put_back`, `fetch_csrf_token`
    (+ `save_back` in DeckCraft).
- `Cargo.toml`: enables `web-sys` features `Request, RequestInit, RequestCredentials, Response, Headers`.
- `index.html`: the loading bar.

If `trunk build` fails after a patch‑apply, the likely spots are the anchors above (the inbox
line, the `services()` download closure, the prefs/restore line). Re‑apply by hand from the
`.patch` hunks — they are small.

## One‑time: build host

Any Linux box with network + disk (≈1 GB per editor's `target/`). Needs **Rust + trunk**
(installed user‑local, no root):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
source ~/.cargo/env
rustup target add wasm32-unknown-unknown
curl -sSfL https://github.com/trunk-rs/trunk/releases/latest/download/trunk-x86_64-unknown-linux-gnu.tar.gz | tar xz -C ~/.cargo/bin trunk
```
For the app JS bundle you also need **Node ≥ 18** (`npm`).

## Update one editor

```bash
git clone https://github.com/storytold/<app>.git        # or: cd <app> && git pull
cd <app>
git apply --3way /path/to/this-repo/patches/<app>-nextcloud.patch   # resolve any conflicts
cd apps/<app>-web
trunk build --release                                   # output: ../../dist/web/
```

## Assemble + deploy the app

```bash
cd /path/to/this-repo
npm ci && npm run build                                 # → js/wordcraft-main.mjs
# copy each editor build + its licenses into the app:
for a in wordcraft gridcraft deckcraft pdfcraft; do
  rm -rf editors/$a && mkdir -p editors/$a
  cp -a /path/to/$a/dist/web/.      editors/$a/
  cp -a /path/to/$a/LICENSE-MIT /path/to/$a/LICENSE-APACHE editors/$a/
done
# editors/.htaccess is in git — keep it.
# bump <version> in appinfo/info.xml (so Nextcloud busts the asset cache!)
# deploy:
rsync -a --delete <this-repo-minus-.git> <nextcloud>/apps/wordcraft/
sudo -u www-data php <nextcloud>/occ app:disable wordcraft
sudo -u www-data php <nextcloud>/occ app:enable  wordcraft    # picks up new version → new cache-buster
```
`scripts/assemble.sh` wraps the assemble step.

## Gotchas learned the hard way

- **Bump `appinfo/info.xml` `<version>` on every change** — Nextcloud derives the JS cache‑buster
  from it; otherwise the browser serves the old `wordcraft-main.mjs` (symptom: new feature missing,
  old one still there). `occ app:disable && app:enable` refreshes it.
- **`@nextcloud/files` must match Nextcloud's major** (NC 33 → v4). v4: no `FileAction` class
  (`registerFileAction(plainObject)`), callbacks get a **context** (`context.nodes[0]`), and the
  shared registry lives on `window._nc_files_scope` (v3's `window._nc_fileactions` is dead).
- **Serve the WASM with `Content-Type: application/wasm`** (the bundled `.htaccess`) — otherwise the
  browser refuses to stream‑compile it.
- **Install into `apps/`, not `custom_apps/`** on this instance (`custom_apps` isn't in `apps_paths`).
- Editors run **same‑origin** inside the app; that's required for the WebDAV fetch/save and the
  host bridge. Keep them under `/apps/wordcraft/editors/…` (don't move them cross‑origin).
