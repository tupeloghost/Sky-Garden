// Feature switches. live:true means every player sees it.
// live:false means only developer mode sees it (turn it on or off in the DEV panel to test).
// Players who already unlocked something keep it, even if its switch is off.
const FEATURES = [
  { id:'pottery',  name:'Pottery Age',        live:false, what:'Clay pits, the kiln, bricks and pots, brick build pieces.' },
  { id:'bronze',   name:'Bronze Age',         live:false, what:'Copper and tin ore, the furnace, bronze tools and pieces.' },
  { id:'specialty', name:'Island specialties', live:false, what:'Each island grows 1 real specialty crop. It sells for 5 times more on other islands.' },
  { id:'heirloom',  name:'Heirloom flowers',  live:false, what:'Each island breeds its own one-of-a-kind flower that only grows there.' },
  { id:'journey', name:'Choices and karma', live:false, what:'Neighbors bring small choices. Hidden kindness and harmony shape what happens later.' },
  { id:'expand', name:'Island expansions', live:false, what:'Nana offers to grow your home island in 3 stages: West Meadow, South Shore, North Ridge.' },
  { id:'market', name:'Trading post and shops', live:false, what:'A market stall on your island. Make a logo, design products, and buy, sell, and trade with other players.' },
  { id:'villagers', name:'Visiting villagers', live:false, what:'Random travelers camp on your island for 2 or 3 days. At 3 hearts you can invite them to stay.' },
  { id:'founders', name:'Founders wall', live:false, what:'The Founding Gardeners thank-you wall on every island. Tester codes, gifts, and missions work either way.' },
  { id:'townhall', name:'Town Hall voting', live:false, what:'A town board where every player gets 1 vote on what gets built next.' },
  { id:'helpertree', name:'Helper Tree', live:false, what:'A tree that grows once a day when you send feedback, vote, or answer a tester question.' },
  { id:'keepers', name:"Keepers' Path", live:false, what:'Trust levels, Lighthouse Rock, Wren the mentor, and trials whose results can shape the world after you approve them.' },
  { id:'myths', name:'Legends', live:true, what:'Rare creatures that can fly over any island. Tap one for a gift.' },
  { id:'switchIsle', name:'Switch island type', live:false, what:'Players can change their island type from the Bag.' },
];
export { FEATURES };
