# wordcraft (Nextcloud-App) — Assemble / Install

Selbst-enthaltene NC-App: Fileactions + „Neu"-Einträge + eingebetteter Editor für
docx (WordCraft), xlsx (GridCraft), pptx (DeckCraft). Editoren werden mitgeliefert und
aus dem App-Webroot (`/apps/wordcraft/editors/<app>/`) ausgeliefert — keine externen Aliase.

## Bauen der Editoren (Rust→WASM, auf einem Build-Host mit rustup+trunk)
Forks mit Nextcloud-Integration (branch `nextcloud-integration`):
- WordCraft/DeckCraft: Patch `?src=`-Laden + `?save=`-WebDAV-PUT (+CSRF) + `?user` + Ladebalken.
- GridCraft: nutzt die eingebaute Host-Bridge (`?host=parent`), nur Ladebalken-Patch.
Je: `cd apps/<app>-web && trunk build --release` → Output `dist/web/`.

## Zusammenbauen
1. `npm i && npm run build`  → `js/wordcraft-main.mjs`
2. `dist/web/` jedes Editors nach `editors/<app>/` kopieren (wordcraft/gridcraft/deckcraft).
3. `editors/.htaccess` (MIME application/wasm, Cache, DEFLATE) liegt bei.
4. Ordner `wordcraft/` nach `<nextcloud>/apps/` + `occ app:enable wordcraft`.

## Installieren (fertiges Paket)
`tar xzf wordcraft-nc-<ver>.tar.gz -C <nextcloud>/apps/` → `occ app:enable wordcraft`.
