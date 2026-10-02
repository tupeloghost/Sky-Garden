// Sky Garden real-world calendar: seasons, the moon, and festivals on their real dates.
// Festivals set by the moon change date every year, so they use a table of known dates.
// To keep the game current, add each new year's dates to the tables below.

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Real season from the real date. 0 Spring, 1 Summer, 2 Fall, 3 Winter.
function realSeason(date, south) {
  const m = date.getMonth(), north = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3;
  return south ? (north + 2) % 4 : north;
}

// Moon phase from a known new moon (Jan 6, 2000, 18:14 UTC). Good to about half a day.
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const PHASE_NAMES = ['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'];
function moonPhase(date) {
  const age = ((date.getTime() - NEW_MOON) / 86400000 % SYNODIC + SYNODIC) % SYNODIC;
  const idx = Math.round(age / SYNODIC * 8) % 8;
  return { age, idx, name: PHASE_NAMES[idx] };
}

// Western Easter (the Computus): first Sunday after the church's spring full moon.
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19*a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2*e + 2*i - h - k) % 7, m = Math.floor((a + 11*h + 22*l) / 451), month = Math.floor((h + l - 7*m + 114) / 31), day = ((h + l - 7*m + 114) % 31) + 1;
  return [month, day];
}
// US Thanksgiving: fourth Thursday of November.
function thanksgiving(y) { const first = new Date(y, 10, 1).getDay(), d = 1 + ((4 - first + 7) % 7) + 21; return [11, d]; }

// [month, day] each year for moon-set festivals. Dates can shift a day by region, so these festivals run a little longer.
const FESTIVALS = [
  { id:'lunarnewyear', name:'Lunar New Year', host:'pip', color:0xff4d4d, len:3,
    dates:{ 2026:[2,17], 2027:[2,6], 2028:[1,26], 2029:[2,13], 2030:[2,3] },
    line:"Happy Lunar New Year! I hung red lanterns for luck. Well, I hung 1. The rest are just red. Want a red envelope?" },
  { id:'holi', name:'Holi', host:'pip', color:0xff8fe0, len:2,
    dates:{ 2026:[3,4], 2027:[3,22], 2028:[3,11], 2029:[3,1], 2030:[3,20] },
    line:"It's Holi, the festival of colors! Hold still... there. Now you're pink. And blue. And a little green. Happy spring!" },
  { id:'nowruz', name:'Nowruz', host:'nana', color:0x8fdc8a, len:2, fixed:[3,20],
    line:"Happy Nowruz, dear. It means 'new day.' Day and night are almost the same length today, all over the world. A good day to begin again." },
  { id:'passover', name:'Passover', host:'nana', color:0x9fd3ff, len:2,
    dates:{ 2026:[4,1], 2027:[4,21], 2028:[4,10], 2029:[3,30], 2030:[4,17] },
    line:"Passover begins tonight. Here, try this flat bread. Remember how my bread puffed up? This bread is never given time to rise. There's a reason for that." },
  { id:'easter', name:'Easter', host:'pip', color:0xfff3a0, len:1, calc:easter,
    line:"Happy Easter! I painted eggs for everyone. Mine has a hat. Do you know how they pick the date? It's the moon!" },
  { id:'eid', name:'Eid al-Fitr', host:'nana', color:0x9fe7e0, len:3,
    dates:{ 2026:[3,20], 2027:[3,9], 2028:[2,26], 2029:[2,14], 2030:[2,4] },
    line:"Eid Mubarak, dear! The new crescent moon was spotted, so the month of fasting is over. Today is for sweets, family, and giving to others." },
  { id:'junesolstice', name:'June Solstice', host:'nana', color:0xffc857, len:2, fixed:[6,20],
    line:"The solstice! The sun has gone as far as it goes, and today it turns back. Your grandmother always watched the sunrise on this day, from the very edge of the island." },
  { id:'midautumn', name:'Mid-Autumn Festival', host:'pip', color:0xffb45c, len:2,
    dates:{ 2026:[9,25], 2027:[9,15], 2028:[10,3], 2029:[9,22], 2030:[9,12] },
    line:"Happy Mid-Autumn Festival! Tonight's full moon is the brightest of the year, some say. I made mooncakes. Well, 1 mooncake. We can share it." },
  { id:'muertos', name:'Dia de los Muertos', host:'nana', color:0xff9a3c, len:2, fixed:[11,1],
    line:"Today is Dia de los Muertos. I set out marigolds and your grandmother's favorite tea. It isn't a sad day. It's a day to remember, and remembering keeps them close." },
  { id:'diwali', name:'Diwali', host:'pip', color:0xffc857, len:2,
    dates:{ 2026:[11,8], 2027:[10,29], 2028:[10,17], 2029:[11,5], 2030:[10,26] },
    line:"Happy Diwali! It's the festival of lights. I lit little lamps all around the island. Lumen says it's the prettiest night of the year." },
  { id:'thanksgiving', name:'Thanksgiving', host:'nana', color:0xd9a066, len:1, calc:thanksgiving, aha:'harvest',
    line:"Happy Thanksgiving, dear! Tonight the whole island gives thanks for the harvest. Sit, eat, and look how much you grew this year." },
  { id:'hanukkah', name:'Hanukkah', host:'pip', color:0x7ec8e3, len:8,
    dates:{ 2026:[12,4], 2027:[12,24], 2028:[12,12], 2029:[12,1], 2030:[12,20] },
    line:"Happy Hanukkah! 8 nights of lights. I'm lighting 1 more candle each night. Tonight's candle count is... hold on, I'm counting." },
  { id:'decsolstice', name:'December Solstice', host:'nana', color:0xfff3a0, len:2, fixed:[12,21],
    line:"The solstice, dear. The turning point of the year. From here the light starts coming back. In many places, people light fires and lamps tonight." },
  { id:'christmas', name:'Christmas', host:'pip', color:0xff6b6b, len:2, fixed:[12,24],
    line:"Merry Christmas! I decorated a tree. It's a small tree. It's a sprout, actually. But it has a star on top!" },
];

