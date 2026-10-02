from base import *
R = random.Random
INK = '#3b2f4a'; SUB = '#9a7f66'

# ---- sundial (Eratosthenes) ----
rays = ''.join(f'<path d="M{x} 4 V{y}" stroke="#f2b84b" stroke-width="1.6" stroke-dasharray="4 3"/>' for x, y in ((92, 78), (150, 60), (238, 56), (270, 60)))
add('sundial', 'A stick, a shadow, and a long walk measured the whole Earth.',
  svg(330, 122, 'A diagram of the curved Earth with a well where sunlight goes straight down and a stick farther north that casts a shadow',
    '<path d="M10 118 Q165 20 320 118Z" fill="#8fc7a0"/><path d="M10 118 Q165 20 320 118" fill="none" stroke="#5f9a73" stroke-width="2"/>' + rays +
    '<rect x="232" y="56" width="12" height="20" fill="#3b2f4a"/><path d="M228 56 h20" stroke="#7a6452" stroke-width="3"/>'
    '<path d="M92 79 L78 49" stroke="#7a5236" stroke-width="4" stroke-linecap="round"/><path d="M92 79 L74 85" stroke="#3b2f4a" stroke-width="3" stroke-linecap="round" opacity=".7"/>'
    + txt(60, 110, 'Alexandria: a shadow', 11, INK) + txt(246, 110, 'Syene: no shadow', 11, INK) + txt(165, 14, 'sunlight', 11, '#c98a1f')),
  'At noon on the longest day, the sun shone straight down a well in Syene. In Alexandria, a stick still had a short shadow. The shadow showed the 2 cities were 1/50 of the way around the Earth apart. So he multiplied their distance by 50.')

# ---- bell (string lengths) ----
def string(y, frac, label, note):
    L = 250 * frac
    return (f'<path d="M30 {y} H{30+L:.0f}" stroke="#b98a3e" stroke-width="2.4"/><circle cx="30" cy="{y}" r="4" fill="#7a5236"/><circle cx="{30+L:.0f}" cy="{y}" r="4" fill="#7a5236"/>'
            f'<path d="M{30+L:.0f} {y} H280" stroke="#d9c7ad" stroke-width="1.2" stroke-dasharray="3 3"/>' + txt(292, y + 4, label, 13, INK, 'start') + txt(30, y - 8, note, 10.5, SUB, 'start'))
add('bell', 'Shorten a string to 1/2. You get the same note, but higher.',
  svg(330, 120, 'A diagram of four strings: a full one, one half as long, one two thirds as long, and one three quarters as long',
    string(22, 1, '1', 'the whole string') + string(52, .5, '1/2', 'the same note, higher') + string(82, 2/3, '2/3', 'sounds sweet with the whole string') + string(112, .75, '3/4', 'also sounds sweet')),
  'Musicians call the jump to the higher note an octave. Strings 2/3 and 3/4 as long sound sweet with the whole string too.')

# ---- still (solar still) ----
drops = ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#7ec8e3"/>' for x, y in ((120, 44), (140, 51), (158, 57), (182, 56), (200, 50), (220, 43)))
add('still', 'The sun can pull fresh water out of salt water.',
  svg(330, 124, 'A diagram of a pot of salty water with a small cup in the middle and a clear cover that sags over the cup, with drops running down it',
    '<circle cx="40" cy="26" r="13" fill="#f2b84b"/><g stroke="#f2b84b" stroke-width="2" stroke-linecap="round"><path d="M62 32 l16 6 M58 44 l12 12 M40 48 v12"/></g>'
    '<path d="M90 44 L104 104 Q170 116 236 104 L250 44" fill="none" stroke="#9b6b4a" stroke-width="6" stroke-linejoin="round"/>'
    '<path d="M100 84 L106 102 Q170 112 234 102 L240 84Z" fill="#5fa8c9"/>'
    '<path d="M150 74 L154 100 H186 L190 74Z" fill="#fff6e6" stroke="#b9a57e" stroke-width="1.5"/><path d="M155 90 H185 L186 99 H154Z" fill="#bfe6f5"/>'
    '<path d="M86 40 Q170 78 254 40" fill="none" stroke="#9fd3ff" stroke-width="3"/><circle cx="170" cy="56" r="5" fill="#8a7a66"/>' + drops +
    '<g stroke="#7ec8e3" stroke-width="1.4" stroke-dasharray="2 4" fill="none"><path d="M118 82 V56 M222 82 V54"/></g><circle cx="170" cy="70" r="2.4" fill="#7ec8e3"/>'
    + txt(292, 92, 'salt water', 11, INK) + txt(292, 60, 'clear cover', 11, INK) + txt(170, 122, 'cup of fresh water', 11, INK)),
  'The sun turns some of the water into a gas you cannot see, and the salt stays behind. The gas turns back into drops on the cover and drips into the cup.')

