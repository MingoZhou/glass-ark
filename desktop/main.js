/* 玻璃方舟 桌面版 / Glass Ark desktop shell (Electron).
   - Serves the game from app://ark/ so ES modules and saves (localStorage) work without a local server.
   - Two window shapes, never open together so they share one save:
       full   : the normal game window
       widget : 桌面模式, a small frameless window that can stay on top of the desktop
   - Window positions, pin, opacity and size are remembered in <userData>/desk.json. */
const { app, BrowserWindow, ipcMain, protocol, net, screen, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');

const GAME = fs.existsSync(path.join(__dirname, 'game', 'index.html')) ? path.join(__dirname, 'game') : path.join(__dirname, '..');
const ICON = path.join(__dirname, 'icon.png');
const SIZES = { s: [360, 270], m: [480, 360], l: [680, 510] };
const MODES = ['mixed', 'desert', 'meadow', 'marsh', 'jungle', 'ocean', 'create'];
let win = null, kind = null, tray = null, quitting = false;

/* ---------- settings ---------- */
const cfgPath = () => path.join(app.getPath('userData'), 'desk.json');
let cfg = { mode: 'mixed', full: null, widget: { pin: true, opacity: 1, size: 'm', bounds: null } };
function loadCfg() { try { const o = JSON.parse(fs.readFileSync(cfgPath(), 'utf8')); cfg = { ...cfg, ...o, widget: { ...cfg.widget, ...(o.widget || {}) } }; } catch (e) {} }
let saveT = null;
function saveCfg() { clearTimeout(saveT); saveT = setTimeout(() => { try { fs.writeFileSync(cfgPath(), JSON.stringify(cfg)); } catch (e) {} }, 300); }
const zh = () => /^zh/i.test(app.getLocale() || '');
const T = (a, b) => (zh() ? a : b);

/* keep a remembered window on a screen that still exists */
function onScreen(b) { if (!b) return false; return screen.getAllDisplays().some(d => { const w = d.workArea; return b.x + b.width > w.x + 40 && b.x < w.x + w.width - 40 && b.y >= w.y - 10 && b.y < w.y + w.height - 40; }); }

/* ---------- app:// protocol ---------- */
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
function serve() {
  protocol.handle('app', req => {
    const u = new URL(req.url); let rel = decodeURIComponent(u.pathname); if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(GAME, rel));
    if (!file.startsWith(GAME)) return new Response('forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
}
const pageURL = q => 'app://ark/index.html' + (q ? '?' + new URLSearchParams(q).toString() : '');

/* ---------- windows ---------- */
function common(w) {
  w.setMenuBarVisibility(false);
  w.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  w.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://ark/')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  w.on('closed', () => { if (win === w) { win = null; kind = null; } });
}
function swap(make) { const old = win; win = null; make(); if (old && !old.isDestroyed()) { old.removeAllListeners('close'); old.destroy(); } }

function openFull(resume) {
  swap(() => {
    const b = onScreen(cfg.full) ? cfg.full : null;
    const w = new BrowserWindow({ width: 1280, height: 800, ...(b || {}), minWidth: 900, minHeight: 600, backgroundColor: '#0b0f0c', icon: ICON, title: T('玻璃方舟', 'Glass Ark'), autoHideMenuBar: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    win = w; kind = 'full'; common(w);
    const keep = () => { if (!w.isDestroyed() && !w.isFullScreen() && !w.isMaximized() && !w.isMinimized()) { cfg.full = w.getBounds(); saveCfg(); } };
    w.on('resize', keep); w.on('move', keep);
    w.loadURL(pageURL(resume ? { resume } : null));
  });
}
function widgetBounds() {
  const [ww, hh] = SIZES[cfg.widget.size] || SIZES.m; const b = cfg.widget.bounds;
  if (onScreen(b)) return b;
  const a = screen.getPrimaryDisplay().workArea; return { width: ww, height: hh, x: a.x + a.width - ww - 24, y: a.y + a.height - hh - 24 };
}
function openWidget(mode) {
  if (MODES.includes(mode)) cfg.mode = mode;
  swap(() => {
    const w = new BrowserWindow({ ...widgetBounds(), minWidth: 240, minHeight: 180, frame: false, resizable: true, maximizable: false, fullscreenable: false, hasShadow: true, backgroundColor: '#0b0f0c', icon: ICON,
      title: T('玻璃方舟', 'Glass Ark'), alwaysOnTop: !!cfg.widget.pin, skipTaskbar: false,
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
    win = w; kind = 'widget'; common(w);
    if (cfg.widget.pin) w.setAlwaysOnTop(true, 'floating');
    try { w.setOpacity(cfg.widget.opacity || 1); } catch (e) {}
    const keep = () => { if (!w.isDestroyed()) { cfg.widget.bounds = w.getBounds(); saveCfg(); } };
    w.on('resize', keep); w.on('move', keep);
    w.loadURL(pageURL({ resume: cfg.mode, widget: '1' }));
  });
  saveCfg(); buildTray();
}

/* ---------- tray ---------- */
function buildTray() {
  try {
    if (!tray) { tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 18, height: 18 })); tray.setToolTip(T('玻璃方舟', 'Glass Ark')); tray.on('click', () => { if (win) { win.show(); win.focus(); } else openFull(cfg.mode); }); }
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: T('完整窗口', 'Full window'), type: 'radio', checked: kind !== 'widget', click: () => { if (kind !== 'full') leaveWidget(); else if (win) { win.show(); win.focus(); } } },
      { label: T('桌面摸鱼模式', 'Desktop mode'), type: 'radio', checked: kind === 'widget', click: () => { if (kind !== 'widget') askPageThen('widget'); } },
      { type: 'separator' },
      { label: T('退出', 'Quit'), click: () => quit() },
    ]));
  } catch (e) { /* no tray on this desktop: the in-game buttons still work */ }
}
/* the page saves before the window is replaced, so progress is never lost */
async function pageSave() { if (!win || win.isDestroyed()) return; try { await win.webContents.executeJavaScript('try{typeof saveNow==="function"&&saveNow()}catch(e){};1', true); } catch (e) {} }
async function askPageThen(what) { await pageSave(); if (what === 'widget') openWidget(cfg.mode); }
async function leaveWidget() { await pageSave(); openFull(cfg.mode); buildTray(); }
async function quit() { quitting = true; await pageSave(); app.quit(); }

