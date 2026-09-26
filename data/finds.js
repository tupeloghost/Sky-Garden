// First-find fun facts and "where to find it" hints for every collectible item.
// Shown in a small banner the first time a player gets the item, and in the Collections page.

const FINDS = {
  cloudberry:  { fact:'Cloudberries are real! They grow in cold northern bogs and have more vitamin C than oranges.', hint:'Buy seeds from Pip in spring or summer.' },
  sunbell:     { fact:'Young sunflowers turn to follow the sun across the sky each day. Grown ones settle facing east.', hint:'Buy seeds from Pip in spring or summer.' },
  skywheat:    { fact:'Wheat was one of the first crops people ever farmed, about 10,000 years ago in the Middle East.', hint:'Buy seeds from Pip in summer or fall.' },
  moonpumpkin: { fact:'Pumpkins are fruits, not vegetables. The biggest one on record weighed over 1,200 kilograms.', hint:'Buy seeds from Pip in fall.' },
  frostmint:   { fact:'Mint feels cold because it tricks the nerves in your mouth that sense cold. Nothing actually gets colder.', hint:'Buy seeds from Pip in winter.' },
  starbloom:   { fact:'Many real flowers have patterns only bees can see, painted in ultraviolet light.', hint:'Finish Chapter 4, then buy seeds from Pip.' },
  apple:       { fact:'Wild apples first grew in the mountains of Kazakhstan. Almaty, a city there, has a name linked to apples.', hint:'Pick the fruit trees on Orchard Isle.' },
  peach:       { fact:'Peaches were first grown in China thousands of years ago, where they were a symbol of long life.', hint:'Pick the fruit trees on Orchard Isle.' },
  minnow:      { fact:'When a minnow is hurt, it releases a scent that warns other minnows to swim away. A scientist named Karl von Frisch discovered it.', hint:'Fish at the dock on Orchard Isle.' },
  trout:       { fact:'Trout need cold, clean, oxygen-rich water, so finding them is a good sign a stream is healthy.', hint:'Fish at the dock on Orchard Isle.' },
  puffer:      { fact:'Pufferfish blow up like balloons by gulping water. Many carry a poison strong enough to be deadly.', hint:'A rare catch at the Orchard Isle dock.' },
  moonray:     { fact:'Manta rays have some of the biggest brains of any fish, and may even recognize themselves in a mirror.', hint:'After 8 PM, find the secret fishing spot using the star that stays.' },
  rug:       { fact:'Some of the oldest known rugs are over 2,000 years old, preserved in ice in Siberia.', hint:'Buy it from Pip.' },
  fern:      { fact:'Ferns are older than dinosaurs. They have no flowers or seeds and spread using tiny spores.', hint:'Buy it from Pip.' },
  lamp:      { fact:'Paper lanterns have been made in China for about 2,000 years.', hint:'Buy it from Pip.' },
  table:     { fact:'Round tables have no head seat, so everyone sits as an equal. That is part of the King Arthur legend.', hint:'Buy it from Pip.' },
  armchair:  { fact:'For most of history, chairs were rare. Many families sat on benches, stools, or the floor.', hint:'Buy it from Pip.' },
  bookshelf: { fact:'Before shelves stood upright, many libraries kept books flat in chests or chained to desks.', hint:'Buy it from Pip.' },
  globe:     { fact:'Star globes are old: one famous Greek statue, the Farnese Atlas, carries a globe of the sky.', hint:'Buy it from Pip.' },
  rocker:    { fact:'Rocking chairs became popular in the 1700s. Gentle rocking can help people relax.', hint:'Reach 6 hearts with Nana Gale.' },
  sign:      { fact:'Before most people could read, shop signs used pictures, like a boot for a shoemaker.', hint:'Reach 6 hearts with Pip.' },
  mushroom:  { fact:'Some real mushrooms glow in the dark. The glow is called bioluminescence, the same as fireflies.', hint:'Reach 6 hearts with Moss & Fern.' },
  painting:  { fact:'Some of the oldest known paintings, in caves in Indonesia, are over 40,000 years old.', hint:'Reach 6 hearts with Lumen.' },
};

export { FINDS };
