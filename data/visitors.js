// Travelers who camp on your island for a couple of days (like Animal Crossing).
// Become good friends and you can invite them to stay as permanent neighbors.
const SPECIES = [
  { id:'rabbit',   name:'rabbit',   look:{ earType:'bunny' },  colors:[[0xf6f1ea,0xffffff],[0xc9a27e,0xf3e2c4],[0x9a8f8a,0xe8e0d0]] },
  { id:'mouse',    name:'mouse',    look:{ earType:'mouse' },  colors:[[0xb3aabb,0xf3eef6],[0xd9bfa6,0xfff1d6]] },
  { id:'cat',      name:'cat',      look:{ earType:'point' },  colors:[[0xffb36b,0xfff6e6],[0x3b2f4a,0x9a8fae],[0xe8e0d0,0xffffff]] },
  { id:'fox',      name:'fox',      look:{ earType:'point' },  colors:[[0xff8a3c,0xfff6e6]] },
  { id:'bear',     name:'bear',     look:{ earType:'round' },  colors:[[0x8b6b5a,0xd9bfa6],[0xf2efe8,0xffffff],[0x5a4034,0xb98a63]] },
  { id:'hedgehog', name:'hedgehog', look:{ earType:'round', spikes:true }, colors:[[0xb98a63,0xfff1d6]] },
  { id:'owl',      name:'owl',      look:{ owl:true, beak:0xffb347 }, colors:[[0xc9b6ff,0xf3eef6],[0x9b7b5a,0xf3e2c4]] },
  { id:'turtle',   name:'turtle',   look:{ shell:true },       colors:[[0x8fbf7a,0xe6f0c8]] },
  { id:'frog',     name:'frog',     look:{ frog:true },        colors:[[0x9fe7a0,0xf2fbe6],[0xff9fb2,0xfff0f3]] },
  { id:'duck',     name:'duck',     look:{ beak:0xffb347 },    colors:[[0xfff3a0,0xffffff],[0xffffff,0xfff6e6]] },
];
const NAMES = ['Juniper','Biscuit','Marlow','Pepper','Clementine','Otis','Willa','Tuck','Hazel','Barley','Mochi','Rosie','Fig','Pebble','Sprout','Quill','Maple','Bramble','Nutmeg','Poppy','Cosmo','Dewey','Tansy','Waffles','Kip','Olive','Rook','Sable','Plum','Bean'];
const OUTFITS = ['cardigan','vest','coat','overalls','apron','dress','robe'];
const TOP_COLORS = [0xff8fa3,0x7ec8e3,0xffc857,0x8fdc8a,0xc9b6ff,0xff9a3c,0x5b5bd6,0xd2334c];
// how each kind of person talks. {name} is replaced with the player's name.
const PERSONALITIES = {
  cheerful: { word:'cheerful', hi:["Hi hi HI! Isn't today the best day?","I love it here already! Can I tell you a secret? I love it everywhere.","You have the nicest island I've seen all week. And I've seen FOUR."],
    loves:['kind:fruit','candy','jam','sunbell'], hates:['saltfish'], invite:"Really?! I'd LOVE to live here! I'll build a cottage right away!" },
  sleepy:   { word:'sleepy', hi:["Mm... oh, hello. I was resting my eyes. For a while.","Your island has a very good napping breeze.","Do you ever just... lie in the grass? Best thing there is."],
    loves:['tea','soup','kind:heirloom','lunamoth'], hates:['coffee'], invite:"Stay here? Forever? That sounds... so cozy. Yes. Yes, please." },
  bookish:  { word:'curious', hi:["Did you know most of the dust in your house is tiny bits of skin? Sorry. I read a lot.","I'm writing a book about islands. Yours is chapter one.","Every rock here has a story. I've been listening to them."],
    loves:['tea','kind:specialty','starbloom','koi'], hates:['candy'], invite:"I'd be honored. I'll need a shelf. Several shelves. Many shelves." },
  sporty:   { word:'sporty', hi:["I ran here! From the next island! Well, I swam some of it.","Want to race to that tree? No? Maybe tomorrow.","Fishing is basically a sport. I'm counting it."],
    loves:['kind:fish','peach','dragonfly'], hates:['candy'], invite:"YES! I'll build my cottage by morning. Warm-ups first, obviously." },
  dreamy:   { word:'dreamy', hi:["I dreamed about this island before I ever saw it. Weird, right?","Do you think clouds get tired of floating?","The sky here is a different blue. Bluer blue."],
    loves:['starbloom','firefly','kind:heirloom','vanilla'], hates:['stone'], invite:"I think the stars wanted me here. Yes. I'll stay." },
  grumpy:   { word:'grumpy', hi:["Hmph. It's fine. The island is fine. Don't make it weird.","I only came here because the other island had too many cheerful people.","I'm not smiling. My face just does that sometimes."],
    loves:['coffee','kale','kind:fish'], hates:['candy'], invite:"...Fine. I'll stay. But only because you asked nicely. Don't tell anyone I'm happy about it." },
};
const REQUEST_LINES = ["I've been craving {item}. Could you find me {n}?","Would you bring me {n} {item}? I'll make it worth your while.","I promised someone {n} {item}. Can you help me out?"];
export { SPECIES, NAMES, OUTFITS, TOP_COLORS, PERSONALITIES, REQUEST_LINES };
