from base import *
R = random.Random
INK = '#3b2f4a'; SUB = '#9a7f66'
def flame(x, y, s=1): return f'<path d="M{x} {y} q{-5*s} {-7*s} 0 {-15*s} q{5*s} {8*s} 0 {15*s}Z" fill="#f6b53a"/><path d="M{x} {y} q{-2.2*s} {-4*s} 0 {-8*s} q{2.2*s} {4*s} 0 {8*s}Z" fill="#fff3b0"/>'

# ---- worldtree (a ceiba) ----
r = R(21)
thorns = ''
crown = ''.join(f'<ellipse cx="{r.uniform(90,230):.0f}" cy="{r.uniform(18,34):.0f}" rx="{r.uniform(20,34):.0f}" ry="{r.uniform(8,13):.0f}" fill="{r.choice(["#4f9a5c","#5fae6b","#3f8a50"])}"/>' for _ in range(16))
add('worldtree', 'Many peoples pictured one giant tree holding the world together.',
  svg(330, 126, 'A drawing of a ceiba tree: a tall straight grey trunk, wide wing-like roots at the bottom, and a flat, spreading top',
    '<path d="M0 102 H330" stroke="#c9ab88" stroke-width="2"/><path d="M110 102 Q140 96 152 70 L152 40 L168 40 L168 70 Q180 96 210 102Z" fill="#a7ab9d"/><path d="M160 40 V102" stroke="#8f9488" stroke-width="1"/>'
    '<path d="M152 44 L112 30 M168 44 L208 30 M156 40 L140 22 M164 40 L182 22" stroke="#a7ab9d" stroke-width="5" stroke-linecap="round"/>' + thorns + crown +
    '<path d="M150 104 q-14 10 -30 12 M170 104 q14 10 30 12 M160 104 v16" stroke="#7a6452" stroke-width="2" fill="none" stroke-dasharray="4 3"/>'
    + txt(290, 30, 'the heavens', 11, INK) + txt(290, 78, 'the earth', 11, INK) + txt(290, 120, 'the underworld', 11, INK) + person(60, 102, 14)),
  'A drawing of a ceiba, the tree in the Maya story, with a person for size. Real ceibas are among the tallest trees in the rainforest.')

# ---- harvest (a sukkah) ----
r = R(22)
roof = ''.join(f'<path d="M{r.uniform(70,250):.0f} {r.uniform(22,32):.0f} l{r.uniform(-26,26):.0f} {r.uniform(-8,8):.0f}" stroke="{r.choice(["#5f8a4a","#4f7a3e","#7a9a52","#8a6a44"])}" stroke-width="{r.uniform(2,4):.1f}" stroke-linecap="round"/>' for _ in range(60))
fruit = ''.join(f'<path d="M{x} 34 v8" stroke="#8a6a44" stroke-width="1"/><circle cx="{x}" cy="46" r="4.500" fill="{c}"/>' for x, c in ((120, '#e5484d'), (150, '#f6c531'), (182, '#f08c2e'), (210, '#8e44ad')))
add('harvest', 'When the crops come in, people everywhere stop and eat together.',
  svg(330, 124, 'A drawing of a small hut with white cloth walls and a roof of leafy branches, with a table set for a meal inside and fruit hanging from the roof',
    '<path d="M20 112 H310" stroke="#c9ab88" stroke-width="2"/><path d="M70 30 V112 M250 30 V112" stroke="#8a6a44" stroke-width="5"/>'
    '<path d="M70 34 H110 Q104 74 112 112 H70Z M250 34 H214 Q220 74 210 112 H250Z" fill="#fbf6ea" stroke="#d9cdb6" stroke-width="1.5"/><rect x="110" y="34" width="104" height="78" fill="#efe3c8" opacity=".6"/>'
    + fruit + '<rect x="124" y="84" width="76" height="6" fill="#9b6b4a"/><path d="M130 90 v22 M194 90 v22" stroke="#9b6b4a" stroke-width="4"/><circle cx="146" cy="80" r="6" fill="#fff"/><circle cx="178" cy="80" r="6" fill="#fff"/><path d="M160 70 h4 v14 h-4Z" fill="#a3402c"/>'
    + flame(162, 70, .6) + roof + '<path d="M62 30 H258" stroke="#8a6a44" stroke-width="4"/>'),
  'A drawing of a sukkah, the outdoor hut built for the Jewish harvest festival of Sukkot. The roof is cut branches, and it is best if you can see the stars through it.')

