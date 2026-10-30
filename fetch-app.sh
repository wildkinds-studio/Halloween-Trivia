#!/bin/sh
# Vercel build step: download the built app from the public GitHub repo at a pinned commit and check
# every file against its SHA-256, so the deployment is exactly what was tested.
set -eu
REPO=wildkinds-studio/halloween-trivia
SHA=cf3b941ea5cc229b21c192e4bcdbd71a4e93de73
check() { echo "$2  $1" | sha256sum -c - >/dev/null || { echo "hash mismatch: $1"; exit 1; }; }
get() { curl -fsSL --retry 3 "https://raw.githubusercontent.com/$REPO/$SHA/$1" -o "$1"; check "$1" "$2"; }
mkdir -p public
get public/index.html 202ddd6bbaea3d02d45b9fdc89ce064c0715b7e3070c869089bfe38f577f3e94
get public/sw.js f43a9259a16b41ff2a4b414e89239ff22842f0d1ba1e1e50bacc32eda0812354
get public/manifest.webmanifest afcfb57f2647fe1d8dabd4189f2f074c6e36ce9f1a2759e2f1b6c6b4eb6d27f7
get public/icon-180.png dec7bef1d8292536c7186122fa78bb282aa213659cb8bdf8bc0fe26e715b1cc7
get public/icon-192.png c295316ee4c62c53de26aa1e94962196748044bd9729a2fba9453501d97f0ca4
get public/icon-512.png 1f1a8027ac2813d1ced4a4d01fd6636e96d8f6a37f6f4dba3a44f76a3e625749
get public/icon-maskable-512.png 47451dd3f996808ec31acb71c8c96464fde71e7f4cc5db4352a8f27289cfc266
# The API files uploaded with the deployment must match the same commit.
check api/asset.js f8cafa818305ea11b209d45aa7914a5f490df7d0ce25350a0cb1cccab04109e2
check api/db.js 979a400de3fdf174100e8e9261298ce0328e97015762b0ca36639da451b7bcd2
check api/login.js 3486004a8ead91cf8b5db8e3580b5e58c42406ca3c0cd027a8555d8da42055fa
check api/ping.js ca10ea8147bd832754abd76e1cee6297b164c797bc5b4cadcaf1d62757001bb9
check lib/blob.js f517b80517ca02885a58368d8aef50cba51e7e7738d9bf1e824e21f6d38adc8d
check lib/core.js 4da84558d549e1ba4a263904d539aa53be3506af937c0d33d79b2854794861cf
echo "app fetched from $REPO@$SHA and verified"
