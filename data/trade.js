// Island specialties: each island gets one real crop. It sells for little at home
// and for 5 times more on any other island, so trading pays off.
const SPECIALTIES = [
  { id:'cacao',   name:'Cacao Pod',     color:0xb5651d, leaf:0x2f7a45, fact:'Cacao pods grow right on the trunk of the tree. The Maya and Aztecs made the beans into a bitter drink, and the Aztecs even used the beans as money.' },
  { id:'coffee',  name:'Coffee Cherry', color:0xd8323c, leaf:0x2f6b3f, fact:'Coffee first grew wild in Ethiopia. A coffee "bean" is really the seed inside a small red fruit called a coffee cherry.' },
  { id:'vanilla', name:'Vanilla Pod',   color:0x4a3a2a, leaf:0x5aa85f, fact:'Vanilla comes from the pod of an orchid flower. Each flower opens for about 1 day, so on most farms, people move the pollen by hand on every single flower.' },
  { id:'saffron', name:'Saffron',       color:0xd8452b, leaf:0x7fb069, fact:'Saffron is the red threads inside a crocus flower. It takes about 150 flowers to make a single gram, which is why it costs so much.' },
  { id:'tea',     name:'Tea Leaves',    color:0x6fae5a, leaf:0x3f8f55, fact:'All true tea, green or black, comes from the leaves of 1 plant, Camellia sinensis. People in China have drunk it for thousands of years.' },
  { id:'olive',   name:'Olives',        color:0x6b7a2a, leaf:0x8fa37a, fact:'Olive trees can live for well over 1,000 years, and people have pressed olives into oil for at least 6,000 years.' },
];
const HOME_PRICE = 20, AWAY_MULT = 5;
const TRADE_FACT = 'In real life, places that trade what they grow best end up with more for everyone. That is why the spice trade and the Silk Road, an old trade route across Asia, crossed whole continents.';

// Heirloom flowers: every island breeds its own variety, made from its island code.
// No two islands get the same one. Real gardeners breed and name their own varieties too.
const H_COLORS = [['Coral',0xff7f6e],['Plum',0x8e4585],['Sky',0x7ec8e3],['Butter',0xffe07a],['Rose',0xff8fb1],['Snow',0xfaf7f0],['Lilac',0xc9a8ff],['Sunset',0xff9a3c],
  ['Mint',0x8fdcb4],['Ruby',0xd2334c],['Peach',0xffc4a3],['Indigo',0x5b5bd6],['Honey',0xf2b33d],['Blush',0xf7c6d0],['Violet',0x9b5de5],['Cream',0xfff1d6]];
const H_STYLES = ['Starburst','Ribbon','Firefly','Velvet','Moonlit','Candy','Sunrise','Feathered','Twirl','Lantern','Comet','Ripple','Freckled','Silk','Whisper','Crown'];
const H_FLOWERS = ['Rose','Tulip','Dahlia','Zinnia','Poppy','Peony','Aster','Camellia','Cosmos','Anemone','Marigold','Iris','Lily','Daisy','Ranunculus','Primrose'];
function heirloomOf(code) { // code: 6 hex characters
  const d = [...code].map(ch => parseInt(ch, 16));
  const main = H_COLORS[d[0]], tip = H_COLORS[(d[0] + 3 + d[3]) % 16], center = H_COLORS[d[4]];
  return { code, name:`${main[0]} ${H_STYLES[d[1]]} ${H_FLOWERS[d[2]]}`, main:main[1], tip:tip[1], center:center[1], petals:5 + (d[5] % 5), stripes:d[3] % 2 === 1 };
}
// item ids only use lowercase letters, so the island code is spelled with a to p
const heirloomId = code => 'hl' + [...code.toUpperCase()].map(ch => String.fromCharCode(97 + parseInt(ch, 16))).join('');
const codeOfHeirloom = id => [...id.slice(2)].map(ch => (ch.charCodeAt(0) - 97).toString(16)).join('').toUpperCase();
const isHeirloom = id => /^hl[a-p]{6}$/.test(id || '');
export { SPECIALTIES, HOME_PRICE, AWAY_MULT, TRADE_FACT, heirloomOf, heirloomId, codeOfHeirloom, isHeirloom };
