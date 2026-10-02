// Real insects you can catch with a bug net. where: air (flies around), flower, ground (hops), tree (clings to trunks).
// seasons: 0 spring, 1 summer, 2 fall, 3 winter. time: day, night, or any.
const INSECTS = [
  { id:'honeybee',  name:'Honeybee',          where:'air',    seasons:[0,1,2], time:'day',   sell:40,  fact:'A honeybee makes only about 1/12 of a teaspoon of honey in its whole life. A jar of honey is the work of more than 1,000 bees.' },
  { id:'ladybird',  name:'Seven-spot Ladybird', where:'flower', seasons:[0,1,2], time:'day', sell:35,  fact:'A single ladybird can eat about 5,000 aphids in its life. Aphids are tiny bugs that eat plants, so gardeners are happy to see a ladybird.' },
  { id:'dragonfly', name:'Green Darner',      where:'air',    seasons:[1],     time:'day',   sell:90,  fact:'Dragonflies catch about 9 out of every 10 insects they chase. That makes them some of the best hunters on Earth.' },
  { id:'hopper',    name:'Grasshopper',       where:'ground', seasons:[1,2],   time:'day',   sell:45,  fact:'Many grasshoppers "sing" by rubbing a back leg against a wing, like a bow on a violin.' },
  { id:'cicada',    name:'Periodical Cicada', where:'tree',   seasons:[1],     time:'day',   sell:110, fact:'Some cicadas live underground for 13 or 17 years, then all come out together in the same spring.' },
  { id:'stagbeetle',name:'Stag Beetle',       where:'tree',   seasons:[1],     time:'any',   sell:180, fact:'Stag beetle young live inside rotting wood for up to 7 years before they become beetles.' },
  { id:'mantis',    name:'Praying Mantis',    where:'flower', seasons:[1,2],   time:'day',   sell:130, fact:'A praying mantis can turn its head about 1/2 a circle, far enough to look over its own shoulder. Very few insects can do that.' },
  { id:'firefly',   name:'Firefly',           where:'air',    seasons:[1],     time:'night', sell:70,  fact:'A firefly makes light by mixing chemicals inside its body. It is called cold light, because it gives off very little heat.' },
  { id:'lunamoth',  name:'Luna Moth',         where:'air',    seasons:[0,1],   time:'night', sell:150, fact:'Grown-up luna moths have no mouth. They live only about a week, just long enough to find a mate.' },
  { id:'springtail',name:'Snow Flea',         where:'ground', seasons:[3],     time:'day',   sell:60,  fact:'Snow fleas are not fleas, and not quite insects either. They are springtails, and they jump by flicking a spring-like tail folded under their body.' },
];
export { INSECTS };
