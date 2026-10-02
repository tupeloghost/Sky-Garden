from base import *
R = random.Random
# ---- bone (Ishango): tapered, rough, shallow uneven scratches ----
r = R(7)
top = lambda x: 36 - (x-20)/290*12 - 5*((x-165)/145)**2 + 5
bot = lambda x: 50 + (x-20)/290*12 - 3*((x-165)/145)**2 + 3
pt = [(x, top(x)+r.uniform(-.7,.7)) for x in range(22,313,10)] + [(x, bot(x)+r.uniform(-.7,.7)) for x in range(312,21,-10)]
path = 'M'+' L'.join(f'{x} {y:.1f}' for x,y in pt)+'Z'
x = 40; marks = ''; labels = ''
for n in (11,13,17,19):
    x0 = x
    for i in range(n):
        t = top(x); h = bot(x)-t; marks += f'<path d="M{x:.1f} {t+h*r.uniform(.12,.2):.1f} l{r.uniform(-1.2,1.2):.1f} {h*r.uniform(.34,.5):.1f}"/>'; x += r.uniform(3.1,4.3)
    labels += txt(round((x0+x)/2-2), 84, n, 13); x += r.uniform(9,13)
bl = ''.join(f'<ellipse cx="{r.uniform(40,300):.0f}" cy="{r.uniform(40,56):.0f}" rx="{r.uniform(8,22):.0f}" ry="{r.uniform(2,5):.0f}" fill="{r.choice(["#8f6f52","#c9ab88","#7d5f46"])}" opacity=".35"/>' for _ in range(12))
add('bone', 'Someone cut these marks about 20,000 years ago. Count them.',
  svg(330, 92, 'A drawing of a rough brown bone, narrow at one end with a tiny crystal, scratched with four groups of short notches',
    f'<clipPath id="ib"><path d="{path}"/></clipPath><path d="{path}" fill="#ad8b68"/><g clip-path="url(#ib)">{bl}<rect x="0" y="52" width="330" height="20" fill="#5e4532" opacity=".28"/></g>'
    '<path d="M23 40 L18 41 L17 43.500 L19 46 L23 47Z" fill="#eef3f5" stroke="#b9c6cc" stroke-width=".8"/>'
    f'<g stroke="#3f2c1f" stroke-width="1.1" stroke-linecap="round" fill="none" opacity=".85">{marks}</g>{labels}'),
  'A drawing of the real bone, which is about 10 centimeters long. 1 row of notches has groups of 11, 13, 17, and 19.')

# ---- tablet (Plimpton 322 style): clay slab, ruled columns, rows of wedge marks, chipped edges ----
r = R(3)
slab = 'M22 16 L296 10 L310 22 L306 62 L312 70 L304 108 L150 114 L26 110 L16 96 L18 30Z'
def wedge(x, y, s=1): return f'<path d="M{x:.1f} {y:.1f} l{3.2*s:.1f} {1.4*s:.1f} l-{3.2*s:.1f} {1.4*s:.1f}Z M{x+2.5*s:.1f} {y+1.4*s:.1f} h{5*s:.1f}"/>'
def vwedge(x, y): return f'<path d="M{x:.1f} {y:.1f} l1.5 3 l1.5 -3Z M{x+1.5:.1f} {y+2.5:.1f} v4.2"/>'
w = ''
cols = [(30, 104), (112, 176), (184, 248), (256, 298)]
for row in range(11):
    y = 24 + row * 7.6 + r.uniform(-.4, .4)
    for a, b in cols:
        x = a + r.uniform(0, 4)
        while x < b - 8:
            w += vwedge(x, y - 1) if r.random() < .55 else wedge(x, y + 1); x += r.uniform(6, 9.5)
            if r.random() < .22: x += 6
