# 玻璃方舟 桌面版 / Glass Ark desktop

用 Electron 把网页版包成桌面程序，并加入**桌面摸鱼模式**：把生态缸缩成一个无边框的小窗口，留在桌面一角。

## 运行和打包

需要 Node.js 20 以上。在 `desktop/` 目录里：

```bash
npm install        # 第一次运行，下载 Electron
npm start          # 直接运行（读取上一级目录里的 index.html）
npm run dist       # 打包 Windows 版，结果在 desktop/dist/
```

也可以不在本机打包：把代码推到 GitHub 后，在仓库的 **Actions → Build desktop (Windows) → Run workflow** 里点一下，几分钟后在该次运行的页面底部下载 `GlassArk-win`。推送 `v` 开头的标签也会自动打包。

## 桌面摸鱼模式

- 在缸里点右上角的“桌面模式”按钮（显示器图标），窗口会变成右下角的一个小窗口，所有面板隐藏，镜头由导演模式自动带着走，帧率限制在 30 帧。
- 鼠标移到小窗口上，顶部会出现一条栏：按住它可以拖动窗口；按钮依次是 **置顶、大小（小 / 中 / 大）、透明度（100% / 85% / 70%）、回到完整窗口、保存并退出**。窗口边缘可以直接拉伸。
- 完整窗口和小窗口不会同时存在，共用同一份存档；切换前会自动保存。
- 系统托盘图标的右键菜单也能在两种窗口之间切换或退出。
- 窗口的位置、大小、置顶和透明度会记住（保存在用户数据目录的 `desk.json`）。
- 启动时加 `--widget` 参数会直接进入桌面模式，打开上次的那只缸。
- F11 切换全屏。

## 文件

| 文件 | 作用 |
|---|---|
| `main.js` | 主进程：窗口、托盘、`app://` 协议（让存档和 ES 模块不需要本地服务器） |
| `preload.js` | 页面和主进程之间唯一的桥：`window.arkDesktop` |
| `prep.js` | 打包前把 `index.html`、`vendor/`、`assets/` 复制到 `desktop/game/`，并去掉 Google 字体链接（桌面版要能离线运行） |
| `icon.png` / `icon.ico` | 程序图标 |
| `../src/js12.js` | 游戏这一侧的桌面模式代码；浏览器里没有 `window.arkDesktop`，所以网页版不受影响 |

标题字体“站酷小薇”在网页版里从 Google Fonts 加载。桌面版离线时会退回系统自带的宋体。想把字体一起打包，把 `ZCOOLXiaoWei-Regular.ttf`（SIL 开源字体协议）放进 `desktop/fonts/`，`prep.js` 会自动接上。

## 还没做

- Steamworks SDK（成就、云存档、Steam 叠加层），需要先有 App ID。
- macOS / Linux 版只写了打包配置，没有测过。
