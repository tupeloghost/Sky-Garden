// The rolling unlock plan. Each real day a player opens the game counts as one play day.
// On that play day, the feature unlocks and a "New today" card explains it in plain words.
// Features that also have a switch in features.js stay hidden until that switch is live.
const ROLLOUT = [
  { day:2,  id:'goals',       title:'Daily goals', text:'Tap Goals at the top to see 3 small tasks for today. Finish them for bonus coins.' },
  { day:4,  id:'butterflies', title:'Butterflies and bugs', text:'Tap a butterfly when you see one. Each kind is a real butterfly, and it is saved in Collections.' },
  { day:6,  id:'specialty',   title:'Your island specialty', text:'A new tree is growing by your garden. Tap it each day. Its crop sells for 5 times more on a friend\'s island.' },
  { day:7,  id:'heirloom',    title:'Your heirloom flower', text:'A flower that grows only on your island is blooming by your garden. Tap it each day and give some to friends.' },
  { day:8,  id:'pottery',     title:'The Pottery Age', text:'Look for reddish clay patches at the edge of your island. Scoop clay, then build a kiln at the tree stump workbench.' },
  { day:9,  id:'villagers',   title:'Visitors', text:'Travelers sometimes camp on your island for a day or two. Talk to them, bring gifts, and if you become good friends, you can invite them to stay.' },
  { day:10, id:'bronze',      title:'The Bronze Age', text:'Green-streaked copper ore is on Orchard Isle. With a kiln and bricks, build a furnace at the tree stump workbench.' },
];
export { ROLLOUT };