rules = ''.join(f'<path d="M{b+4} 14 L{b+3} 110" />' for a, b in cols[:-1]) + '<path d="M22 21 L306 16"/>'
add('tablet', 'Counting in 60s like this is why your hour has 60 minutes.',
  svg(330, 124, 'A drawing of a clay tablet with chipped edges, ruled into columns and covered in rows of small wedge-shaped marks',
    f'<clipPath id="tb"><path d="{slab}"/></clipPath><path d="{slab}" fill="#b9a58c"/><g clip-path="url(#tb)"><path d="M0 96 H330 V124 H0Z" fill="#8f7a62" opacity=".35"/><path d="M0 0 H330 V20 H0Z" fill="#d6c6ae" opacity=".5"/>'
    f'<g stroke="#7d6a55" stroke-width=".8" fill="none">{rules}</g><g stroke="#5c4a3a" stroke-width=".9" fill="#5c4a3a" stroke-linecap="round">{w}</g>'
    '<path d="M240 60 l26 -8 l10 10 l-14 8Z" fill="#8f7a62" opacity=".8"/></g>'),
  'A drawing of a Babylonian clay tablet, about the size of a hand. The columns of wedges are numbers, written in 60s.')

# ---- gears (Antikythera fragment A): corroded green-bronze lump, big wheel with four spokes ----
r = R(11)
lump = blob(150, 66, 88, 72, 22, .08, 5)
CXg, CYg, RG = 150, 72, 63
teeth = ''.join(f'<path d="M{CXg+(RG+2)*math.cos(a):.1f} {CYg+(RG+2)*math.sin(a):.1f} L{CXg+(RG+5.5)*math.cos(a+.012):.1f} {CYg+(RG+5.5)*math.sin(a+.012):.1f} L{CXg+(RG+2)*math.cos(a+.024):.1f} {CYg+(RG+2)*math.sin(a+.024):.1f}"/>' for a in [i/130*math.tau for i in range(10, 118)])
spk = ''.join(f'<path d="M{CXg+9*math.cos(a-.5):.1f} {CYg+9*math.sin(a-.5):.1f} L{CXg+(RG-2)*math.cos(a-.08):.1f} {CYg+(RG-2)*math.sin(a-.08):.1f} L{CXg+(RG-2)*math.cos(a+.08):.1f} {CYg+(RG-2)*math.sin(a+.08):.1f} L{CXg+9*math.cos(a+.5):.1f} {CYg+9*math.sin(a+.5):.1f}Z"/>' for a in (.35, .35+math.pi/2, .35+math.pi, .35+3*math.pi/2))
crust = ''.join(f'<path d="{blob(r.uniform(66,234), r.uniform(8,136), r.uniform(5,16), r.uniform(4,11), 9, .25, i)}" fill="{r.choice(["#2f4a40","#5f8a76","#243a33","#6e9a84","#8a7a52"])}" opacity="{r.uniform(.35,.7):.2f}"/>' for i in range(44))
add('gears', 'This lump of green metal is a machine. It is about 2,100 years old.',
  svg(330, 150, 'A drawing of a corroded green lump of bronze with a large gear wheel inside it, with four spokes and tiny teeth around its edge',
    f'<clipPath id="ak"><path d="{lump}"/></clipPath><path d="{lump}" fill="#3d5f52"/><g clip-path="url(#ak)">{crust}'
    f'<circle cx="{CXg}" cy="{CYg}" r="{RG}" fill="#1f332d" opacity=".55"/><g fill="#7fa893">{spk}</g><circle cx="{CXg}" cy="{CYg}" r="{RG}" fill="none" stroke="#7fa893" stroke-width="5"/><g stroke="#a9cdb9" stroke-width="1" fill="none">{teeth}</g>'
    f'<circle cx="{CXg}" cy="{CYg}" r="10" fill="#7fa893"/><rect x="{CXg-3.5}" y="{CYg-3.5}" width="7" height="7" fill="#1f332d"/>'
    '<circle cx="212" cy="30" r="13" fill="none" stroke="#7fa893" stroke-width="3"/><circle cx="212" cy="30" r="3" fill="#7fa893"/>'
    + ''.join(f'<path d="{blob(r.uniform(90,215), r.uniform(14,130), r.uniform(6,13), r.uniform(4,9), 8, .3, 90+i)}" fill="#2a4239" opacity=".7"/>' for i in range(10)) + '</g>'
    + '<path d="M266 140 h49" stroke="#9a7f66" stroke-width="2"/><path d="M266 136 v8 M315 136 v8" stroke="#9a7f66" stroke-width="2"/>' + txt(290, 132, '5 cm', 11)),
  'A drawing of the biggest piece that survived, about 18 centimeters wide. The large wheel once had about 223 teeth, each cut by hand.')

