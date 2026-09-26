// First-find fun facts and "where to find it" hints for every collectible item.
// Shown in a small banner the first time a player gets the item, and in the Collections page.

const FINDS = {
  cloudberry:  { fact:'Cloudberries grow in cold northern bogs in places like Norway, Finland, and Canada, and have more vitamin C than oranges.', hint:'Buy seeds from Pip in spring or summer.' },
  sunbell:     { fact:'Young sunflowers turn to follow the sun across the sky each day. Grown ones settle facing east.', hint:'Buy seeds from Pip in summer or fall.' },
  skywheat:    { fact:'Wheat was one of the first crops people ever farmed, about 10,000 years ago in the Middle East.', hint:'Buy seeds from Pip in summer or fall.' },
  moonpumpkin: { fact:'Pumpkins are fruits, not vegetables. The biggest one on record weighed over 1,200 kilograms.', hint:'Buy seeds from Pip in fall.' },
  frostmint:   { fact:'Mint feels cold because it tricks the nerves in your mouth that sense cold. Nothing actually gets colder.', hint:'Buy seeds from Pip in spring, summer, or fall.' },
  starbloom:   { fact:'Moonflowers are real vines whose big white flowers open at dusk and close in the morning. Night-flying moths pollinate them.', hint:'Finish Chapter 4, then buy seeds from Pip. In Sky Garden, they bloom in any season.' },
  kale:        { fact:'Kale gets sweeter after a frost. The plant turns some of its starch into sugar, which works like antifreeze in its leaves.', hint:'Buy seeds from Pip in fall or winter.' },
  apple:       { fact:'Wild apples first grew in the mountains of Kazakhstan. Almaty, a city there, has a name linked to apples.', hint:'Pick the fruit trees on Orchard Isle.' },
  peach:       { fact:'Peaches were first grown in China thousands of years ago, where they were a symbol of long life.', hint:'Pick the fruit trees on Orchard Isle.' },
  minnow:      { fact:'When a minnow is hurt, it releases a scent that warns other minnows to swim away. A scientist named Karl von Frisch discovered it.', hint:'Fish at the dock on Orchard Isle.' },
  trout:       { fact:'Trout need cold, clean, oxygen-rich water, so finding them is a good sign a stream is healthy.', hint:'Fish at the dock on Orchard Isle.' },
  puffer:      { fact:'Pufferfish blow up like balloons by gulping water. Many carry a poison strong enough to be deadly.', hint:'A rare catch at the Orchard Isle dock.' },
  koi:         { fact:'Koi can live for decades. A famous koi named Hanako was said to be over 200 years old, though scientists doubt it.', hint:'Fish in spring, before 7 PM.' },
  sunfish:     { fact:'The ocean sunfish is one of the heaviest bony fish in the world. Some weigh over 2,000 kilograms.', hint:'Fish in summer, before 7 PM.' },
  frostchar:   { fact:'Arctic char live farther north than any other freshwater fish, in icy lakes near the top of the world.', hint:'Fish in winter.' },
  guppy:       { fact:'Guppies are named after Robert Guppy, who sent some from Trinidad to the British Museum in 1866.', hint:'Fish while it is raining. (Only biting in the rain is a Sky Garden rule, not a real one.)' },
  lanterneel:  { fact:'Lanternfish make their own light with glowing spots on their bodies, and they are some of the most common fish in the deep ocean.', hint:'Fish after 8 PM. Real lanternfish live deep in the ocean and swim up toward the surface at night.' },
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
  cake:      { fact:'Birthday candles may go back to ancient Greece, where round cakes with candles were offered to Artemis, goddess of the moon. Historians are not completely sure.', hint:'Celebrate your birthday, or your Island Day, in Sky Garden.' },
  mushroom:  { fact:'Some real mushrooms glow in the dark. The glow is called bioluminescence, the same as fireflies.', hint:'Reach 6 hearts with Moss & Fern.' },
  painting:  { fact:'Some of the oldest known paintings, in caves in Indonesia, are over 40,000 years old.', hint:'Reach 6 hearts with Lumen.' },
};

export { FINDS };