function festivalWindow(f, y) {
  const md = f.fixed || (f.calc ? f.calc(y) : f.dates[y]);
  if (!md) return null;
  const start = new Date(y, md[0] - 1, md[1]);
  return { start, end: new Date(y, md[0] - 1, md[1] + f.len) };
}
function activeFestival(date) {
  const y = date.getFullYear(), day = new Date(y, date.getMonth(), date.getDate());
  for (const f of FESTIVALS) for (const yy of [y, y - 1]) {
    const w = festivalWindow(f, yy);
    if (w && day >= w.start && day < w.end) return { ...f, year: yy };
  }
  return null;
}
function dateLabel(date) { return `${MONTHS[date.getMonth()]} ${date.getDate()}`; }

// Memory cards for each festival. Plain facts, respectful, no preaching.
const FESTIVAL_AHA = {
  lunarnewyear: { kicker:'FESTIVAL', title:'A New Year Set by the Moon',
    did:'You celebrated Lunar New Year with Pip and a sky full of red lanterns.',
    real:'Lunar New Year starts the year on a calendar that follows both the moon and the sun. So it lands on a different day each year, between January 21 and February 20. It is celebrated in China, Korea, Vietnam, and many other places.',
    today:'Over a billion people celebrate it, making it one of the biggest holidays on Earth.' },
  holi: { kicker:'FESTIVAL', title:'The Festival of Colors',
    did:'You got covered in colored powder with Pip for Holi.',
    real:'Holi is a Hindu spring festival. People throw bright colored powder and water at each other. It welcomes spring and celebrates good winning over evil. It also honors the playful god Krishna.',
    today:'For 1 day, everyone ends up the same colors. Many people say that is the point.' },
  nowruz: { kicker:'FESTIVAL', title:'New Day on the Equinox',
    did:'You welcomed Nowruz with Nana on the first day of spring.',
    real:'Nowruz, Persian for "new day," is a New Year. It has been celebrated for around 3,000 years, in Iran, across Central Asia, and far beyond. It begins on the equinox, when day and night are nearly equal everywhere on Earth.',
    today:'On an equinox, the sun rises almost exactly in the east and sets almost exactly in the west.' },
  passover: { kicker:'FESTIVAL', title:'Bread With No Time to Rise',
    did:'You shared flat bread with Nana at the start of Passover.',
    real:'Passover is a Jewish holiday remembering the Exodus. That is when the Israelites escaped slavery in Egypt. They left in such a hurry that their bread had no time to rise. So during Passover people eat matzah, starting with a special meal called a seder.',
    today:'Remember that bread is alive? Matzah is bread with no yeast at all.' },
  easter: { kicker:'FESTIVAL', title:'A Holiday Set by the Sky',
    did:'You celebrated Easter with Pip and his painted eggs.',
    real:'Easter is the Christian celebration of Jesus rising from the dead. It is the first Sunday after the first full moon of spring. So it moves between late March and late April. Orthodox churches use an older calendar, so their Easter is often later.',
    today:'Many holidays are set by watching the sky.' },
  eid: { kicker:'FESTIVAL', title:'Watching for the New Moon',
    did:'You celebrated Eid al-Fitr with Nana at the end of Ramadan.',
    real:'Eid al-Fitr ends Ramadan, the Islamic month when Muslims fast from dawn to sunset. The Islamic calendar follows only the moon, so each month begins with a new crescent moon.  Eid is celebrated with prayer, family visits, sweets, and gifts to people in need.',
    today:'Some people still watch the western sky after sunset to spot the first thin crescent.' },
  junesolstice: { kicker:'FESTIVAL', title:'The June Solstice',
    did:'You watched the solstice sun with Nana.',
    real:'Around June 21, the North Pole tilts most toward the sun. North of the equator it is the longest day of the year, and south of it, the shortest. Stonehenge was built about 5,000 years ago. People have marked this day for a very long time.',
    today:'Remember the sundial? In most of the north, today\'s noon shadow is the shortest of the whole year.' },
  midautumn: { kicker:'FESTIVAL', title:'Mooncakes and the Moon Lady',
    did:'You shared a mooncake with Pip under the Mid-Autumn full moon.',
    real:'The Mid-Autumn Festival is celebrated in China, Vietnam, and elsewhere. It falls on the full moon of the 8th month of the moon calendar. Families gather to look at the moon and share round mooncakes. A famous legend tells of Chang\'e, who floated up to live on the moon.',
    today:'In 2020, China\'s Chang\'e 5 mission, named after her, brought moon rocks back to Earth.' },
  muertos: { kicker:'FESTIVAL', title:'Remembering Keeps Them Close',
    did:'You helped Nana remember your grandmother on Dia de los Muertos.',
    real:'Dia de los Muertos, the Day of the Dead, is celebrated in Mexico on November 1 and 2. Families build these altars, called ofrendas. It blends the traditions of Mexico\'s first peoples with Catholic holidays.',
    today:'It is a celebration, not a sad day. Remembering is how people stay with us. It is what a Keeper of Memory does.' },
  diwali: { kicker:'FESTIVAL', title:'The Festival of Lights',
    did:'You lit little lamps with Pip for Diwali.',
    real:'Diwali is the festival of lights, celebrated by Hindus, Sikhs, Jains, and some Buddhists. People light diyas, set off fireworks, and share sweets. For many Hindus it remembers the god Rama returning home. It also honors Lakshmi, goddess of good fortune.',
    today:'It falls on the new moon, the darkest night of the month. So all those little lamps really matter.' },
  hanukkah: { kicker:'FESTIVAL', title:'8 Nights of Light',
    did:'You helped Pip light the Hanukkah candles.',
    real:'Hanukkah is an 8-night Jewish festival of lights. It remembers the day the Temple in Jerusalem was made holy again, about 2,200 years ago. It also remembers the story of a small jar of oil that lasted 8 nights.',
    today:'The helper candle has its own name: the shamash.' },
  decsolstice: { kicker:'FESTIVAL', title:'The December Solstice',
    did:'You marked the turning of the year with Nana.',
    real:'Around December 21, the South Pole tilts most toward the sun. North of the equator it is the shortest day of the year, and south of it, the longest. The tomb at Newgrange is about 5,200 years old.',
    today:'In the north, the days start getting longer again tomorrow.' },
  christmas: { kicker:'FESTIVAL', title:'Christmas Around the World',
    did:'You admired Pip\'s very small Christmas tree.',
    real:'Christmas is the Christian celebration of the birth of Jesus. Most churches hold it on December 25. Many Orthodox churches hold it in early January.',
    today:'Many people who are not Christian celebrate it too, as a time for family and giving.' },
};

export { MONTHS, realSeason, moonPhase, FESTIVALS, activeFestival, festivalWindow, dateLabel, FESTIVAL_AHA };
