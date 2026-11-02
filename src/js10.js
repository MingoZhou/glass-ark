
/* =================== 缸中见闻录 · rare mutations ===================
   The journal records moments the player actually saw: the subject had to be on screen (or followed)
   when it happened. Tank-wide milestones count automatically. A photo taken while the moment is still on
   screen upgrades an entry to a gold star. The journal is shared by every tank on this device.
   Everything here is var/function so other files may call jot()/born() before this file has run. */

var JR_READY = false, J = null, JR_RECENT = {}, JR_LAST_CROAK = null, JR_T = 0, JR_DAY = -1, JR_HEAT = false;
var JR, JR_BY, MUT, JR_TIER;
/* data is built lazily: the home page opens the journal before this file's top level has run */
function jrInit() {
  if (JR) return;
  JR_TIER = [null, { n: '常见', c: '#8fb39a', r: 5 }, { n: '少见', c: '#7fb3e0', r: 12 }, { n: '罕见', c: '#c39ae8', r: 25 }, { n: '传说', c: '#f0b25a', r: 60 }];
/* k, tier, where (land|ocean|any), name, hint shown before discovery, note shown after, auto = no subject needed */
JR = [
  ['ant_carry', 1, 'land', '搬叶回巢', '切叶蚁总是很忙。跟着一只扛着东西的蚂蚁走。', '切叶蚁把叶片和草籽搬回土丘，巢里的储粮够了就会孵出新蚂蚁。'],
  ['ant_hatch', 1, 'land', '新蚂蚁出巢', '蚁巢储粮充足时，盯着土丘看一会儿。', '储粮攒够时，蚁巢会孵出一只新工蚁。'],
  ['firefly_glow', 1, 'land', '第一盏萤火', '天黑以后，潮湿的地方会亮起来。', '萤火虫只在夜里飞，尾部一明一暗，每只的节奏都不一样。'],
  ['chirp', 1, 'land', '蟋蟀夜鸣', '夜里草丛中传来声音，找到正在振翅的那一只。', '蟋蟀靠摩擦前翅发声，停下来振翅的时候最好找。'],
  ['frog_call', 1, 'land', '水边蛙鸣', '夜里去水边，下雨时更热闹。', '雨蛙鼓起声囊鸣叫，雨夜里叫得最勤。'],
  ['shower', 1, 'land', '午后阵雨', '缸里的天气也会变。', '午后有时会下一场阵雨，各区域一起变湿。', 1],
  ['mushroom', 1, 'land', '腐殖质里的蘑菇', '潮湿处的落叶、沉木和尸体下面会长出东西。', '蘑菇从腐烂的有机物里长出来，是分解者工作的痕迹。'],
  ['web_built', 1, 'land', '织网', '园蛛会在植物之间工作。', '园蛛从中心向外一圈圈织网，织好后就守在网中央。'],
  ['lizard_bask', 1, 'land', '清晨晒背', '沙漠的早晨很冷，沙蜥需要一块热的石头。', '沙蜥是冷血动物，清晨要趴在加热岩上晒热身体才能捕猎。'],
  ['bf_sip', 1, 'land', '花间采蜜', '蝴蝶会停在开花的植物上。', '蝴蝶落在花上吸食花蜜，顺便替植物传粉。'],
  ['clown_home', 1, 'ocean', '海葵里的家', '小丑鱼从不远离它的海葵。', '小丑鱼身上有黏液保护，海葵的触手蜇不到它们。'],
  ['jelly_glow', 1, 'ocean', '夜里的水母', '天黑以后看看水中央。', '海月水母在夜里发出幽蓝的光，随水流慢慢漂。'],
  ['school', 1, 'ocean', '成群游过', '让一大群雀鲷同时出现在画面里。', '蓝魔雀鲷成群游动，同一群鱼会朝同一个方向转弯。'],
  ['cat_hatch', 2, 'land', '毛毛虫出生', '蝴蝶把卵产在寄主植物上，过些时候再回来看看。', '蝴蝶卵孵出毛毛虫，它们一出生就开始啃寄主植物的叶子。'],
  ['pupate', 2, 'land', '化蛹', '吃饱的毛毛虫会停下来，安静一段时间。', '毛毛虫吃够了就挂在植物上化蛹，外表静止，里面正在重组身体。'],
  ['emerge', 2, 'land', '破蛹羽化', '盯住一个蛹，它总有一天会打开。', '成虫从蛹里爬出来，先晾干翅膀，再第一次起飞。'],
  ['bf_lay', 2, 'land', '产卵', '雌蝶会挑选特定的植物。', '蝴蝶只把卵产在幼虫能吃的寄主植物上。'],
  ['frog_catch', 2, 'land', '弹舌捕虫', '雨蛙安静地蹲着，然后……', '雨蛙的舌头又长又黏，一瞬间就能把虫子卷进嘴里。'],
  ['mantis_catch', 2, 'land', '螳螂伏击', '螳螂常常一动不动地伏在花枝上。', '螳螂伪装成植物等猎物靠近，前足一合就抓住了。'],
  ['lizard_catch', 2, 'land', '沙蜥捕食', '晒暖之后的沙蜥会开始巡视。', '沙蜥追上蟋蟀和蚂蚁，一口咬住。'],
  ['web_stuck', 2, 'land', '撞上蛛网', '飞行的小虫不一定看得见丝线。', '蛛网上的丝很黏，飞虫一碰就被粘住，蛛网的主人会马上赶来。'],
  ['web_wrap', 2, 'land', '裹成茧', '园蛛抓到猎物后会做一件事。', '园蛛用丝把猎物一圈圈裹起来，留着慢慢吃。'],
  ['web_escape', 2, 'land', '挣脱蛛网', '不是每只被粘住的虫子都会被吃掉。', '力气够大、运气够好的猎物，有时能在园蛛赶到之前挣脱。'],
  ['frog_spawn', 2, 'land', '水塘产卵', '夜里，成年雨蛙会去水塘。', '雨蛙把卵块产在水里，一团卵里有好几颗。'],
  ['tadpole_hatch', 2, 'land', '蝌蚪出世', '水里的卵块过一段时间会有变化。', '卵块孵化，一群蝌蚪游进水塘，开始啃藻类。'],
  ['metamorph', 2, 'land', '长腿上岸', '蝌蚪不会永远是蝌蚪。', '蝌蚪长出四肢、尾巴缩短，爬上岸变成小雨蛙。'],
  ['miss', 2, 'any', '扑空', '捕食者也会失手。', '不是每次出击都能成功，猎物有时会在最后一刻逃走。'],
  ['grouper_catch', 2, 'ocean', '石斑鱼出击', '石斑鱼喜欢在礁石边上等待。', '石斑鱼张大嘴猛地一吸，小鱼就被吸了进去。'],
  ['crab_threat', 2, 'ocean', '举钳示威', '螃蟹遇到危险时不会马上逃跑。', '螃蟹高举双钳，摆出最大的架势吓退对手。'],
  ['clown_hide', 2, 'ocean', '躲进海葵', '捕食者靠近的时候看看小丑鱼。', '遇到危险时，小丑鱼会钻进海葵的触手深处。'],
  ['plankton', 2, 'ocean', '浮游生物爆发', '海缸里的营养有时会突然变多。', '浮游生物爆发，滤食的鱼和水母迎来一场盛宴。', 1],
  ['visit', 2, 'any', '参观日', '缸养得够漂亮，会有人来看。', '参观日这天，观赏值越高，门票收入越多。', 1],
  ['snake_hunt', 3, 'land', '顶级捕食者', '食物链最顶端的那条蛇需要你先把它的猎物养起来。', '玉米蛇缠住猎物，再整只吞下去，之后要很久才会再饿。'],
  ['moray_hunt', 3, 'ocean', '海鳗出洞捕食', '海鳗白天只露出一个头。', '海鳗在夜里离开岩缝，悄无声息地游到猎物身边。'],
  ['moray_out', 3, 'ocean', '夜巡的海鳗', '天黑以后，礁石缝里的东西会出来。', '海鳗白天守在洞口，入夜后整条游出来巡视礁石。'],
  ['hunter_hunted', 3, 'any', '螳螂捕蝉', '捕食者也可能成为别人的猎物。', '一只捕猎过的动物，自己也成了更大捕食者的食物。'],
  ['coral_save', 3, 'ocean', '救回珊瑚', '水太热时珊瑚会变白。白了之后，还来得及吗？', '水温降下来之后，共生藻回到珊瑚里，颜色慢慢恢复。', 1],
  ['algae_fix', 3, 'ocean', '水清了', '藻类爆发会把珊瑚盖住。', '营养盐降下来，啃藻的海胆和海星把礁石重新清理干净。', 1],
  ['mold_fix', 3, 'land', '霉斑消退', '太潮湿会长霉。试试打开顶盖通风。', '你打开顶盖通风，霉斑慢慢消失了。', 1],
  ['heat_survive', 3, 'any', '平安度过热浪', '热浪来的时候，别让任何一只动物死去。', '整场热浪里没有一只动物死亡。', 1],
  ['old_age', 3, 'any', '寿终正寝', '让一只在你缸里出生的捕食者安稳地活完一生。', '它在你的缸里出生，没有被吃掉，也没有饿死，一直活到了生命的尽头。', 1],
  ['frog_cycle', 3, 'land', '生生不息 · 雨蛙', '一只在你的缸里出生的雨蛙，长大后会做什么？', '这只雨蛙从卵块里出生、变态上岸，长大后又在水塘里产下了自己的卵。'],
  ['bf_cycle', 3, 'land', '生生不息 · 蝴蝶', '一只在你的缸里出生的蝴蝶，长大后会做什么？', '这只蝴蝶在你的缸里从卵长大，又把自己的卵产在了寄主植物上。'],
  ['coral_reef', 3, 'ocean', '珊瑚花园', '让礁石上的健康珊瑚比开缸时多一半。', '健康的珊瑚比开缸时多了一半，礁石上长满了珊瑚。', 1],
  ['night_chorus', 3, 'land', '雨夜合唱', '下雨的夜里，水边会同时有光和声音。', '雨夜里萤火虫在水边闪烁，雨蛙在同一时刻鸣叫。'],
  ['mutant_found', 3, 'any', '找到变异个体', '极少数新生命生来就与众不同。', '你在缸里找到了一只稀有变异个体。它的颜色是天生的，商店里买不到。'],
  ['chain7', 4, 'any', '完整的食物链', '让食物链的每一级都有动物活着，并且坚持一周。', '从食草者到顶级捕食者，每一级都有动物活着，整整 7 天。', 1],
  ['three_gen', 4, 'any', '三代同堂', '捕食者也能祖孙三代同时活着吗？', '一只捕食者出生时，它的父母和祖父母都还在你的缸里活着。', 1],
  ['day100', 4, 'any', '第 100 天', '让一只缸一直运转下去。', '这只缸已经运转了 100 天。', 1],
  ['balance30', 4, 'any', '月度平衡', '生态平衡，连续很多天。', '连续 30 天生态平衡。', 1],
  ['mutant_born', 4, 'any', '目睹变异诞生', '亲眼看到一只稀有变异个体出生。', '你正好看着它来到这个世界。'],
  ['mutant_line', 4, 'any', '变异的传承', '稀有变异会遗传吗？', '一只稀有变异个体的后代，也生来带着同样的变异。', 1],
  ['mutant3', 4, 'any', '变异图谱', '找到三种不同的稀有变异。', '你已经在缸里找到了三种不同的稀有变异。', 1],
  ['apex_old', 4, 'any', '王者寿终', '让一只顶级捕食者活完一生。', '一只顶级捕食者在你的缸里活到了寿终。', 1],
].map(r => ({ k: r[0], t: r[1], w: r[2], n: r[3], h: r[4], d: r[5], auto: !!r[6] }));
JR_BY = {}; JR.forEach(e => JR_BY[e.k] = e);

/* rare mutations: tint (rgb) and how strongly the original colours are replaced */
MUT = {
  frog: { n: '白化雨蛙', c: [1, 0.92, 0.9], a: 0.88 }, lizard: { n: '蓝色沙蜥', c: [0.32, 0.58, 1], a: 0.8 }, butterfly: { n: '黑翅蝴蝶', c: [0.13, 0.12, 0.16], a: 0.85 },
  snail: { n: '粉壳蜗牛', c: [1, 0.55, 0.78], a: 0.65 }, cricket: { n: '白化蟋蟀', c: [1, 0.95, 0.86], a: 0.85 }, firefly: { n: '蓝光萤火虫', c: [0.4, 0.62, 1], a: 0.35, glow: 0x6ab8ff },
  mantis: { n: '兰花螳螂', c: [1, 0.74, 0.9], a: 0.8 }, spider: { n: '金色园蛛', c: [1, 0.78, 0.25], a: 0.75 }, snake: { n: '白化玉米蛇', c: [1, 0.93, 0.88], a: 0.85 },
  isopod: { n: '橙色鼠妇', c: [1, 0.55, 0.2], a: 0.75 }, clown: { n: '黑化小丑鱼', c: [0.17, 0.16, 0.2], a: 0.8 }, damsel: { n: '金色雀鲷', c: [1, 0.8, 0.22], a: 0.85 },
  starfish: { n: '金色海星', c: [1, 0.8, 0.25], a: 0.8 }, crab: { n: '蓝色螃蟹', c: [0.3, 0.55, 1], a: 0.75 }, shrimp: { n: '雪白清洁虾', c: [1, 1, 1], a: 0.7 },
  grouper: { n: '金色石斑鱼', c: [1, 0.78, 0.3], a: 0.75 }, jelly: { n: '粉色水母', c: [1, 0.62, 0.85], a: 0.7 }, moray: { n: '金色海鳗', c: [1, 0.85, 0.3], a: 0.8 },
  };
  const SN = { frog: '雨蛙', lizard: '沙蜥', butterfly: '蝴蝶', snail: '蜗牛', cricket: '蟋蟀', firefly: '萤火虫', mantis: '螳螂', spider: '园蛛', snake: '玉米蛇', isopod: '鼠妇', clown: '小丑鱼', damsel: '蓝魔雀鲷', starfish: '海星', crab: '螃蟹', shrimp: '清洁虾', grouper: '石斑鱼', jelly: '海月水母', moray: '海鳗' };
  for (const k in MUT) MUT[k].sn = SN[k];
}
var JR_PHOTO_BONUS = 5, MUT_P = 0.005, MUT_INHERIT = 0.35;

