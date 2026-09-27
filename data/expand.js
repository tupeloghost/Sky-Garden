// Island expansions: new land joins your home island in stages.
// Real life: people really do make new land. About a sixth of the Netherlands was reclaimed from the sea.
const EXPANSIONS = [
  { id:'west',  name:'West Meadow', x:-12.4, z:1.6,  r:6, cost:{ log:20, stone:15 }, coins:300,  needs:'home',
    trees:[[-14.5,-.5],[-15.5,3.2],[-11.2,5.4]], rocks:[[-13.8,-2.6,.4],[-16.4,1,.36]], bushes:[[-12.6,-1.8],[-15,5.5]],
    why:'Finish building your hut first.' },
  { id:'south', name:'South Shore', x:1.8,   z:12.6, r:6, cost:{ brick:10, log:20, stone:20 }, coins:800, needs:'kiln',
    trees:[[-1.2,14],[4.2,15.4],[5.4,11.2]], rocks:[[1.6,16.4,.42],[-2,11.6,.38]], bushes:[[3.2,14],[-.4,16.2]],
    why:'Reach the Pottery Age first (build a kiln).' },
  { id:'north', name:'North Ridge', x:-3,    z:-12.6, r:6, cost:{ bronze:4, brick:15 }, coins:2000, needs:'furnace',
    trees:[[-6,-13.6],[-.6,-15.6],[-4.4,-16.2]], rocks:[[-1.2,-11.8,.45],[-6.6,-10.6,.4]], bushes:[[-3,-14.6],[.6,-13]],
    why:'Reach the Bronze Age first (build a furnace).' },
];
const RECLAIM_FACT = 'People really do make new land. About a sixth of the Netherlands was once sea, marsh, or lake. The Dutch built walls of earth called dikes, pumped the water out with windmills, and farmed the dry land. These new lands are called polders.';
export { EXPANSIONS, RECLAIM_FACT };
