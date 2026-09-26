// A picture for every item. Used in the Bag, crafting, and Collections.
const ICONS = {
  cloudberry:'🫐', sunbell:'🌻', skywheat:'🌾', moonpumpkin:'🎃', frostmint:'🌿', kale:'🥬', starbloom:'🌼',
  apple:'🍎', peach:'🍑',
  minnow:'🐟', trout:'🐟', puffer:'🐡', moonray:'🐟', koi:'🐠', sunfish:'🐠', frostchar:'🐟', guppy:'🐠', lanterneel:'🐟',
  jam:'🍯', crisp:'🥧', tea:'🍵', soup:'🥣', saltfish:'🐟', candy:'🍬',
  flour:'🌾', stick:'🥢', stone:'🪨', fiber:'🌱', log:'🪵', clay:'🟤', brick:'🧱', pot:'🏺', copper:'🟢', tin:'⚪', bronze:'🟠',
  rug:'🟣', fern:'🪴', lamp:'🏮', table:'🪑', armchair:'🛋️', bookshelf:'📚', globe:'🌐', rocker:'🪑', sign:'🍀', mushroom:'🍄', cake:'🎂', painting:'🖼️',
};
const KIND_ICON = { crop:'🌱', fruit:'🍎', fish:'🐟', dish:'🍽️', material:'🪵', quest:'📦' };
const icon = (k, kind) => ICONS[k] || KIND_ICON[kind] || '✨';
export { ICONS, icon };