/* ---------- storage ---------- */
function jLoad() { try { const o = JSON.parse(localStorage.getItem('ark-journal') || 'null'); if (o && o.v === 1) return Object.assign({ e: {}, mut: {}, fresh: 0 }, o); } catch (e) {} return { v: 1, e: {}, mut: {}, fresh: 0 }; }
function jSave() { try { localStorage.setItem('ark-journal', JSON.stringify(J)); } catch (e) {} }
function jPhoto(k) { try { return localStorage.getItem('ark-jp-' + k); } catch (e) { return null; } }

/* ---------- witnessing ---------- */
var _jv = null;
function jSeen(s) {
  if (!s) return true; if (typeof cam !== 'undefined' && cam.follow === s) return true;
  if (!_jv) _jv = new THREE.Vector3();
  const y = (s.y != null ? s.y : heightAt(s.x, s.z)) + 0.05; _jv.set(s.x, y, s.z);
  const d = camera.position.distanceTo(_jv); if (d > 26) return false;
  _jv.project(camera); return _jv.z < 1 && Math.abs(_jv.x) < 0.94 && Math.abs(_jv.y) < 0.94;
}
function jDist(s) { if (!s) return 99; if (!_jv) _jv = new THREE.Vector3(); _jv.set(s.x, (s.y != null ? s.y : heightAt(s.x, s.z)), s.z); return camera.position.distanceTo(_jv); }
/* jot(key, subject): record a moment. subject null = tank-wide milestone. */
function jot(k, s) {
  if (!JR_READY || !J) return; jrInit(); const E = JR_BY[k]; if (!E) return;
  if (!E.auto && !jSeen(s)) return;
  if (s) JR_RECENT[k] = { t: performance.now(), s };
  if (J.e[k]) return;
  J.e[k] = { day: env.day, mk: MK, ts: Date.now(), star: 1 }; J.fresh = (J.fresh || 0) + 1; jSave();
  const T = JR_TIER[E.t]; env.coins += T.r;
  toast(`<span class="jr-toast" style="--tc:${T.c}">《缸中见闻录》${E.t >= 3 ? '稀有' : ''}新记录 · ${T.n}</span><b>${E.n}</b>　+${T.r} 孢子${E.auto ? '' : '<br><small>趁它还在画面里，按右上角相机拍下来，可以升级为金星</small>'}`);
  if (typeof logEvent === 'function') logEvent('life', `见闻录新记录：${E.n}`, s && s.kind ? s : null, E.t >= 3 ? 3 : 1);
  jBadge(); if (typeof sfx === 'function' && typeof snd !== 'undefined' && snd.on && snd.ctx) jChime(E.t);
}
function jChime(t) { try { const c = snd.ctx, t0 = c.currentTime; [0, 4, 7, 12].slice(0, 2 + Math.min(2, t - 1)).forEach((st, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880 * Math.pow(2, st / 12); g.gain.setValueAtTime(0, t0 + i * 0.09); g.gain.linearRampToValueAtTime(0.05, t0 + i * 0.09 + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t0 + i * 0.09 + 0.7); o.connect(g); g.connect(snd.master); o.start(t0 + i * 0.09); o.stop(t0 + i * 0.09 + 0.75); }); } catch (e) {} }

