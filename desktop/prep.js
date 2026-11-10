/* Copies the built game (index.html, vendor/, assets/) into desktop/game so the packaged app is self-contained and works offline.
   The web page loads its title font from Google Fonts; the desktop copy drops those links. To bundle the font instead, put
   ZCOOLXiaoWei-Regular.ttf (SIL Open Font License) into desktop/fonts/ and it is wired in automatically. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'game');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'vendor', 'assets']) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replace(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
const fdir = path.join(__dirname, 'fonts');
if (fs.existsSync(fdir)) { const ttf = fs.readdirSync(fdir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
  if (ttf.length) { fs.cpSync(fdir, path.join(out, 'fonts'), { recursive: true });
    const face = ttf.map(f => `@font-face{font-family:"${/mono/i.test(f) ? 'JetBrains Mono' : 'ZCOOL XiaoWei'}";src:url("fonts/${f}");font-display:swap}`).join('');
    html = html.replace('<style>', '<style>' + face); console.log('bundled fonts:', ttf.join(', ')); } }
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('game copied to', out);
