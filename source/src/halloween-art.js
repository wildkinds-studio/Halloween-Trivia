// Halloween artwork for Trivia Day: every function returns an inline SVG markup string.
// No DOM access, no globals besides HART. Colours are CSS custom properties with fallbacks,
// so the app can recolour; ids (clip paths) get a per-call suffix so nothing is shared between SVGs.
const HART = (() => {
  let uid = 0;
  const nid = (p) => `hart-${p}-${(++uid).toString(36)}`;
  const v = (n, fb) => `var(--${n}, ${fb})`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const svg = (name, vb, body, extra = '') =>
    `<svg class="hart hart-${name}${extra}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
  const f1 = (n) => +n.toFixed(1);
  // ellipse as a path fragment (so several shapes can share one fill/stroke)
  const ell = (cx, cy, rx, ry) => `M${f1(cx - rx)} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  // a closed "cloud" of outward bumps around an ellipse (fluffy fur)
  const fluff = (cx, cy, rx, ry, n, k = 0.62, a0 = 0) => {
    const P = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      P.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    let d = `M${f1(P[0][0])} ${f1(P[0][1])}`;
    for (let i = 1; i <= n; i++) {
      const r = f1(Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) * k);
      d += `A${r} ${r} 0 0 1 ${f1(P[i][0])} ${f1(P[i][1])}`;
    }
    return d + 'Z';
  };

  const C = {
    night: v('night', '#0d0a17'), line: v('line', '#3d2f5c'), text: v('text', '#f8f1e7'),
    pumpkin: v('pumpkin', '#ff8a1f'), deep: v('pumpkin-deep', '#d9590b'), glow: v('glow', '#ffd54a'),
    slime: v('slime', '#8be04e'), witch: v('witch', '#9b5cff'), ghost: v('ghost', '#efeaff'),
    blood: v('blood', '#ff4d6d'), moon: v('moon', '#ffe9a8'), raised: v('raised', '#261d3a'),
    bat: v('bat-c', '#2a1f3d'), rim: v('bat-rim', 'rgba(155,92,255,.6)'), web: v('web', 'rgba(239,234,255,.35)'),
    stem: v('hart-stem', '#4c8a2a'), fur: v('hart-fur', '#dba062'), furLight: v('hart-fur-light', '#f8e6c8'),
    furDark: v('hart-fur-dark', '#9a5a2c'), ink: v('hart-ink', '#2b1a24'), tongue: v('hart-tongue', '#ff7f98'),
    stone: v('hart-stone', '#6b5f8c'), ground: v('hart-ground', '#2f4d26'), bone: v('hart-bone', '#f8f1e7'),
    ghostLine: v('hart-ghost-line', 'rgba(124,98,184,.5)'), eye: v('hart-eye', '#2a1f3d'),
  };
  const WHITE = '#fff';

  /* ---------- bat (viewBox 120x52) ---------- */
  const BAT_BODY = 'M47 21.5Q44.5 12 46 3.5Q52 7.5 56.1 14.5A15 15 0 0 1 63.9 14.5Q68 7.5 74 3.5Q75.5 12 73 21.5A15 15 0 1 1 47 21.5Z';
  const BAT_WING = 'M54 24C44 12 26 5 4 12Q12.8 17.6 14 28Q21.6 24.6 27 31Q35.3 28.8 40 36Q47 32 54 39Z';
  function bat({ flap = true } = {}) {
    const wing = (s) =>
      `<g class="wing-${s}" style="transform-box:fill-box;transform-origin:${s === 'l' ? '100%' : '0%'} 55%"><path d="${BAT_WING}"${s === 'r' ? ' transform="matrix(-1 0 0 1 120 0)"' : ''} fill="${C.bat}" stroke="${C.rim}" stroke-width="2.2" stroke-linejoin="round"/></g>`;
    return svg('bat', '0 0 120 52',
      `<path d="${BAT_BODY}" fill="${C.bat}" stroke="${C.rim}" stroke-width="2.4" stroke-linejoin="round"/>${wing('l')}${wing('r')}` +
      `<path d="${BAT_BODY}" fill="${C.bat}"/><path d="M49 10 50.2 17.6 54.6 15.4ZM71 10 69.8 17.6 65.4 15.4Z" fill="${C.witch}" opacity=".55"/>` +
      `<path d="${ell(54.4, 27.5, 3.9, 4.5)}${ell(65.6, 27.5, 3.9, 4.5)}" fill="${WHITE}"/><path d="${ell(55.2, 28.7, 2, 2.4)}${ell(64.8, 28.7, 2, 2.4)}" fill="${C.night}"/>` +
      `<path d="M55.8 35Q60 38.8 64.2 35" fill="none" stroke="${WHITE}" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/><path d="M57 36.3 58 39.2 59.1 37ZM63 36.3 62 39.2 60.9 37Z" fill="${WHITE}"/>`,
      flap ? ' hart-flap' : '');
  }

  /* ---------- cobweb (viewBox 100x100, anchored in a corner) ---------- */
  const WEB = (() => {
    const A = [0, 15, 30, 45, 60, 75, 90].map((d) => (d * Math.PI) / 180);
    const J = [1, 1.05, 0.96, 1.03, 0.97, 1.04, 1];
    const p = (r, a) => `${f1(r * Math.cos(a))} ${f1(r * Math.sin(a))}`;
    const threads = A.slice(1, -1).map((a) => `M0 0L${p(150, a)}`).join('');
    const rings = [17, 33, 51, 71, 93].map((r) => {
      let d = `M${p(r * J[0], A[0])}`;
      for (let k = 1; k < A.length; k++) {
        const m = (A[k - 1] + A[k]) / 2;
        d += `Q${p(r * 0.84 * (J[k - 1] + J[k]) / 2, m)} ${p(r * J[k], A[k])}`;
      }
      return d;
    }).join('');
    return { threads, rings };
  })();
  const WEB_T = { tl: '', tr: ' transform="matrix(-1 0 0 1 100 0)"', bl: ' transform="matrix(1 0 0 -1 0 100)"', br: ' transform="matrix(-1 0 0 -1 100 100)"' };
  function web(corner = 'tl') {
    const k = Object.prototype.hasOwnProperty.call(WEB_T, corner) ? corner : 'tl';
    return svg('web', '0 0 100 100',
      `<g${WEB_T[k]} fill="none" stroke="${C.web}" stroke-linecap="round"><path d="${WEB.threads}" stroke-width="1.5" vector-effect="non-scaling-stroke"/><path d="${WEB.rings}" stroke-width="1.2" vector-effect="non-scaling-stroke"/></g>`,
      ` hart-web-${k}`);
  }

  /* ---------- jack-o'-lantern (viewBox 120x110) ---------- */
  const PK_FACES = [
    { // 0 happy
      cut: 'M34 64 44.5 47.5 55 64ZM65 64 75.5 47.5 86 64ZM56.5 73 60 67.5 63.5 73ZM30 76Q60 93 90 76Q84 96 60 98Q36 96 30 76Z',
      keep: '<rect x="45.5" y="79" width="8" height="10.5" rx="1.5"/><rect x="66.5" y="79" width="8" height="10.5" rx="1.5"/><rect x="56" y="91.5" width="8" height="10" rx="1.5"/>',
    },
    { // 1 cheeky wink
      cut: 'M34 65 44.5 48.5 55 65ZM64 61Q75.5 48 87 61Q75.5 55 64 61ZM57 73.5 60.5 68 64 73.5ZM32 80Q58 92 88 71Q88 90 64 96Q40 98 32 80Z',
      keep: '<rect x="65.5" y="76" width="8" height="10.5" rx="1.5"/><rect x="44" y="89" width="7" height="9" rx="1.5"/>',
    },
    { // 2 'oooh'
      cut: `${ell(45, 60, 7.5, 9.5)}${ell(75, 60, 7.5, 9.5)}M35 45Q45 36 55 43Q45 40.5 35 45ZM65 43Q75 36 85 45Q75 40.5 65 43Z${ell(60, 87, 8, 10)}`,
      keep: `<circle cx="47" cy="63" r="2.6"/><circle cx="77" cy="63" r="2.6"/>`,
    },
  ];
  function pumpkin(face = 0) {
    const F = PK_FACES[((face | 0) % 3 + 3) % 3];
    const lobe = (cx, rx, ry, cy = 67) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
    const g = (fill, extra = '') => `<g fill="${fill}" stroke="${fill}" stroke-width="2.4" stroke-linejoin="round"${extra}><path d="${F.cut}"/></g>`;
    return svg('pumpkin', '0 0 120 110',
      `<path d="M54.5 33C56 25 54 17 49.5 12.5C54 9.5 60.5 10 64.5 13.5C65 20 64.5 27 66 33Q60 36 54.5 33Z" fill="${C.stem}"/>` +
      `<g fill="${C.pumpkin}" stroke="${C.deep}" stroke-width="2.4">${lobe(34, 26, 34, 68)}${lobe(86, 26, 34, 68)}${lobe(47, 25, 37)}${lobe(73, 25, 37)}${lobe(60, 21, 38.5, 66.5)}</g>` +
      `<path d="M66 27C72 18 84 18 90 25C83 30 73 31 66 27Z" fill="${C.slime}"/><path d="M63.5 22C68 13 76 13 77 18.5C78 23 72 23.5 72 20" fill="none" stroke="${C.slime}" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="17.5" cy="58" rx="3.6" ry="10" transform="rotate(14 17.5 58)" fill="${WHITE}" opacity=".24"/>` +
      g(C.glow, ' opacity=".28" stroke-width="7"') + g(C.deep, ' transform="translate(0 -1.8)"') + g(C.glow) +
      `<g fill="${C.pumpkin}">${F.keep}</g>`,
      ` hart-pumpkin-${['happy', 'wink', 'oooh'][((face | 0) % 3 + 3) % 3]}`);
  }

  /* ---------- ghost (viewBox 100x120) ---------- */
  const GHOST = 'M50 10C70 10 86 27 86 54C89 50 92.5 45.5 95.5 46C99.5 47 97.5 55 86 66V100A9 9 0 0 1 68 100A9 9 0 0 1 50 100A9 9 0 0 1 32 100A9 9 0 0 1 14 100V81C8.5 83 3 83 2 79.5C1 75.5 8 71.5 14 68V58C14 28 30 10 50 10Z';
  function ghost() {
    return svg('ghost', '0 0 100 120',
      `<path d="${GHOST}" fill="${C.ghost}" stroke="${C.ghostLine}" stroke-width="2" stroke-linejoin="round"/>` +
      `<ellipse cx="33" cy="27" rx="5" ry="9" transform="rotate(30 33 27)" fill="${WHITE}" opacity=".7"/>` +
      `<path d="${ell(39, 55, 5.2, 6.8)}${ell(61, 55, 5.2, 6.8)}M44 67.5Q50 77 56 67.5Q50 70 44 67.5Z" fill="${C.eye}"/>` +
      `<path d="${ell(40.6, 52.4, 1.9, 1.9)}${ell(62.6, 52.4, 1.9, 1.9)}" fill="${WHITE}"/>` +
      `<path d="${ell(30, 66, 5.5, 3.2)}${ell(70, 66, 5.5, 3.2)}" fill="${C.blood}" opacity=".32"/>`);
  }

  /* ---------- moon (viewBox 100x100) ---------- */
  function moon() {
    const crater = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
    const gid = nid('moon');
    return svg('moon', '0 0 100 100',
      `<defs><radialGradient id="${gid}"><stop offset=".84" stop-color="${C.moon}" stop-opacity=".5"/><stop offset="1" stop-color="${C.moon}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="50" cy="50" r="50" fill="url(#${gid})"/><circle cx="50" cy="50" r="44" fill="${C.moon}"/>` +
      `<path d="M50 6A44 44 0 0 1 50 94A32 44 0 0 0 50 6Z" fill="#c4802a" opacity=".13"/>` +
      `<g fill="#b97a2a" opacity=".2">${crater(34, 36, 9)}${crater(62, 62, 12)}${crater(67, 29, 5)}${crater(36, 68, 5.5)}${crater(76, 46, 3.5)}${crater(48, 20, 3)}</g>` +
      `<g fill="${WHITE}" opacity=".22">${crater(32.5, 34.5, 4)}${crater(60, 60, 5)}</g>`);
  }

  /* ---------- spider on a thread (viewBox 60x100; thread starts at y=0) ---------- */
  const SP_LEGS = 'M20 63Q8 51 3 61M18.5 68.5Q5 64 2 74M18.5 74Q6 78 5 89M21.5 79Q14 88 12 97';
  function spider() {
    const legs = (stroke, w) => `<g fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${SP_LEGS}"/><path d="${SP_LEGS}" transform="matrix(-1 0 0 1 60 0)"/></g>`;
    return svg('spider', '0 0 60 100',
      `<path d="M30 0V58" stroke="${C.web}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>` +
      legs(C.rim, 5.4) + legs(C.bat, 3) +
      `<circle cx="30" cy="70" r="14" fill="${C.bat}" stroke="${C.rim}" stroke-width="2"/>` +
      `<ellipse cx="23.5" cy="61.5" rx="4" ry="2.4" transform="rotate(-35 23.5 61.5)" fill="${WHITE}" opacity=".2"/>` +
      `<path d="${ell(25, 68, 4.3, 5.1)}${ell(35, 68, 4.3, 5.1)}" fill="${WHITE}"/><path d="${ell(25.8, 69.6, 2.2, 2.6)}${ell(34.2, 69.6, 2.2, 2.6)}" fill="${C.night}"/>` +
      `<path d="${ell(26.6, 68.4, .8, .8)}${ell(35, 68.4, .8, .8)}" fill="${WHITE}"/>` +
      `<path d="M26.5 76.5Q30 79.5 33.5 76.5" fill="none" stroke="${WHITE}" stroke-opacity=".75" stroke-width="1.3" stroke-linecap="round"/>` +
      `<path d="${ell(20.5, 75, 2.6, 1.6)}${ell(39.5, 75, 2.6, 1.6)}" fill="${C.blood}" opacity=".45"/>`);
  }

  /* ---------- tombstone (viewBox 100x120) ---------- */
  function tombstone(label = '') {
    const t = String(label == null ? '' : label).trim();
    const n = [...t].length;
    let txt;
    if (n) {
      const fs = n <= 2 ? 26 : n <= 3 ? 22 : n <= 5 ? 16 : n <= 8 ? 12 : 10;
      const fit = n > 5 ? ` textLength="${Math.min(48, n * fs * 0.62).toFixed(0)}" lengthAdjust="spacingAndGlyphs"` : '';
      const y = f1(76 + fs * 0.35);
      const tx = (yy, fill, extra) => `<text x="50" y="${yy}" text-anchor="middle" font-family="var(--f-display, system-ui, sans-serif)" font-weight="800" font-size="${fs}"${fit} fill="${fill}"${extra}>${esc(t)}</text>`;
      txt = tx(f1(y + 1.2), WHITE, ' opacity=".2"') + tx(y, v('hart-stone-ink', '#2a2140'), ' opacity=".9"');
    } else {
      txt = `<path d="M37 66H63M40 77H60M38 88H62" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>`;
    }
    return svg('tombstone', '0 0 100 120',
      `<ellipse cx="50" cy="113" rx="45" ry="6.5" fill="${C.ground}"/>` +
      `<path d="M20 113V50A30 30 0 0 1 80 50V113Z" fill="${C.stone}" stroke="#000" stroke-opacity=".22" stroke-width="1.5"/>` +
      `<path d="M25.5 113V51A24.5 24.5 0 0 1 74.5 51V113Z" fill="${WHITE}" opacity=".1"/>` +
            `<path d="M66 33 61 41 65.5 45 61 52" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      txt +
      `<path d="M11 114 14.5 103 17.5 111 21 98.5 24 111 27.5 104 31 114ZM67 114 70.5 102.5 73.5 111 77.5 97.5 80 111 84.5 103.5 89 114Z" fill="${C.slime}"/>`);
  }

  /* ---------- witch hat (viewBox 160x124; brim spans the full width, brim centre at y≈106) ---------- */
  const HAT_CONE = 'M40 106C54 78 60 54 67 36C73 20 87 9 102 10C110 10.5 116 16 119 24C111 20.5 103 22 98 29C92 40 99 76 120 106Q80 117 40 106Z';
  function hat() {
    const cid = nid('hat');
    return svg('hat', '0 0 160 124',
      `<defs><clipPath id="${cid}"><path d="${HAT_CONE}"/></clipPath></defs>` +
      `<ellipse cx="80" cy="108.5" rx="78" ry="14.5" fill="${C.witch}"/><ellipse cx="80" cy="108.5" rx="78" ry="14.5" fill="#000" opacity=".42"/>` +
      `<ellipse cx="80" cy="105.5" rx="77" ry="13.5" fill="${C.witch}"/><ellipse cx="80" cy="105.5" rx="77" ry="13.5" fill="#000" opacity=".16"/>` +
      `<path d="${HAT_CONE}" fill="${C.witch}"/>` +
      `<g clip-path="url(#${cid})"><path d="M90 0C85 36 92 80 124 114H130V0Z" fill="#000" opacity=".16"/><path d="M60 46C55 66 50 90 46 108H38V46Z" fill="${WHITE}" opacity=".12"/>` +
      `<path d="M30 100Q80 110 130 100V87Q80 96 30 87Z" fill="${C.pumpkin}"/><path d="M30 100Q80 110 130 100V97Q80 107 30 97Z" fill="#000" opacity=".14"/></g>` +
      `<rect x="72.5" y="89.5" width="15" height="14" rx="2.5" fill="none" stroke="${C.glow}" stroke-width="3"/>` +
      `<path d="M63 57 74 54.5 76.5 65 65.5 67.5Z" fill="${C.slime}" opacity=".9"/><path d="M65 59 73 57.2M66 62.5 74 60.7M67 66 75 64.2" stroke="#000" stroke-opacity=".25" stroke-width="1" stroke-dasharray="2 1.6"/>` +
      `<path d="M119 23 120.7 27.4 125.3 27.6 121.7 30.4 123 34.9 119 32.3 115 34.9 116.3 30.4 112.7 27.6 117.3 27.4Z" fill="${C.glow}"/>`);
  }

  /* ---------- Meeko placeholder: cartoon dog portrait (viewBox 200x200) ---------- */
  const DOG_RUFF = fluff(100, 109, 57, 38, 16, 0.62, 0.17);
  const DOG_EAR = 'M80 47C66 40 44 44 34 60C26 74 25 98 32 112C37 121 50 121 55 111C60 100 61 82 70 70C76 62 84 56 80 47Z';
  function dog({ bg = true } = {}) {
    return svg('dog', '0 0 200 200',
      (bg ? `<rect width="200" height="200" fill="${C.raised}"/><circle cx="100" cy="96" r="88" fill="${WHITE}" opacity=".045"/><circle cx="100" cy="96" r="68" fill="${WHITE}" opacity=".04"/>` : '') +
      `<g transform="matrix(1.12 0 0 1.12 -12 -7.5)">` +
      `<g fill="${C.fur}"><path d="M26 206C28 168 58 138 100 138C142 138 172 168 174 206ZM83 50C80 40 88 33 94 39C96 30 107 29 109 38C114 33 121 40 117 50Q100 43 83 50Z"/><path d="${DOG_RUFF}"/><ellipse cx="100" cy="90" rx="50" ry="47"/></g>` +
      `<path d="M60 129Q100 149 140 129" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="3"/>` +
      `<path d="M93 63Q100 55 107 63L111 102H89Z${ell(87.5, 113, 17, 14.5)}${ell(112.5, 113, 17, 14.5)}${ell(100, 121, 14, 11)}" fill="${C.furLight}"/>` +
      `<g fill="${C.furDark}"><path d="${DOG_EAR}"/><path d="${DOG_EAR}" transform="matrix(-1 0 0 1 200 0)"/></g>` +
      `<path d="M71 69Q79 63 87 68M113 68Q121 63 129 69" fill="none" stroke="${C.furDark}" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="${ell(81, 86, 9.5, 11)}${ell(119, 86, 9.5, 11)}M88 117Q100 133 112 117Q100 122 88 117ZM88 103Q100 97 112 103Q112 111 100 114Q88 111 88 103Z" fill="${C.ink}"/>` +
      `<path d="${ell(84.5, 81.5, 3.8, 3.8)}${ell(122.5, 81.5, 3.8, 3.8)}" fill="${WHITE}"/><path d="${ell(78, 91, 1.8, 1.8)}${ell(116, 91, 1.8, 1.8)}" fill="${WHITE}" opacity=".85"/>` +
      `<path d="${ell(67, 107, 7, 4.2)}${ell(133, 107, 7, 4.2)}" fill="${C.blood}" opacity=".28"/>` +
      `<path d="M93.5 121Q92 139 100 140Q108 139 106.5 121Q100 124 93.5 121Z" fill="${C.tongue}"/><path d="M100 126V134" stroke="#000" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/>` +
      `<ellipse cx="95.5" cy="102.6" rx="3.6" ry="1.6" fill="${WHITE}" opacity=".55"/>` +
      `<path d="M100 114V119M87 116Q93.5 123 100 119Q106.5 123 113 116" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M47 146Q100 167 153 146L155 157Q100 181 45 157ZM58 160Q100 178 142 160L104 186Q100 188.5 96 186Z" fill="${C.pumpkin}"/>` +
      `<g fill="${C.night}"><circle cx="62" cy="154" r="2.6"/><circle cx="138" cy="154" r="2.6"/><circle cx="80" cy="170.5" r="2.8"/><circle cx="120" cy="170.5" r="2.8"/><circle cx="100" cy="177" r="2.8"/></g>` +
      `<path d="M45 157Q100 181 155 157" fill="none" stroke="${C.night}" stroke-width="2.4"/></g>`);
  }

  /* ---------- candy corn (viewBox 60x70) ---------- */
  const CANDY = 'M30 5C34 5 52 44 54 56C55 63 44 66 30 66C16 66 5 63 6 56C8 44 26 5 30 5Z';
  function candy() {
    const cid = nid('cc');
    return svg('candy', '0 0 60 70',
      `<defs><clipPath id="${cid}"><path d="${CANDY}"/></clipPath></defs>` +
      `<g clip-path="url(#${cid})"><rect width="60" height="70" fill="${C.text}"/><rect y="25" width="60" height="21" fill="${C.pumpkin}"/><rect y="46" width="60" height="24" fill="${C.glow}"/></g>` +
      `<path d="M25.5 15Q19 32 13.5 52" fill="none" stroke="${WHITE}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="${CANDY}" fill="none" stroke="${C.night}" stroke-opacity=".3" stroke-width="1.5"/>`);
  }

  /* ---------- cute sugar skull (viewBox 100x100) ---------- */
  function skull() {
    const petals = (cx, cy, fill) => {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        s += ell(f1(cx + 11 * Math.cos(a)), f1(cy + 11 * Math.sin(a)), 3.8, 3.8);
      }
      return `<path d="${s}" fill="${fill}"/>`;
    };
    return svg('skull', '0 0 100 100',
      `<path d="M50 8C74 8 90 25 90 47C90 60 84 68 76 72V83Q76 92 67 92H33Q24 92 24 83V72C16 68 10 60 10 47C10 25 26 8 50 8Z" fill="${C.bone}" stroke="${C.night}" stroke-opacity=".25" stroke-width="1.5"/>` +
      petals(33, 47, C.pumpkin) + petals(67, 47, C.witch) +
      `<path d="${ell(33, 47, 9.5, 9.5)}${ell(67, 47, 9.5, 9.5)}" fill="${C.night}"/><path d="${ell(30, 43.5, 3, 3)}${ell(64, 43.5, 3, 3)}" fill="${WHITE}"/>` +
      `<path d="M50 70C44 65 43.5 59.5 47.3 59.5C49 59.5 50 61 50 62C50 61 51 59.5 52.7 59.5C56.5 59.5 56 65 50 70Z" fill="${C.blood}"/>` +
      `<path d="M32 80H68M38.5 75.5V84.5M44.5 76V85M50 76.2V85.2M55.5 76V85M61.5 75.5V84.5" fill="none" stroke="${C.night}" stroke-opacity=".7" stroke-width="1.8" stroke-linecap="round"/>` +
      `<g fill="${C.slime}"><circle cx="39" cy="23" r="2.4"/><circle cx="50" cy="19" r="3.2"/><circle cx="61" cy="23" r="2.4"/></g>` +
      `<path d="${ell(19, 64, 3.6, 2.4)}${ell(81, 64, 3.6, 2.4)}" fill="${C.blood}" opacity=".45"/>`);
  }

  /* ---------- cauldron (viewBox 120x100) ---------- */
  function cauldron() {
    return svg('cauldron', '0 0 120 100',
      `<path d="M31 82 24 96H35ZM89 82 96 96H85Z" fill="${C.bat}" stroke="${C.rim}" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path d="M15 46C7 72 28 92 60 92C92 92 113 72 105 46Z" fill="${C.bat}" stroke="${C.rim}" stroke-width="2"/>` +
      `<path d="M23 58Q24 74 38 82" fill="none" stroke="${WHITE}" stroke-opacity=".14" stroke-width="4" stroke-linecap="round"/>` +
      `<ellipse cx="60" cy="46" rx="49" ry="10" fill="${C.line}" stroke="${C.rim}" stroke-width="2"/><ellipse cx="60" cy="46" rx="42" ry="6.5" fill="${C.slime}"/>` +
      `<path d="M28 49Q27 61 31.5 61.5Q35.5 61.5 35 51ZM80 50.5Q80 57 83 57Q86 57 86 50Z" fill="${C.slime}"/>` +
      `<g fill="${C.slime}"><circle cx="45" cy="38" r="6.5"/><circle cx="68" cy="34" r="4.8"/><circle cx="79" cy="41" r="3.2"/><circle cx="57" cy="22" r="3"/><circle cx="72" cy="14" r="2"/></g>` +
      `<g fill="${WHITE}" opacity=".55"><circle cx="42.5" cy="35.5" r="1.8"/><circle cx="66.3" cy="32.3" r="1.3"/><circle cx="56" cy="21" r=".9"/></g>`);
  }

  return Object.freeze({ bat, web, pumpkin, ghost, moon, spider, tombstone, hat, dog, candy, skull, cauldron });
})();