# ---- theseus (a trireme) ----
r = R(23)
hull = 'M24 62 Q28 86 60 90 L262 90 Q292 88 300 60 Q306 40 296 26 Q300 46 282 62 L50 62 Q34 62 22 70Z'
planks = ''.join(f'<rect x="{60 + i*22}" y="{66 + j*8}" width="20" height="6.500" fill="{"#e9cf9a" if r.random() < .38 else "#8a6240"}"/>' for i in range(10) for j in range(3))
oars = ''.join(f'<path d="M{66 + i*13 + lv*4} {68 + lv*8} L{52 + i*13 + lv*4} 112" stroke="#c9a06a" stroke-width="1.2"/><circle cx="{66 + i*13 + lv*4}" cy="{68 + lv*8}" r="1.600" fill="#2a1c12"/>' for i in range(15) for lv in range(3))
add('theseus', 'Replace every plank. Is it still the same ship?',
  svg(330, 124, 'A drawing of a long, low Greek warship with three levels of oars, a pointed ram at the front, and a high curved tail. Some planks are new, pale wood and some are old, dark wood',
    f'<path d="{hull}" fill="#6f4c30"/>{planks}' + oars + '<path d="M0 102 Q40 96 80 102 T160 102 T240 102 T330 102 V124 H0Z" fill="#7ec8e3" opacity=".85"/>'
    f'<path d="M22 70 L4 74 L24 80Z" fill="#b98a3e"/><circle cx="40" cy="70" r="3.500" fill="#fff"/><circle cx="40" cy="70" r="1.500" fill="#1d1a22"/>'
    '<path d="M150 62 V14 M118 22 H182" stroke="#7a5236" stroke-width="3"/><path d="M120 24 H180 L176 52 H124Z" fill="#f6efdc"/>'
    + txt(262, 20, 'pale = new plank', 10.5, INK) + txt(262, 34, 'dark = old plank', 10.5, INK)),
  'A drawing of an ancient Greek warship with three levels of oars.')

# ---- zeno ----
segs = ''; x = 20; w = 290; cols = ['#ff8fa3', '#ffc857', '#8fdc8a', '#7ec8e3', '#c9b6ff', '#f0a3d0']
for i in range(6):
    ww = w / 2 ** (i + 1); segs += f'<rect x="{x:.1f}" y="34" width="{ww:.1f}" height="38" fill="{cols[i]}"/>'
    if i < 4: segs += txt(x + ww / 2, 58, f'1/{2 ** (i + 1)}', 15 - i * 2, INK)
    x += ww
add('zeno', 'Walk halfway to a door. Then halfway again. There is always a bit left. So how do you ever arrive?',
  svg(330, 104, 'A diagram of a bar cut in half, then the rest cut in half again and again, into smaller and smaller pieces that get closer and closer to the end',
    '<rect x="20" y="34" width="290" height="38" fill="#fff6e6"/>' + segs + '<rect x="20" y="34" width="290" height="38" fill="none" stroke="#3b2f4a" stroke-width="2"/>'
    + txt(20, 24, 'start', 11, INK, 'start') + txt(310, 24, 'finish', 11, INK, 'end') + txt(165, 94, '1/2 + 1/4 + 1/8 + 1/16 + ... = 1', 13, INK)),
  'Each colored block is one step: half the way, then half of what was left. The steps shrink so fast that all of them together make the whole way.')

# ---- cave ----
add('cave', 'What if everything you have ever seen was only a shadow?',
  svg(330, 124, 'A cutaway drawing of a cave. People sit facing a wall and watch shadows. Behind them, a fire throws the shadows of objects carried along a low wall. Far behind, a tunnel leads up to sunlight',
    '<rect width="330" height="124" rx="10" fill="#3a3140"/><path d="M0 0 H330 V30 Q300 20 280 0Z" fill="#f6ead8"/><circle cx="312" cy="12" r="9" fill="#f2b84b"/><path d="M230 60 Q270 40 300 26 L312 34 Q280 50 244 72Z" fill="#6b5f70"/>'
    '<path d="M0 108 H330 V124 H0Z" fill="#2a2330"/><rect x="8" y="24" width="10" height="84" fill="#5a4f60"/>'
    '<g fill="#17131c" opacity=".85"><path d="M20 70 q8 -18 14 0 v20 h-14Z"/><path d="M40 78 l8 -22 l8 22Z"/></g>'
    + person(96, 108, 22, '#c9b6ff') + person(112, 108, 22, '#ffc857') + person(128, 108, 22, '#8fdc8a')
    + '<rect x="160" y="84" width="46" height="24" fill="#5a4f60"/><path d="M170 84 q6 -16 12 0Z M190 84 l6 -18 l6 18Z" fill="#17131c"/>' + person(182, 108, 16, '#8a7a96')
    + '<path d="M232 108 l8 -14 l8 14Z" fill="#7a5236"/>' + flame(240, 98, 1.5)
    + '<g stroke="#f6b53a" stroke-width="1" stroke-dasharray="3 4" opacity=".7"><path d="M236 86 L22 60 M236 90 L44 70"/></g>'
    + txt(36, 118, 'shadows', 10, '#f6ead8') + txt(112, 121, 'the prisoners', 10, '#f6ead8') + txt(240, 121, 'fire', 10, '#f6ead8') + txt(282, 62, 'the way out', 10, '#f6ead8')),
  'A drawing of the cave in Plato\'s story. The prisoners are chained. They have only ever seen the shadows on the wall. So they think the shadows are the real world.')

