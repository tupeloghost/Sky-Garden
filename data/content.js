// Sky Garden content: crops, items, neighbors, memories, questions, and quests.
// Add new memories or lines here; the engine in js/main.js reads everything from this file.

const SEASONS = ['Spring','Summer','Fall','Winter'];
const CROPS = {
  cloudberry:  { name:'Cloudberry',   days:2, seed:10, sell:25,  color:0xffc4d6, seasons:[0,1] },
  sunbell:     { name:'Sunbell',      days:4, seed:25, sell:85,  color:0xff9a3c, seasons:[0,1] },
  skywheat:    { name:'Skywheat',     days:3, seed:15, sell:45,  color:0xffd35c, seasons:[1,2] },
  moonpumpkin: { name:'Moonpumpkin',  days:5, seed:30, sell:120, color:0xb58cff, seasons:[2] },
  frostmint:   { name:'Frostmint',    days:3, seed:20, sell:60,  color:0x9fe7e0, seasons:[3] },
  starbloom:   { name:'Starbloom',    days:4, seed:35, sell:140, color:0xfff3a0, seasons:[0,1,2,3], locked:true },
};
const ITEMS = {
  ...Object.fromEntries(Object.entries(CROPS).map(([k,c]) => [k, { name:c.name, sell:c.sell, kind:'crop' }])),
  apple:  { name:'Sky Apple',      sell:20, kind:'fruit' },
  peach:  { name:'Sun Peach',      sell:30, kind:'fruit' },
  minnow: { name:'Cloud Minnow',   sell:15, kind:'fish' },
  trout:  { name:'Sky Trout',      sell:35, kind:'fish' },
  puffer: { name:'Rainbow Puffer', sell:80, kind:'fish' },
  flour:  { name:'Bag of Flour',   sell:0,  kind:'quest' },
  moonray:{ name:'Moon Ray',       sell:150, kind:'fish' },
};
const FURN = {
  rug:       { name:'Round Rug',         price:20 },
  fern:      { name:'Potted Fern',       price:15 },
  lamp:      { name:'Paper Lamp',        price:30 },
  table:     { name:'Round Table',       price:40 },
  armchair:  { name:'Armchair',          price:45 },
  bookshelf: { name:'Bookshelf',         price:60 },
  globe:     { name:'Star Globe',        price:80 },
  rocker:    { name:"Grandma's Rocker",  gift:true },
  sign:      { name:"Pip's Lucky Sign",  gift:true },
  mushroom:  { name:'Glow Mushroom Lamp', gift:true },
  painting:  { name:"Lumen's Painting", gift:true },
};
const LOVES = { nana:['skywheat','frostmint','peach'], pip:['sunbell','cloudberry','apple'], drizzle:['minnow','trout','puffer','moonpumpkin'], twins:['moonpumpkin','apple','frostmint'], lumen:['starbloom','frostmint','peach','moonray'] };
const BRIDGE2_COST = 300;
const BRIDGE_COST = 150;
const DAY_LEN = 360; // seconds, 6 AM to midnight (6 real minutes per day)
const SAVE_KEY = 'sg.save', MUTE_KEY = 'sg.muted';

