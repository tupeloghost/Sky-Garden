// The quiet journey: small choices neighbors bring you.
// One option pays right away (like real life). The other pays nothing now,
// but a bigger reward arrives days later as a letter. The game never says which is "right".
// kind = how you treat people, harmony = how you treat nature. Both stay hidden.
// Quotes are real and attributed as sources usually give them.
const DILEMMAS = [
  { id:'pouch', who:'pip',
    text:"I found a coin pouch by the bridge. No name on it. Finders keepers, right? You cross that bridge more than anyone, so it's yours if you want it.",
    a:{ label:'Keep it', now:{ coins:60 }, kind:-2, story:'You kept a coin pouch you found by the bridge.' },
    b:{ label:'Leave it by the crate with a note', kind:3, story:'You left a lost coin pouch out for its owner.',
        later:{ days:4, from:'Nana Gale', letter:"Dear one, that pouch was mine. It held my savings for a new garden gate. Someone left it out with a note, and Pip told me it was you. Please take this. It is more than the pouch held, and it is still not enough.",
          give:{ coins:220, seeds:{ moonpumpkin:3 } }, quote:'"No act of kindness, no matter how small, is ever wasted." (The moral often given for Aesop\'s The Lion and the Mouse)' } } },
  { id:'overpay', who:'pip',
    text:"Hmm. Did I pay you twice for your last crate? My books are a mess this week. Eh, I'm sure it's fine. Coins come and go!",
    a:{ label:"It's fine, don't worry about it", now:{ coins:40 }, kind:-2, story:'You kept extra coins Pip paid you by mistake.' },
    b:{ label:"Let's check your books together", kind:3, story:"You helped Pip find a mistake in his books, even though it cost you.",
        later:{ days:3, from:'Pip', letter:"I checked everything twice, like you showed me. Found 3 more mistakes! You are the most honest customer I have. From now on, my daily orders pay you extra.",
          give:{ perk:'pipBonus', coins:60 }, quote:'"The noble person thinks of what is right. The small person thinks of what will pay." (Confucius, Analects 4.16)' } } },
  { id:'berries', who:'nana',
    text:"The wild cloudberry bushes behind my place are heavy with fruit this year. Take as many as you like, dear. The birds get whatever is left.",
    a:{ label:'Pick them all', now:{ items:{ cloudberry:8 } }, harmony:-3, story:'You picked every wild cloudberry.' },
    b:{ label:'Take a few and leave the rest', now:{ items:{ cloudberry:2 } }, harmony:3, story:'You left wild berries for the birds.',
        later:{ days:5, from:'Nana Gale', letter:"Have you seen? Little cloudberry and sunflower seedlings are coming up all over the island. The birds ate your berries and carried the seeds everywhere. I dug some up for you.",
          give:{ seeds:{ cloudberry:6, sunbell:3 } }, quote:'"What is not good for the swarm is not good for the bee." (Marcus Aurelius, Meditations)' } } },
  { id:'oldtree', who:'nana',
    text:"That big old tree near the cliff is dying on one side. It would give you a lot of good wood. Or you could let it be. Old trees are homes, you know.",
    a:{ label:'Cut it down for wood', now:{ items:{ log:12 } }, harmony:-3, story:'You cut down the old tree by the cliff for wood.' },
    b:{ label:'Let it stand', harmony:3, story:'You let the old tree by the cliff stand.',
        later:{ days:6, from:'Nana Gale', letter:"An owl family moved into the old tree, and glowing mushrooms are growing on its fallen branch. Dead wood feeds a whole forest, you know. I brought you one of the mushrooms. It glows at night.",
          give:{ furn:'mushroom', coins:80 }, quote:'"A society grows great when old people plant trees whose shade they know they will never sit in." (A modern saying, often wrongly called a Greek proverb)' } } },
  { id:'shovel', who:'twins',
    text:"Moss: Fern broke my favorite shovel. Fern: It was already cracked! Moss: Tell them it was Fern's fault and I'll give you the stones I dug up. Fern: Tell them the truth!",
    a:{ label:"Side with Moss and take the stones", now:{ items:{ stone:8 } }, kind:-2, story:'You took a side in the twins\' fight and got stones for it.' },
    b:{ label:'Help them fix the shovel together', kind:3, story:'You helped Moss and Fern fix their shovel together.',
        later:{ days:3, from:'Moss & Fern', letter:"Moss: We fixed the shovel. Fern: Then we fixed the fence. Moss: Then we built you this. Fern: Together. Moss: Mostly me. Fern: TOGETHER.",
          give:{ coins:150, items:{ brick:4 } }, quote:'"United we stand, divided we fall." (Aesop, The Four Oxen and the Lion)' } } },
  { id:'fishhole', who:'drizzle',
    text:"The old fishing hole is packed this week, sailor. I could net every fish in there and split the lot with you.",
    a:{ label:'Net them all', now:{ items:{ trout:3, minnow:3 } }, harmony:-3, story:'You and Drizzle netted every fish in the old fishing hole.' },
    b:{ label:'Only take the big ones', now:{ items:{ trout:1 } }, harmony:3, story:'You left the young fish in the old fishing hole.',
        later:{ days:7, from:'Captain Drizzle', letter:"The fishing hole is fuller than I have ever seen it. The young fish we left grew up and had young of their own. Real fishing nets have wide holes so the young fish can slip through. Here, the best of the catch.",
          give:{ items:{ puffer:1, koi:2 }, coins:60 }, quote:'"A thing is right when it tends to preserve the integrity, stability, and beauty of the biotic community." (Aldo Leopold, A Sand County Almanac, 1949)' } } },
];
// what the island feels like, from the hidden scores (the only hint players get)
function islandFeel(kind, harmony) {
  const warm = kind >= 5, cold = kind <= -3, green = harmony >= 5, tired = harmony <= -3;
  if (warm && green) return 'The island feels warm and full of life.';
  if (warm && tired) return 'People smile when you pass, but the meadows look tired.';
  if (cold && green) return 'The meadows are thriving, but the neighbors seem a little distant.';
  if (cold && tired) return 'The island feels quiet lately. Even the birds seem to keep away.';
  if (warm) return 'Neighbors wave a little longer when you pass.';
  if (green) return 'More butterflies than usual drift over the island.';
  if (cold) return 'The neighbors seem a little busy lately.';
  if (tired) return 'The grass looks a bit tired.';
  return 'The island is still getting to know you.';
}
const PATHS = { grower:['Grower','Grow things.'], maker:['Maker','Craft and build.'], explorer:['Explorer','Go places and fish.'],
  scholar:['Scholar','Learn and discover.'], trader:['Trader','Sell and trade.'], friend:['Friend','Spend time with your neighbors.'] };
export { DILEMMAS, islandFeel, PATHS };
