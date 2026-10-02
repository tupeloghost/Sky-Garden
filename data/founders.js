// Founding Gardeners: testers who help build Sky Garden. Their extras are looks only.
// Tester missions point testers at the things we most want tried. `feature` hides a mission until that feature is on.
const MISSIONS = [
  { id:'fish',    title:'Catch a fish off a dock', how:'Tap a dock, watch for fish shadows, and reel one in.', done:S => Object.keys(S.fishLog || {}).length > 0 },
  { id:'row',     title:'Plant a whole row', how:'Plant 3 plots in one row, then water one of them.', done:S => [0,3,6,9].some(r => [0,1,2].every(c => S.tiles[r + c] && S.tiles[r + c].s === 2)) },
  { id:'crate',   title:'Choose what to sell', how:'Tap the sell crate and pick what to sell.', done:S => !!S.soldPick },
  { id:'stars',   title:'Sleep under the stars', how:'Tap the campfire at night and sleep outside.', done:S => !!S.sleptOutside },
  { id:'nap',     title:'Take a nap in a hammock', how:'Tap the hammock between the 2 trees behind your garden.', done:S => !!S.napped },
  { id:'build',   title:'Build something', how:'After your hut is rebuilt, tap Build and place a piece anywhere on your island.', done:S => (S.builds || []).length > 0 },
  { id:'taste',   title:'Learn what a neighbor loves', how:'Give gifts and watch how they react.', done:S => Object.values(S.tastesKnown || {}).some(t => Object.values(t).includes(0)) },
  { id:'bug',     title:'Catch a bug with a net', how:'Make a Bug Net at the workbench, then swing at an insect.', feature:'butterflies', done:S => !!S.tools.net && (S.bugs || []).length > 0 },
  { id:'choice',  title:'Make a choice for a neighbor', how:'When a neighbor asks you to decide something, pick an answer. There are no wrong answers.', feature:'journey', done:S => (S.choices || []).length > 0 },
  { id:'grow',    title:'Grow your island', how:'Ask Nana about growing the island.', feature:'expand', done:S => (S.expand || 0) > 0 },
  { id:'visitor', title:'Befriend a visitor', how:'When a traveler camps on your island, talk to them and bring gifts.', feature:'villagers', done:S => Object.values(S.people || {}).some(p => p.hearts >= 3) },
  { id:'product', title:'Design a product', how:'Make your maker\'s mark with Pip, then design something at the Trading Post.', feature:'market', done:S => (S.madeProducts || 0) > 0 },
];
const FOUNDER_GIFTS = [
  "The Founder's Lantern: fireflies gather around it at night. Find it in Build mode.",
  'The Sky Pioneer outfit: flight jacket, trailing scarf, and aviator cap. Pick it in Change my look.',
  'Your own hot-air balloon: tap it in the hotbar to fly to any island you have opened.',
  'A companion: a fennec fox kit, red panda cub, or barn owl chick that follows you everywhere.',
];
export { MISSIONS, FOUNDER_GIFTS };