# ---- river ----
r = R(25)
flow = ''.join(f'<path d="M{x} {y} q14 -5 28 0" stroke="#dff3ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>' for x, y in [(r.uniform(10, 290), r.uniform(46, 92)) for _ in range(26)])
add('river', 'The water you stepped in is already gone.',
  svg(330, 118, 'A drawing of a river flowing left to right past grassy banks, with two bare feet standing in the shallow water and ripples moving on past them',
    '<path d="M0 0 H330 V40 Q250 30 165 40 Q80 50 0 38Z" fill="#8fdc8a"/><path d="M0 38 Q80 50 165 40 Q250 30 330 40 V98 Q250 88 165 98 Q80 108 0 96Z" fill="#5fb4dc"/><path d="M0 96 Q80 108 165 98 Q250 88 330 98 V118 H0Z" fill="#7fcf7a"/>' + flow +
    '<path d="M142 28 q4 30 2 44 q10 4 18 0 q-2 -6 -8 -8 l-2 -36Z M176 28 q4 30 2 44 q10 4 18 0 q-2 -6 -8 -8 l-2 -36Z" fill="#e8b98f"/><ellipse cx="152" cy="72" rx="16" ry="4" fill="none" stroke="#dff3ff" stroke-width="1.5"/><ellipse cx="186" cy="72" rx="16" ry="4" fill="none" stroke="#dff3ff" stroke-width="1.5"/>'
    '<path d="M230 66 h56 m-9 -6 l9 6 l-9 6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>' + txt(258, 88, 'new water, every second', 10.5, '#fff')),
  'The river keeps its name and its place on the map. The water in it is never the same water. Heraclitus said everything is like that river: always changing, and still itself.')

# ---- floating man ----
r = R(26)
cl = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.38:.0f}" fill="#fff" opacity=".85"/>' for x, y, rx in ((50, 96, 40), (92, 104, 30), (268, 22, 34), (300, 30, 24), (238, 100, 28)))
add('floating', 'No sight, no sound, no touch. Would you still know you are there?',
  svg(330, 118, 'A drawing of a person floating in an empty sky with eyes closed and arms and legs spread out, touching nothing',
    '<rect width="330" height="118" rx="10" fill="#9fd3ff"/>' + cl +
    '<g transform="rotate(-12 165 58)"><path d="M150 52 L112 40 M180 52 L220 42 M158 80 L140 110 M174 80 L190 110" stroke="#e8b98f" stroke-width="7" stroke-linecap="round"/><rect x="148" y="44" width="34" height="40" rx="10" fill="#7a6cc9"/>'
    '<circle cx="165" cy="30" r="14" fill="#e8b98f"/><path d="M152 26 q13 -16 26 0 q-13 -6 -26 0Z" fill="#3b2f4a"/><path d="M158 31 q3 3 6 0 M167 31 q3 3 6 0" stroke="#3b2f4a" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>'),
  'Ibn Sina asked you to picture it. You float in still air with your eyes closed. Your arms and legs are spread so nothing touches anything.')

# ---- stoic ----
add('stoic', 'Sort every worry into two piles.',
  svg(330, 118, 'A diagram of two circles. One is labeled up to you, with your choices, your effort, and your words inside. The other is labeled not up to you, with the weather, the past, and other people inside',
    '<circle cx="92" cy="62" r="52" fill="#dff5e3" stroke="#5fae6b" stroke-width="3"/><circle cx="238" cy="62" r="52" fill="#eee9f7" stroke="#9a8fc0" stroke-width="3" stroke-dasharray="6 5"/>'
    + txt(92, 34, 'UP TO YOU', 12, '#2f7a45') + txt(92, 56, 'your choices', 12, INK) + txt(92, 73, 'your effort', 12, INK) + txt(92, 90, 'your words', 12, INK)
    + txt(238, 34, 'NOT UP TO YOU', 12, '#6a5fa0') + txt(238, 56, 'the weather', 12, INK) + txt(238, 73, 'the past', 12, INK) + txt(238, 90, 'other people', 12, INK)),
  'Epictetus taught that peace comes from working on the first pile and letting go of the second. Many people find a worry has a piece in each pile.')

