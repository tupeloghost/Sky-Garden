// Hidden gift tastes. Nobody tells you these. You learn them by giving gifts and watching how people react.
// Each list can hold item ids, or "kind:bug" style entries for a whole kind of item.
// Hearts: love +2, like +1, neutral 0, dislike -1, hate -2.
const UNIVERSAL = {
  likes:['kind:heirloom','kind:specialty','kind:dish'],
  dislikes:['stick','stone','fiber','log','clay','brick','copper','tin'],
};
const TASTES = {
  nana:    { loves:['skywheat','kale','peach','soup','tea'], likes:['kind:crop','kind:fruit','jam','flour'], dislikes:['kind:bug','coffee'], hates:['puffer'] },
  pip:     { loves:['sunbell','cloudberry','apple','candy','cacao'], likes:['kind:crop','kind:fruit','ladybird'], dislikes:['kale','frostmint','tea'], hates:['saltfish'] },
  drizzle: { loves:['minnow','trout','puffer','moonpumpkin','dragonfly','hopper'], likes:['kind:fish','kind:bug'], dislikes:['candy','jam'], hates:['saltfish'] },
  twins:   { loves:['moonpumpkin','apple','frostmint','stagbeetle','springtail'], likes:['stone','clay','kind:bug','kind:crop'], dislikes:['sunbell','firefly'], hates:['tea'] },
  lumen:   { loves:['starbloom','lunamoth','firefly','lanterneel','coffee'], likes:['clay','koi','kind:heirloom','tea'], dislikes:['hopper','minnow'], hates:['stagbeetle'] },
  mabel:   { loves:['jam','peach','cacao','vanilla','crisp','skywheat'], likes:['kind:fruit','kind:crop','olive'], dislikes:['kind:fish'], hates:['kind:bug'] },
  hoot:    { loves:['tea','trout','starbloom','coffee','lunamoth'], likes:['kind:fish','kale','soup'], dislikes:['jam'], hates:['candy'] },
  allegra: { loves:['candy','minnow','cloudberry','cicada','hopper'], likes:['kind:fruit','jam','crisp'], dislikes:['kale'], hates:['frostmint'] },
  sage:    { loves:['tea','frostmint','soup','olive','saffron'], likes:['kind:crop','kind:heirloom','kind:specialty'], dislikes:['kind:fish','candy'], hates:['kind:bug'] },
};
// What each person says. Order: love, like, neutral, dislike, hate.
const REACT = {
  nana:    ["Oh my! My very favorite. You remember everything, don't you?", "How lovely, dear. Thank you.", "Well, thank you, dear. That was kind.", "Oh. Hm. I will find a use for it, I suppose.", "Oh dear. Please take this away from me."],
  pip:     ["FOR ME?! This is the best day of my WHOLE life. Again!", "Ooh, nice! Thanks, friend!", "Oh! A present. Cool. Thanks!", "Um. Do I have to eat this?", "Blegh! No no no. Why would you give me THIS?"],
  drizzle: ["Now THAT is a proper gift. You have a sailor's heart!", "Much obliged, sailor.", "Aye. Thank you kindly.", "Hmph. Not quite to a captain's taste.", "Salt? For a freshwater frog?! Walk the plank, sailor!"],
  twins:   ["Moss: OUR FAVORITE! Fern: Our most favorite favorite!", "Moss: Nice! Fern: Very nice.", "Moss: Oh. Fern: Thank you!", "Moss: Too bright. Fern: Way too bright.", "Moss: Blech! Fern: Tastes like leaves that gave up."],
  lumen:   ["Oh... it's beautiful. I want to paint it. Can I keep it forever?", "Thank you. I like this very much.", "Oh. For me? Thank you.", "Hm. It is not really... me.", "It pinched my brush last time. Please, no."],
  mabel:   ["Oh, sweetheart! I can bake something wonderful with this!", "Lovely! That'll go right in the pantry.", "Thank you, dear.", "Hm, not really a baker's gift. But thank you.", "EEK! Not in my KITCHEN! Out, out, out!"],
  hoot:    ["Splendid! Truly splendid. You have excellent taste.", "Ah, thank you. Most kind.", "Hm. Thank you, young scholar.", "Please keep that far from my books.", "Crumbs! Crumbs in my pages! Absolutely not."],
  allegra: ["Oh, it SINGS! This is my absolute favorite!", "Ooh, lovely. Thank you, darling!", "Thank you!", "Hmm, not really my rhythm.", "Oh no. It makes my voice squeak. Take it back!"],
  sage:    ["This fills my heart. Thank you, friend.", "How kind. Thank you.", "Thank you for thinking of me.", "I am grateful, but this is not for me.", "Please, let it go free. All living things want to be free."],
};
const TIERS = ['love','like','neutral','dislike','hate'], TIER_HEARTS = [2, 1, 0, -1, -2];
// which taste does this person have for this item?
function tasteOf(t, k, kind) { const has = list => (list || []).some(x => x === k || x === 'kind:' + kind);
  if (!t) return 2;
  if (has(t.loves)) return 0; if (has(t.hates)) return 4; if (has(t.dislikes)) return 3; if (has(t.likes)) return 1;
  if (has(UNIVERSAL.dislikes)) return 3; if (has(UNIVERSAL.likes)) return 1; return 2; }
export { TASTES, REACT, TIERS, TIER_HEARTS, tasteOf, UNIVERSAL };
