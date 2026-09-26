#!/bin/sh
# Playtest report: feedback notes and where players have reached. Run from the cloud folder.
export PATH="$HOME/.local/node/bin:$PATH"
q() { npx wrangler d1 execute sky-garden-saves --remote --json --command "$1" 2>/dev/null | python3 -c "import sys,json; [print(r) for r in json.load(sys.stdin)[0]['results']]"; }
echo "== Feedback (newest first)"
q "SELECT datetime(at/1000,'unixepoch') AS sent, mood, place, day, note FROM feedback ORDER BY at DESC LIMIT 50"
echo "== Players by furthest chapter"
q "SELECT CASE WHEN json_extract(data,'\$.quest')<5 THEN 'Ch1 step '||json_extract(data,'\$.quest') WHEN json_extract(data,'\$.q2')<5 THEN 'Ch2 step '||json_extract(data,'\$.q2') WHEN json_extract(data,'\$.q3')<7 THEN 'Ch3 step '||json_extract(data,'\$.q3') WHEN json_extract(data,'\$.q4')<5 THEN 'Ch4 step '||json_extract(data,'\$.q4') WHEN json_extract(data,'\$.q5')<6 THEN 'Ch5 step '||json_extract(data,'\$.q5') ELSE 'Village' END AS reached, COUNT(*) AS players FROM saves GROUP BY reached ORDER BY reached"
echo "== Players who came back on a later day"
q "SELECT COUNT(*) AS total, SUM(updated - created > 86400000) AS returned_next_day FROM saves WHERE created IS NOT NULL"