# ---- rope (3-4-5) ----
A = (60, 100); B = (220, 100); C = (60, -20)
A = (70, 104); B = (230, 104); C = (70, 104 - 120)
def knots(p, q, n): return ''.join(f'<circle cx="{p[0]+(q[0]-p[0])*i/n:.1f}" cy="{p[1]+(q[1]-p[1])*i/n:.1f}" r="3.4" fill="#7a5236"/>' for i in range(n))
s = .75; A = (84, 106); B = (84 + 160*s, 106); C = (84, 106 - 120*s)
add('rope', '12 knots make a perfect square corner.',
  svg(330, 122, 'A diagram of a knotted rope pulled into a triangle with sides of 3, 4, and 5 spaces, with a square corner',
    f'<path d="M{A[0]} {A[1]} L{B[0]} {B[1]} L{C[0]} {C[1]}Z" fill="#fff6e6" stroke="#c9a06a" stroke-width="3" stroke-linejoin="round"/>'
    f'<path d="M{A[0]} {A[1]-12} h12 v12" fill="none" stroke="#3b2f4a" stroke-width="1.6"/>' + knots(A, B, 4) + knots(B, C, 5) + knots(C, A, 3)
    + txt((A[0]+B[0])/2, 120, '4', 14, INK) + txt(A[0] - 14, (A[1]+C[1])/2 + 4, '3', 14, INK) + txt((B[0]+C[0])/2 + 14, (B[1]+C[1])/2 - 4, '5', 14, INK)
    + txt(262, 50, '3 x 3 = 9', 12, SUB) + txt(262, 66, '4 x 4 = 16', 12, SUB) + txt(262, 82, '9 + 16 = 25', 12, SUB) + txt(262, 98, '5 x 5 = 25', 12, INK)),
  'Tie a rope into a loop with 12 equal spaces. Pull it into sides of 3, 4, and 5. The corner between the 3 and the 4 is always exactly square.')

# ---- stars (star trails) ----
r = R(8); cx, cy = 165, 40; arcs = ''
for i in range(46):
    rad = 4 + i * 3.3 + r.uniform(-1, 1); a0 = r.uniform(0, math.tau); a1 = a0 + .75
    x0, y0, x1, y1 = cx + rad*math.cos(a0), cy + rad*math.sin(a0), cx + rad*math.cos(a1), cy + rad*math.sin(a1)
    arcs += f'<path d="M{x0:.1f} {y0:.1f} A{rad:.1f} {rad:.1f} 0 0 1 {x1:.1f} {y1:.1f}" stroke="{r.choice(["#fff","#cfe3ff","#ffe9c4"])}" stroke-width="{r.uniform(.6,1.4):.1f}" opacity="{r.uniform(.5,1):.2f}"/>'
add('stars', 'Leave a camera open all night, and the stars draw circles.',
  svg(330, 120, 'A drawing of a night sky photo where every star has left a curved streak, all circling one bright point above dark hills',
    f'<clipPath id="st"><rect width="330" height="120" rx="10"/></clipPath><g clip-path="url(#st)"><rect width="330" height="120" fill="#16203f"/><g fill="none" stroke-linecap="round">{arcs}</g>'
    f'<circle cx="{cx}" cy="{cy}" r="2.4" fill="#fff"/><path d="M0 120 V100 Q50 82 96 98 Q150 76 204 100 Q262 84 330 102 V120Z" fill="#0b1124"/></g>' + txt(cx + 34, cy - 6, 'Polaris', 11, '#ffe9c4')),
  'A drawing of a photo taken over several hours. Earth is turning, so every star smears into a curved line. Polaris hardly moves at all.')

