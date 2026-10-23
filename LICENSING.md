# Licensing & attribution

This project has two clearly separated parts.

## 1. The Nextcloud app glue (this repository's own code)

Everything written for this integration — `src/`, `lib/`, `appinfo/`, `esbuild.mjs`,
`patches/`, `scripts/`, the blank templates in `src/*.b64`, docs — is licensed **MIT**
(see `LICENSE`), © 2026 Manuel Dell.

## 2. The bundled editors (third‑party)

`editors/<app>/` contains prebuilt WebAssembly editors from the **ArtCraft / storytold**
projects, each licensed **MIT OR Apache‑2.0**, © "ArtCraft Team and the &lt;App&gt; contributors":

| Folder | Upstream | License |
|---|---|---|
| `editors/wordcraft` | github.com/storytold/wordcraft | MIT OR Apache‑2.0 |
| `editors/gridcraft` | github.com/storytold/gridcraft | MIT OR Apache‑2.0 |
| `editors/deckcraft` | github.com/storytold/deckcraft | MIT OR Apache‑2.0 |
| `editors/pdfcraft`  | github.com/storytold/pdfcraft  | MIT OR Apache‑2.0 |

The upstream `LICENSE-MIT` and `LICENSE-APACHE` are retained **inside each `editors/<app>/`**
folder, as MIT and Apache‑2.0 require when redistributing binaries. Do not remove them.

The WASM in `editors/` is built from lightly patched upstream source; the patches are in
`patches/` and are themselves MIT (they are modifications to MIT/Apache‑2.0 code and keep that
dual license for the resulting builds).

## 3. Trademarks & affiliation

"ArtCraft", "WordCraft", "GridCraft", "DeckCraft", "PdfCraft" are names of the storytold
projects. This app is **unofficial and not affiliated with, sponsored, or endorsed by** them.
The names are used descriptively (nominative fair use: "Open in WordCraft"). The brand marks in
`src/main.js`/editor icons come from the upstream `assets/app-icon/*.svg` (same MIT/Apache
license). If you publish this app, consider adding a visible "unofficial" notice and, for a
public/app‑store release, renaming the app id to avoid implying an official product.

## 4. No warranty / alpha software

The editors are **alpha**. Office/PDF fidelity is imperfect and formats can change between
upstream releases. Provided "as is", without warranty of any kind (per the MIT/Apache terms).
Keep the editors updated (see `UPDATING.md`) and rely on Nextcloud file versions for recovery.

## 5. Privacy note

Editing happens **entirely in the user's browser** (WebAssembly, same‑origin) and files are read
from / written to the user's own Nextcloud over WebDAV. No document content is sent to any third
party or external service by this app.
