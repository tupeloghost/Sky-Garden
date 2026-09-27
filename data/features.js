// Feature switches. live:true means every player sees it.
// live:false means only developer mode sees it (turn it on or off in the DEV panel to test).
// Players who already unlocked something keep it, even if its switch is off.
const FEATURES = [
  { id:'pottery',  name:'Pottery Age',        live:false, what:'Clay pits, the kiln, bricks and pots, brick build pieces.' },
  { id:'bronze',   name:'Bronze Age',         live:false, what:'Copper and tin ore, the furnace, bronze tools and pieces.' },
  { id:'specialty', name:'Island specialties', live:false, what:'Each island grows one real specialty crop. It sells for 5 times more on other islands.' },
  { id:'heirloom',  name:'Heirloom flowers',  live:false, what:'Each island breeds its own one-of-a-kind flower that only grows there.' },
  { id:'journey', name:'Choices and karma', live:false, what:'Neighbors bring small choices. Hidden kindness and harmony shape what happens later.' },
  { id:'expand', name:'Island expansions', live:false, what:'Nana offers to grow your home island in 3 stages: West Meadow, South Shore, North Ridge.' },
  { id:'switchIsle', name:'Switch island type', live:false, what:'Players can change their island type from the Bag.' },
];
export { FEATURES };