# ---- lever ----
add('lever', 'Rest the beam close to the stone, and a small push lifts it.',
  svg(330, 120, 'A diagram of a long beam resting on a pivot close to a heavy stone, with a person pushing down on the far end',
    '<path d="M20 108 H310" stroke="#c9ab88" stroke-width="2"/><path d="M84 108 L96 86 L108 108Z" fill="#7a6452"/>'
    '<path d="M36 100 L300 62" stroke="#9b6b4a" stroke-width="7" stroke-linecap="round"/>'
    f'<path d="{blob(48, 80, 26, 20, 9, .14, 3)}" fill="#8a8f96"/><path d="{blob(42, 74, 10, 6, 7, .2, 4)}" fill="#a9afb6"/>'
    + person(292, 108, 44) + '<path d="M292 36 v20 m-5 -6 l5 6 l5 -6" stroke="#ff6b6b" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    '<path d="M48 124 m0 -8 H96 M96 116 H292" stroke="#9a7f66" stroke-width="1.4"/><path d="M48 112 v8 M96 112 v8 M292 112 v8" stroke="#9a7f66" stroke-width="1.4"/>'
    + txt(72, 113, '1', 11, INK) + txt(196, 113, '4', 11, INK) + txt(48, 54, '100 kg', 12, INK) + txt(260, 30, 'a push of 25 kg', 12, INK)),
  'The beam rests on one point, called the pivot. The push is 4 times farther from the pivot than the stone is. So it only needs to be 1/4 as strong.')

# ---- bread ----
r = R(12)
loaf = 'M84 104 V52 Q84 30 104 28 Q110 12 165 12 Q220 12 226 28 Q246 30 246 52 V104Z'
holes = ''.join(f'<path d="{blob(r.uniform(98,232), r.uniform(26,96), rr, rr*r.uniform(.6,.95), 8, .22, 40+i)}" fill="#d9bd8a"/>' for i, rr in enumerate([r.uniform(1.5, 7.5) for _ in range(70)]))
add('bread', 'Every hole is a bubble blown up by something alive.',
  svg(330, 116, 'A drawing of a slice of bread with a brown crust and a pale inside full of holes of different sizes',
    f'<clipPath id="br"><path d="{loaf}"/></clipPath><path d="{loaf}" fill="#f3e2bd" stroke="#a8713a" stroke-width="6" stroke-linejoin="round"/><g clip-path="url(#br)">{holes}</g>'
    f'<path d="{loaf}" fill="none" stroke="#a8713a" stroke-width="6" stroke-linejoin="round"/>'),
  'Yeast is alive and too small to see. It eats sugar in the dough and breathes out gas, and baking sets each bubble in place.')

# ---- moon phases ----
def moon(cx, f):  # f: 0 new .. .5 full .. 1 new; lit side on the right while growing (seen from north of the equator)
    Rr = 15; out = f'<circle cx="{cx}" cy="40" r="{Rr}" fill="#2c3154"/>'
    if f in (0, 1): return out
    grow = f < .5; k = math.cos(f * math.tau)  # 1 at new, -1 at full
    rx = abs(k) * Rr; sweep_outer = 1 if grow else 0
    inner_sweep = (0 if k > 0 else 1) if grow else (1 if k > 0 else 0)
    d = f'M{cx} {40-Rr} A{Rr} {Rr} 0 0 {sweep_outer} {cx} {40+Rr} A{rx:.1f} {Rr} 0 0 {inner_sweep} {cx} {40-Rr}Z'
    return out + f'<path d="{d}" fill="#f6efd6"/>'