/* hooks called from the simulation */
function jLog(e) {
  if (!JR_READY) return; jrInit(); const x = e.text, w = e.who;
  const R = [[/一只毛毛虫孵化了/, 'cat_hatch'], [/化蛹了/, 'pupate'], [/破蛹羽化了/, 'emerge'], [/孵出了 \d+ 只蝌蚪/, 'tadpole_hatch'], [/变成了小雨蛙/, 'metamorph'],
    [/在水塘里产卵了/, 'frog_spawn'], [/织好了一张新网/, 'web_built'], [/裹成了茧/, 'web_wrap'], [/撞上了蛛网/, 'web_stuck'], [/挣脱了蛛网/, 'web_escape'],
    [/午后阵雨/, 'shower'], [/浮游生物爆发/, 'plankton'], [/参观日门票/, 'visit']];
  for (const [re, k] of R) if (re.test(x)) jot(k, JR_BY[k].auto ? null : w);
  if (/在水塘里产卵了/.test(x) && w && (w.gen || 0) >= 1) jot('frog_cycle', w);
  if (/开始长霉/.test(x)) env.jx.mold = 1;
  if (/珊瑚开始白化/.test(x)) env.jx.bleach = 1;
  if (/藻类爆发/.test(x)) env.jx.alg = 1;
}
function jHunt(a, p) {
  if (!JR_READY) return; const m = { frog: 'frog_catch', mantis: 'mantis_catch', lizard: 'lizard_catch', snake: 'snake_hunt', grouper: 'grouper_catch', moray: 'moray_hunt' }[a.sp];
  if (m) jot(m, a); if (p.kills > 0) jot('hunter_hunted', a);
}
function jDeath(a, reason) {
  if (!JR_READY) return; if (reason !== 'eaten' && reason !== 'hatched') env.jx.deaths = (env.jx.deaths || 0) + 1;
  if (reason === 'old') { if ((a.gen || 0) >= 1 && a.S.lvl >= 2) jot('old_age', null); if (a.S.lvl >= 4) jot('apex_old', null); }
}
function jById(id) { if (id == null) return null; for (const k of SPK) for (const a of pop[k]) if (a.id === id) return a; return null; }
/* born(child, parent, how): generations and mutations. how: undefined = normal birth,
   'egg' = a frog egg mass (traits decided per tadpole), 'hatch' = a tadpole from that egg mass */