const NEIGHBORS = {
  nana: { name:'Nana Gale', lines:[
    "The wind is gentle today. Good day to plant.",
    "Before the Great Gust, you could walk from here to the Old Heart without getting your feet cloudy.",
    "Water your crops each day, dear. Rain does it for you, if you are lucky.",
    "Every season has its own crops. Plant what the sky wants, not what you want.",
    "Bridges are how islands hold hands. Pip says that. I think he stole it from me.",
  ], heartLines:[
    "Your grandmother kept a Wind Bell. It rang the whole village awake.",
    "You are good company. The sky feels less empty lately.",
  ]},
  pip: { name:'Pip', lines:[
    "Seeds! Fresh seeds! Well. Fresh-ish. They were in my hat.",
    "One day I will have a real shop. On a big island. With a sign!",
    "Cloudberries grow fast. Sunbells sell high. I did that math myself.",
    "I sell furniture now too. Your hut looks like a cloud with a door.",
    "You are my best customer. You are also my only customer.",
  ], heartLines:[
    "Here is a secret: I cannot actually fly very far. That is why I need the bridges too.",
  ]},
  drizzle: { name:'Captain Drizzle', lines:[
    "Ahoy! Mind the edge. It is a long way down, and I should know.",
    "I once sailed through a cloud so thick, the fish swam in the air. True story. Mostly.",
    "Rain is just the sky giving back what it borrowed.",
    "Pick the fruit trees every day. They like the attention.",
    "The cloud stream by the dock is full of fish. Cast a line!",
  ], heartLines:[
    "Your grandmother charted every island in this sky. I have her old map somewhere. Under the fish.",
  ]},
  lumen: { name:'Lumen', lines:[
    "Oh. Hello. Sorry, I am not used to visitors. The dark is quieter.",
    "I only come out at night. The daytime is so... loud.",
    "Every night the moon looks a little different. I paint it anyway.",
    "Do you see those glowing mushrooms? They are my night lights.",
    "I like how the stars do not rush.",
  ], heartLines:[
    "Your grandmother used to sit right there and watch me paint. She never said much. It was nice.",
  ]},
  twins: { name:'Moss & Fern', lines:[
    "Moss: We dig. Fern: We tunnel. Moss: There is a difference. Fern: There is not.",
    "Fern: The windmill used to hum all day. Moss: Now it only creaks.",
    "Moss: Worms are great listeners. Fern: They have no ears. Moss: Exactly.",
    "Fern: We can smell rain coming. Moss: Also cake. Mostly cake.",
    "Moss: Fern is the smart one. Fern: Moss is the other smart one.",
  ], heartLines:[
    "Fern: Your grandmother gave us our first shovels. Moss: Tiny ones. Fern: We were tiny.",
  ]},
};

