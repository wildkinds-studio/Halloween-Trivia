#!/bin/sh
# Vercel build step: download the built app (public/) from the public GitHub repo at a pinned commit
# (APP_SHA, set on the Vercel project) and check it, and the uploaded api/ and lib/ files, against
# that commit's SHA256SUMS, so the deployment is exactly what was tested.
set -eu
REPO=wildkinds-studio/halloween-trivia
SHA=${APP_SHA:?set APP_SHA on the Vercel project to the commit to deploy}
BASE="https://raw.githubusercontent.com/$REPO/$SHA"
curl -fsSL --retry 3 "$BASE/SHA256SUMS" -o SHA256SUMS
mkdir -p public
for f in $(awk '{print $2}' SHA256SUMS | grep '^public/'); do curl -fsSL --retry 3 "$BASE/$f" -o "$f"; done
sha256sum -c --quiet SHA256SUMS
echo "app fetched from $REPO@$SHA and verified ($(wc -l < SHA256SUMS) files)"
