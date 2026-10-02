// The Keepers' Path: trials for trusted players (trust level 2 = Keeper, 3 = Elder Keeper).
// Each trial pairs something that helps everyone with a real piece of wisdom and a private reflection question.
// The mentor, Wren, is a game character. The wisdom and history are real.
const MENTOR = { name:'Wren', title:'the Lighthouse Keeper' };
const TRIALS = [
  { id:'map', level:2, name:'The Trial of the Map',
    intro:"Before you can keep a place, you have to know it. Four old marker stones sit at the edges of your island, glowing faintly. Everyone who ever walks in the village square will know it by the name you give it.",
    task:'Visit the 4 glowing marker stones at the edges of your island, then name the village square.',
    wisdom:'Mapmakers have always named places for people who come after them. A good name helps a stranger feel at home. The oldest map of the world we know of, the Babylonian Map of the World, is a clay tablet about 2,600 years old.',
    reflect:'Think of a place that felt like home the first time you saw it. What made it feel that way?' },
  { id:'seeds', level:2, name:'The Trial of the Seeds',
    intro:"Keepers plant things they may never see finished. The saplings grow one stage for each day you come back. They will outlast us all.",
    task:'Plant the 3 saplings at the glowing spots on your island.',
    wisdom:'"A society grows great when old people plant trees whose shade they know they will never sit in." It is a modern saying, though it is often called a Greek proverb. Some trees people plant today will still stand in 500 years.',
    reflect:'What is something you could start now that might help someone long after you?' },
  { id:'gift', level:2, name:'The Trial of the Gift',
    intro:"Now make something for everyone. If your landmark is chosen, every gardener in the sky will see it.",
    task:'Design a landmark for the village and send it for approval.',
    wisdom:'"It is more blessed to give than to receive." These words appear in the Bible, in the book of Acts, 20:35. Scientists studying happiness have found something similar: spending on others often makes people happier than spending on themselves.',
    reflect:'When did giving something away make you happier than keeping it?' },
  { id:'voice', level:2, name:'The Trial of the Voice',
    intro:"Keepers have a voice in what the sky becomes. After you vote, listen to a story about what power is for.",
    task:"Vote in the Keepers' Council at the Town Hall.",
    wisdom:'Roman tradition says that in 458 BC, Rome was in danger, and the leaders gave a farmer named Cincinnatus total power to save the city. He won. After about two weeks, he gave all that power back and went home to plow his fields. People have admired him for over 2,000 years because he let go.',
    reflect:'What would you do with power you did not ask for? How would you know when to give it back?' },
  { id:'unseen', level:3, name:'The Trial of the Unseen',
    intro:"The last trial is the quietest. Your neighbors will never know the gifts came from you. That is the point.",
    task:'Leave 3 secret gifts for neighbors, from the lighthouse.',
    wisdom:'The Tao Te Ching, traditionally credited to Lao Tzu about 2,400 years ago, says: the best leaders are barely known. When their work is done, the people say, "We did it ourselves."',
    reflect:'Who has helped you without being thanked, or without you even knowing? How might you thank them now?' },
];
const LANDMARKS = { fountain:'Fountain', sundial:'Sundial garden', belltower:'Bell tower', stonecircle:'Standing stones' };
export { MENTOR, TRIALS, LANDMARKS };