// Aha cards: do it first, learn what it was after.
const AHA = {
  bone: { kicker:'MEMORY FOUND', title:'The Counting Bone',
    did:'You dug up a bone with little notches cut in groups.',
    real:'A real bone like this was found at Ishango, in what is now the Democratic Republic of the Congo. It is roughly 20,000 years old. The notches come in groups, and many scientists think someone was counting. Maybe days, maybe the moon.',
    today:'Every tally mark on a scoreboard is the same idea, 20,000 years later.' },
  temple: { kicker:'MEMORY FOUND', title:'The Temple Older Than Farms',
    did:'You found a carved stone with animals on it, buried under layers of ash and clay.',
    real:'At Gobekli Tepe in Turkey, people carved giant stone pillars about 11,600 years ago. That is before farming. Some archaeologists think feeding the crowds who gathered to build and worship there helped push people toward growing crops.',
    today:'Which came first, the temple or the farm? Your garden is part of a very old question.' },
  tablet: { kicker:'MEMORY FOUND', title:'Why an Hour Has 60 Minutes',
    did:'You found a clay tablet covered in little wedge marks.',
    real:'The Babylonians, about 4,000 years ago, counted in 60s instead of 10s. 60 splits evenly into 2, 3, 4, 5, 6, 10, 12, 15, 20, and 30 parts, which made trading and sharing easy.',
    today:'60 seconds, 60 minutes, 360 degrees in a circle. You use Babylonian math every time you read a clock.' },
  sundial: { kicker:'MEMORY FOUND', title:'Measuring the Earth With a Stick',
    did:'You found noon by watching a shadow shrink and then grow.',
    real:'Around 240 BCE, Eratosthenes heard that at noon on one summer day, sunlight reached the bottom of a well in Syene, so there was no shadow. In Alexandria, a stick still cast one. Using that angle and the distance between the cities, he estimated the size of the whole Earth, and came surprisingly close.',
    today:'The shortest shadow of the day means it is noon where you stand. People set clocks this way for thousands of years.' },
  bell: { kicker:'MEMORY FOUND', title:'The Numbers Inside Music',
    did:'You picked chimes with simple lengths like 1/2, 2/3, and 3/4. They sounded sweet. The messy fractions sounded sour.',
    real:'The followers of Pythagoras noticed this about 2,500 years ago: simple number ratios make harmony. A string half as long plays the same note, higher. (The famous story of Pythagoras hearing it in blacksmith hammers is probably a legend.)',
    today:'Every guitar fret and piano key is laid out using this idea.' },
  still: { kicker:'MEMORY FOUND', title:'Fresh Water From the Sun',
    did:'You left salty water in a covered pot in the sun. The next day, fresh water had collected in the little cup.',
    real:'The sun heats the water until some of it rises as vapor, leaving the salt behind. The vapor hits the cooler lid, turns back into drops, and drips into the cup. That is a solar still. It is also how rain works: the sun lifts water off the sea, and clouds drop it back as fresh water.',
    today:'Survival kits and some dry places still use solar stills to make drinking water.' },
  rope: { kicker:'MEMORY FOUND', title:'The 3-4-5 Triangle',
    did:'You split a 12-knot rope into sides of 3, 4, and 5, and got a perfect square corner.',
    real:'Any triangle with sides 3, 4, and 5 has a perfect right angle, because 3x3 + 4x4 = 5x5. We call this the Pythagorean theorem, but Babylonian scribes knew number sets like this over a thousand years before Pythagoras. A popular story says Egyptian "rope stretchers" used knotted ropes this way to lay out buildings. Historians are not sure that part is true.',
    today:'Carpenters and builders still check corners with the 3-4-5 rule.' },
  stars: { kicker:'MEMORY FOUND', title:'The Star That Stays',
    did:'You found the one star that stayed still while all the others turned.',
    real:'Earth spins, so the night sky seems to wheel around one point. In the north, the star Polaris sits almost exactly there, so sailors used it to find north. Polynesian navigators crossed thousands of miles of the Pacific by reading where many stars rise and set, plus ocean swells and birds. In 1976, the canoe Hokule\'a sailed from Hawaii to Tahiti this way, with no instruments.',
    today:'If you can find Polaris, you can always find north.' },
  loom: { kicker:'NANA\'S STORY', title:'Holes, No Holes: The First Programs',
    did:'You finished a weaving pattern made of holes and no holes.',
    real:'In 1804, Joseph Marie Jacquard built a loom controlled by punched cards: a hole or no hole told each thread to rise or stay down. Charles Babbage planned to use punched cards in his Analytical Engine, and in 1843 Ada Lovelace wrote what is often called the first computer program for it.',
    today:'Every computer still runs on two choices: 1 or 0. Hole or no hole.' },
  migration: { kicker:'PIP\'S STORY', title:'How Birds Find Their Way',
    did:'You helped Pip figure out how birds cross whole oceans without getting lost.',
    real:'Many migrating birds use more than one compass: the sun by day, the stars at night, and Earth\'s magnetic field. Scientists think some birds, like European robins, may actually sense magnetism with special molecules in their eyes. Research on this is still going on.',
    today:'Your phone\'s compass senses the same invisible magnetic field.' },
  worldtree: { kicker:'DRIZZLE\'S TALE', title:'The Trees That Hold Up the Sky',
    did:'You listened to Captain Drizzle\'s tale of a giant tree holding the sky together.',
    real:'Many cultures pictured the world held together by a great tree or mountain. In Norse myth it is Yggdrasil, the world tree. In Hindu, Buddhist, and Jain traditions it is Mount Meru at the center of everything. For the ancient Maya, a great ceiba tree linked the heavens, the earth, and the underworld.',
    today:'People everywhere have looked for a center that holds everything together.' },
  harvest: { kicker:'FESTIVAL', title:'Giving Thanks for the Harvest',
    did:'You celebrated the end of the harvest with your neighbors.',
    real:'All over the world, people celebrate when the crops come in. In Judaism, Sukkot is celebrated in small outdoor huts. In Tamil Nadu, Pongal is named after sweet rice boiled until it overflows. Korea has Chuseok and China the Mid-Autumn Festival, both under the full moon. North America has Thanksgiving.',
    today:'Sharing food after hard work may be one of the oldest human traditions.' },
  theseus: { kicker:"PIP'S BIG QUESTION", title:'The Ship of Theseus',
    did:'You answered whether a bridge with all new planks is still the same bridge.',
    real:'The Greek writer Plutarch described a famous ship kept in Athens. As planks rotted, they were replaced, until none of the originals were left. Was it still the same ship? Philosophers have argued about it for 2,000 years. There is no official answer.',
    today:'Your body replaces many of its cells over the years. Are you still the same you?' },
  zeno: { kicker:"PIP'S BIG QUESTION", title:"Zeno's Endless Halves",
    did:'You thought about crossing half, then half of what is left, forever.',
    real:'Zeno of Elea, about 2,450 years ago, made puzzles like this to show that motion is stranger than it looks. Much later, math showed that endless halves can add up to one whole: 1/2 + 1/4 + 1/8 and so on equals exactly 1.',
    today:'Adding up endless tiny pieces is the heart of calculus, used to design bridges, rockets, and video games.' },
  cave: { kicker:"PIP'S BIG QUESTION", title:"Plato's Cave",
    did:'You wondered if what we see might only be shadows of something realer.',
    real:'Plato told a story about people chained in a cave who only ever see shadows on a wall, so they think shadows are everything. One escapes, sees the sun, comes back to tell them, and nobody believes him.',
    today:'Asking "how do I know this is true?" is where science starts.' },
  river: { kicker:"PIP'S BIG QUESTION", title:'You Cannot Step in the Same River Twice',
    did:'You decided whether you can step in the same cloud twice.',
    real:'Heraclitus of Ephesus, about 2,500 years ago, is remembered for saying you cannot step into the same river twice, because new water is always flowing. To him, change was the one thing that never changed.',
    today:'Places, friends, and you keep changing. That can be a comforting thought.' },
  floating: { kicker:"PIP'S BIG QUESTION", title:'The Floating Man',
    did:'You imagined floating in the sky, eyes closed, touching nothing.',
    real:'About 1,000 years ago, the Persian philosopher and doctor Ibn Sina imagined a person floating in the air, blindfolded, touching nothing at all. He argued that person would still know they exist. So, he said, your self is something more than what your senses tell you.',
    today:'Close your eyes for a second. You still know you are here. That is his whole argument.' },
};
Object.assign(AHA, {
  gears: { kicker:'MEMORY FOUND', title:'The 2,000-Year-Old Computer',
    did:'You picked gear sizes until the small gear spun 3 times for every turn of the big one.',
    real:'In 1901, divers near the Greek island of Antikythera pulled a lump of corroded bronze out of a shipwreck. Inside were dozens of tiny gears. It is about 2,100 years old, and researchers have shown that turning its handle could predict eclipses and track the moon and planets. The sizes of its gears set the speeds, just like yours.',
    today:'Bikes, clocks, and car engines all use gear sizes to trade speed for strength.' },
  lever: { kicker:'MEMORY FOUND', title:'Give Me a Place to Stand',
    did:'You slid the pivot close to the heavy stone, and suddenly you could lift it.',
    real:'Archimedes of Syracuse, about 2,250 years ago, worked out the law of the lever: a small push far from the pivot can balance a big weight close to it. He is famously quoted as saying, "Give me a place to stand, and I will move the Earth."',
    today:'Scissors, seesaws, bottle openers, and wheelbarrows are all levers.' },
  bread: { kicker:'MEMORY FOUND', title:'Bread Is Alive',
    did:'You ground wheat into flour, and Nana turned it into bread that puffed up while it rested.',
    real:'Bread rises because yeast, a tiny living fungus, eats the sugar in dough and gives off gas bubbles. People in ancient Egypt were baking risen bread thousands of years ago. Bread also matters in faiths around the world: challah on the Jewish Sabbath, bread at Christian communion, and the free meals of Sikh langar kitchens, where anyone can sit and eat.',
    today:'Every hole in a slice of bread was made by yeast.' },
  fibonacci: { kicker:"MOSS & FERN'S SECRET", title:"The Sunflower's Secret Spiral",
    did:'You found the next number in the pattern the twins counted in a sunflower.',
    real:'1, 1, 2, 3, 5, 8, 13, 21, 34: each number is the sum of the two before it. Sunflowers, pinecones, and pineapples often grow their spirals in these numbers, which packs seeds tightly with no gaps. It is named after Leonardo of Pisa, called Fibonacci, who wrote about it in 1202, but mathematicians in India described it centuries earlier.',
    today:'Next time you hold a pinecone, count its spirals.' },
  stoic: { kicker:"PIP'S BIG QUESTION", title:'Only Worry About What You Control',
    did:'You helped Pip decide what to do about rain he cannot stop.',
    real:'Epictetus was born enslaved in the Roman Empire about 2,000 years ago and became a famous Stoic teacher. His big idea: some things are up to us, like our choices and our effort, and some are not, like the weather. Peace comes from caring for the first and letting go of the second.',
    today:'When you feel stressed, try sorting it: what can I control, and what can I not?' },
  golden: { kicker:"PIP'S BIG QUESTION", title:'The Golden Rule, Everywhere',
    did:'You thought about whether to be kind only to kind birds, or to everyone.',
    real:'About 2,500 years ago, Confucius taught: do not do to others what you would not want done to yourself. Versions of this rule appear in Judaism, Christianity, Islam, Hinduism, Buddhism, and many other traditions. That is why people call it the Golden Rule.',
    today:'It may be the most widely shared rule in human history.' },
});
AHA.rosetta = { kicker:'MEMORY FOUND', title:'The Stone That Unlocked a Language',
  did:'You lifted a boulder and found a stone carved with the same message in three kinds of writing.',
  real:'In 1799, soldiers in Egypt found the Rosetta Stone. It repeats one decree in hieroglyphs, in a later Egyptian script called Demotic, and in ancient Greek. Scholars could already read the Greek, so they used it as a key. In 1822, Jean-Francois Champollion announced he had cracked the hieroglyphs.',
  today:'Translation apps still learn the same way: by comparing the same words in different languages.' };
