#!/usr/bin/env bash
# Assemble the installable app: build the JS bundle and copy the four editor builds
# (+ their licenses) into editors/. Build the editors first (see UPDATING.md).
#
#   EDITOR_SRC=/path/containing/<app>/dist/web   scripts/assemble.sh
#
# EDITOR_SRC defaults to $HOME (so $HOME/wordcraft/dist/web, $HOME/gridcraft/dist/web, …).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
EDITOR_SRC="${EDITOR_SRC:-$HOME}"

echo "==> app JS bundle"
npm ci --no-audit --no-fund
npm run build   # -> js/wordcraft-main.mjs

for a in wordcraft gridcraft deckcraft pdfcraft; do
  src="$EDITOR_SRC/$a/dist/web"
  [ -d "$src" ] || { echo "!! missing $src — build the editor first (UPDATING.md)"; exit 1; }
  echo "==> bundling editor: $a"
  rm -rf "editors/$a"; mkdir -p "editors/$a"
  cp -a "$src/." "editors/$a/"
  # MIT/Apache require the license to travel with redistributed binaries:
  cp -a "$EDITOR_SRC/$a/LICENSE-MIT" "$EDITOR_SRC/$a/LICENSE-APACHE" "editors/$a/" 2>/dev/null || true
done

echo "==> done. Deploy editors/, js/, lib/, appinfo/, editors/.htaccess to <nextcloud>/apps/wordcraft"
echo "    then bump appinfo/info.xml <version> and: occ app:disable wordcraft && occ app:enable wordcraft"