# ---- golden rule ----
add('golden', 'One rule shows up almost everywhere people have lived.',
  svg(330, 112, 'A drawing of two people facing each other with an arrow going from each one to the other, the same in both directions',
    person(84, 98, 62, '#7a6cc9') + person(246, 98, 62, '#e2702e') +
    '<path d="M108 48 Q165 22 222 48" fill="none" stroke="#c98a1f" stroke-width="3"/><path d="M214 40 l9 8 l-11 4" fill="none" stroke="#c98a1f" stroke-width="3" stroke-linecap="round"/>'
    '<path d="M222 74 Q165 100 108 74" fill="none" stroke="#c98a1f" stroke-width="3"/><path d="M116 82 l-9 -8 l11 -4" fill="none" stroke="#c98a1f" stroke-width="3" stroke-linecap="round"/>'
    + txt(165, 30, 'how I treat you', 11, INK) + txt(165, 108, 'how I would want to be treated', 11, INK)),
  'Before you act, swap places in your head. Would you want that done to you?')

# =================== festivals ===================
# ---- lunar new year: red envelopes ----
def env(x, y, rot, mark):
    return f'<g transform="rotate({rot} {x+20} {y+34})"><rect x="{x}" y="{y}" width="40" height="68" rx="3" fill="#d6332e"/><path d="M{x} {y+16} Q{x+20} {y+30} {x+40} {y+16}" fill="none" stroke="#a82420" stroke-width="1.5"/><circle cx="{x+20}" cy="{y+40}" r="11" fill="none" stroke="#f6c531" stroke-width="2"/>{mark(x+20, y+40)}</g>'
m1 = lambda x, y: f'<path d="M{x-5} {y} h10 M{x} {y-5} v10" stroke="#f6c531" stroke-width="2"/>'
m2 = lambda x, y: f'<rect x="{x-4}" y="{y-4}" width="8" height="8" fill="none" stroke="#f6c531" stroke-width="2"/>'
m3 = lambda x, y: f'<circle cx="{x}" cy="{y}" r="4" fill="#f6c531"/>'
add('lunarnewyear', 'Red envelopes, for luck in the new year.',
  svg(330, 112, 'A drawing of three red envelopes with gold decoration, fanned out, next to a round red paper lantern with a gold tassel',
    env(60, 22, -14, m1) + env(104, 18, 0, m2) + env(148, 22, 14, m3) +
    '<path d="M258 6 v10" stroke="#8a6a44" stroke-width="2"/><ellipse cx="258" cy="50" rx="34" ry="32" fill="#d6332e"/><g stroke="#a82420" stroke-width="1.5" fill="none"><ellipse cx="258" cy="50" rx="20" ry="32"/><ellipse cx="258" cy="50" rx="7" ry="32"/></g><rect x="246" y="14" width="24" height="6" fill="#f6c531"/><rect x="246" y="80" width="24" height="6" fill="#f6c531"/><path d="M254 86 v18 M258 86 v20 M262 86 v18" stroke="#f6c531" stroke-width="2"/>'),
  'In Chinese tradition, older family members give children money in red envelopes. Red is the color of good luck.')

# ---- holi: bowls of colored powder ----
r = R(31)
def pile(x, c, d): return f'<path d="M{x-24} 84 Q{x-22} 100 {x} 100 Q{x+22} 100 {x+24} 84Z" fill="#b08a5e"/><ellipse cx="{x}" cy="84" rx="24" ry="5" fill="#8a6a44"/><path d="M{x-21} 84 Q{x-8} 44 {x} 46 Q{x+8} 44 {x+21} 84Z" fill="{c}"/><path d="M{x-21} 84 Q{x-8} 44 {x} 46 Q{x-2} 66 {x-4} 84Z" fill="{d}" opacity=".5"/>'
puffs = ''.join(f'<circle cx="{r.uniform(20,310):.0f}" cy="{r.uniform(8,40):.0f}" r="{r.uniform(5,16):.0f}" fill="{r.choice(["#ec4899","#f6c531","#3d8fe0","#4cb86a","#f08c2e","#8e44ad"])}" opacity="{r.uniform(.25,.5):.2f}"/>' for _ in range(34))
add('holi', 'For one morning, everyone is covered in color.',
  svg(330, 108, 'A drawing of five bowls heaped with bright powder in pink, yellow, blue, green, and orange, with clouds of color in the air above',
    puffs + pile(48, '#ec4899', '#b0266f') + pile(106, '#f6c531', '#c79a12') + pile(164, '#3d8fe0', '#2563a8') + pile(222, '#4cb86a', '#2f8a49') + pile(280, '#f08c2e', '#b5621a')),
  'A drawing of the colored powder, called gulal, sold in heaps before the festival. Friends and strangers throw it and smear it on each other in the street.')