const RECALL = {
  bell:  { title:'Harmony, Remembered', text:'Remember tuning Grandma\'s Wind Bell? Simple lengths like 1/2 and 2/3 sounded sweet then, and they sound sweet now. The same numbers work in bells, crystals, and guitar strings.' },
  rope:  { title:'The Rope Trick, Doubled', text:'Remember the 3-4-5 rope on Captain Drizzle\'s ship? You just used it again. 6, 8, 10 is the same triangle, twice as big. Math you understand works at any size.' },
  stars: { title:'Your Own Star Map', text:'Remember the star that stays? Sailors used it to hold a steady course at night. You just used it the same way, to find a hidden fishing spot no one else knows about.' },
  lever: { title:'Archimedes Again', text:'Remember the millstone at the windmill? This boulder is heavier and your push is stronger, but the rule has not changed: put the pivot close to the weight.' },
};
Object.assign(AHA, {
  moon: { kicker:'MEMORY FOUND', title:'Why the Moon Changes Shape',
    did:'You put Lumen\'s moon paintings in order, from dark to full and back to dark.',
    real:'The moon makes no light of its own. The sun always lights half of it. As the moon circles Earth, about every 29.5 days, we see more or less of that lit half. Many calendars follow it: the Islamic calendar is fully lunar, so Ramadan moves through the seasons, and the Jewish and Chinese calendars mix moon and sun, which is why Passover and Lunar New Year shift each year.',
    today:'The word "month" comes from the same old root as "moon."' },
  optics: { kicker:'MEMORY FOUND', title:'The Dark Room That Explained Seeing',
    did:'You shrank the hole in a dark room until an upside-down picture of the outside turned sharp.',
    real:'About 1,000 years ago in Cairo, Ibn al-Haytham studied light in dark rooms with tiny holes. He showed that light travels in straight lines, bouncing off things and into our eyes, and he tested his ideas with careful experiments. Many historians call his Book of Optics an early model of the scientific method.',
    today:'Every camera, including the one in your phone, is a dark box with a small hole and a lens.' },
  prism: { kicker:"LUMEN'S STORY", title:'White Light Is Every Color',
    did:'You watched white light go into a crystal and come out as a rainbow.',
    real:'In 1666, Isaac Newton split sunlight with a glass prism into a band of colors. Then he used a second prism to mix the colors back into white. That showed white light is not pure. It is every color at once.',
    today:'Every rainbow is sunlight being split by raindrops, which act like tiny prisms.' },
});
const AHA_ORDER = ['bone','temple','tablet','sundial','bell','still','rope','stars','gears','lever','bread','rosetta','moon','optics','loom','migration','worldtree','fibonacci','prism','harvest','theseus','zeno','cave','river','floating','stoic','golden'];
const RELICS = [ { id:'bone', name:'a notched bone' }, { id:'temple', name:'a carved stone' }, { id:'tablet', name:'a clay tablet' } ];
const LAYERS = ['Topsoil. Roots and worms.', 'A dark layer of ash. Something burned here long ago.', 'Old clay. The deeper you dig, the older it gets.'];
const QUESTIONS = [
  { id:'theseus', q:"If we fix the bridge one plank at a time, until every plank is new... is it still the same bridge?",
    a:['Yes, same bridge','No, new bridge','Somehow both?'], r:["That is what I think! Mostly.", "Oh no. Then which bridge am I standing on?", "Both! My head hurts in a fun way."] },
  { id:'zeno', q:"To fly to that far island, first I fly halfway. Then half of what is left. Then half again. That is endless halves! How does anyone get anywhere?",
    a:['You just do','You never do','Tiny bits add up'], r:["Just do! Great. I will try that.", "Then I am staying here. Pass the seeds.", "Tiny bits! Like my savings."] },
  { id:'cave', q:"What if everything we see is only shadows, and the real stuff is somewhere else?",
    a:['Spooky','I trust my eyes','I would go look'], r:["Very spooky. I love it.", "Your eyes are very nice eyes.", "Brave! Take snacks."] },
  { id:'river', q:"Nana says you cannot step in the same cloud twice, because the cloud keeps changing. Is she just being mysterious again?",
    a:['Yes','She is right','Both'], r:["I KNEW it.", "Hmm. She usually is. Annoying.", "Mysterious AND right. Classic Nana."] },
  { id:'floating', q:"If you floated in the sky with your eyes shut, touching nothing, hearing nothing... would you still know you are you?",
    a:['Yes','No','I would be asleep'], r:["Me too! I think I think.", "Spooky. Hold my wing.", "Ha! Fair. Floating is very relaxing."] },
  { id:'stoic', q:"Rain ruined my seed stand sign again. I cannot stop the rain. So... should I stay grumpy about it?",
    a:['Grumpy is fair','Just fix the sign','Dance in the rain'], r:["Fair! But my feathers are tired of frowning.", "Fix it! Yes! That part I CAN do.", "Wheee! Okay, this is way better."] },
  { id:'golden', q:"Should I be nice only to birds who are nice to me? Or to everybody, even the grumpy crow?",
    a:['Only nice birds','Everybody','Start with the crow'], r:["Hmm. But then who is nice first?", "Everybody! Even the crow. Deep breath.", "The crow?! Brave. Okay. Tomorrow."] },
];
const QUEST3 = [
  "Earn 300 coins. Then tap the sign on the north edge of Orchard Isle.",
  "Walk across the north bridge. Talk to the mole twins.",
  "Tap the windmill to fix its gears.",
  "Tap the windmill to lift the millstone.",
  "Tap the windmill to grind flour.",
  "Bring the flour to Nana Gale.",
  "Talk to Moss & Fern.",
  "Chapter 3 done! Night Isle is coming.",
];
const QUEST4 = [
  "After 8 PM, cross the glowing bridge east of Windmill Isle. Talk to Lumen.",
  "Tap Lumen's easel to sort her moon paintings.",
  "Tap Lumen's little black house.",
  "Tap the purple crystals.",
  "Talk to Lumen.",
  "Chapter 4 done! The Old Heart is waiting.",
];
const ROOFS = { '0xff8fa3':'Rose', '0x7ec8e3':'Sky Blue', '0x8fdc8a':'Mint', '0xc9b6ff':'Lavender', '0xffc857':'Sunflower' };
const WALLS = { '0xfff1d6':'Cream', '0xffd6c9':'Peach', '0xdff3ff':'Cloud', '0xfff3a0':'Butter' };
const PAINT_PRICE = 40;
const QUEST1 = [
  "Talk to Nana Gale. She is the white sheep.",
  "Find a sparkly spot. Tap it 3 times to dig it up.",
  "Tap the stone sundial at noon (12 PM on the clock).",
  "Talk to Nana Gale to fix the Wind Bell.",
  "Earn 150 coins. Then tap the sign by the broken bridge.",
];
const QUEST2 = [
  "Walk across the east bridge. Talk to the frog in the captain's hat.",
  "Tap the metal pot by the ship. Tap it again tomorrow.",
  "Tap the ship to fix its sail.",
  "After 8 PM, talk to Captain Drizzle.",
  "Talk to Captain Drizzle.",
  "Chapter 2 done! Windmill Isle is coming.",
];
const CHIMES = [ // length as a fraction of the big chime; simple = sweet
  { label:'1/2', r:2, sweet:true }, { label:'5/7', r:7/5 }, { label:'2/3', r:3/2, sweet:true },
  { label:'15/16', r:16/15 }, { label:'3/4', r:4/3, sweet:true }, { label:'8/15', r:15/8 },
];