names = ['new', 'crescent', 'half', 'nearly full', 'full', 'nearly full', 'half', 'crescent']
moons = ''.join(moon(24 + i * 40.3, i / 8) + txt(24 + i * 40.3, 72, names[i], 9.5, '#cfd6f2') for i in range(8))
add('moon', 'The moon is always a ball. What changes is how much of its sunny side we can see.',
  svg(330, 104, 'A row of eight moons going from dark, to a thin crescent, to half, to full, and back again',
    '<rect width="330" height="84" rx="10" fill="#16203f"/>' + moons + txt(165, 100, 'about 29.5 days from one new moon to the next', 11)),
  'The sun always lights 1/2 of the moon. As the moon goes around Earth, we see that lit half from a different side each night. This is how it looks from north of the equator. South of it, the picture is flipped.')

# ---- optics (camera obscura) ----
def tree(x, y, s, flip=1):
    return (f'<path d="M{x-2*s} {y} h{4*s} v{-16*s*flip} h{-4*s}Z" fill="#7a5236"/><circle cx="{x}" cy="{y-24*s*flip}" r="{12*s}" fill="#5fae6b"/><circle cx="{x-8*s}" cy="{y-17*s*flip}" r="{8*s}" fill="#4f9a5c"/><circle cx="{x+8*s}" cy="{y-18*s*flip}" r="{8*s}" fill="#6fbf7a"/>')
add('optics', 'Light travels in straight lines, so the picture lands upside down.',
  svg(330, 120, 'A diagram of a tree outside a dark room with one tiny hole in the wall. Lines of light cross at the hole and make an upside-down tree on the far wall',
    '<rect x="150" y="14" width="160" height="96" fill="#2c2438"/><rect x="150" y="14" width="160" height="96" fill="none" stroke="#7a6452" stroke-width="4"/><rect x="148" y="58" width="4" height="8" fill="#f6ead8"/>'
    + tree(54, 96, 1.6) + tree(274, 34, 1, -1) +
    '<g stroke="#f2b84b" stroke-width="1.4" fill="none"><path d="M54 36 L150 62 L274 94"/><path d="M54 96 L150 62 L274 34"/></g>'
    + txt(110, 116, 'one tiny hole', 11, INK) + txt(230, 104, 'dark room', 11, '#cfc4dd')),
  'Light from the top of the tree goes straight through the hole and lands low on the wall. Light from the bottom lands high.')

# ---- prism ----
cols = ['#e5484d', '#f08c2e', '#f6d32d', '#4cb86a', '#3d8fe0', '#5a55c9', '#8e44ad']
fan = ''.join(f'<path d="M186 54 L318 {34 + i*11} L318 {45 + i*11} L190 58Z" fill="{c}"/>' for i, c in enumerate(cols))
add('prism', 'White light is every color at once.',
  svg(330, 120, 'A diagram of a beam of white light entering a glass triangle and fanning out as a rainbow, red at the top and violet at the bottom',
    '<rect width="330" height="120" rx="10" fill="#1d1a2b"/><path d="M10 78 L150 52" stroke="#fff" stroke-width="5"/>' + fan +
    '<path d="M168 16 L212 96 H124Z" fill="#bfe6f5" opacity=".35" stroke="#dff3ff" stroke-width="2" stroke-linejoin="round"/><path d="M150 52 L188 56" stroke="#fff" stroke-width="3" opacity=".6"/>'
    + txt(268, 26, 'red bends least', 10.5, '#ffb3b3') + txt(264, 116, 'violet bends most', 10.5, '#d5b8ff') + txt(60, 100, 'sunlight', 11, '#fff')),
  'Glass bends each color by a different amount, so the colors fan out. Red bends the least. Violet bends the most.')

# ---- fibonacci (sunflower head) ----
seeds = ''
for n in range(1, 420):
    a = n * math.radians(137.508); rad = 3.05 * math.sqrt(n)
    seeds += f'<circle cx="{110 + rad*math.cos(a):.1f}" cy="{66 + rad*math.sin(a):.1f}" r="{1.3 + n/420*1.5:.1f}" fill="{"#5a3d1e" if n % 2 else "#7a5527"}"/>'
