#!/bin/sh
# Start a Town Hall vote. Usage: sh make-poll.sh "Question?" "Option A" "Option B" "Option C"
# Starting a new vote closes the old ones.
export PATH="$HOME/.local/node/bin:$PATH"
TITLE="$1"; Q=$(echo "$1" | sed "s/'/''/g"); shift
OPTS=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1:]).replace(\"'\",\"''\"))" "$@")
npx wrangler d1 execute sky-garden-saves --remote -y --command "UPDATE polls SET open = 0; INSERT INTO polls (question, options, created) VALUES ('$Q', '$OPTS', $(date +%s)000);" >/dev/null && echo "Town Hall vote started: $TITLE" || echo "Could not start the vote. Try again."