# ---- nowruz: haft-sin ----
r = R(32)
sprout = ''.join(f'<path d="M{x} 70 q{r.uniform(-3,3):.0f} -14 {r.uniform(-4,4):.0f} -{r.uniform(22,32):.0f}" stroke="{r.choice(["#4cb86a","#3f9a56","#6fcf82"])}" stroke-width="1.6" fill="none"/>' for x in range(22, 70, 2))
def bowl(x, c, lab): return f'<path d="M{x-17} 72 Q{x-15} 88 {x} 88 Q{x+15} 88 {x+17} 72Z" fill="#dfeaf2" stroke="#9fb6c8" stroke-width="1.2"/><ellipse cx="{x}" cy="72" rx="17" ry="4" fill="{c}"/>' + txt(x, 104, lab, 9.5, INK)
add('nowruz', 'Seven things on the table. In Persian, each one starts with S.',
  svg(330, 110, 'A drawing of seven items on a table: a dish of green sprouts, an apple, a head of garlic, and bowls of vinegar, red spice, brown pudding, and dried fruit',
    '<path d="M6 90 H324" stroke="#c9ab88" stroke-width="2"/><path d="M20 70 H72 L66 88 H26Z" fill="#dfeaf2" stroke="#9fb6c8" stroke-width="1.2"/>' + sprout + '<path d="M22 60 H70" stroke="#d6332e" stroke-width="3"/>' + txt(46, 104, 'sprouts', 9.5, INK)
    + '<path d="M96 66 q-14 0 -12 14 q2 10 12 10 q10 0 12 -10 q2 -14 -12 -14Z" fill="#d6332e"/><path d="M96 66 q2 -6 6 -8" stroke="#7a5236" stroke-width="1.6" fill="none"/>' + txt(96, 104, 'apple', 9.5, INK)
    + '<path d="M136 66 q-12 4 -11 14 q1 10 11 10 q10 0 11 -10 q1 -10 -11 -14Z" fill="#f4efe4" stroke="#cfc6b4" stroke-width="1.2"/><path d="M136 66 v-7 M131 72 q3 8 0 16 M141 72 q-3 8 0 16" stroke="#cfc6b4" stroke-width="1.2" fill="none"/>' + txt(136, 104, 'garlic', 9.5, INK)
    + bowl(178, '#e9d9a8', 'vinegar') + bowl(220, '#8f2436', 'sumac') + bowl(262, '#8a5a34', 'pudding') + bowl(304, '#b9783e', 'dried fruit')),
  'A drawing of a Haft-sin table. In Persian the 7 are sabzeh, sib, sir, serkeh, somaq, samanu, and senjed. Each is said to stand for a wish for the year, like new life, health, or patience.')

# ---- passover: matzah ----
r = R(33)
perf = ''.join(f'<path d="M{x} 20 V96" stroke="#d9b877" stroke-width="2" stroke-dasharray="1.500 4"/>' for x in range(122, 216, 8))
blis = ''.join(f'<path d="{blob(r.uniform(120,212), r.uniform(22,94), r.uniform(2,6), r.uniform(1.5,4), 7, .3, 300+i)}" fill="{r.choice(["#a8713a","#8a5a2a","#c08a4a"])}" opacity=".85"/>' for i in range(60))
add('passover', 'Flat bread, baked in a hurry.',
  svg(330, 116, 'A drawing of a square of matzah: a thin, pale cracker with rows of tiny holes and many small brown scorch marks',
    f'<path d="{blob(166, 58, 56, 46, 28, .03, 9)}" fill="none"/><path d="M114 14 L220 12 L222 100 L112 102Z" fill="#f0dcae" stroke="#d2b47a" stroke-width="1.5" stroke-linejoin="round"/>' + perf + blis
    + txt(274, 50, 'rows of holes', 10.5, INK) + txt(274, 64, 'let steam out', 10.5, INK)),
  'A drawing of matzah, made from only flour and water. By tradition, it must go from mixing to fully baked in under 18 minutes, so the dough has no chance to rise.')

# ---- easter: eggs ----
def egg(x, y, c, deco, rot=0): return f'<g transform="rotate({rot} {x} {y})"><path d="M{x} {y-17} q13 6 13 20 q0 14 -13 14 q-13 0 -13 -14 q0 -14 13 -20Z" fill="{c}"/>{deco(x, y)}</g>'
d1 = lambda x, y: f'<path d="M{x-12} {y+2} q6 -5 12 0 q6 5 12 0" stroke="#fff" stroke-width="2" fill="none"/>'
d2 = lambda x, y: ''.join(f'<circle cx="{x+dx}" cy="{y+dy}" r="2" fill="#fff"/>' for dx, dy in ((-6, 0), (0, -6), (6, 2), (-2, 8), (5, 10)))
d3 = lambda x, y: f'<path d="M{x-13} {y+4} h26 M{x-12} {y+10} h24" stroke="#fff" stroke-width="2"/>'
add('easter', 'Easter moves every year, because its date follows the moon.',
  svg(330, 112, 'A drawing of a woven basket full of painted eggs in red, green, orange, blue, and pink',
    egg(130, 52, '#e5484d', d1, -14) + egg(160, 44, '#4cb86a', d2, 4) + egg(192, 50, '#f08c2e', d3, 16) + egg(146, 66, '#3d8fe0', d2, -6) + egg(178, 68, '#ec4899', d1, 10) +
    '<path d="M100 66 Q104 104 165 104 Q226 104 230 66Z" fill="#b8854a"/><g stroke="#8a5f2e" stroke-width="1.5" fill="none"><path d="M104 76 H226 M110 88 H220 M124 98 H206"/><path d="M124 66 V98 M144 66 V102 M165 66 V104 M186 66 V102 M206 66 V98"/></g><path d="M100 66 H230" stroke="#8a5f2e" stroke-width="5" stroke-linecap="round"/>'),
  'Eggs are an old sign of new life. People have painted them for Easter for many centuries.')