petals = ''.join(f'<path d="M110 66 m0 -62 q9 -16 0 -30 q-9 14 0 30Z" fill="{"#f6c531" if i % 2 else "#eeb420"}" transform="rotate({i*360/26:.1f} 110 66)" opacity=".95"/>' for i in range(26))
add('fibonacci', 'One simple rule makes every spiral in a sunflower.',
  svg(330, 132, 'A drawing of a sunflower head packed with seeds in crossing spirals, with a note showing each new seed turned 137.5 degrees from the last',
    f'<g transform="translate(0 0) scale(.92) translate(8 6)">{petals}<circle cx="110" cy="66" r="64" fill="#3f2a12"/>{seeds}</g>'
    '<g transform="translate(262 62)"><circle r="30" fill="none" stroke="#c9ab88" stroke-width="1.5"/><path d="M0 0 L30 0 M0 0 L-22.1 20.3" stroke="#3b2f4a" stroke-width="2"/><path d="M12 0 A12 12 0 1 1 -8.800 8.100" fill="none" stroke="#c98a1f" stroke-width="2"/><circle cx="30" cy="0" r="4" fill="#5a3d1e"/><circle cx="-22.1" cy="20.3" r="4" fill="#5a3d1e"/></g>'
    + txt(262, 112, 'each seed: 137.5 degrees', 10.5, INK) + txt(262, 124, 'around from the last', 10.5, INK)),
  'A sunflower grows one seed at a time. Each seed sits 137.5 degrees around from the last one. That is a bit more than 1/3 of a circle. Repeat that turn, and the spirals show up.')

# ---- migration (European robin) ----
add('migration', 'This small bird knows which way to fly, even with no sun or stars to see.',
  svg(330, 120, 'A drawing of a European robin on a twig: a round brown bird with an orange face and chest and a pale belly',
    '<path d="M60 100 Q170 92 290 104" stroke="#8a6a52" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M230 100 l24 -14" stroke="#8a6a52" stroke-width="3" stroke-linecap="round"/>'
    '<path d="M226 78 L276 92 L270 98 L222 88Z" fill="#6b5a48"/>'
    '<ellipse cx="170" cy="62" rx="50" ry="36" fill="#8a7458" transform="rotate(14 170 62)"/><path d="M150 84 Q180 104 214 84 Q200 70 168 70Z" fill="#e9e2d2"/>'
    '<path d="M196 58 Q232 66 236 84 Q206 80 186 70Z" fill="#6b5a48"/>'
    '<circle cx="136" cy="44" r="25" fill="#8a7458"/><path d="M112 44 Q114 28 132 26 Q150 28 156 46 Q164 66 150 84 Q128 86 120 64Z" fill="#e2702e"/><path d="M118 62 Q112 52 114 42" stroke="#a9b4bd" stroke-width="3" fill="none"/>'
    '<circle cx="134" cy="40" r="4.5" fill="#1d1a22"/><circle cx="135.300" cy="38.700" r="1.3" fill="#fff"/><path d="M112 44 L98 47 L112 51Z" fill="#3b3438"/>'
    '<path d="M166 96 v10 M178 97 v9" stroke="#7a5a46" stroke-width="2.2"/>'
    + txt(282, 30, 'European robin', 11, INK) + txt(282, 44, 'about 14 cm long', 10.5, SUB)),
  'A drawing of a European robin. In tests in closed rooms, robins still faced the way they fly each season. When scientists turned the magnetic pull, the birds turned too.')

