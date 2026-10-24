# Publishing to the Nextcloud App Store — what's prepared & what YOU do

Everything technical is prepared. Only the **[you]** steps need your Nextcloud/GitHub account.

## Prepared for you
- **Store-ready `appinfo/info.xml`** — id `wordcraft`, name "ArtCraft Office", NC **33–34**
  (min-version fixed: the app needs `@nextcloud/files` v4 = NC 33+), MIT, summary/description,
  website/bugs/repository/screenshot fields (pointing at the GitHub repo — adjust the URL/user).
- **Signing key + CSR** in `/root/wordcraft-signing/` (on the management host):
  - `wordcraft.key` — **PRIVATE, keep secret** (never commit/publish; it's outside the git repo).
  - `wordcraft.csr` — the request you submit (CN = `wordcraft`).
- **Installable package** on .88: `/root/wordcraft-nc-<ver>.tar.gz` (unsigned; gets signed in step 3).
- Docs: `README.md`, `UPDATING.md`, `LICENSING.md`, `patches/`, `scripts/`.

## Decide FIRST (affects the CSR — its CN must equal the final app id)
- **App id / trademark.** Currently id `wordcraft`, name "ArtCraft Office". For a *public* listing,
  consider a neutral id (e.g. `craftoffice`) so it doesn't imply affiliation with ArtCraft. If you
  rename, tell me — I rename the app (dir, namespace, DirectEditor id, editor paths) **and
  regenerate the CSR**. If `wordcraft` is fine, the current CSR stands.

## 1. [you] Accounts
- Register on <https://apps.nextcloud.com> (sign in with GitHub or a Nextcloud account).
- Tell me the **GitHub repo name + public/private** → I push the code (public is required for the store).

## 2. [you] Get the app certificate signed by Nextcloud
- Submit `wordcraft.csr` via a PR to <https://github.com/nextcloud/app-certificate-requests>
  (follow that repo's README; the file goes under the app id). A maintainer signs it.
- You receive `wordcraft.crt` → put it in `/root/wordcraft-signing/wordcraft.crt`.

## 3. Sign the app (I run this once the .crt is back)
```
occ integrity:sign-app --path=<nextcloud>/apps/wordcraft \
  --privateKey=/root/wordcraft-signing/wordcraft.key \
  --certificate=/root/wordcraft-signing/wordcraft.crt
```
→ writes `appinfo/signature.json`; then I rebuild the `tar.gz`.

## 4. [you] Publish the release
- Create a **GitHub Release** and attach the signed `tar.gz` (gives a public download URL).
- On apps.nextcloud.com → your apps → **register** `wordcraft` (first time), then **add a release**:
  paste the download URL and the **signature** of the archive (base64 of
  `openssl dgst -sha512 -sign wordcraft.key <tar.gz>`). The store downloads and verifies it.
- Add real **screenshots** to `screenshots/` in the repo (info.xml references one).

## Notes
- **Size ~50 MB** (bundled WASM) — acceptable but large; an alternative is a post-install download
  of the editors instead of bundling (more work).
- **Maintenance:** the editors are alpha and move fast → plan regular updates (`UPDATING.md`).
