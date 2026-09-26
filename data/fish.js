// Every fish in the cloud stream: when it bites, how hard it fights (0 easy to 1 hard), size range in cm, and colors.
// `when` receives { season, hour, raining, secret } and says whether the fish can bite right now.
const FISH = [
  { id:'minnow',     weight:40, fight:.15, cm:[4, 9],    body:0x9fb6c8, belly:0xe8f0f5, fin:0x7e97ab, when:c => !c.secret },
  { id:'trout',      weight:22, fight:.35, cm:[25, 60],  body:0x8a9a6a, belly:0xf2d7c8, fin:0xd98b7a, when:c => !c.secret },
  { id:'koi',        weight:14, fight:.4,  cm:[30, 70],  body:0xffffff, belly:0xffffff, fin:0xff7a45, spots:0xff7a45, when:c => !c.secret && c.season === 0 && c.hour < 19 },
  { id:'sunfish',    weight:10, fight:.55, cm:[80, 250], body:0xb8c4cc, belly:0xdfe6ea, fin:0x9aa8b2, round:true, when:c => !c.secret && c.season === 1 && c.hour < 19 },
  { id:'frostchar',  weight:14, fight:.45, cm:[30, 75],  body:0x5f7fa3, belly:0xff9a7a, fin:0xffffff, when:c => !c.secret && c.season === 3 },
  { id:'guppy',      weight:18, fight:.2,  cm:[2, 6],    body:0xff8fe0, belly:0xfff3a0, fin:0x7ec8e3, when:c => !c.secret && c.raining },
  { id:'lanterneel', weight:12, fight:.6,  cm:[40, 110], body:0x3b2f4a, belly:0x5a4b7a, fin:0xfff38a, glow:0xfff38a, long:true, when:c => c.hour >= 20 },
  { id:'puffer',     weight:6,  fight:.7,  cm:[15, 45],  body:0xffc857, belly:0xfff6e6, fin:0x7ec8e3, spots:0x3b2f4a, round:true, when:() => true },
  { id:'moonray',    weight:30, fight:.85, cm:[150, 450],body:0x2d3a6b, belly:0xdff3ff, fin:0x9fe7e0, ray:true, when:c => c.secret },
];
export { FISH };
