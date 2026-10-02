// Chapter 2's fork: what the Puddle Jumper becomes day to day. Both are good; you can switch next island year.
const SHIP_PATHS = {
  explore: { name:"An explorer's ship", short:'Sail out once a day. Pick how to find your way, and come back with fish and finds.' },
  market:  { name:'A floating market', short:"Drizzle's deck becomes a market. You get 3 orders each day, and they pay extra." },
};
// voyages: three real ways Pacific navigators found land without instruments
const HEADINGS = [
  { id:'birds', label:'Follow the birds', hint:'At dusk, sea birds fly home toward land.' },
  { id:'swells', label:'Read the waves', hint:'Islands bend the ocean waves. A sailor can feel it through the boat.' },
  { id:'stars', label:'Steer by the stars', hint:'Each star rises and sets at the same spot on the horizon. Memorize the spots, and they point the way.' },
];
const WAYFINDING = 'Polynesian sailors crossed thousands of kilometers of open ocean with no compass or map. They read the stars, the ocean waves, the birds, and even the color of clouds over land. In 1976, the sailing canoe Hokule\'a sailed from Hawaii to Tahiti this way, and showed the world how it was done.';
const FLOATING = 'Floating markets are real. In Thailand, sellers have paddled boats full of fruit, noodles, and flowers along the canals for generations. When roads are water, the market comes to you.';
export { SHIP_PATHS, HEADINGS, WAYFINDING, FLOATING };