# ---- rosetta: dark slab, broken top corners, three bands of writing ----
r = R(5)
stone = 'M96 12 L150 6 L196 10 L214 44 L216 120 L84 120 L82 66 Z'
def lines(y0, y1, n, kind):
    out = ''
    for i in range(n):
        y = y0 + (y1 - y0) * i / max(1, n - 1); x = 90
        while x < 210:
            if kind == 'h': L = r.uniform(2.5, 4); out += f'<rect x="{x:.1f}" y="{y-1.6:.1f}" width="{L:.1f}" height="3.2" rx=".8"/>'; x += L + r.uniform(1.5, 3)
            elif kind == 'd': L = r.uniform(4, 10); out += f'<path d="M{x:.1f} {y:.1f} q{L/2:.1f} {r.uniform(-1.6,1.6):.1f} {L:.1f} 0" fill="none" stroke-width=".8"/>'; x += L + r.uniform(1, 2.5)
            else: L = r.uniform(1.2, 2); out += f'<rect x="{x:.1f}" y="{y-.9:.1f}" width="{L:.1f}" height="1.8"/>'; x += L + r.uniform(.9, 1.6)
    return out
add('rosetta', '1 message, written 3 ways.',
  svg(330, 128, 'A drawing of a dark grey stone slab with a broken top, carved with three bands of writing',
    f'<clipPath id="rs"><path d="{stone}"/></clipPath><path d="{stone}" fill="#4a4a50"/><g clip-path="url(#rs)"><path d="M150 0 L230 0 L230 128 L176 128Z" fill="#3a3a40" opacity=".5"/>'
    f'<g fill="#c9c6bd" stroke="#c9c6bd" opacity=".9">{lines(22, 40, 5, "h")}{lines(50, 76, 9, "d")}{lines(85, 116, 13, "g")}</g>'
    '<path d="M82 44.500 H218 M82 80.500 H218" stroke="#2a2a2e" stroke-width="1"/></g>'
    + txt(228, 34, 'Hieroglyphs', 12, '#9a7f66', 'start') + txt(228, 66, 'Demotic', 12, '#9a7f66', 'start') + txt(228, 104, 'Greek', 12, '#9a7f66', 'start') + '<path d="M66 8 V120 M61 8 h10 M61 120 h10" stroke="#9a7f66" stroke-width="1.6" fill="none"/>' + txt(34, 68, '112 cm', 12)),
  'A drawing of the Rosetta Stone, 112 centimeters tall. It has 14 lines of hieroglyphs, 32 lines of an everyday Egyptian writing called Demotic, and 54 lines of Greek.')

# ---- tools: an Oldowan chopper, and a stone axe head tied to a handle ----
r = R(2)
cob = 'M30 78 Q20 50 44 34 L62 30 L74 42 L88 34 L104 46 L112 40 Q128 58 118 84 Q96 104 60 100 Q38 96 30 78Z'
scars = '<path d="M44 34 L56 52 L62 30 M74 42 L78 60 L88 34 M104 46 L100 62 L112 40 M56 52 L78 60 L100 62" fill="none" stroke="#3f3040" stroke-width="1.2" stroke-linejoin="round"/>'
head = 'M214 30 L250 22 L262 40 L252 62 L216 58 L206 44Z'
lash = ''.join(f'<path d="M{228+i*4} 62 L{238+i*4} 40" />' for i in range(-2, 4)) + ''.join(f'<path d="M{238+i*4} 62 L{228+i*4} 40" />' for i in range(-1, 4))
add('tools', 'One of the first tools was a rock with 1 sharp edge.',
  svg(330, 118, 'Two drawings: a rounded stone with chips knocked off one edge, and a stone axe head tied to a wooden handle',
    f'<path d="{cob}" fill="#7a5f6a"/><path d="M30 78 Q38 96 60 100 Q96 104 118 84 Q100 92 62 90 Q40 88 30 78Z" fill="#4f3c47" opacity=".6"/><path d="M44 34 L62 30 L74 42 L88 34 L104 46 L112 40 L100 62 L78 60 L56 52Z" fill="#a08592"/>{scars}'
    + txt(84, 114, '2.6 million years old, or older', 11)
    + '<path d="M236 36 L246 36 L262 108 L250 110Z" fill="#9b6b4a"/><path d="M240 36 L246 36 L262 108 L257 109Z" fill="#7a5236" opacity=".6"/>'
    f'<path d="{head}" fill="#6f7377"/><path d="M214 30 L250 22 L238 38 L206 44Z" fill="#8d9296"/><path d="M206 44 L216 58 L222 46Z" fill="#555a5e"/>'
    f'<g stroke="#d9c49a" stroke-width="1.6" stroke-linecap="round">{lash}</g>' + txt(248, 12, 'stone tied to a handle', 11)),
  'Left: a chopper, a river stone with chips knocked off. Right: much later, people tied the stone to a wooden handle.')

