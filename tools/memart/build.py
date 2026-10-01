# Rebuilds data/memart.js (the Memory card drawings). Run: python3 tools/memart/build.py
import sys, glob, importlib, os
sys.path.insert(0, os.path.dirname(__file__))
import base
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'b*.py'))):
    n = os.path.basename(f)[:-3]
    if n not in ('base', 'build'): importlib.import_module(n)
base.write(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'memart.js')); print(len(base.ART), 'cards')
