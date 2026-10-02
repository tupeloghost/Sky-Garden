// The rebuilt village at the Old Heart: new neighbors and what each building does.
// Each building has a collection. Add new recipes, books, songs, or sayings here.

const VILLAGERS = {
  mabel: { name:'Mabel', building:'bakery', lines:[
    "Welcome to the bakery! Mind the flour. It gets everywhere. It is in my spikes right now.",
    "Cooking is just science you can eat.",
    "Bring me crops, fruit, or fish and we will turn them into something wonderful.",
    "A good dish sells for much more than what went into it. That is the baker's secret.",
    "I named my oven Gerald. Gerald runs hot.",
  ], heartLines:["Your grandmother taught me my first recipe. Burnt, of course. Everyone's first is burnt."] },
  hoot: { name:'Professor Hoot', building:'library', lines:[
    "Ah, a reader! Every week I shelve one new book. Come back and see what it is.",
    "Hoo. Knowledge is the only thing that grows when you give it away.",
    "Libraries are memory with a roof on it.",
    "I have read every book here twice. The third time is the best.",
    "I shush people for a living. Shh. See? Still got it.",
  ], heartLines:["Your grandmother never returned a single book on time. I forgave her every time."] },
  allegra: { name:'Allegra', building:'musichall', lines:[
    "Oh, a visitor! Want to play the xylophone? There are no wrong notes. Well. Some. Not many.",
    "Music is just math that makes you feel something.",
    "Try playing only the colored bars. Anything you play will sound nice. Trust me.",
    "I can hear the bells from every island from here. They are all in tune now.",
    "I once sneezed in the middle of a concert. Everyone clapped. Best note of the night.",
  ], heartLines:["I used to play for your grandmother while she worked. She always hummed along, slightly off key."] },
  sage: { name:'Sage', building:'temple', lines:[
    "Welcome, young one. Sit. There is no hurry in a garden.",
    "People have asked the same big questions in every language. The answers are different. The questions are the same.",
    "Each day I read one saying. Would you like to hear today's?",
    "The moon gate lets everyone in. That is the only rule of this garden.",
    "I am slow, yes. I have also never once tripped.",
  ], heartLines:["I am 190 years old. Your grandmother was a baby when I planted that tree. Now look at us."] },
};
const VILLAGER_LOVES = { mabel:['jam','bread','peach'], hoot:['tea','trout','starbloom'], allegra:['candy','minnow','cloudberry'], sage:['tea','frostmint','soup'] };
const VILLAGER_LOOK = {
  mabel:   { body:0xb98a63, belly:0xfff1d6, ear:0x8a6445, earType:'round', spikes:true },
  hoot:    { body:0x9b7b5a, belly:0xf3e2c4, beak:0xffb347, owl:true },
  allegra: { body:0xffb36b, belly:0xfff6e6, ear:0xff9a3c, earType:'point' },
  sage:    { body:0x8fbf7a, belly:0xe6f0c8, shell:true },
};

// Bakery recipes: each one teaches a bit of kitchen science the first time you cook it.
const RECIPES = [
  { id:'jam', name:'Cloudberry Jam', needs:{ cloudberry:3 }, sell:120,
    aha:{ kicker:"MABEL'S KITCHEN", title:'Why Jam Turns Thick',
      did:'You cooked cloudberries until they turned into jam.',
      real:'Fruit holds something called pectin. When you heat fruit with sugar and a little sour juice, the pectin links up into a net. The net traps the juice, and the jam sets into a soft jelly.',
      today:'Apples and citrus peels are full of pectin, so cooks add them to help other jams set.' } },
  { id:'crisp', name:'Apple Crisp', needs:{ apple:2, skywheat:1 }, sell:110,
    aha:{ kicker:"MABEL'S KITCHEN", title:'The Browning Reaction',
      did:'You baked apples under a golden, toasty topping.',
      real:'When food bakes hot enough, the sugars and proteins in it join up in new ways. That makes hundreds of new flavors and a brown color. It is called the Maillard reaction, after the French scientist Louis-Camille Maillard, who described it in 1912.',
      today:'Toast, grilled cheese, and the crust on bread all taste better because of it.' } },
  { id:'tea', name:'Mint Tea', needs:{ frostmint:2 }, sell:100,
    aha:{ kicker:"MABEL'S KITCHEN", title:'How Tea Spreads by Itself',
      did:'You watched mint color spread through hot water without stirring.',
      real:'Everything is made of tiny bits, too small to see, that are always moving and bumping. They slowly spread from where they are crowded to where there are fewer. That is called diffusion. Heat makes the bits move faster, so tea brews faster in hot water than in cold.',
      today:'It is also how the smell of cooking fills a whole house.' } },
  { id:'soup', name:'Pumpkin Soup', needs:{ moonpumpkin:1, minnow:1 }, sell:220,
    aha:{ kicker:"MABEL'S KITCHEN", title:'Why Soup Cooks Slower Up High',
      did:'You made soup high up in the sky, and it took extra time to cook.',
      real:'Water boils at 100 degrees Celsius at sea level. Higher up, the air presses down less, so water boils at a lower temperature. Boiling water on a tall mountain is not as hot, so food takes longer to cook.',
      today:'A pressure cooker does the opposite. It traps steam, which makes water boil hotter.' } },
  { id:'saltfish', name:'Salted Trout', needs:{ trout:2 }, sell:110,
    aha:{ kicker:"MABEL'S KITCHEN", title:'How Salt Kept Food for Months',
      did:'You packed fish in salt so it would keep.',
      real:'Salt pulls water out of food, a process called osmosis. Germs that spoil food need water to grow, so dry, salty food lasts for months. For thousands of years, before fridges, salting was one of the main ways people stored food.',
      today:'Ham, pickles, and soy sauce all use the same old trick.' } },
  { id:'candy', name:'Sunflower Seed Brittle', needs:{ sunbell:2 }, sell:220,
    aha:{ kicker:"MABEL'S KITCHEN", title:'Sugar Glass',
      did:'You cooked sugar with sunflower seeds and let it cool into crunchy, see-through brittle.',
      real:'When sugar syrup cools slowly, the sugar lines up into neat crystals. When it cools fast, the sugar freezes in a jumble before it can line up. That makes a clear, glassy candy.',
      today:'Stunt glass in old movies was made of sugar, so it broke safely. Today stunt glass is mostly a brittle plastic.' } },
];