function born(c, p, how) {
  if (!c || !p) return c; jrInit();
  let pm, gen, par, gpar;
  if (how === 'hatch') { pm = p.pmut; gen = p.gen || 1; par = p.par; gpar = p.gpar; }
  else { pm = p.mut; gen = (p.gen || 0) + 1; par = p.id; gpar = p.par; }
  c.gen = gen; c.par = par; c.gpar = gpar;
  if (how === 'egg') { c.pmut = pm; return c; }
  if (MUT[c.sp] && Math.random() < (pm ? MUT_INHERIT : MUT_P)) {
    c.mut = 1; if (c.name && c.name[0] !== '★') c.name = '★' + c.name; applyMut(c);
    if (JR_READY) {
      toast(`<span class="jr-toast" style="--tc:#f0b25a">稀有变异诞生</span><b>${MUT[c.sp].n}「${c.name}」</b> <button class="tlink" data-follow="${c.id}">去看看</button>`);
      logEvent('life', `稀有变异诞生：${MUT[c.sp].n}「${c.name}」`, c, 4);
      jot('mutant_born', p); if (pm) jot('mutant_line', null);
    }
  }
  if (JR_READY && gpar != null && c.S && c.S.lvl >= 2) { const g = jById(gpar), q = jById(par); if (g && g.alive && q && q.alive) jot('three_gen', null); }
  if (JR_READY && c.sp === 'butterfly' && c.stage === 'egg') { jot('bf_lay', p); if ((p.gen || 0) >= 1) jot('bf_cycle', p); }
  return c;
}
/* recolour one animal: its own copies of the materials, with the colour pulled toward the variant tint */
function applyMut(a) {
  jrInit(); const V = MUT[a.sp]; if (!V || !a.mut || !a.m || !a.m.root || a.stage === 'egg') return;
  const tint = new THREE.Vector3(...V.c);
  a.m.root.traverse(o => {
    if (o.isSprite && V.glow) { o.material = o.material.clone(); o.material.color.setHex(V.glow); return; }
    if (!o.isMesh || !o.material) return;
    const conv = m => { if (!m || m.userData.mutOf) return m; const c = m.clone(); c.userData = Object.assign({}, m.userData, { mutOf: 1 }); const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
      c.onBeforeCompile = (sh, r) => { if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(c, sh, r); sh.uniforms.uMutT = { value: tint }; sh.uniforms.uMutA = { value: V.a };
        sh.fragmentShader = 'uniform vec3 uMutT;\nuniform float uMutA;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb=mix(diffuseColor.rgb,dot(diffuseColor.rgb,vec3(0.299,0.587,0.114))*uMutT*1.7,uMutA);'); };
      c.customProgramCacheKey = () => pk + '|mut-' + a.sp; c.needsUpdate = true; return c; };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
}
function mutLabel(a) { jrInit(); return a && a.mut && MUT[a.sp] ? MUT[a.sp].n : ''; }

/* ---------- per-frame polling for states and milestones (cheap, ~3 times a second) ---------- */
function jTick(dt) {
  if (!JR_READY) return; JR_T += dt; if (JR_T < 0.35) return; JR_T = 0;
  const night = isNight(), vis = (sp, f) => (pop[sp] || []).find(a => a.alive && (!f || f(a)) && jSeen(a));
  if (!OCEAN) {
    if (colony) { const a = vis('ant', a => a.state === 'carry' && Math.hypot(a.x - colony.x, a.z - colony.z) < 3); if (a) jot('ant_carry', a); }
    if (night) { const f = vis('firefly', f => f.flying && f.glow > 0.6); if (f) jot('firefly_glow', f); }
    { const a = vis('lizard', a => a.state === 'bask'); if (a) jot('lizard_bask', a); }
    { const a = vis('butterfly', a => a.state === 'sip'); if (a) jot('bf_sip', a); }
    if (night && rain.intensity > 0.2 && JR_LAST_CROAK && performance.now() - JR_LAST_CROAK < 4000) { const n = (pop.firefly || []).filter(f => f.alive && f.flying && f.glow > 0.3 && jSeen(f)).length; if (n >= 3) jot('night_chorus', null); }
    if (env.jx.mold && env.vent > 0) env.jx.moldVent = 1;
    if (env.jx.mold && env.zones.every(z => z.mold <= 0)) { if (env.jx.moldVent) jot('mold_fix', null); env.jx.mold = 0; env.jx.moldVent = 0; }
  } else {
    { const a = vis('clown', a => a.host && a.host.alive && Math.hypot(a.x - a.host.x, a.z - a.host.z) < 0.5); if (a) jot('clown_home', a); }
    { const a = vis('clown', a => a.state === 'hide'); if (a) jot('clown_hide', a); }
    if (night) { const a = vis('jelly'); if (a) jot('jelly_glow', a); }
    { const n = (pop.damsel || []).filter(a => a.alive && jSeen(a)).length; if (n >= 15) jot('school', (pop.damsel || []).find(a => a.alive && jSeen(a))); }
    { const a = vis('crab', a => a.state === 'threat'); if (a) jot('crab_threat', a); }
    if (night) { const a = vis('moray', a => a.state === 'roam'); if (a) jot('moray_out', a); }
    const corals = plants.filter(p => p.alive && p.T.coral); const healthy = corals.filter(p => p.health > 0.6).length;
    if (env.jx.c0 == null) env.jx.c0 = healthy;
    if (healthy >= Math.max(30, env.jx.c0 * 1.5)) jot('coral_reef', null);
    if (env.jx.bleach && env.temp < 28.5 && corals.length >= 8 && healthy / corals.length > 0.75) { env.jx.bleach = 0; jot('coral_save', null); }
    if (env.jx.alg && env.algae < 0.35) { env.jx.alg = 0; jot('algae_fix', null); }
  }
  /* rare mutants anywhere on screen and close enough to make out */
  for (const k of SPK) for (const a of pop[k]) if (a.alive && a.mut && jSeen(a) && jDist(a) < 14) { if (!J.mut[k]) { J.mut[k] = Date.now(); jSave(); } jot('mutant_found', a); if (Object.keys(J.mut).length >= 3) jot('mutant3', null); }
  /* heat waves: no deaths from start to end */
  if (env.heat > 0 && !JR_HEAT) { JR_HEAT = true; env.jx.hd = env.jx.deaths || 0; }
  else if (env.heat <= 0 && JR_HEAT) { JR_HEAT = false; if ((env.jx.deaths || 0) === env.jx.hd) jot('heat_survive', null); }
  /* daily milestones */
  if (env.day !== JR_DAY) { const first = JR_DAY < 0; JR_DAY = env.day;
    if (!first) { const lv = new Set(SPK.map(k => SPEC[k].lvl).filter(l => l >= 1)); const ok = [...lv].every(l => SPK.some(k => SPEC[k].lvl === l && count(k) > 0)) && lv.has(4);
      env.jx.chain = ok ? (env.jx.chain || 0) + 1 : 0; if (env.jx.chain >= 7) jot('chain7', null); }
    if (env.day >= 100) jot('day100', null); if (env.balanceDays >= 30) jot('balance30', null); }
}

/* ---------- photo: upgrades entries whose moment is on screen right now ---------- */
function takePhoto() {
  const shutter = performance.now(); renderFrame(0.016); let url; try { url = renderer.domElement.toDataURL('image/jpeg', 0.92); } catch (e) { toast('这台设备不能截图'); return; }
  const fl = $('#flash'); if (fl) { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }
  const now = shutter, up = [];
  for (const k in JR_RECENT) { const r = JR_RECENT[k], E = JR_BY[k]; if (now - r.t > 12000 || !r.s || (r.s.alive === false) || !jSeen(r.s) || jDist(r.s) > 12) continue;
    const e = J.e[k]; if (!e || e.star >= 2) continue; e.star = 2; up.push(E); }
  const thumb = jThumb(); window.__lastPhoto = url;
  if (up.length) { for (const E of up) { try { localStorage.setItem('ark-jp-' + E.k, thumb); } catch (e) {} env.coins += JR_PHOTO_BONUS; } jSave(); jBadge();
    toast(`拍到了！<b>${up.map(E => E.n).join('、')}</b> 升级为金星　+${JR_PHOTO_BONUS * up.length} 孢子 <button class="tlink" data-photo="1">保存照片</button>`); }
  else toast(`已拍照。镜头里没有可以升级的见闻：要在发生后 12 秒内、离主角足够近 <button class="tlink" data-photo="1">保存照片</button>`);
}
function jThumb() { const s = renderer.domElement, w = 240, h = Math.round(w * 2 / 3), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const r = s.width / s.height, tr = w / h; let sw = s.width, sh = s.height, sx = 0, sy = 0; if (r > tr) { sw = s.height * tr; sx = (s.width - sw) / 2; } else { sh = s.width / tr; sy = (s.height - sh) / 2; }
  g.drawImage(s, sx, sy, sw, sh, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.72); }
async function savePhoto() { const url = window.__lastPhoto; if (!url) return; const d = new Date(), p = x => String(x).padStart(2, '0'), name = `glass-ark-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
  /* decode the data URL directly: fetch() on data: URLs is blocked by some hosts' security policies */
  let blob; try { const b64 = url.slice(url.indexOf(',') + 1), bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); blob = new Blob([u8], { type: 'image/jpeg' }); } catch (e) { toast('照片保存失败'); return; }
  if (window.claude && typeof window.claude.use === 'function') { const dl = await window.claude.use('downloads').catch(() => null); if (dl) { try { await dl.save({ filename: name, data: blob }); toast('照片已保存'); } catch (e) { if (e && e.code !== 'declined') toast('这里不能保存文件'); } return; } }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }

/* ---------- journal window ---------- */
function jBadge() { const b = $('#jrBadge'); if (!b || !J) return; const n = J.fresh || 0; b.hidden = !n; b.textContent = n > 9 ? '9+' : n; }
function jStats() { const got = Object.keys(J.e).filter(k => JR_BY[k]).length, gold = Object.values(J.e).filter(e => e.star >= 2).length; return { got, gold, total: JR.length }; }
var JR_FILTER = 0;
function openJournal() {
  jrInit(); if (!J) J = jLoad(); const dlg = $('#journal'); if (!dlg) return;
  J.fresh = 0; jSave(); jBadge(); renderJournal();
  if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
}
function renderJournal() {
  const st = jStats(), MKN = k => (typeof MODES !== 'undefined' && MODES[k] ? MODES[k].name : '');
  $('#jrProg').innerHTML = `已记录 <b>${st.got}</b> / ${st.total} · 金星 <b>${st.gold}</b> · 变异 <b>${Object.keys(J.mut).length}</b> / ${Object.keys(MUT).length}`;
  $('#jrBar').style.width = (st.got / st.total * 100).toFixed(1) + '%';
  $$('#jrTabs button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.t === JR_FILTER));
  const list = $('#jrList'); let h = '';
  if (JR_FILTER === 5) {
    for (const sp in MUT) { const got = !!J.mut[sp], V = MUT[sp];
      h += `<li class="jr-card jr-mut ${got ? 'got' : ''}" style="--tc:#f0b25a"><div class="jr-sw" style="${got ? `background:rgb(${V.c.map(v => Math.round(v * 255)).join(',')})` : ''}">${got ? '' : '?'}</div><div class="jr-tx"><b>${got ? V.n : '？？？'}</b><small>${got ? `${V.sn}的稀有变异 · 在你的缸里找到` : `${V.sn}的一种稀有颜色。只会在你的缸里自然出生`}</small></div></li>`; }
    list.innerHTML = h; return;
  }
  for (const E of JR) { if (JR_FILTER && E.t !== JR_FILTER) continue; const e = J.e[E.k], T = JR_TIER[E.t], ph = e && e.star >= 2 ? jPhoto(E.k) : null;
    const where = E.w === 'land' ? '陆地缸' : E.w === 'ocean' ? '海洋缸' : '任意缸';
    const stars = e ? (E.auto ? '<span class="jr-st on" title="已达成">✓</span>' : `<span class="jr-st on">★</span><span class="jr-st ${e.star >= 2 ? 'on gold' : ''}" title="${e.star >= 2 ? '拍到了照片' : '拍下它的照片可以升级'}">★</span>`) : '';
    h += `<li class="jr-card ${e ? 'got' : ''}" style="--tc:${T.c}">${ph ? `<img class="jr-ph" src="${ph}" alt="">` : e ? (E.auto ? `<div class="jr-ph jr-ph1"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>已达成</div>` : `<div class="jr-ph jr-ph1"><svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.3" r="3.4"/></svg>待拍照</div>`) : `<div class="jr-ph jr-ph0">?</div>`}
      <div class="jr-tx"><div class="jr-row"><span class="jr-tier">${T.n}</span><span class="jr-where">${where}</span><span class="jr-stars">${stars}</span></div>
      <b>${e ? E.n : '？？？'}</b><small>${e ? E.d : E.h}</small>${e ? `<em>第 ${e.day} 天 · ${MKN(e.mk)}</em>` : ''}</div></li>`; }
  list.innerHTML = h;
}
function initJournal() {
  jrInit(); const dlg = $('#journal'); if (!dlg || dlg.dataset.ready) return; dlg.dataset.ready = '1'; if (!J) J = jLoad();
  $('#jrClose').addEventListener('click', () => dlg.close()); dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $$('#jrTabs button').forEach(b => b.addEventListener('click', () => { JR_FILTER = +b.dataset.t; renderJournal(); }));
  $$('[data-open-journal]').forEach(b => b.addEventListener('click', openJournal)); jBadge();
}
/* game-side setup, runs once the tank exists */
jrInit(); if (!env.jx || typeof env.jx !== 'object') env.jx = {};
J = jLoad(); initJournal(); JR_READY = true; JR_DAY = env.day;
for (const k of SPK) for (const a of pop[k]) if (a.mut) applyMut(a);
$('#camBtn').addEventListener('click', takePhoto);
$('#jrBtn').addEventListener('click', openJournal);
$('#toasts').addEventListener('click', e => { const b = e.target.closest('.tlink'); if (!b) return; e.stopPropagation();
  if (b.dataset.photo) savePhoto().catch(() => toast('照片保存失败')); else if (b.dataset.follow) { const a = jById(+b.dataset.follow); if (a && a.alive) { selectEntity(a); startFollow(a, 'orbit'); directorOff(); } else toast('它已经离开了'); } });
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toLowerCase(); if (k === 'p') takePhoto(); else if (k === 'j') { const d = $('#journal'); if (d.open) d.close(); else openJournal(); } });