# ---- eid: the thin new crescent ----
r = R(35)
stars = ''.join(f'<circle cx="{r.uniform(10,320):.0f}" cy="{r.uniform(6,60):.0f}" r="{r.uniform(.5,1.3):.1f}" fill="#fff" opacity="{r.uniform(.4,.9):.2f}"/>' for _ in range(26))
add('eid', 'For many Muslims, the fasting month ends when this thin moon is seen.',
  svg(330, 118, 'A drawing of a very thin crescent moon low in a dusk sky above the outline of rooftops and a dome with a tower',
    '<defs><linearGradient id="dk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2450"/><stop offset=".7" stop-color="#6a4c8c"/><stop offset="1" stop-color="#f0a070"/></linearGradient></defs><rect width="330" height="118" rx="10" fill="url(#dk)"/>' + stars +
    '<path d="M214 44 A17 17 0 1 0 238 68 A21 21 0 0 1 214 44Z" fill="#fdf6dc"/>'
    '<path d="M0 118 V98 H40 V88 H70 V98 H96 Q96 76 118 76 Q140 76 140 98 H170 V60 l5 -10 l5 10 V98 H220 V90 H262 V98 H330 V118Z" fill="#15152a"/>'),
  'A drawing of the new crescent just after sunset. It is very thin and sets soon after the sun, so it is easy to miss.')

# ---- june solstice: Stonehenge ----
r = R(36)
def stone(x, w, h, seed): return f'<path d="{blob(x + w/2, 92 - h/2, w/2, h/2, 10, .07, seed)}" fill="#8f949a"/><path d="{blob(x + w*.3, 92 - h*.55, w*.18, h*.36, 7, .2, seed+50)}" fill="#a9afb6" opacity=".7"/>'
stones = ''.join(stone(x, w, h, 400 + i) for i, (x, w, h) in enumerate(((50, 15, 46), (78, 15, 48), (116, 16, 50), (146, 16, 50), (196, 16, 50), (226, 15, 48), (258, 14, 40))))
lint = '<path d="M48 44 H96 V52 H48Z M114 40 H164 V49 H114Z M194 40 H243 V49 H194Z" fill="#7d8288"/>'
add('junesolstice', 'Stonehenge was built to line up with sunrise on the longest day.',
  svg(330, 118, 'A drawing of Stonehenge: a ring of tall grey standing stones with flat stones laid across the tops, on green grass, with the sun rising between two of them',
    '<rect width="330" height="94" rx="10" fill="#fbe3b8"/><circle cx="180" cy="70" r="15" fill="#f6b53a"/><g stroke="#f6b53a" stroke-width="2" opacity=".6"><path d="M180 44 V30 M158 54 L146 44 M202 54 L214 44"/></g>'
    + stones + lint + '<path d="M0 90 H330 V118 H0Z" fill="#7fbf6a"/>' + person(292, 100, 15)),
  'A drawing of Stonehenge in England, with a person for size. On the longest day, people standing in the middle see the sun come up right beside a marker stone outside the ring.')

# ---- mid-autumn: mooncake ----
petal = ''.join(f'<path d="M110 60 m0 -24 q7 6 0 14 q-7 -8 0 -14Z" fill="none" stroke="#9a6a22" stroke-width="1.5" transform="rotate({i*45} 110 60)"/>' for i in range(8))
scal = ''.join(f'<circle cx="{110 + 43*math.cos(i/16*math.tau):.1f}" cy="{60 + 43*math.sin(i/16*math.tau):.1f}" r="8.500" fill="#d49a3a"/>' for i in range(16))
add('midautumn', 'A round cake for a round moon.',
  svg(330, 120, 'A drawing of a round golden-brown mooncake with a flower pattern pressed into the top, and a cut wedge showing a dark filling with a round yellow egg yolk in the middle',
    scal + '<circle cx="110" cy="60" r="43" fill="#d49a3a"/><circle cx="110" cy="60" r="34" fill="none" stroke="#9a6a22" stroke-width="1.5"/>' + petal + '<circle cx="110" cy="60" r="7" fill="none" stroke="#9a6a22" stroke-width="1.5"/>'
    '<path d="M214 96 L214 34 Q262 36 286 78Z" fill="#d49a3a"/><path d="M219 91 L219 42 Q256 44 277 78Z" fill="#6b4226"/><circle cx="236" cy="66" r="13" fill="#f2a52e"/><circle cx="232" cy="62" r="4" fill="#f8c869" opacity=".8"/>'
    + txt(292, 30, 'egg yolk,', 10.5, INK) + txt(292, 43, 'like the moon', 10.5, INK) + '<path d="M262 46 L244 58" stroke="#3b2f4a" stroke-width="1"/>'),
  'A drawing of a mooncake, about as wide as your palm. In this style, from southern China, the inside is a thick, sweet paste. Often a salted egg yolk sits in the middle and looks like a full moon.')