# ---- roads (Roman road section) ----
r = R(14)
big = ''.join(f'<path d="{blob(64 + i*24 + r.uniform(-3,3), 96, 12, 8, 7, .2, 60+i)}" fill="#8a8f96"/>' for i in range(9))
grav = ''.join(f'<circle cx="{r.uniform(56,276):.0f}" cy="{r.uniform(66,82):.0f}" r="{r.uniform(1.6,3.6):.1f}" fill="{r.choice(["#b9a58c","#9c8f7c","#cfc0a6"])}"/>' for _ in range(110))
pave = ''.join(f'<path d="{blob(70 + i*27, 52 - 6*math.cos((i-3.5)/3.5*1.3) + 5, 13, 6.5, 6, .12, 80+i)}" fill="#6f747a" stroke="#4d5156" stroke-width="1"/>' for i in range(8))
add('roads', 'The part of a Roman road you walk on is only the top layer.',
  svg(330, 122, 'A cutaway drawing of one of the best Roman roads, built up higher than the land beside it: fitted paving stones on top, curved so water runs off, then gravel, then big stones at the bottom, with a ditch on each side',
    '<path d="M0 90 H16 L26 104 L38 90 H292 L304 104 L314 90 H330 V122 H0Z" fill="#b08a5e"/><path d="M38 90 L52 60 V112 H38Z M292 90 L278 60 V112 H292Z" fill="#9c7a50"/><rect x="52" y="86" width="226" height="26" fill="#a58a66"/>'
    '<rect x="52" y="62" width="226" height="24" fill="#d9cbb0"/>' + grav + big + pave
    + txt(308, 84, 'ditch', 10.5, INK) + txt(165, 30, 'paving stones, higher in the middle', 11, INK) + txt(165, 118, 'big stones at the bottom', 10.5, '#fff6e6') + txt(22, 56, 'gravel', 10.5, INK)
    + '<path d="M30 60 L58 74" stroke="#3b2f4a" stroke-width="1"/>'),
  'The Romans built their best roads up in layers. Rain runs off the curved top into the ditches.')

# ---- thatch ----
r = R(15)
straw = ''.join(f'<path d="M{x:.0f} 22 L{x + (x-150)*.42 + r.uniform(-3,3):.0f} 70" stroke="{r.choice(["#b8975a","#a3854d","#c9aa6c","#8f7340"])}" stroke-width="1.2"/>' for x in [r.uniform(70, 230) for _ in range(150)])
add('thatch', 'A roof made of dried reeds can last 40 years.',
  svg(330, 122, 'A drawing of a white cottage with a thick, rounded roof of reeds that hangs low over the walls and curves around a small window',
    '<rect x="62" y="64" width="176" height="46" fill="#f4efe4"/><rect x="62" y="104" width="176" height="6" fill="#cfc6b4"/>'
    '<rect x="132" y="78" width="22" height="32" fill="#5a3d2a"/><rect x="84" y="78" width="26" height="18" fill="#3b4a5a"/><rect x="186" y="78" width="26" height="18" fill="#3b4a5a"/><path d="M97 78 v18 M84 87 h26 M199 78 v18 M186 87 h26" stroke="#f4efe4" stroke-width="1.5"/>'
    '<clipPath id="th"><path d="M40 72 Q52 30 104 20 Q150 12 196 20 Q248 30 260 72 Q150 60 40 72Z"/></clipPath><path d="M40 72 Q52 30 104 20 Q150 12 196 20 Q248 30 260 72 Q150 60 40 72Z" fill="#a98a52"/>'
    f'<g clip-path="url(#th)">{straw}<path d="M40 72 Q150 60 260 72 V62 Q150 50 40 62Z" fill="#6b5630" opacity=".45"/></g><path d="M100 22 Q150 10 200 22 Q150 18 100 22Z" fill="#7a6234" stroke="#7a6234" stroke-width="5" stroke-linejoin="round"/>'
    '<rect x="206" y="6" width="14" height="18" fill="#b0705a"/><path d="M20 110 H300" stroke="#c9ab88" stroke-width="2"/>'
    + '<g transform="translate(286 56)"><path d="M-20 -22 L20 6 M-20 -14 L20 14 M-20 -6 L20 22" stroke="#b8975a" stroke-width="3" stroke-linecap="round"/><path d="M-8 -30 v10 M4 -30 v16" stroke="#3d8fe0" stroke-width="2" stroke-dasharray="3 3"/><path d="M-8 -18 L18 0" stroke="#3d8fe0" stroke-width="1.6"/></g>' + txt(286, 96, 'rain runs down', 10, INK) + txt(286, 108, 'the stems', 10, INK)),
  'The tight-packed stems lie on a steep slope, so rain runs down them to the edge. Only the top few centimeters get wet.')
