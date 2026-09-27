#!/bin/sh
# Make Founding Gardener tester codes. Usage: sh make-codes.sh 10 "optional label"
# The codes are saved to tester-codes.txt (kept private, never pushed to GitHub).
export PATH="$HOME/.local/node/bin:$PATH"
N=${1:-10}; LABEL=${2:-}
CODES=$(python3 -c "
import secrets,string
a=string.ascii_uppercase.replace('O','').replace('I','')+'23456789'
for _ in range($N): print('SKY-'+''.join(secrets.choice(a) for _ in range(4))+'-'+''.join(secrets.choice(a) for _ in range(4)))")
SQL=""; NOW=$(date +%s)000
for c in $CODES; do SQL="$SQL INSERT INTO tester_codes (code, label, created) VALUES ('$c', '$(echo "$LABEL" | tr -d "'")', $NOW);"; done
npx wrangler d1 execute sky-garden-saves --remote -y --command "$SQL" >/dev/null && {
  for c in $CODES; do echo "$c  https://tupeloghost.github.io/Sky-Garden/?tester=$c  $LABEL" | tee -a tester-codes.txt; done
  echo "Saved to tester-codes.txt"; } || echo "Could not save the codes. Try again."