// Library: one new book each real week. Add more to keep the shelves growing.
const BOOKS = [
  { id:'zero', title:'The Number Zero',
    real:'Using zero as a real number, not just an empty space, took people a long time. Around the year 628, the Indian mathematician Brahmagupta wrote down rules for adding and subtracting with zero. The Maya of Mexico and Central America also used a zero in their calendars, on their own.',
    today:'Every computer runs on zeros and ones. No zero, no computers.' },
  { id:'wisdom', title:'The House of Wisdom',
    real:'In the 800s, scholars in Baghdad gathered at a center of learning often called the House of Wisdom. They translated Greek, Persian, and Indian books into Arabic and added their own discoveries. One of them, al-Khwarizmi, wrote about algebra, and his name gave us the word "algorithm."',
    today:'An algorithm is a set of step-by-step rules. One is at work every time an app recommends something to you.' },
  { id:'timbuktu', title:'The Manuscripts of Timbuktu',
    real:'Timbuktu, in Mali, was a great center of learning in the 1400s and 1500s. Families kept hundreds of thousands of handwritten books on astronomy, medicine, law, and poetry. In 2012 and 2013, when fighters threatened the city, librarians secretly carried many of them to safety.',
    today:'Sometimes keeping knowledge alive takes real courage.' },
  { id:'press', title:'Printing With Movable Type',
    real:'Around 1450 in Germany, Johannes Gutenberg built a printing press with metal letters that could be moved and reused. Printing was older in East Asia. The oldest book we still have that was printed with metal type is the Jikji. It was made in Korea in 1377.',
    today:'Once books were cheap to copy, ideas could spread faster than ever before.' },
  { id:'handwashing', title:'Wash Your Hands',
    real:'In 1847, the doctor Ignaz Semmelweis noticed far fewer new mothers died when doctors washed their hands in a chlorine mix before helping them. Many doctors refused to believe him. Years later, Louis Pasteur and Robert Koch showed that tiny germs cause many diseases.',
    today:'Twenty seconds of soap still saves lives every day.' },
  { id:'drift', title:'The Drifting Continents',
    real:'People had long seen that the coasts of South America and Africa fit together like puzzle pieces. In 1912, Alfred Wegener said the continents had drifted apart. Most scientists laughed. In the 1960s, new evidence from the ocean floor proved the continents do move, a few centimeters each year.',
    today:'The ground under you is drifting right now, about as fast as your fingernails grow.' },
  { id:'alexandria', title:'The Library of Alexandria',
    real:'The ancient Library of Alexandria in Egypt tried to collect every book in the world. It is often said to have burned in one great fire, but many historians think it faded slowly over centuries, as money and support dried up.',
    today:'Libraries need care, not just walls, to survive.' },
  { id:'khipu', title:'Knots That Kept Records',
    real:'The Inca Empire kept records with khipu: bundles of colored strings with knots. The type and place of each knot stood for numbers, and experts called khipukamayuq could read them. Some researchers think khipu may also have recorded words, but no one has fully worked that out yet.',
    today:'Remember the knotted rope on Drizzle\'s ship? Knots have carried knowledge for centuries.' },
  { id:'hypatia', title:'Hypatia of Alexandria',
    real:'Around the year 400, Hypatia taught mathematics, astronomy, and philosophy in Alexandria. She was one of the most respected teachers of her time and is one of the first women mathematicians whose life is well recorded.',
    today:'Her name is on a crater on the Moon and an asteroid in space.' },
  { id:'photosynthesis', title:'Plants Eat Sunlight',
    real:'In 1779, Jan Ingenhousz showed that plants only make fresh, breathable air when light shines on them. Today we call it photosynthesis: plants use sunlight to turn water and air into sugar, and give off oxygen.',
    today:'Almost every bite of food you eat started as sunlight caught by a plant.' },
  { id:'middleway', title:'The Middle Way',
    real:'About 2,500 years ago, in what is now Nepal and India, Siddhartha Gautama, who became known as the Buddha, tried living as a rich prince and then as a starving man with nothing. He decided that neither way brought peace, and taught a Middle Way between them.',
    today:'"Not too much, not too little" is still good advice for sleep, work, and snacks.' },
  { id:'ubuntu', title:'I Am Because We Are',
    real:'Ubuntu is a Southern African idea often put as "a person is a person through other people." It means we become who we are through how we treat each other. Leaders like Archbishop Desmond Tutu spoke about it often.',
    today:'Sky Garden is built on the same idea. The village is its people.' },
];

