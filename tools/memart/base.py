# Shared helpers for the Memory card drawings. Each drawing is an SVG string; ART[id] = dict(hook, art, cap).
import random, math, json
ART = {}
FONT = 'font-family="Baloo 2,sans-serif" font-weight="800"'
def svg(w, h, label, body): return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{label}">{body}</svg>'
def blob(cx, cy, rx, ry, n=14, j=.12, seed=1):
    r = random.Random(seed); pts = []
    for i in range(n):
        a = i / n * math.tau; k = 1 + r.uniform(-j, j); pts.append((cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k))
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
def txt(x, y, s, size=12, fill='#9a7f66', anchor='middle'): return f'<text x="{x}" y="{y}" {FONT} font-size="{size}" fill="{fill}" text-anchor="{anchor}">{s}</text>'
def person(x, y, h=30, fill='#3b2f4a'):  # a small standing figure for scale; feet at (x, y)
    r = h * .11
    return f'<g fill="{fill}"><circle cx="{x}" cy="{y - h + r:.1f}" r="{r:.1f}"/><path d="M{x - h*.11:.1f} {y - h*.76:.1f} h{h*.22:.1f} l{h*.04:.1f} {h*.4:.1f} l-{h*.05:.1f} {h*.36:.1f} h-{h*.07:.1f} l-{h*.03:.1f} -{h*.3:.1f} l-{h*.03:.1f} {h*.3:.1f} h-{h*.07:.1f} l-{h*.05:.1f} -{h*.36:.1f}Z"/></g>'
def add(id, hook, art, cap):
    for s in (hook, cap): assert '—' not in s
    ART[id] = dict(hook=hook, art=art, cap=cap)
def write(path):
    q = lambda t: json.dumps(t, ensure_ascii=False)
    out = "// Pictures and one-line hooks for the Memory cards. Each picture is drawn to match photos of the real thing.\n// Made by a script; the drawings are plain SVG so they need no downloads.\nconst MEM_ART = {\n"
    for k, v in ART.items(): out += f"  {k}: {{ hook:{q(v['hook'])},\n    art:{q(v['art'])},\n    cap:{q(v['cap'])} }},\n"
    out += "};\nexport { MEM_ART };\n"; open(path, 'w').write(out)
