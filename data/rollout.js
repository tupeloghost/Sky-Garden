// The rolling unlock plan. Each real day a player opens the game counts as one play day.
// On that play day, the feature unlocks and a "New today" card explains it in plain words.
// Features that also have a switch in features.js stay hidden until that switch is live.
const ROLLOUT = [
  { day:2,  id:'goals',       title:'Daily goals', text:'Tap Goals at the top to see 3 small tasks for today. Finish them for bonus coins.' },
  { day:4,  id:'butterflies', title:'Butterflies and bugs', text:'Tap a butterfly when you see one. Each kind is a real butterfly. The ones you tap are saved in Collections.' },
  { day:6,  id:'specialty',   title:'Your island specialty', text:'A new tree is growing by your garden. Tap it each day. Its crop sells for 5 times more on a friend\'s island.' },
  { day:7,  id:'heirloom',    title:'Your heirloom flower', text:'A flower that grows only on your island is blooming by your garden. Tap it each day and give some to friends.' },
  { day:8,  id:'pottery',     title:'The Pottery Age', text:'Look for reddish clay patches at the edge of your island. Scoop clay, then build a kiln at the tree stump workbench.' },
  { day:9,  id:'villagers',   title:'Visitors', text:'When a traveler camps on your island, talk to them and bring gifts. They stay 2 or 3 days. At 3 hearts you can invite them to stay.' },
  { day:10, id:'bronze',      title:'The Bronze Age', text:'Look for green-streaked copper ore on Orchard Isle. Then build a furnace at the tree stump workbench. You need a kiln and bricks to build it.' },
];
export { ROLLOUT };