// Music Hall: the xylophone has 8 bars, C to the next C. Songs are bar numbers 0-7.
const XYLO = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9, 523.3];
const XYLO_NAMES = ['C','D','E','F','G','A','B','C'];
const PENTA = [0,1,2,4,5]; // C D E G A: the five-note scale
const SONGS = [
  { id:'twinkle', name:'Twinkle, Twinkle', notes:[0,0,4,4,5,5,4,3,3,2,2,1,1,0],
    aha:{ kicker:"ALLEGRA'S SONGBOOK", title:'A Tune Older Than Its Words',
      did:'You learned Twinkle, Twinkle, Little Star on the xylophone.',
      real:'The tune is an old French folk song, "Ah, vous dirai-je, maman," from the 1700s. Mozart wrote his own playful versions of it. The same melody is used for the Alphabet Song and Baa, Baa, Black Sheep.',
      today:'Three songs, one tune. Music gets reused all the time.' } },
  { id:'ode', name:'Ode to Joy', notes:[2,2,3,4,4,3,2,1,0,0,1,2,2,1,1],
    aha:{ kicker:"ALLEGRA'S SONGBOOK", title:'A Deaf Composer\'s Joy',
      did:'You played the opening of Ode to Joy.',
      real:'Ludwig van Beethoven finished his Ninth Symphony in 1824, with Ode to Joy as its last part. By then he was almost completely deaf. He wrote it by hearing the music in his head.',
      today:'It is now the anthem of the European Union.' } },
];
const PENTA_AHA = { kicker:"ALLEGRA'S SONGBOOK", title:'The Five-Note Scale',
  did:'You played only the five colored bars, and every note you played sounded nice together.',
  real:'Those five notes make a five-note scale, called pentatonic. Scales like it show up in music all over the world: Chinese folk songs, Scottish tunes, West African music, Indonesian gamelan music, and American blues. With no clashing notes next to each other, it is hard to play a "wrong" note.',
  today:'Play only the black keys on a piano. That is a five-note scale too.' };

// Temple Garden: one saying each day, from many traditions. Sources are well documented.
const SAYINGS = [
  { id:'hillel', text:'If I am not for myself, who will be for me? And if I am only for myself, what am I? And if not now, when?', from:'Hillel the Elder, in the Jewish text Pirkei Avot, about 2,000 years ago' },
  { id:'laozi', text:'A journey of a thousand miles begins beneath one\'s feet.', from:'The Tao Te Ching, a founding text of Taoism, traditionally credited to Laozi, over 2,000 years ago' },
  { id:'confucius', text:'To know what you know and to know what you do not know, that is true knowledge.', from:'Confucius, in the Analects, about 2,500 years ago' },
  { id:'dhammapada', text:'Hatred is never ended by hatred in this world. By non-hatred alone is hatred ended.', from:'The Dhammapada, a collection of the Buddha\'s teachings' },
  { id:'gita', text:'You have a right to your actions, but never to the fruits of your actions.', from:'The Bhagavad Gita, a Hindu scripture, about 2,000 years old' },
  { id:'quran', text:'We made you into nations and tribes so that you may come to know one another.', from:'The Quran, the holy book of Islam, chapter 49' },
  { id:'proverbs', text:'A soft answer turns away anger.', from:'The Book of Proverbs, in the Hebrew Bible and the Christian Old Testament' },
  { id:'ubuntu', text:'A person is a person through other people.', from:'A Zulu proverb, Umuntu ngumuntu ngabantu, from Southern Africa' },
  { id:'socrates', text:'The unexamined life is not worth living.', from:'Socrates, as written by his student Plato, about 2,400 years ago' },
  { id:'marcus', text:'Such as are your habitual thoughts, such also will be the character of your mind.', from:'Marcus Aurelius, Roman emperor and Stoic, in his Meditations' },
];

export { VILLAGERS, VILLAGER_LOVES, VILLAGER_LOOK, RECIPES, BOOKS, XYLO, XYLO_NAMES, PENTA, SONGS, PENTA_AHA, SAYINGS };