const QUEST5 = [
  "Talk to Captain Drizzle on Orchard Isle.",
  "Tap the ship on Orchard Isle to fly north.",
  "Tap the fallen bell to lift it.",
  "Tap the pile of wooden beams next to the bell to build a frame.",
  "Tap the pile of wooden beams again to fix the gears.",
  "Tap the bell at noon (12 PM on the clock) to ring it.",
  "The islands are home. Rebuild the village at the Old Heart!",
];
Object.assign(RECALL, {
  lever2: { aha:'lever', title:'The Biggest Lift Yet', text:'The great bell is twice as heavy as the boulder. Same rule as the windmill: the log goes close to the weight, and a small push lifts almost anything.' },
  rope2:  { aha:'rope',  title:'3-4-5, Three Times Bigger', text:'A 36-knot rope, and 9, 12, 15 makes the square corner. It is the same triangle as on Drizzle\'s ship, just three times bigger. Builders have trusted it for thousands of years.' },
  gears:  { aha:'gears', title:'Gears, Remembered', text:'This time the small gear has to spin 4 times for each big turn. Same idea as the windmill: fewer teeth on the small gear means more spins.' },
  sundial:{ aha:'sundial', title:'Noon, the Old Way', text:'You knew noon was the moment of the shortest shadow. That is how bell ringers set their time for thousands of years, long before clocks.' },
});
const BUILDINGS = [
  { id:'observatory', name:'Observatory', coins:400, items:{ trout:2, minnow:3 }, pos:[-5,-4],
    about:'A dome with a telescope. After 8 PM, chart the constellations. Different stars come out in different months.' },
  { id:'bakery', name:'Bakery', coins:500, items:{ 'kind:crop':6 }, pos:[-6,3], villager:'mabel',
    about:'Mabel the hedgehog moves in. Cook crops, fruit, and fish into dishes that sell for more, and learn kitchen science.' },
  { id:'library', name:'Library', coins:600, items:{ 'kind:fish':4 }, pos:[5,-4], villager:'hoot',
    about:'Professor Hoot the owl moves in. A new book arrives every week, full of history and science.' },
  { id:'musichall', name:'Music Hall', coins:700, items:{ 'kind:fruit':5 }, pos:[6,3], villager:'allegra',
    about:'Allegra the cat moves in. Play the xylophone and learn songs.' },
  { id:'temple', name:'Temple Garden', coins:800, items:{ 'kind:dish':3 }, pos:[0,7], villager:'sage',
    about:'Sage the old tortoise moves in. Hear a saying from the world\'s traditions each day, and see every festival coming this year.' },
];
const GRANDMA_LETTER2 = "If you are reading this, you rang it. I knew you would. I spent years trying, and I think I was missing the one thing you have: you learned it all by doing it, one small thing at a time, with friends beside you. The village was never just the islands. It was the people who remembered together. Build it back, one home at a time. The sky remembers. So will you.";