# ---- temple (Gobekli Tepe pillar): T-shaped limestone pillar with arms, hands, belt, and a fox ----
r = R(9)
pil = 'M118 12 L214 8 L218 34 L190 38 L192 122 L140 122 L142 38 L114 36Z'
fox = '<path d="M150 62 q8 -8 18 -4 l6 -6 l2 8 q6 4 4 10 l-8 2 l-2 10 l-4 0 l0 -8 l-10 0 l-2 8 l-4 0 l0 -12 q-6 -6 -8 -14Z" fill="#c9bda6" stroke="#8c8068" stroke-width="1"/>'
arms = '<path d="M146 44 L146 86 L172 92 M186 44 L186 84" fill="none" stroke="#8c8068" stroke-width="2.2"/><path d="M160 96 h5 M160 99 h5 M160 102 h5 M170 96 h5 M170 99 h5 M170 102 h5" stroke="#8c8068" stroke-width="1.4"/><path d="M141 108 H192" stroke="#8c8068" stroke-width="3"/>'
speck = ''.join(f'<circle cx="{r.uniform(116,216):.0f}" cy="{r.uniform(10,120):.0f}" r="{r.uniform(.6,1.6):.1f}" fill="#9c8f76" opacity=".6"/>' for _ in range(70))
add('temple', 'People carved these giant stone pillars before anyone had a farm.',
  svg(330, 130, 'A drawing of a tall T-shaped stone pillar carved with arms, hands, a belt, and a fox, with a person beside it for size',
    f'<path d="M20 122 H310" stroke="#c9ab88" stroke-width="2"/><clipPath id="gt"><path d="{pil}"/></clipPath><path d="{pil}" fill="#d9cfb9"/><g clip-path="url(#gt)">{speck}<path d="M176 0 H230 V130 H182Z" fill="#b7ab92" opacity=".55"/></g>{arms}{fox}'
    + person(96, 122, 36) + txt(258, 60, '5.5 meters', 12) + '<path d="M228 10 V122 M223 10 h10 M223 122 h10" stroke="#9a7f66" stroke-width="1.6" fill="none"/>'),
  'A drawing of one of the 2 tallest pillars at Gobekli Tepe in Turkey, 5.5 meters tall. The T shape is a person: arms on the sides, hands in front, and a belt.')

# ---- pottery (Xianrendong): rough broken pieces ----
r = R(4)
def sherd(cx, cy, rx, ry, seed, col):
    p = blob(cx, cy, rx, ry, 7, .28, seed); rr = R(seed)
    grit = ''.join(f'<circle cx="{cx+rr.uniform(-rx,rx)*.7:.0f}" cy="{cy+rr.uniform(-ry,ry)*.7:.0f}" r="{rr.uniform(.7,2):.1f}" fill="{rr.choice(["#e6d9c2","#5a4638","#a58c70"])}" opacity=".8"/>' for _ in range(26))
    cord = ''.join(f'<path d="M{cx-rx} {cy-ry+i*5:.0f} q{rx} {rr.uniform(-3,3):.0f} {2*rx} 0" stroke="#5a4638" stroke-width=".9" fill="none" opacity=".5"/>' for i in range(2, int(2*ry/5)))
    return f'<clipPath id="sh{seed}"><path d="{p}"/></clipPath><path d="{p}" fill="{col}"/><g clip-path="url(#sh{seed})">{cord}{grit}<path d="M{cx-rx} {cy+ry*.4:.0f} h{2*rx} v{ry} h-{2*rx}Z" fill="#3f2f25" opacity=".3"/></g>'
