#!/usr/bin/env bash
# 把 src/ 下的分段源码拼成一个 index.html（three.js 从本仓库 vendor/ 加载，不依赖 CDN）
set -euo pipefail
cd "$(dirname "$0")"
FILES="js1.js js2.js js3.js js4.js js4o.js js5.js js5o.js js6.js js7.js js7d.js js8.js"
CDN='https://cdn.jsdelivr.net/npm/three@0.165.0/'
{
  printf '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  sed "s#${CDN}#./vendor/three/#g" src/head.html
  echo '<script type="module">'
  for f in $FILES; do cat "src/$f"; done
  echo '</script>'
  printf '</html>\n'
} > index.html
if command -v node >/dev/null 2>&1; then
  tmp="$(mktemp).mjs"; for f in $FILES; do cat "src/$f"; done > "$tmp"; node --check "$tmp" && echo "syntax ok"; rm -f "$tmp"
fi
echo "built index.html ($(wc -c < index.html) bytes)"
