// Inlines src/ into two single-file builds:
//   dist/trivia-day.html      claude.ai Artifact page (the platform adds the document skeleton)
//   dist/standalone/index.html full document for any static host / iPad home screen
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, 'src', p), 'utf8');

const FONTS = [
  'family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400..800',
  'family=Abril+Fatface&family=DM+Serif+Display&family=Shrikhand&family=Outfit:wght@500..800&family=Graduate&family=Barlow+Semi+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@600;700&family=IBM+Plex+Sans:wght@500;600&family=Cinzel:wght@600..800&family=EB+Garamond:wght@500..700',
  'family=Josefin+Sans:wght@600;700&family=Lobster&family=Fraunces:opsz,wght@9..144,600..900&family=Press+Start+2P&family=VT323&family=Anton&family=Orbitron:wght@600..800&family=Exo+2:wght@600;700&family=Pacifico&family=Nunito:wght@700..900',
  'family=Creepster&family=Cinzel+Decorative:wght@700&family=Monoton&family=Righteous&family=Racing+Sans+One&family=Bodoni+Moda:ital,opsz,wght@0,6..96,600..800;1,6..96,600..800&family=Jost:wght@500..700&family=Fredoka:wght@500..700',
].map((q) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q.replace(/&/g, '&amp;')}&amp;display=swap">`).join('\n');

const css = read('styles.css');
const opt = (p) => (fs.existsSync(path.join(__dirname, 'src', p)) ? read(p) + '\n' : '');
const js = read('themes.js') + '\n' + opt('halloween-art.js') + opt('meeko-lines.js') + opt('sfx.js') + opt('qr.js') + read('app.js');
if (/<\/script/i.test(js)) throw new Error('JS contains a closing script tag');

const head = `<title>Trivia Day</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${FONTS}`;
const body = `<div id="app"><main class="page"><p style="color:#aaa3c4;padding-top:40px;font-weight:600">Loading Trivia Day…</p></main></div>
<div id="overlays"></div>
<script>
${js}
</script>`;

const artifact = `${head}\n<style>\n${css}\n</style>\n${body}\n`;

const reset = `:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}*,*::before,*::after{box-sizing:border-box}`;
const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Trivia Day">
<meta name="theme-color" content="#0d0a17">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
${head}
<style>
${reset}
${css}
</style>
</head>
<body>
${body}
<script>if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(function () {});</script>
</body>
</html>
`;

fs.mkdirSync(path.join(__dirname, 'dist', 'standalone'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'trivia-day.html'), artifact);
fs.writeFileSync(path.join(__dirname, 'dist', 'standalone', 'index.html'), standalone);
fs.writeFileSync(path.join(__dirname, 'dist', 'app.check.js'), js);
const build = require('crypto').createHash('sha1').update(standalone).digest('hex').slice(0, 10);
for (const f of fs.readdirSync(path.join(__dirname, 'pwa'))) {
  const src = path.join(__dirname, 'pwa', f); const dst = path.join(__dirname, 'dist', 'standalone', f);
  if (f === 'sw.js') fs.writeFileSync(dst, fs.readFileSync(src, 'utf8').replace('__BUILD__', build)); else fs.copyFileSync(src, dst);
}

// Vercel project: the standalone app as static files plus the cloud API (server/api + server/lib).
const dep = path.join(__dirname, 'dist', 'vercel');
fs.rmSync(dep, { recursive: true, force: true });
for (const d of ['public', 'api', 'lib']) fs.mkdirSync(path.join(dep, d), { recursive: true });
for (const f of fs.readdirSync(path.join(__dirname, 'dist', 'standalone'))) fs.copyFileSync(path.join(__dirname, 'dist', 'standalone', f), path.join(dep, 'public', f));
for (const f of fs.readdirSync(path.join(__dirname, 'server', 'api'))) fs.copyFileSync(path.join(__dirname, 'server', 'api', f), path.join(dep, 'api', f));
for (const f of ['core.js', 'blob.js']) fs.copyFileSync(path.join(__dirname, 'server', 'lib', f), path.join(dep, 'lib', f));
fs.copyFileSync(path.join(__dirname, 'server', 'vercel.json'), path.join(dep, 'vercel.json'));
fs.copyFileSync(path.join(__dirname, 'server', 'fetch-app.sh'), path.join(dep, 'fetch-app.sh'));
// What the Vercel build checks the downloaded app and the uploaded functions against.
const sums = [];
for (const d of ['public', 'api', 'lib']) for (const f of fs.readdirSync(path.join(dep, d)).sort()) {
  sums.push(require('crypto').createHash('sha256').update(fs.readFileSync(path.join(dep, d, f))).digest('hex') + '  ' + d + '/' + f);
}
fs.writeFileSync(path.join(dep, 'SHA256SUMS'), sums.join('\n') + '\n');
let blobVersion = '2.8.2';
try { blobVersion = require('./server/node_modules/@vercel/blob/package.json').version; } catch { /* not installed here: use the tested version */ }
fs.writeFileSync(path.join(dep, 'package.json'), JSON.stringify({ name: 'trivia-day', private: true, type: 'module', engines: { node: '22.x' }, dependencies: { '@vercel/blob': blobVersion } }, null, 2) + '\n');
console.log('built', (artifact.length / 1024).toFixed(1) + 'KB artifact,', (standalone.length / 1024).toFixed(1) + 'KB standalone');