/* ---------- IPC (see preload.js) ---------- */
ipcMain.on('desk:mode', (e, m) => { if (MODES.includes(m)) { cfg.mode = m; saveCfg(); } });
ipcMain.on('desk:enter', (e, m) => openWidget(m));
ipcMain.on('desk:exit', (e, m) => { if (MODES.includes(m)) cfg.mode = m; openFull(cfg.mode); buildTray(); });
ipcMain.on('desk:quit', () => { quitting = true; app.quit(); });
ipcMain.on('desk:fullscreen', () => { if (win && kind === 'full') win.setFullScreen(!win.isFullScreen()); });
ipcMain.handle('desk:get', () => ({ pin: !!cfg.widget.pin, opacity: cfg.widget.opacity || 1, size: cfg.widget.size || 'm' }));
ipcMain.handle('desk:set', (e, o) => {
  o = o || {}; const W = cfg.widget;
  if (typeof o.pin === 'boolean') { W.pin = o.pin; if (win && kind === 'widget') win.setAlwaysOnTop(W.pin, 'floating'); }
  if (typeof o.opacity === 'number') { W.opacity = Math.min(1, Math.max(0.4, o.opacity)); if (win && kind === 'widget') { try { win.setOpacity(W.opacity); } catch (e) {} } }
  if (SIZES[o.size]) { W.size = o.size; if (win && kind === 'widget') { const [w, h] = SIZES[o.size], b = win.getBounds();
      /* grow from the bottom-right corner so a widget parked in that corner stays put */
      const nb = { x: b.x + b.width - w, y: b.y + b.height - h, width: w, height: h }; win.setBounds(onScreen(nb) ? nb : { ...b, width: w, height: h }); } }
  saveCfg(); return { pin: !!W.pin, opacity: W.opacity, size: W.size };
});

/* ---------- life cycle ---------- */
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(() => { loadCfg(); serve(); buildTray(); if (process.argv.includes('--widget')) openWidget(cfg.mode); else openFull(null); });
  app.on('window-all-closed', () => { if (!win) app.quit(); });
  app.on('before-quit', () => { quitting = true; try { clearTimeout(saveT); fs.writeFileSync(cfgPath(), JSON.stringify(cfg)); } catch (e) {} });
}