# ---- dia de los muertos: an ofrenda ----
r = R(38)
mari = lambda x, y, s=1: f'<circle cx="{x}" cy="{y}" r="{6*s}" fill="#f08c2e"/><circle cx="{x}" cy="{y}" r="{3.4*s}" fill="#f6b53a"/>'
flowers = ''.join(mari(x, y, r.uniform(.8, 1.2)) for x, y in [(r.uniform(84, 246), r.choice([52, 78, 104]) + r.uniform(-2, 2)) for _ in range(30)])
picado = ''.join(f'<path d="M{96 + i*24} 12 h20 v16 l-5 -4 l-5 4 l-5 -4 l-5 4Z" fill="{c}"/><circle cx="{106 + i*24}" cy="19" r="2.500" fill="#f6ead8"/>' for i, c in enumerate(['#ec4899', '#3d8fe0', '#f6c531', '#4cb86a', '#8e44ad', '#f08c2e']))
add('muertos', 'An altar to welcome the people you miss.',
  svg(330, 122, 'A drawing of a three-step altar covered in orange marigold flowers, with a framed photo at the top, candles, bread, fruit, and a string of bright cut-paper flags above',
    '<path d="M92 12 H240" stroke="#7a6452" stroke-width="1.5"/>' + picado +
    '<rect x="128" y="34" width="74" height="24" fill="#7a3fa0"/><rect x="104" y="58" width="122" height="26" fill="#d6332e"/><rect x="80" y="84" width="170" height="28" fill="#7a3fa0"/>'
    '<rect x="154" y="30" width="22" height="26" fill="#f6ead8" stroke="#b98a3e" stroke-width="2.5"/><circle cx="165" cy="40" r="4.500" fill="#8a6a52"/><path d="M158 54 q7 -10 14 0Z" fill="#8a6a52"/>'
    + flowers + ''.join(f'<rect x="{x-2}" y="{y-12}" width="4" height="12" fill="#fff"/>' + flame(x, y - 12, .5) for x, y in ((116, 58), (214, 58), (94, 84), (236, 84)))
    + '<ellipse cx="140" cy="76" rx="10" ry="6" fill="#d9a55a"/><path d="M133 74 h14 M140 70 v10" stroke="#f6ead8" stroke-width="2"/><circle cx="188" cy="76" r="5.500" fill="#f08c2e"/><circle cx="198" cy="78" r="5.500" fill="#e5484d"/>'),
  'A drawing of an ofrenda, with a photo of the person it is for. Around it go their favorite foods, candles, a sweet bread, and bright orange marigolds. The color and smell of the marigolds are said to guide them home.')

# ---- diwali: diyas ----
def diya(x, y, s=1): return f'<path d="M{x-16*s} {y} Q{x-14*s} {y+12*s} {x} {y+12*s} Q{x+14*s} {y+12*s} {x+20*s} {y-3*s} L{x+12*s} {y}Z" fill="#b5622f"/><ellipse cx="{x-1*s}" cy="{y}" rx="{14*s}" ry="{3.5*s}" fill="#e9c15a"/>' + flame(x + 15 * s, y - 2 * s, .8 * s) + f'<circle cx="{x+15*s}" cy="{y-8*s}" r="{15*s}" fill="#f6b53a" opacity=".16"/>'
add('diwali', 'Rows of small clay lamps, lit against the dark.',
  svg(330, 112, 'A drawing of seven small clay oil lamps, each a shallow dish with a pinched spout and a single flame, glowing on a dark floor',
    '<rect width="330" height="112" rx="10" fill="#1d1730"/>' + diya(60, 44, .8) + diya(130, 40, .8) + diya(200, 44, .8) + diya(270, 40, .8) + diya(96, 82, 1.1) + diya(170, 86, 1.1) + diya(244, 82, 1.1)),
  'A drawing of diyas. Each one is a little dish of baked clay. It is filled with oil or ghee, which is clear butter. A cotton wick rests in the spout. Families set them along doorsteps, windows, and rooftops.')

