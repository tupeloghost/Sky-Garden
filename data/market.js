// Trading post and creator shops: logos, shop names, and one-of-a-kind products.
// Kids choose shop and product names from these words only (the server checks this too).
const KID_ADJ = ['Sunny','Cozy','Happy','Little','Starry','Breezy','Golden','Mossy','Rosy','Misty','Bright','Merry'];
const KID_NOUN = ['Garden','Nook','Workshop','Corner','Market','Studio','Meadow','Cottage','Lantern','Harbor','Orchard','Den'];
const SHAPES = ['circle','shield','star','heart','leaf','diamond'];
const PATTERNS = ['plain','stripes','dots','waves','checks','flowers'];
const SYMBOLS = ['🌸','🐝','🍯','⭐','🌙','🍄','🐟','🌻','🦋','🍎','🌿','☕','🏺','🧺','🔥','💎'];
const PALETTE = [0xff8fa3,0x7ec8e3,0xffc857,0x8fdc8a,0xc9b6ff,0xfff1d6,0xff9a3c,0x3b2f4a,0xd2334c,0x5b5bd6,0x9b6b4a,0xffffff];
// what you can turn into a product, and what it takes
const BASES = {
  basket:  { name:'Woven Basket', needs:{ fiber:6, stick:2 }, value:60 },
  pot:     { name:'Painted Pot',  needs:{ pot:1 },            value:90, age:'kiln' },
  jam:     { name:'Jam Jar',      needs:{ jam:1 },            value:160 },
  tea:     { name:'Tea Tin',      needs:{ tea:1 },            value:150 },
  candy:   { name:'Brittle Box',  needs:{ candy:1 },          value:170 },
  soup:    { name:'Soup Crock',   needs:{ soup:1 },           value:180 },
  crisp:   { name:'Crisp Tin',    needs:{ crisp:1 },          value:160 },
  saltfish:{ name:'Fish Crate',   needs:{ saltfish:1 },       value:150 },
};
const hx = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
const SHAPE_SVG = {
  circle:'<circle cx="50" cy="50" r="46"/>',
  shield:'<path d="M50 4 L92 18 V50 C92 74 72 90 50 97 C28 90 8 74 8 50 V18 Z"/>',
  star:'<path d="M50 4 L62 36 L96 38 L69 59 L79 93 L50 73 L21 93 L31 59 L4 38 L38 36 Z"/>',
  heart:'<path d="M50 92 C18 70 4 52 4 32 C4 16 16 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C84 6 96 16 96 32 C96 52 82 70 50 92 Z"/>',
  leaf:'<path d="M50 4 C82 18 94 50 78 78 C68 94 32 94 22 78 C6 50 18 18 50 4 Z"/>',
  diamond:'<path d="M50 3 L96 50 L50 97 L4 50 Z"/>',
};
// a logo as a small inline picture
function logoSvg(l, size = 44) { l = l || {}; const txt = l.letters || '';
  return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100"><g fill="${hx(l.bg ?? 0xffc857)}" stroke="${hx(l.fg ?? 0x3b2f4a)}" stroke-width="5">${SHAPE_SVG[l.shape] || SHAPE_SVG.circle}</g>`
    + (l.sym ? `<text x="50" y="${txt ? 50 : 64}" font-size="${txt ? 30 : 42}" text-anchor="middle">${l.sym}</text>` : '')
    + (txt ? `<text x="50" y="${l.sym ? 82 : 64}" font-size="${l.sym ? 24 : 40}" font-weight="800" text-anchor="middle" fill="${hx(l.fg ?? 0x3b2f4a)}" font-family="sans-serif">${txt}</text>` : '') + '</svg>'; }
// a product as a little swatch showing its colors and pattern
function productSwatch(p, size = 44) { if (!p) return ''; const a = hx(p.color), b = hx(p.color2), id = 'pt' + Math.random().toString(36).slice(2, 8);
  const pat = { stripes:`<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="${b}"/></pattern>`,
    dots:`<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="4" fill="${b}"/></pattern>`,
    waves:`<pattern id="${id}" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 6 Q6 0 12 6 T24 6" fill="none" stroke="${b}" stroke-width="3"/></pattern>`,
    checks:`<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${b}"/><rect x="8" y="8" width="8" height="8" fill="${b}"/></pattern>`,
    flowers:`<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="3" fill="${b}"/><circle cx="11" cy="5" r="3" fill="${b}"/><circle cx="11" cy="17" r="3" fill="${b}"/><circle cx="5" cy="11" r="3" fill="${b}"/><circle cx="17" cy="11" r="3" fill="${b}"/></pattern>` }[p.pattern];
  return `<svg class="swatch" width="${size}" height="${size}" viewBox="0 0 100 100"><defs>${pat || ''}</defs><rect x="6" y="6" width="88" height="88" rx="22" fill="${a}"/>${pat ? `<rect x="6" y="6" width="88" height="88" rx="22" fill="url(#${id})"/>` : ''}<rect x="6" y="6" width="88" height="88" rx="22" fill="none" stroke="#3b2f4a" stroke-opacity=".25" stroke-width="4"/></svg>`; }
const MARK_LESSON = 'Makers have marked their work for thousands of years. Roman brickmakers stamped their bricks, and potters scratched their sign into clay. In 1876, a brewery\'s red triangle became the first trademark registered in Britain. A mark tells people who made something, so they can find you again.';
const DESIGN_LESSON = 'Good product design is more than looks. The best products are useful, easy to recognize, and tell a story about who made them. That is why real brands keep their colors and logo the same on everything they sell.';
export { KID_ADJ, KID_NOUN, SHAPES, PATTERNS, SYMBOLS, PALETTE, BASES, logoSvg, productSwatch, hx, MARK_LESSON, DESIGN_LESSON };
