# Trivia Day: Halloween edition

An iPad app for a guest-hosted trivia day, hosted by **Game Master Meeko**.

- Every guest gets a photo in costume and hosts one round in their own category.
- Questions are multiple choice and rated easy (1 pt), medium (2) or hard (3).
- Each round shows its questions, then its answers (tap who got each one right), then a leaderboard. Meeko announces each round, comments on the scores and crowns the winner.
- Every tap saves on the iPad straight away. If the app closes or crashes, reopen it and it goes back to the same screen.
- With the event code, everything also backs up to private cloud storage. Any device that enters the code shares the same players, photos and games.

## Live app

https://halloween-trivia-pink.vercel.app (Vercel project `halloween-trivia`).

## Install on the iPad

Open the site in Safari, tap **Share → Add to Home Screen**, then open it from the new icon. Do your setup inside the home-screen app: iPadOS keeps its saved data separate from Safari's. Enter the event code when asked (Settings → Cloud backup).

## What's in this repo

| Path | What it is |
|---|---|
| `public/` | The built app (one HTML file, service worker, icons, manifest) |
| `api/`, `lib/` | Vercel Functions for the cloud backup (Vercel Blob, private store) |
| `vercel.json`, `package.json` | Deployment config |
| `source/` | The source the build is made from (`node build.js` writes `dist/vercel/`). Meeko's bark and howl come from the owner's Artlist plan, so `src/sfx.js` is left out here; without it the build simply has no barks. |
| `fetch-app.sh`, `SHA256SUMS` | The Vercel build step: downloads `public/` from this repo at the commit in the project's `APP_SHA` setting and checks every file |

To publish a new version: push it here, set `APP_SHA` on the Vercel project to the new commit, and redeploy.

The event code is a Vercel environment variable (`TRIVIA_KEY`) and is not stored here. The guests' photos and scores live in the private Blob store, never in this repo.
