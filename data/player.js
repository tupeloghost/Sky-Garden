// Character creation and island modes. Add new animals, colors, hats, or modes here.

const SPECIES = {
  bear:  { name:'Bear',  ears:'round' },
  bunny: { name:'Bunny', ears:'bunny', tail:'puff' },
  cat:   { name:'Cat',   ears:'point', tail:'long' },
  fox:   { name:'Fox',   ears:'point', tail:'fox' },
  mouse: { name:'Mouse', ears:'mouse', tail:'thin' },
};
const FUR = [0xffe0b3, 0xf6f1ea, 0xd9a066, 0x9b7b5a, 0xffb36b, 0xb8b8c8, 0xffc4d6, 0x86c7ff];
const HATS = {
  none:   'No hat',
  tophat: 'Top hat',
  crown:  'Flower crown',
  beanie: 'Beanie',
  bow:    'Bow',
  straw:  'Straw hat',
};
const HAT_COLORS = [0x7ec8e3, 0xff8fa3, 0xffc857, 0x8fdc8a, 0xc9b6ff, 0x3b2f4a];
const DEFAULT_LOOK = { species:'bear', fur:0xffe0b3, hat:'tophat', hatColor:0x7ec8e3 };

// Island modes, chosen once at the start (like picking a farm type). Each has perks.
const MODES = [
  { id:'garden',   name:"Gardener's Isle", blurb:'For people who love to grow things.',
    perks:['Start with a bigger garden: 12 plots instead of 9', 'Every harvest has a 1 in 5 chance of a bonus crop'] },
  { id:'fisher',   name:"Fisher's Isle", blurb:'For people who love the water.',
    perks:['Your own fishing dock at home from day one', 'Fish sell for 25% more'] },
  { id:'scholar',  name:"Scholar's Isle", blurb:'For people who love to learn.',
    perks:['Every new memory also pays 30 coins', 'Start with a bookshelf in your hut'] },
  { id:'explorer', name:"Explorer's Isle", blurb:'For people who want to see everything.',
    perks:['Walk 25% faster', 'Bridges cost 30% less'] },
  { id:'cozy',     name:'Cozy Isle', blurb:'For people who like to take their time.',
    perks:['Days last twice as long', 'Crops never wilt when the season changes'] },
];

export { SPECIES, FUR, HATS, HAT_COLORS, DEFAULT_LOOK, MODES };
