#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT=${PORT:-8765}
URL="http://localhost:$PORT/"
echo "Glass Ark: $URL"
( sleep 1; (command -v open >/dev/null && open "$URL") || (command -v xdg-open >/dev/null && xdg-open "$URL") ) >/dev/null 2>&1 &
if command -v python3 >/dev/null; then exec python3 -m http.server "$PORT"
elif command -v npx >/dev/null; then exec npx --yes http-server -p "$PORT" -c-1
else echo "需要 Python 3 或 Node.js"; exit 1; fi