add('pottery', 'The oldest pot ever found is about 20,000 years old. Only pieces are left.',
  svg(330, 112, 'A drawing of four rough, broken pieces of dark brown pottery',
    sherd(70, 54, 46, 34, 21, '#8a6a52') + sherd(160, 44, 34, 26, 22, '#75594a') + sherd(232, 62, 42, 30, 23, '#927258') + sherd(150, 88, 24, 14, 24, '#6b5142')
    ),
  'A drawing of pieces like the ones found in Xianrendong Cave in China. People made these pots before anyone farmed.')

# ---- loom (Jacquard cards): a chain of punched cards laced together ----
r = R(6)
cards = ''
for i in range(4):
    x = 22 + i * 74; y = 24 + (i % 2) * 5
    holes = ''.join(f'<circle cx="{x+9+c*6.3:.1f}" cy="{y+12+rw*9:.1f}" r="2.1"/>' for c in range(9) for rw in range(6) if r.random() < .5)
    cards += f'<rect x="{x}" y="{y}" width="66" height="68" rx="3" fill="#e8dcc0" stroke="#b9a57e" stroke-width="1.2"/><circle cx="{x+5}" cy="{y+34}" r="3" fill="#6b5a44"/><circle cx="{x+61}" cy="{y+34}" r="3" fill="#6b5a44"/><g fill="#6b5a44">{holes}</g>'
    if i < 3: cards += f'<path d="M{x+66} {y+12} L{x+74} {24+((i+1)%2)*5+12} M{x+66} {y+56} L{x+74} {24+((i+1)%2)*5+56}" stroke="#a3402c" stroke-width="1.8"/>'
add('loom', 'A hole means lift the thread. No hole means leave it down.',
  svg(330, 112, 'A drawing of four cream cards with rows of punched holes, tied together in a chain with red cord',
    cards + txt(165, 108, 'each card is one row of the cloth', 11)),
  'A drawing of the punched cards from a Jacquard loom, laced into a long chain. The loom reads 1 card, weaves 1 row, then moves to the next card.')

# ---- bronze: the recipe ----
dots = ''.join(f'<circle cx="{30+ (i%3)*22}" cy="{30 + (i//3)*22}" r="9" fill="#c46f3e"/><circle cx="{27+(i%3)*22}" cy="{27+(i//3)*22}" r="3" fill="#e69a6c" opacity=".8"/>' for i in range(9))
axe = 'M206 44 L294 33 Q304 53 294 73 L206 62 Q203 53 206 44Z'
add('bronze', '9 parts copper, 1 part tin. Harder than both.',
  svg(330, 112, 'A drawing: nine copper-colored pieces plus one silver-grey piece of tin make a golden-brown bronze axe head',
    dots + txt(52, 104, '9 copper', 12) + txt(104, 58, '+', 22, '#3b2f4a') + '<circle cx="134" cy="52" r="9" fill="#b9c0c6"/><circle cx="131" cy="49" r="3" fill="#e8edf0"/>' + txt(134, 104, '1 tin', 12)
    + txt(184, 60, '=', 24, '#3b2f4a') + f'<path d="{axe}" fill="#b98a3e"/><path d="M206 44 L294 33 Q290 40 288 44 L208 50Z" fill="#e0b565" opacity=".75"/><path d="M294 33 Q304 53 294 73 Q292 53 294 33Z" fill="#f3d9a0"/>' + txt(256, 104, 'bronze axe head', 12)),
  'Copper alone is soft enough to bend. Tin alone is softer still. Melted together, they make a metal hard enough for axes, saws, and swords.')
