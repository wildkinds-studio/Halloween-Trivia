// Round themes. Each guest's category gets one; the play screens re-light in its colours.
// `kw` drives the auto-suggestion from the category name (whole-word-ish, lowercase).
const THEMES = [
  {
    id: 'premiere', name: 'Premiere', emoji: '🎬',
    kw: ['movie', 'movies', 'film', 'films', 'cinema', 'tv', 'television', 'oscar', 'oscars', 'disney', 'pixar', 'marvel', 'netflix', 'sitcom', 'sitcoms', 'actor', 'actors', 'hollywood', 'series', 'star wars', 'quotes', 'musicals', 'broadway', 'friends', 'simpsons', 'bond', 'soap'],
    ink: '#fff3dc', accent: '#f5c451', accent2: '#ff7a59', card: 'rgba(24,4,9,.62)', cardInk: '#fff3dc', line: 'rgba(245,196,81,.55)',
    title: '"Abril Fatface", "Didot", serif', q: '"DM Serif Display", "Georgia", serif', qWeight: 400,
  },
  {
    id: 'vinyl', name: 'Vinyl', emoji: '🎵',
    kw: ['music', 'song', 'songs', 'band', 'bands', 'album', 'albums', 'lyrics', 'lyric', 'pop', 'rock', 'hip hop', 'rap', 'taylor', 'swift', 'beatles', 'eurovision', 'singer', 'singers', 'concert', 'concerts', 'karaoke', 'country', 'jazz', 'one hit', 'charts', 'boy bands', 'abba', 'beyonce'],
    ink: '#fdf2ff', accent: '#ff3d8b', accent2: '#31e7ff', card: 'rgba(18,12,34,.72)', cardInk: '#fdf2ff', line: 'rgba(255,61,139,.6)',
    title: '"Shrikhand", "Cooper Black", serif', q: '"Outfit", "Avenir Next", sans-serif', qWeight: 700,
  },
  {
    id: 'stadium', name: 'Stadium', emoji: '🏆',
    kw: ['sport', 'sports', 'football', 'afl', 'nrl', 'soccer', 'cricket', 'rugby', 'tennis', 'olympic', 'olympics', 'basketball', 'nba', 'nfl', 'golf', 'footy', 'swimming', 'world cup', 'athletes', 'boxing', 'netball', 'hockey', 'baseball', 'surfing'],
    ink: '#ffffff', accent: '#ffe14d', accent2: '#ffffff', card: 'rgba(3,38,20,.68)', cardInk: '#ffffff', line: 'rgba(255,255,255,.7)',
    title: '"Graduate", "Rockwell", serif', q: '"Barlow Semi Condensed", "Avenir Next Condensed", sans-serif', qWeight: 700,
  },
  {
    id: 'lab', name: 'Lab', emoji: '🧪',
    kw: ['science', 'chemistry', 'physics', 'biology', 'maths', 'math', 'mathematics', 'tech', 'technology', 'computer', 'computers', 'inventions', 'invention', 'medicine', 'medical', 'human body', 'anatomy', 'elements', 'engineering', 'coding', 'ai', 'robots', 'nerd'],
    ink: '#e7fbff', accent: '#3ef2d0', accent2: '#ff9f43', card: 'rgba(6,20,38,.78)', cardInk: '#e7fbff', line: 'rgba(62,242,208,.55)',
    title: '"IBM Plex Mono", "Menlo", monospace', q: '"IBM Plex Sans", "Helvetica Neue", sans-serif', qWeight: 600,
  },
  {
    id: 'archive', name: 'Archive', emoji: '📜',
    kw: ['history', 'historical', 'ancient', 'war', 'wars', 'royal', 'royals', 'royalty', 'king', 'kings', 'queen', 'queens', 'empire', 'rome', 'roman', 'egypt', 'medieval', 'presidents', 'prime ministers', 'politics', 'century', 'vikings', 'tudors', 'monarchy', 'world war', 'world wars', 'ww1', 'ww2', 'wwi', 'wwii', 'war history'],
    ink: '#3a2816', accent: '#8e2c1a', accent2: '#5b6b2f', card: 'rgba(255,249,232,.72)', cardInk: '#3a2816', line: 'rgba(110,80,40,.55)',
    title: '"Cinzel", "Trajan Pro", serif', q: '"EB Garamond", "Garamond", serif', qWeight: 600, light: true,
  },
  {
    id: 'passport', name: 'Passport', emoji: '✈️',
    kw: ['geography', 'travel', 'countries', 'country', 'capitals', 'capital', 'flags', 'flag', 'world', 'cities', 'city', 'maps', 'map', 'landmarks', 'europe', 'asia', 'africa', 'america', 'australia', 'languages', 'language', 'holidays abroad', 'airports'],
    ink: '#f6f1e4', accent: '#ff6a4d', accent2: '#ffd166', card: 'rgba(5,44,54,.72)', cardInk: '#f6f1e4', line: 'rgba(255,209,102,.6)',
    title: '"Josefin Sans", "Futura", sans-serif', q: '"Josefin Sans", "Futura", sans-serif', qWeight: 600, upper: true,
  },
  {
    id: 'diner', name: 'Diner', emoji: '🍔',
    kw: ['food', 'foods', 'drink', 'drinks', 'cooking', 'cuisine', 'restaurant', 'restaurants', 'cocktail', 'cocktails', 'wine', 'beer', 'snack', 'snacks', 'candy', 'lollies', 'chocolate', 'baking', 'fast food', 'coffee', 'cheese', 'fruit', 'dessert', 'desserts', 'recipes', 'chef', 'pizza'],
    ink: '#2b1715', accent: '#e63946', accent2: '#1d7a74', card: '#fff8ec', cardInk: '#2b1715', line: '#e63946',
    title: '"Lobster", "Brush Script MT", cursive', q: '"Figtree", "Avenir Next", sans-serif', qWeight: 700, light: true, boxed: true,
  },
  {
    id: 'wild', name: 'Wild', emoji: '🦁',
    kw: ['animal', 'animals', 'nature', 'wildlife', 'plants', 'plant', 'dogs', 'dog', 'cats', 'cat', 'birds', 'bird', 'dinosaurs', 'dinosaur', 'zoo', 'insects', 'bugs', 'environment', 'pets', 'trees', 'flowers', 'gardening', 'safari', 'jungle'],
    ink: '#f0f7e6', accent: '#c7e36b', accent2: '#ff9f5a', card: 'rgba(8,28,16,.7)', cardInk: '#f0f7e6', line: 'rgba(199,227,107,.55)',
    title: '"Fraunces", "Georgia", serif', q: '"Fraunces", "Georgia", serif', qWeight: 600,
  },
  {
    id: 'arcade', name: 'Arcade', emoji: '🕹️',
    kw: ['gaming', 'video games', 'video game', 'games', 'game', 'nintendo', 'mario', 'pokemon', 'playstation', 'xbox', 'minecraft', 'fortnite', 'zelda', 'sega', 'console', 'consoles', 'esports', 'pixel'],
    ink: '#e9fff7', accent: '#00ff9f', accent2: '#ff00e6', card: 'rgba(13,2,33,.82)', cardInk: '#e9fff7', line: 'rgba(0,255,159,.6)',
    title: '"Press Start 2P", "Courier New", monospace', q: '"VT323", "Courier New", monospace', qWeight: 400, qScale: 1.3, titleScale: 0.55,
  },
  {
    id: 'tabloid', name: 'Tabloid', emoji: '⭐',
    kw: ['pop culture', 'celebrity', 'celebrities', 'celebs', 'gossip', 'reality', 'reality tv', 'kardashians', 'memes', 'meme', 'internet', 'social media', 'tiktok', 'instagram', 'viral', 'influencers', 'famous', 'scandals', 'love island', 'bachelor'],
    ink: '#111111', accent: '#ff2d55', accent2: '#111111', card: '#ffffff', cardInk: '#111111', line: '#111111',
    title: '"Anton", "Impact", sans-serif', q: '"Figtree", "Avenir Next", sans-serif', qWeight: 800, light: true, boxed: true, upper: true,
  },
  {
    id: 'gallery', name: 'Gallery', emoji: '🎨',
    kw: ['art', 'arts', 'artist', 'artists', 'painting', 'paintings', 'design', 'architecture', 'photography', 'sculpture', 'museum', 'museums', 'famous paintings', 'logos', 'brands', 'colours', 'colors'],
    ink: '#141414', accent: '#d7263d', accent2: '#1b4d9c', card: 'rgba(255,255,255,.86)', cardInk: '#141414', line: '#141414',
    title: '"DM Serif Display", "Georgia", serif', q: '"Figtree", "Avenir Next", sans-serif', qWeight: 700, light: true,
  },
  {
    id: 'orbit', name: 'Orbit', emoji: '🚀',
    kw: ['space', 'astronomy', 'planet', 'planets', 'stars', 'star', 'nasa', 'sci-fi', 'scifi', 'science fiction', 'aliens', 'alien', 'universe', 'rockets', 'rocket', 'star trek', 'moon', 'galaxy', 'astronauts'],
    ink: '#eef0ff', accent: '#8c7bff', accent2: '#ffb86b', card: 'rgba(8,9,24,.9)', cardInk: '#eef0ff', line: 'rgba(140,123,255,.6)',
    title: '"Orbitron", "Eurostile", sans-serif', q: '"Exo 2", "Avenir Next", sans-serif', qWeight: 600, titleScale: 0.8,
  },
  {
    id: 'tide', name: 'Tide', emoji: '🌊',
    kw: ['ocean', 'oceans', 'beach', 'beaches', 'sea', 'surf', 'summer', 'island', 'islands', 'water', 'boats', 'boat', 'fish', 'sharks', 'holiday', 'holidays', 'sailing', 'marine', 'pirates'],
    ink: '#effcff', accent: '#ffd27a', accent2: '#ff8a7a', card: 'rgba(3,48,72,.86)', cardInk: '#effcff', line: 'rgba(255,210,122,.65)',
    title: '"Pacifico", "Brush Script MT", cursive', q: '"Nunito", "Avenir Next Rounded", sans-serif', qWeight: 800, titleScale: 0.85,
  },
  {
    id: 'tome', name: 'Tome', emoji: '📚',
    kw: ['book', 'books', 'literature', 'fantasy', 'harry potter', 'potter', 'lord of the rings', 'tolkien', 'magic', 'myth', 'myths', 'mythology', 'fairy tales', 'fairytales', 'novels', 'novel', 'authors', 'poetry', 'dragons', 'game of thrones', 'shakespeare', 'witches', 'wizards', 'legends'],
    ink: '#f6eedb', accent: '#e8c36a', accent2: '#b47cff', card: 'rgba(22,10,40,.72)', cardInk: '#f6eedb', line: 'rgba(232,195,106,.6)',
    title: '"Cinzel Decorative", "Cinzel", serif', q: '"EB Garamond", "Garamond", serif', qWeight: 600, titleScale: 0.85,
  },
  {
    id: 'rewind', name: 'Rewind', emoji: '📼',
    kw: ['80s', '90s', '2000s', '70s', '60s', 'eighties', 'nineties', 'retro', 'nostalgia', 'nostalgic', 'decades', 'decade', 'throwback', 'y2k', 'cartoons', 'cartoon', 'toys', 'childhood', 'old school', 'vintage'],
    ink: '#ffffff', accent: '#05d9e8', accent2: '#ff2a6d', card: 'rgba(26,6,51,.9)', cardInk: '#ffffff', line: 'rgba(5,217,232,.65)',
    title: '"Monoton", "Impact", sans-serif', q: '"Righteous", "Avenir Next", sans-serif', qWeight: 400, titleScale: 0.85,
  },
  {
    id: 'pitlane', name: 'Pit Lane', emoji: '🏁',
    kw: ['cars', 'car', 'f1', 'formula 1', 'formula one', 'motorsport', 'racing', 'vehicles', 'transport', 'planes', 'trains', 'motorbikes', 'v8', 'supercars', 'driving', 'road'],
    ink: '#f5f5f5', accent: '#ff3b30', accent2: '#ffd60a', card: 'rgba(14,14,14,.82)', cardInk: '#f5f5f5', line: 'rgba(255,59,48,.7)',
    title: '"Racing Sans One", "Impact", sans-serif', q: '"Barlow Semi Condensed", "Avenir Next Condensed", sans-serif', qWeight: 700,
  },
  {
    id: 'runway', name: 'Runway', emoji: '👠',
    kw: ['fashion', 'style', 'beauty', 'makeup', 'designers', 'designer', 'clothing', 'clothes', 'shoes', 'models', 'luxury', 'outfits', 'outfit', 'vogue', 'skincare', 'perfume', 'jewellery', 'jewelry'],
    ink: '#fbf7f5', accent: '#f4b6c2', accent2: '#e9d3a3', card: 'rgba(20,14,16,.72)', cardInk: '#fbf7f5', line: 'rgba(244,182,194,.6)',
    title: '"Bodoni Moda", "Didot", serif', q: '"Jost", "Futura", sans-serif', qWeight: 500, titleItalic: true,
  },
  {
    id: 'haunt', name: 'Haunted', emoji: '🎃',
    kw: ['halloween', 'horror', 'horror movies', 'horror films', 'scary', 'spooky', 'ghost', 'ghosts', 'witch', 'witches', 'vampire', 'vampires', 'zombie', 'zombies', 'monster', 'monsters', 'haunted', 'creepy', 'paranormal', 'supernatural', 'true crime', 'serial killers', 'murder', 'stephen king', 'dracula', 'frankenstein', 'slasher', 'occult', 'urban legends', 'cryptids', 'myths and legends'],
    ink: '#f4ecff', accent: '#ff8a1f', accent2: '#8be04e', card: 'rgba(16,8,30,.74)', cardInk: '#f4ecff', line: 'rgba(255,138,31,.6)',
    title: '"Creepster", "Chiller", fantasy', q: '"Outfit", "Avenir Next", sans-serif', qWeight: 700, titleScale: 1.08,
  },
  {
    id: 'party', name: 'Party', emoji: '🎉',
    kw: ['general', 'general knowledge', 'random', 'mixed', 'trivia', 'family', 'board games', 'christmas', 'easter', 'birthdays', 'party', 'kids', 'fun', 'misc', 'miscellaneous', 'everything'],
    ink: '#ffffff', accent: '#ffd23f', accent2: '#ff5d8f', card: 'rgba(30,20,84,.72)', cardInk: '#ffffff', line: 'rgba(255,210,63,.65)',
    title: '"Fredoka", "Avenir Next Rounded", sans-serif', q: '"Fredoka", "Avenir Next Rounded", sans-serif', qWeight: 600,
  },
];

