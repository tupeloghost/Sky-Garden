// Character creation and island modes. Add new animals, colors, hats, or modes here.

// The player is a person. (Neighbors are animal villagers.)
const SKIN = [0xffe9da, 0xffe0c9, 0xf6c9a4, 0xeebd94, 0xe0ac86, 0xc68a62, 0xb07a52, 0x9c6644, 0x7f5236, 0x6e4630, 0x4f3322];
const HAIR_STYLES = { short:'Short', buzz:'Buzz cut', sidepart:'Side part', spiky:'Spiky', bob:'Bob', long:'Long', wavy:'Wavy', ponytail:'Ponytail', braid:'Braid', bun:'Bun', twinbuns:'Space buns', pigtails:'Pigtails', curly:'Curly', afro:'Afro', locs:'Locs' };
const HAIR_COLORS = [0x1c1820, 0x2b2233, 0x5a3a28, 0x7a4a2e, 0x9b6b4a, 0xb5562e, 0xd9653b, 0xe6b35a, 0xf2dc9b, 0xa9a4a8, 0xe8e0d0, 0xff8fa3, 0xc9b6ff, 0x7ec8e3, 0x8fdc8a];
const EYE_COLORS = [0x2b2233, 0x5a3a28, 0x8a6a3a, 0x6f8f4a, 0x3f8f7a, 0x4a86c9, 0x8fa7b8, 0xb07a2e];
const EYE_STYLES = { round:'Round', lashes:'Lashes', happy:'Happy', sleepy:'Sleepy' };
const BROWS = { none:'None', soft:'Soft', bold:'Bold' };
const FACE_EXTRAS = { blush:'Rosy cheeks', freckles:'Freckles', glasses:'Glasses' };
const SHIRTS = [0xff8fa3, 0xd2334c, 0xff9a3c, 0xffc857, 0x8fdc8a, 0x4f8a5b, 0x7ec8e3, 0x3f86c9, 0x2d3a6b, 0xc9b6ff, 0xfff1d6, 0xffffff, 0x9a9aa6, 0x8a5a3a, 0x3b2f4a];
// starter outfits: real everyday clothes
const TOPS = { tee:'T-shirt', hoodie:'Hoodie', sweater:'Striped sweater', buttonup:'Button-up shirt', overalls:'Overalls', dress:'Dress' };
const SHOES = { sneakers:'Sneakers', boots:'Boots', rainboots:'Rain boots' };
const SHOE_COLORS = [0x3b2f4a, 0xffffff, 0x8a5a3a, 0xd2334c, 0xffc857, 0x7ec8e3, 0x8fdc8a];
const BOTTOMS = { pants:'Pants', shorts:'Shorts', skirt:'Skirt', longskirt:'Long skirt' };
const BOTTOM_COLORS = [0x3f5a8c, 0x7a9cc9, 0x6b4f3a, 0x3b2f4a, 0x1c1820, 0x9a9aa6, 0xd9c7a0, 0x8fa37a, 0xd2334c, 0xff8fa3, 0xc9b6ff];
const HATS = {
  none:   'No hat',
  tophat: 'Top hat',
  crown:  'Flower crown',
  beanie: 'Beanie',
  bow:    'Bow',
  straw:  'Straw hat',
  cap:    'Baseball cap',
  beret:  'Beret',
  bucket: 'Bucket hat',
  headband:'Headband',
};
const FOUNDER_HATS = { pioneer:'Sky Pioneer hat' }; // only for Founding Gardeners
const HAT_COLORS = [0x7ec8e3, 0x3f86c9, 0xff8fa3, 0xd2334c, 0xffc857, 0x8fdc8a, 0xc9b6ff, 0xfff1d6, 0x8a5a3a, 0x3b2f4a];
const DEFAULT_LOOK = { human:true, skin:0xf6c9a4, hair:'short', hairColor:0x5a3a28, shirt:0x7ec8e3, bottom:'pants', bottomColor:0x3f5a8c, hat:'none', hatColor:0x7ec8e3,
  eyeColor:0x2b2233, eyes:'round', brows:'none', blush:true, freckles:false, glasses:false, top:'tee', shoes:'sneakers', shoeColor:0x3b2f4a };

// Island modes, chosen once at the start (like picking a farm type). Each has perks.
const MODES = [
  { id:'garden',   name:"Gardener's Isle", blurb:'For people who love to grow things.',
    perks:['Start with a bigger garden: 12 plots instead of 9', 'Every harvest has a 1 in 5 chance of a bonus crop'] },
  { id:'fisher',   name:"Fisher's Isle", blurb:'For people who love the water.',
    perks:['Your own fishing dock at home from day one', 'Fish sell for 25% more'] },
  { id:'scholar',  name:"Scholar's Isle", blurb:'For people who love to learn.',
    perks:['Earn 30 extra coins each time you dig up or learn something new', 'Start with a bookshelf in your hut'] },
  { id:'explorer', name:"Explorer's Isle", blurb:'For people who want to see everything.',
    perks:['Walk 25% faster', 'Bridges cost 30% less'] },
  { id:'cozy',     name:'Cozy Isle', blurb:'For people who like to take their time.',
    perks:['Days last twice as long', 'Crops never wilt when the season changes'] },
];

export { EYE_COLORS, EYE_STYLES, BROWS, FACE_EXTRAS, TOPS, SHOES, SHOE_COLORS, FOUNDER_HATS, SKIN, HAIR_STYLES, HAIR_COLORS, SHIRTS, BOTTOMS, BOTTOM_COLORS, HATS, HAT_COLORS, DEFAULT_LOOK, MODES };
