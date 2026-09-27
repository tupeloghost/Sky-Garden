// Character creation and island modes. Add new animals, colors, hats, or modes here.

// The player is a person. (Neighbors are animal villagers.)
const SKIN = [0xffe0c9, 0xf6c9a4, 0xe0ac86, 0xc68a62, 0x9c6644, 0x6e4630];
const HAIR_STYLES = { short:'Short', long:'Long', bun:'Bun', curly:'Curly', pigtails:'Pigtails', bob:'Bob' };
const HAIR_COLORS = [0x2b2233, 0x5a3a28, 0x9b6b4a, 0xe6b35a, 0xd9653b, 0xe8e0d0, 0xff8fa3, 0x7ec8e3];
const SHIRTS = [0xff8fa3, 0x7ec8e3, 0xffc857, 0x8fdc8a, 0xc9b6ff, 0xfff1d6, 0xff9a3c, 0x3b2f4a];
const BOTTOMS = { pants:'Pants', skirt:'Skirt', shorts:'Shorts' };
const BOTTOM_COLORS = [0x3f5a8c, 0x6b4f3a, 0x3b2f4a, 0xd9c7a0, 0x8fa37a, 0xff8fa3];
const HATS = {
  none:   'No hat',
  tophat: 'Top hat',
  crown:  'Flower crown',
  beanie: 'Beanie',
  bow:    'Bow',
  straw:  'Straw hat',
};
const FOUNDER_HATS = { pioneer:'Sky Pioneer hat' }; // only for Founding Gardeners
const HAT_COLORS = [0x7ec8e3, 0xff8fa3, 0xffc857, 0x8fdc8a, 0xc9b6ff, 0x3b2f4a];
const DEFAULT_LOOK = { human:true, skin:0xf6c9a4, hair:'short', hairColor:0x5a3a28, shirt:0x7ec8e3, bottom:'pants', bottomColor:0x3f5a8c, hat:'none', hatColor:0x7ec8e3 };

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

export { FOUNDER_HATS, SKIN, HAIR_STYLES, HAIR_COLORS, SHIRTS, BOTTOMS, BOTTOM_COLORS, HATS, HAT_COLORS, DEFAULT_LOOK, MODES };