const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));
const DEFAULT_THEME = 'party';

function themeOf(id) {
  return THEME_BY_ID[id] || THEME_BY_ID[DEFAULT_THEME];
}

// Pick the theme whose keywords best match a category name. Longer keyword hits win
// so "video games" beats "games" and "pop culture" beats "pop".
function suggestTheme(category) {
  const plain = String(category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const text = ' ' + plain.replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  if (!text.trim()) return DEFAULT_THEME;
  let best = null;
  let bestLen = 0;
  for (const t of THEMES) {
    for (const k of t.kw) {
      const needle = ' ' + k.replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
      if (text.includes(needle) && needle.length > bestLen) {
        best = t.id;
        bestLen = needle.length;
      }
    }
  }
  return best || DEFAULT_THEME;
}

// CSS custom properties a themed screen reads.
function themeVars(t) {
  // Font stacks are quoted with " in THEMES; inline style attributes are double-quoted, so swap to '.
  const f = (v) => String(v).replace(/"/g, "'");
  return [
    `--t-ink:${t.ink}`, `--t-accent:${t.accent}`, `--t-accent2:${t.accent2}`,
    `--t-card:${t.card}`, `--t-card-ink:${t.cardInk}`, `--t-line:${t.line}`,
    `--t-title:${f(t.title)}`, `--t-q:${f(t.q)}`, `--t-qw:${t.qWeight || 600}`,
    `--t-qscale:${t.qScale || 1}`, `--t-titlescale:${t.titleScale || 1}`,
  ].join(';');
}