# ---- hanukkah: the menorah ----
arms = ''.join(f'<path d="M{165 - d} 36 V52 Q{165 - d} {58 + d*.42:.0f} 165 {58 + d*.42:.0f} Q{165 + d} {58 + d*.42:.0f} {165 + d} 52 V36" fill="none" stroke="#c9a23a" stroke-width="4"/>' for d in (26, 52, 78, 104))
cand = ''.join(f'<rect x="{x-3}" y="{y-16}" width="6" height="16" fill="#7ec8e3"/>' + flame(x, y - 16, .6) for x, y in [(165 + sd * d, 36) for d in (26, 52, 78, 104) for sd in (-1, 1)] + [(165, 26)])
add('hanukkah', '8 nights, 8 lights, and one more to light them.',
  svg(330, 122, 'A drawing of a gold menorah with nine candles: four on each side at the same height, and one in the middle standing a little higher',
    arms + '<path d="M165 26 V104" stroke="#c9a23a" stroke-width="5"/><path d="M135 110 Q165 96 195 110Z" fill="#c9a23a"/><rect x="128" y="108" width="74" height="6" rx="2" fill="#a8842a"/>' + cand
    ),
  'A drawing of a Hanukkah menorah. It holds 9 candles: one for each of the 8 nights, plus a helper candle. The helper is lit first and lights the rest. One more candle is added each night.')

# ---- december solstice: Newgrange ----
r = R(41)
quartz = ''.join(f'<circle cx="{r.uniform(50,280):.0f}" cy="{r.uniform(68,86):.0f}" r="{r.uniform(1.2,2.6):.1f}" fill="{r.choice(["#fff","#fff","#d9dde0","#3b3f44"])}"/>' for _ in range(150))
add('decsolstice', 'For a few mornings a year, sunrise shines all the way into this old stone tomb.',
  svg(330, 122, 'A drawing of Newgrange: a wide, low, grass-covered mound with a wall of white stones around the front, a dark doorway with a small window above it, and a beam of sunrise light going in',
    '<rect width="330" height="92" rx="10" fill="#f6d9b0"/><circle cx="30" cy="80" r="14" fill="#f6b53a"/>'
    '<path d="M36 90 Q60 34 165 30 Q270 34 294 90Z" fill="#6fae5a"/><path d="M44 90 Q46 66 60 62 H270 Q284 66 286 90Z" fill="#eef0f1"/>' + quartz +
    '<rect x="155" y="68" width="20" height="22" fill="#1d1a22"/><rect x="157" y="60" width="16" height="5" fill="#1d1a22"/><rect x="151" y="64" width="28" height="4" fill="#7d8288"/>'
    '<path d="M30 80 L165 62" stroke="#f6b53a" stroke-width="2.5"/><path d="M0 90 H330 V122 H0Z" fill="#7fbf6a"/>' + person(214, 96, 12)
    + txt(110, 112, 'light comes in through the small window', 10, INK)),
  'A drawing of Newgrange in Ireland, with a person for size. Around the shortest day, the rising sun shines through a small window above the door. The light runs down a 19-meter passage. It lights the floor of the end room for about 17 minutes.')

# ---- christmas: a decorated tree ----
r = R(42)
tiers = ''.join(f'<path d="M165 {14 + i*20} L{165 - 22 - i*13} {48 + i*20} H{165 + 22 + i*13}Z" fill="{c}"/>' for i, c in enumerate(['#2f8a49', '#2a7d42', '#25703b', '#20633a']))
baub = ''.join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="3.600" fill="{r.choice(["#e5484d","#f6c531","#fff","#3d8fe0"])}"/>' for x, y in [(165 + r.uniform(-1, 1) * (16 + (y - 30) * .62), y) for y in [r.uniform(34, 104) for _ in range(24)]])
add('christmas', 'A decorated tree, lights, carols, and gifts. No two countries do it the same.',
  svg(330, 124, 'A drawing of a green fir tree decorated with colored balls and a star on top, with wrapped presents underneath',
    '<rect x="159" y="104" width="12" height="12" fill="#7a5236"/>' + tiers + baub +
    '<path d="M165 4 l3 7 l7 0 l-6 5 l2 7 l-6 -4 l-6 4 l2 -7 l-6 -5 l7 0Z" fill="#f6c531"/>'
    '<rect x="104" y="100" width="26" height="18" fill="#e5484d"/><path d="M117 100 v18 M104 108 h26" stroke="#f6c531" stroke-width="2.5"/><rect x="198" y="96" width="22" height="22" fill="#3d8fe0"/><path d="M209 96 v22 M198 106 h22" stroke="#fff" stroke-width="2.5"/><rect x="224" y="104" width="20" height="14" fill="#f6c531"/><path d="M234 104 v14" stroke="#e5484d" stroke-width="2.5"/>'),
  'The decorated indoor tree started in German-speaking lands in the 1500s and spread around the world in the 1800s. Other customs change from place to place: who brings the gifts, what is eaten, and even which day is the main one.')