// "What to do" help for every quest step. Shown when the player taps the goal box.
// Keep these plain: where to go, what to tap, what happens next.
const HOWTO = {
  c1: [
    "Nana Gale is the white sheep near the top of your island. Walk to her by tapping the ground, then tap her to talk. The gold arrow points at her.",
    "Look for small gold sparkles on the ground. Walk to one and tap it. Each tap digs one layer deeper. On the third tap you find something. New sparkles appear each morning until you have found all 3.",
    "The sundial is the round stone with a pointer, left of your garden. Watch the clock at the top of the screen. When it says about 12 PM, tap the sundial. If you miss noon, try again the next day.",
    "Talk to Nana Gale. She will ask you to tune the bell. You tap chimes to hear them, pick the 3 that sound nice together, and ring the bell.",
    "Grow and sell crops to earn 150 coins. Sell by tapping the wooden crate next to your garden. Then walk to the sign at the right edge of your island and tap it to fix the bridge.",
  ],
  c2: [
    "Walk across the bridge on the right side of your island. On Orchard Isle, tap the green frog wearing a captain's hat.",
    "Tap the metal pot next to the ship to set it up. Then sleep in your bed, or wait for the next day. Tap the pot again to collect fresh water.",
    "Tap the ship. You will split a rope into 3 sides. Use the + and - buttons until the corner turns green, then tap Tie it.",
    "Wait until the clock says 8 PM or later. Then tap Captain Drizzle and choose Look up. Watch the stars turn, and tap the one star that does not move.",
    "Tap Captain Drizzle to finish the chapter.",
    "You finished this chapter. Keep farming, fishing, and meeting your neighbors.",
  ],
  c3: [
    "Earn 300 coins by selling crops, fruit, and fish. Then walk to the sign at the top edge of Orchard Isle and tap it.",
    "Walk across the new bridge to Windmill Isle. Tap the two brown moles to talk.",
    "Tap the windmill. Try the small gears one at a time. Watch the two counters: the small gear must spin 3 times each time the big gear spins once. Then tap Fit this gear.",
    "Tap the windmill. Use the arrow buttons to move the log under the plank, then tap Push down. If the stone won't lift, move the log and try again.",
    "Tap the windmill once. It grinds wheat into a bag of flour for you.",
    "Walk back to your home island and tap Nana Gale. She turns the flour into bread.",
    "Go back to Windmill Isle and tap Moss & Fern.",
    "You finished this chapter. Keep farming, fishing, and meeting your neighbors.",
  ],
  c4: [
    "The glowing bridge only appears after 8 PM, on the right side of Windmill Isle. Wait for the clock, cross it, and tap Lumen, the little firefly.",
    "Tap the easel with the moon painting. Tap the 8 moon paintings in order, starting with the darkest one. The lit part grows night by night until the moon is full, then shrinks.",
    "Tap the little black house. Try the hole-size buttons. Find the one that makes the picture sharp.",
    "Tap the purple crystals. Tap each crystal to hear it with the tallest one. Pick the 2 that sound nice together, then tap Ring them. Sound off? Tap the hint button.",
    "Tap Lumen to finish the chapter.",
    "You finished this chapter. The Old Heart is next.",
  ],
  c5: [
    "Walk to Orchard Isle and tap Captain Drizzle.",
    "Tap the ship on Orchard Isle and choose Fly. To come back later, tap the ship at the Old Heart.",
    "Tap the big gold bell lying on the ground. Move the log with the arrow buttons, then tap Push down.",
    "Look for the pile of wooden beams, rope, and big stones just to the right of the bell. The gold arrow points at it. Tap it. Use + and - to split the rope into 3 sides until the corner turns green, then tap Tie it. The see-through outline around the bell shows the frame you are building.",
    "Tap the same pile of wooden beams again. It has a gear on top now. Try small gears until the small gear spins 4 times for each turn of the big gear, then tap Fit this gear.",
    "Watch the clock at the top. At about 12 PM, tap the bell.",
    "Tap an empty building site at the Old Heart to see what it needs. Each building costs coins plus some crops, fish, fruit, or dishes. When it is built, a new neighbor moves in. Tap the building or the neighbor to use it.",
  ],
};

export { HOWTO, QUEST5, BUILDINGS, GRANDMA_LETTER2, MUTE_KEY, SEASONS, CROPS, ITEMS, FURN, LOVES, BRIDGE2_COST, BRIDGE_COST, DAY_LEN, SAVE_KEY, NEIGHBORS, AHA, RECALL, AHA_ORDER, RELICS, LAYERS, QUESTIONS, QUEST3, QUEST4, ROOFS, WALLS, PAINT_PRICE, QUEST1, QUEST2, CHIMES };
