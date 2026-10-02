// Legends: rare creatures anyone might see fly over their island.
// This file only holds how each one looks and what a sighting gives. Everything else comes from the server,
// and only to the person it belongs to.
const MYTHS = {
  simurgh: { name:'The Simurgh', colors:[0xff5fa2, 0xffb347, 0x7ee0c3, 0x8fa8ff, 0xc98bff],
    appear:{ head:'A Simurgh flew over your island!', gift:'Glowing mushrooms popped up where its shadow passed. Tap them to see what\'s inside.' } },
  ziz: { name:'The Ziz', colors:[0x7ec8e3, 0x3f86c9, 0x8fdc8a, 0xfff3a0],
    appear:{ head:'A Ziz flew over your island!', gift:'It brought rain to your garden, so every plant is watered. It also dropped a Sunflower Seed Brittle. It is in your Bag.' } },
  ibis: { name:'The Ibis of Thoth', colors:[0xfff6e6, 0x2b2233, 0xffc857, 0x7ee0c3],
    appear:{ head:'An Ibis of Thoth flew over your island!', gift:'It dropped a golden feather worth 50 coins.' } },
};
// what you find under a glowing mushroom: just for fun
const FINDS = [
  'A tiny snail is under the cap, wearing it like a hat.',
  'This one hums a little when you touch it.',
  'It puffs out a cloud of glowing spores. Your hands sparkle for a minute.',
  'A ladybug was napping underneath. It is not happy about this.',
  'This one glows in a spiral pattern if you look closely.',
  'It smells a little like rain on pavement.',
  'The mushroom sneezes. Probably.',
];
// used in developer mode, before the server has sent the real content
const DEV_CONTENT = { path:'Test path', legend:['Developer mode: the real story comes from the server.'], power:{ name:'Power', text:'Test power.' },
  missions:[{ t:'pick', n:2, text:'Harvest 2 crops.' }, { t:'talk', n:1, text:'Talk to a neighbor.' }, { t:'water', n:2, text:'Water 2 plants.' }, { t:'power', n:1, text:'Use your power.' }, { t:'appear', n:1, text:'Fly over another island.' }, { t:'reflect', n:1, text:'Answer today\'s question.' }],
  reflect:['Test question?'], learn:['Test fact.'] };
// your legend's level: it goes up by one for every finished mission, with no top
const glowName = n => `Level ${n + 1}`;
export { MYTHS, FINDS, DEV_CONTENT, glowName };
