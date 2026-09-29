
/* =================== sound =================== */
const snd={on:false,ctx:null,vol:0.7,active:0};
function initSound(){if(snd.ctx||!snd.on)return;try{const ctx=new(window.AudioContext||window.webkitAudioContext)();snd.ctx=ctx;snd.master=ctx.createGain();snd.master.gain.value=snd.vol;snd.master.connect(ctx.destination);
  const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;snd.noise=buf;
  const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3800;const g=ctx.createGain();g.gain.value=0;src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(snd.master);src.start();snd.rainGain=g;
  const fs=ctx.createBufferSource();fs.buffer=buf;fs.loop=true;const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1100;const fh=ctx.createBiquadFilter();fh.type='highpass';fh.frequency.value=180;const fg=ctx.createGain();fg.gain.value=0;const fp=panner(POOL.x,5,-10);fs.connect(fh);fh.connect(fl);fl.connect(fg);fg.connect(fp);fs.start();snd.fallGain=fg;
  if(ctx.state==='suspended')ctx.resume();}catch(e){snd.ctx=null;}}
function panner(x,y,z){const c=snd.ctx,p=c.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=2.2;p.maxDistance=80;p.rolloffFactor=1.4;
  if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z;}else p.setPosition(x,y,z);p.connect(snd.master);return p;}
function sndListener(){const c=snd.ctx;if(!c)return;const L=c.listener,p=camera.position,f=new V3();camera.getWorldDirection(f);
  if(L.positionX){L.positionX.value=p.x;L.positionY.value=p.y;L.positionZ.value=p.z;L.forwardX.value=f.x;L.forwardY.value=f.y;L.forwardZ.value=f.z;L.upX.value=0;L.upY.value=1;L.upZ.value=0;}else{L.setPosition(p.x,p.y,p.z);L.setOrientation(f.x,f.y,f.z,0,1,0);}}
function sndRain(I){if(snd.on&&snd.rainGain)snd.rainGain.gain.setTargetAtTime(I*(rain.global>0?0.34:0.2),snd.ctx.currentTime,0.25);}
function sfx(kind,a){if(!snd.on||!snd.ctx||snd.active>7)return;const d=camera.position.distanceTo(_v.set(a.x,a.y||0,a.z));if(d>35)return;const c=snd.ctx,t=c.currentTime,out=panner(a.x,(a.y||0)+0.1,a.z);snd.active++;let dur=0.5;
  if(kind==='frog'){const n=irand(7,12),f0=rand(1850,2300);dur=n*0.075+0.1;for(let k=0;k<n;k++){const t0=t+k*0.075,o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),g2=c.createGain();o.type='sine';o.frequency.setValueAtTime(f0*(1-k*0.004),t0);o2.frequency.setValueAtTime(f0*2.01,t0);
      g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(0.22,t0+0.006);g.gain.exponentialRampToValueAtTime(0.001,t0+0.05);g2.gain.setValueAtTime(0,t0);g2.gain.linearRampToValueAtTime(0.05,t0+0.006);g2.gain.exponentialRampToValueAtTime(0.001,t0+0.04);
      o.connect(g);g.connect(out);o2.connect(g2);g2.connect(out);o.start(t0);o.stop(t0+0.06);o2.start(t0);o2.stop(t0+0.06);}}
  else if(kind==='chirp'){const f0=rand(4300,4900);dur=0.25;for(let k=0;k<4;k++){const t0=t+k*0.045,o=c.createOscillator(),g=c.createGain();o.frequency.value=f0;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(0.07,t0+0.006);g.gain.linearRampToValueAtTime(0,t0+0.028);o.connect(g);g.connect(out);o.start(t0);o.stop(t0+0.035);}}
  setTimeout(()=>{snd.active--;try{out.disconnect();}catch(e){}},dur*1000+200);}
const _v=new V3();

/* =================== UI helpers =================== */
function toast(html){const t=document.createElement('div');t.className='toast';t.innerHTML=html;const box=$('#toasts');box.prepend(t);while(box.children.length>3)box.lastChild.remove();setTimeout(()=>t.remove(),3800);}
const STATE_TXT={idle:'四处转悠',forage:'觅食中',carry:'搬运食物回巢',home:'在巢里休息',homeward:'天黑了，回巢',hungry:'饿了，回巢进食',graze:'啃食草叶',chirp:'振翅鸣叫',dormant:'太干了，缩壳休眠',eat:'进食',
  hunt:'追猎',stalk:'悄悄靠近猎物',chase:'追击',strike:'出击！',recover:'扑空了，调整姿势',flee:'逃跑！',rolled:'蜷成一个球',retracted:'缩进壳里',bask:'在加热岩上晒太阳',sleep:'睡觉',
  build:'正在织网',wait:'守在网中央',toPrey:'冲向落网的猎物',wrap:'吐丝缠住猎物',feed:'享用网中的猎物',return:'回到网中央',drop:'顺着丝线垂降',eatDrop:'在地面进食',climb:'爬回网上',wander:'寻找结网地点',
  sip:'吸食花蜜',rest:'停在植物上休息',fly:'飞行',lay:'在寄主植物上产卵',emerge:'刚刚羽化，正在展开翅膀',pupate:'寻找化蛹的地方',swim:'游泳',ambush:'伏在花枝上埋伏',digest:'慢慢消化食物',drift:'随水流漂浮',hide:'躲进海葵触手里',lurk:'在洞口埋伏',patrol:'在礁石间巡游',roam:'出洞巡游',threat:'举起大螯示威',school:'结群巡游',stuck:'被蛛网粘住了',caught:'被捉住了'};
const LV=['分解','Ⅰ','Ⅱ','Ⅲ','Ⅳ'];
function lvlOf(S){return S.lvl<1?'分解者':`第${['一','二','三','四'][Math.round(S.lvl)-1]}营养级`;}
function stageTxt(a){return a.S.stageNames?a.S.stageNames[a.stage]:'';}
function bar(v,c){return`<div class="meter"><b style="width:${Math.round(clamp(v,0,1)*100)}%;${c?'background:'+c:''}"></b></div>`;}
function preyNames(sp){const d=SPEC[sp].diet;if(d)return Object.keys(d).map(k=>SPEC[k].name).join('、');return{ant:'叶片、草、腐殖质',cricket:'草叶、腐殖质',snail:'苔藓、蕨叶、蘑菇',butterfly:'花蜜（幼虫吃野花叶）',isopod:'落叶、尸体、蘑菇',firefly:'成虫不进食',damsel:'浮游生物、藻类',clown:'浮游生物、饵料',jelly:'浮游生物',shrimp:'碎屑、藻类、残饵',crab:'碎屑、藻类、残饵',starfish:'藻膜、碎屑',urchin:'藻类'}[sp]||'';}
function predNames(sp){return SPK.filter(k=>SPEC[k].diet&&SPEC[k].diet[sp]).map(k=>SPEC[k].name).join('、')||'暂无';}

/* ---- tabs & panels ---- */
$$('.tabs button').forEach(b=>b.addEventListener('click',()=>{const box=b.closest('.side');box.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));box.querySelectorAll('.tabbody').forEach(x=>x.hidden=x.id!=='tab-'+b.dataset.tab);if(b.dataset.tab==='log')logDirty=true;if(b.dataset.tab==='species')renderSpecies();}));
$('#leftToggle').addEventListener('click',()=>{$('#left').classList.toggle('open');$('#right').classList.remove('open');});
$('#rightToggle').addEventListener('click',()=>{$('#right').classList.toggle('open');$('#left').classList.remove('open');});
function setTool(t){tool=t;moveSel=null;$$('.tool[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===t?'true':'false'));canvas.classList.toggle('paint',t!=='observe');renderPalette();cursor.visible=false;
  const hints={observe:'点击生物查看、跟随 · 点击地面查看区域',rain:'在缸内按住并拖动，云跟着指针下雨',plant:'绿色圈=适合，黄色=湿度不合适，红色=不能种',animal:'点击地面投放',feed:'饲料会被蚂蚁、蟋蟀和鼠妇吃掉',move:'先点一只动物，再点放下的位置',shovel:'点击铲掉一株植物或布景（返还部分孢子）· 按住拖动可以连续铲',decor:'选一种布景，点击地面摆放 · 用铲除工具可以移走'};if(OCEAN){hints.rain='在水面按住拖动，补充淡水、降低盐度';hints.feed='浮游饵料喂鱼和珊瑚，剩下的沉底给螃蟹和虾';}$('#hint').textContent=hints[t]||'';$('#hint').style.opacity=1;}
$$('.tool[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
function setSpeed(s){env.speed=s;if(s>=3)tutDone('fast');$$('[data-speed]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.speed===s?'true':'false'));}
$$('[data-speed]').forEach(b=>b.addEventListener('click',()=>setSpeed(+b.dataset.speed)));
function updateToggles(){$('#lampBtn').setAttribute('aria-pressed',env.lamp);$('#pumpBtn').setAttribute('aria-pressed',env.pump);}
$('#ventBtn').addEventListener('click',()=>{if(OCEAN){if(env.vent>0)return;if(!spend(15))return;env.vent=4;env.sal+=(35-env.sal)*0.75;env.nut*=0.5;env.algae*=0.75;env.plank*=0.85;env.temp+=(25-env.temp)*0.5;toast('换掉三成海水　−15 孢子：盐度回到 35‰，营养盐减半');logEvent('info','你给海缸换了水',null,0);return;}env.vent=8;toast('打开顶盖通风 8 秒：气体向室内空气靠拢，湿度下降');});
$('#lampBtn').addEventListener('click',()=>{env.lamp=!env.lamp;updateToggles();toast(env.lamp?'补光灯开启：夜里也能光合作用，沙蜥和蝴蝶不再休息。每天约 −14 孢子':'补光灯已关闭');});
$('#pumpBtn').addEventListener('click',()=>{env.pump=!env.pump;updateToggles();if(OCEAN){toast(env.pump?'造浪泵开启：水流带来氧气，珊瑚和海葵随波摆动。每天约 −5 孢子':'造浪泵关闭：水流停了，溶氧会慢慢下降');return;}toast(env.pump?'水泵开启：瀑布和溪流恢复，雨林和溪沼更湿润，藻类减少。每天约 −5 孢子':'水泵关闭：溪流断流，雨林会慢慢变干');});
$('#dirBtn').addEventListener('click',()=>{director.on=!director.on;$('#dirBtn').setAttribute('aria-pressed',director.on);if(director.on){director.lockUntil=0;director.next=0;toast('导演模式开启：镜头会自动追踪捕猎、羽化和孵化');}else{caption('');stopFollow();}});
$('#soundBtn').addEventListener('click',()=>{snd.on=!snd.on;$('#soundBtn').setAttribute('aria-pressed',snd.on);if(snd.on){initSound();if(snd.ctx&&snd.ctx.state==='suspended')snd.ctx.resume();}if(snd.master)snd.master.gain.value=snd.on?snd.vol:0;});
$('#setBtn').addEventListener('click',()=>{const s=$('#settings');s.hidden=!s.hidden;$('#setBtn').setAttribute('aria-pressed',!s.hidden);});
function renderQual(){$$('#qualSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.q===QK));}
$$('#qualSeg button').forEach(b=>b.addEventListener('click',()=>{QK=b.dataset.q;Q=QUAL[QK];try{localStorage.setItem('ark-quality',QK);}catch(e){}applyQuality();renderQual();}));
$('#vol').addEventListener('input',e=>{snd.vol=e.target.value/100;if(snd.master&&snd.on)snd.master.gain.value=snd.vol;});
function applyQuality(){renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));if(renderer.shadowMap.enabled!==Q.shadows){renderer.shadowMap.enabled=Q.shadows;scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});}
  if(sun.shadow.mapSize.x!==Q.shadow){sun.shadow.mapSize.set(Q.shadow,Q.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}grass.mesh.count=Math.floor(grass.n*Q.grass);resize();}

/* ---- palette ---- */
function renderPalette(){const pal=$('#palette');let h='';
  if(tool==='rain'&&OCEAN){h+=`<div class="item" style="cursor:default"><i style="background:var(--water)"></i><b>定点补淡水</b><small>在水面按住拖动 · 盐度 ${env.sal.toFixed(1)}‰</small></div><button class="item" id="globalRain"><i style="background:#b9dde4"></i><b>全缸补淡水 10 秒</b><small>约把盐度降低 0.9‰</small></button>`;}
  else if(tool==='rain'){h+=`<div class="item" style="cursor:default"><i style="background:var(--water)"></i><b>定点降雨</b><small>在缸内按住并拖动</small></div><button class="item" id="globalRain"><i style="background:#b9dde4"></i><b>全缸喷淋 10 秒</b><small>所有区域一起加湿</small></button>`;}
  else if(tool==='plant'){for(const k of PLANT_KEYS){const T=PT[k];h+=`<button class="item" data-plant="${k}" aria-pressed="${sub.plant===k}"><i style="background:${T.color}"></i><b>${T.name}</b><small><span class="c">${T.cost}</span> · ${T.hint}</small></button>`;}}
  else if(tool==='animal'){for(const k of SPK){const S=SPEC[k],lock=S.unlock&&!S.unlock.need()?S.unlock.text:null;h+=`<button class="item" data-animal="${k}" aria-pressed="${sub.animal===k}" ${lock?`disabled title="${lock}"`:''}><i style="background:${S.color}"></i><b>${S.name}${S.batch>1?' ×'+S.batch:''}</b><small>${lock?lock:`<span class="c">${S.cost}</span> · ${S.role}`}</small></button>`;}}
  else if(tool==='feed'&&OCEAN)h+=`<div class="item" style="cursor:default"><i style="background:#d8b070"></i><b>浮游饵料</b><small><span class="c">2</span> · 点击投放，浮游生物 +12%</small></div>`;
  else if(tool==='shovel')h+=`<div class="item" style="cursor:default"><i style="background:var(--bad)"></i><b>铲除</b><small>植物返还 30% · 布景返还 50%</small></div>`;
  else if(tool==='decor'){for(const k in DECOR_T){const T=DECOR_T[k];h+=`<button class="item" data-decor="${k}" aria-pressed="${sub.decor===k}"><i style="background:${T.color}"></i><b>${T.name}</b><small><span class="c">${T.cost}</span> · ${T.hint}</small></button>`;}}
  else if(tool==='feed')h+=`<div class="item" style="cursor:default"><i style="background:#b07a3c"></i><b>昆虫饲料</b><small><span class="c">2</span> · 点击地面投放</small></div>`;
  else if(tool==='move')h+=`<div class="item" style="cursor:default"><i style="background:var(--lamp)"></i><b>上帝之手</b><small>把动物搬到别的地方，免费</small></div>`;
  pal.innerHTML=h;pal.hidden=!h;
  pal.querySelectorAll('[data-plant]').forEach(b=>b.addEventListener('click',()=>{sub.plant=b.dataset.plant;renderPalette();}));
  pal.querySelectorAll('[data-decor]').forEach(b=>b.addEventListener('click',()=>{sub.decor=b.dataset.decor;renderPalette();}));
  pal.querySelectorAll('[data-animal]').forEach(b=>b.addEventListener('click',()=>{sub.animal=b.dataset.animal;renderPalette();}));
  const g=$('#globalRain');if(g)g.addEventListener('click',()=>{rain.global=10;initSound();toast(OCEAN?'顶部开始淋入淡水':'顶部喷淋系统启动');});}
let lockSig='';function refreshLocks(){const s=SPK.map(k=>SPEC[k].unlock&&!SPEC[k].unlock.need()?1:0).join('');if(s!==lockSig){if(lockSig&&tool==='animal')renderPalette();if(lockSig){SPK.forEach((k,i)=>{if(lockSig[i]==='1'&&s[i]==='0'){toast(`新物种解锁：<b>${SPEC[k].name}</b>`);logEvent('life',`${SPEC[k].name}已解锁，可以投放了`,null,2);}});}lockSig=s;}}

/* ---- inspect ---- */
let inspDirty=true,inspHover=false;$('#inspect').addEventListener('pointerenter',()=>inspHover=true);$('#inspect').addEventListener('pointerleave',()=>inspHover=false);
function reasonTxt(a){const S=a.S;let s=STATE_TXT[a.state]||a.state;if(a.prey&&a.prey.alive&&['stalk','chase','strike'].includes(a.state))s+=`（目标：${a.prey.S.name}${a.prey.S.noName?'':'「'+a.prey.name+'」'}）`;
  if(a.heldBy)s=`被${a.heldBy.S.name}「${a.heldBy.name}」捉住了`;if(a.state==='idle'&&a.energy<0.4)s='饿了，正在找吃的';return s;}
function renderInspect(){const s=selected,box=$('#inspect');if(!s||!s.alive){box.hidden=true;return;}
  if(s.kind==='zone'&&OCEAN){box.innerHTML=`<h3><i style="background:${ZONES[s.zi].color}"></i>${ZONES[s.zi].name}</h3><dl class="kv"><dt>水温</dt><dd class="num">${env.temp.toFixed(1)} °C</dd><dd></dd><dt>盐度</dt><dd class="num">${env.sal.toFixed(1)} ‰</dd><dd></dd><dt>营养盐</dt><dd>${bar(env.nut/1.2,'#c9a066')}</dd><dd></dd><dt>浮游生物</dt><dd>${bar(env.plank,'#9ad0c8')}</dd><dd></dd></dl><p class="fact">这里适合：${PLANT_KEYS.filter(k=>(PZO[k]||[0,1,2,3]).includes(s.zi)).map(k=>PT[k].name).join('、')}</p><div class="row"><button class="btn" data-a="close">关闭</button></div>`;}
  else if(s.kind==='zone'){const z=env.zones[s.zi];const rec=PLANT_KEYS.filter(k=>{const T=PT[k];return!T.water&&z.m>=T.moist[0]&&z.m<=T.moist[1];}).map(k=>PT[k].name).slice(0,6).join('、');
    box.innerHTML=`<h3><i style="background:${ZONES[s.zi].color}"></i>${ZONES[s.zi].name}</h3><dl class="kv"><dt>土壤湿度</dt><dd>${bar(z.m,'var(--water)')}</dd><dd class="num">${Math.round(z.m*100)}%</dd><dt>空气湿度</dt><dd>${bar(z.h,'#b9dde4')}</dd><dd class="num">${Math.round(z.h*100)}%</dd><dt>温度</dt><dd class="num">${z.T.toFixed(1)} °C</dd><dd></dd><dt>肥力</dt><dd>${bar(z.fert/1.2,'#c9a066')}</dd><dd></dd></dl><p class="fact">现在适合种：${rec||'暂时没有合适的植物，先调节湿度'}</p><div class="row"><button class="btn" data-a="close">关闭</button></div>`;}
  else if(s.kind==='plant'){const m=OCEAN?0:s.T.water?(inPond(s.x,s.z)?1:0):s.T.fungus?env.zones[s.zone].h:plantMoist(s);
    box.innerHTML=`<h3><i style="background:${s.T.color}"></i>${s.T.name}</h3><span class="tag">${ZONES[s.zone].name}</span>${s.T.nectar?'<span class="tag">蜜源</span>':''}${s.T.host?'<span class="tag">毛毛虫寄主</span>':''}${s.T.fungus?'<span class="tag">分解者</span>':`<span class="tag">产氧 ${(s.T.o2*s.growth*s.health).toFixed(2)}</span>`}
      <dl class="kv"><dt>健康</dt><dd>${bar(s.health,s.health<0.4?'var(--bad)':'')}</dd><dd class="num">${Math.round(s.health*100)}%</dd><dt>生长</dt><dd>${bar(s.growth)}</dd><dd class="num">${Math.round(s.growth*100)}%</dd>${s.pollen>0?`<dt>授粉</dt><dd>${'●'.repeat(s.pollen)}</dd><dd></dd>`:''}</dl>
      <p class="fact">${OCEAN?(s.T.coral?`珊瑚靠共生藻光合作用，也滤食浮游生物。水温超过 29°C 或被藻类覆盖会白化。现在水温 ${env.temp.toFixed(1)}°C。`:s.T.host?'小丑鱼的家：触手会蜇伤别的鱼，却保护小丑鱼。':'海草和海带吸收营养盐、释放氧气，是小鱼的育婴场。'):s.T.water?(m?'漂浮在水塘上。':'水塘干了，它正在枯萎！'):s.T.fungus?'从腐烂的落叶和尸体上长出来，加快分解，也是蜗牛和鼠妇的食物。':`土壤湿度 ${Math.round(m*100)}%，它喜欢 ${Math.round(s.T.moist[0]*100)}–${Math.round(s.T.moist[1]*100)}%。`}</p><div class="row"><button class="btn" data-a="close">关闭</button></div>`;}
  else{const S=s.S,fm=cam.follow===s?cam.fmode:null;const st=stageTxt(s);const days=(s.age).toFixed(1);
    box.innerHTML=`<h3><i style="background:${S.color}"></i><span>${s.name}</span>${S.noName?'':'<button class="rn" data-a="rename">改名</button>'}</h3>
      <span class="tag">${S.name}${s.sp==='butterfly'&&s.stage==='adult'&&S.VAR&&S.VAR[s.variant]!=null?' · '+S.VAR[s.variant]:''}</span>${st&&s.stage!=='adult'?`<span class="tag">${st}</span>`:''}${s.scale<0.95&&s.stage!=='egg'&&s.stage!=='pupa'?'<span class="tag">幼体</span>':''}<span class="tag">${lvlOf(S)}</span><span class="tag">${ZONES[zoneAt(s.x,s.z)].name}</span>
      <div class="state"><b>●</b> ${reasonTxt(s)}</div>
      <div class="segm"><button data-f="orbit" aria-pressed="${fm==='orbit'}">环绕跟随</button><button data-f="chase" aria-pressed="${fm==='chase'}">追尾镜头</button><button data-f="eye" aria-pressed="${fm==='eye'}">它的视角</button></div>
      <dl class="kv"><dt>饱食</dt><dd>${bar(s.energy,s.energy<0.3?'var(--bad)':'')}</dd><dd class="num">${Math.round(s.energy*100)}%</dd>${s.stage==='larva'||s.stage==='tadpole'||s.stage==='egg'||s.stage==='pupa'?`<dt>发育</dt><dd>${bar(s.stage==='larva'?s.stageT/1.1:s.stage==='tadpole'?s.stageT/1.2:s.stage==='pupa'?s.stageT/0.6:s.stageT/0.35,'#e9b451')}</dd><dd></dd>`:''}</dl>
      <div class="stats3"><span>年龄 <b>${days}</b> 天</span>${S.diet?`<span>捕获 <b>${s.kills}</b></span>`:''}<span>后代 <b>${s.kids}</b></span></div>
      ${s.diary.length?`<ul class="diary">${s.diary.slice(0,4).map(d=>`<li>${d}</li>`).join('')}</ul>`:''}
      <p class="fact">吃：${preyNames(s.sp)}<br>天敌：${predNames(s.sp)}</p>
      <div class="row"><button class="btn" data-a="next">下一只${S.name}</button><button class="btn" data-a="move">搬运</button><button class="btn" data-a="close">关闭</button></div><div id="renameBox"></div>`;}
  box.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{startFollow(s,b.dataset.f);renderInspect();});
  box.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='close')deselect();else if(a==='next'){const list=pop[s.sp].filter(x=>x.alive&&!x.hidden);const i=list.indexOf(s);const n=list[(i+1)%list.length];if(n){selectEntity(n);if(cam.follow)startFollow(n,cam.fmode);}}
    else if(a==='move'){setTool('move');moveSel=s;toast(`点击地面，把「${s.name}」放过去`);}
    else if(a==='rename'){const rb=$('#renameBox');rb.innerHTML=`<div class="rename"><input id="rnIn" maxlength="8" value="${s.name}" aria-label="新名字"><button class="btn pri" id="rnOk">好</button></div>`;const inp=$('#rnIn');inp.focus();inp.select();const ok=()=>{const v=inp.value.trim();if(v){s.name=v;s.note(`被你取名为「${v}」`);}renderInspect();};$('#rnOk').onclick=ok;inp.onkeydown=e=>{if(e.key==='Enter')ok();};inspHover=true;}});}

/* ---- side panels ---- */
function renderContracts(){$('#ctCount').textContent=contracts.length?` ${contracts.length}`:'';
  const tl=TUT.filter(t=>!t.done).length?`<div class="tut"><div class="tut-h">上手任务 <span>${TUT.filter(t=>t.done).length}/${TUT.length}</span></div>${TUT.map(t=>`<div class="tut-i ${t.done?'ok':''}"><i></i><span>${t.t}</span><em>+${t.r}</em></div>`).join('')}</div>`:'';
  $('#tab-contracts').innerHTML=tl+contracts.map(c=>{const pr=clamp(c.tpl.prog()-c.base,0,c.n);return`<div class="contract"><div class="t"><span>${c.tpl.t(c.n)}</span><em>+${c.reward}</em></div><div class="pb"><b style="width:${Math.round(pr/c.n*100)}%"></b></div><div class="s">${Math.floor(pr)}/${c.n} · 截止第 ${c.due} 天</div></div>`;}).join('')+
  `<p class="fact" style="margin-top:12px">观赏值来自物种多样性、生态平衡和刚刚发生的精彩瞬间（捕猎、羽化、孵化），它持续产出孢子。</p>`;}
function renderLog(){const ul=$('#logList');ul.innerHTML=LOG.slice(0,40).map(e=>`<li><time>${e.day}·${e.t}</time><span class="k-${e.kind}">${e.text}</span>${e.who&&e.who.alive?`<button class="go" data-id="${e.id}">去看</button>`:''}</li>`).join('')||'<li><span>还没有发生什么</span></li>';
  ul.querySelectorAll('.go').forEach(b=>b.onclick=()=>{const e=LOG.find(x=>x.id==b.dataset.id);if(e&&e.who&&e.who.alive){selectEntity(e.who);startFollow(e.who,'orbit');}});}
function renderSpecies(){const box=$('#tab-species');const order=(OCEAN?['moray','grouper','clown','damsel','jelly','crab','shrimp','starfish','urchin']:['snake','lizard','frog','mantis','spider','ant','cricket','snail','butterfly','firefly','isopod']).filter(k=>SPK.includes(k));
  box.innerHTML=`<p class="fact">从上到下是食物链的层级。解锁更高层的捕食者，需要先把它的猎物养起来。</p>`+order.map(k=>{const S=SPEC[k],n=count(k),lock=S.unlock&&!S.unlock.need();let br='';if(S.stages){const c={};for(const a of pop[k])c[a.stage]=(c[a.stage]||0)+1;br=S.stages.filter(s=>c[s]).map(s=>`${S.stageNames[s]} ${c[s]}`).join(' · ');}
    return`<div class="sp ${lock&&!n?'locked':''}"><i style="background:${S.color}"></i><b>${S.name}<span class="lvl">${S.lvl<1?'分解':LV[Math.round(S.lvl)]}</span></b><span class="cnt">${n}</span><div class="meta">${br?br+'<br>':''}吃 <em>${preyNames(k)}</em><br>天敌 <em>${predNames(k)}</em>${lock?`<br>🔒 ${S.unlock.text}`:''}</div></div>`;}).join('')+
  `<div class="sp"><i style="background:#6f9a55"></i><b>植物</b><span class="cnt">${plants.filter(p=>p.alive&&!p.T.fungus).length}</span><div class="meta">${new Set(plants.map(p=>p.type)).size} 种，含蘑菇 ${plants.filter(p=>p.type==='mushroom').length} 朵。${OCEAN?'珊瑚、海草和海带白天释放氧气。':'白天吸收 CO₂ 释放氧气。'}</div></div>`;
  $('#spCount').textContent=' '+SPK.filter(k=>count(k)>0).length;}
const O2H=[env.o2,env.o2];let o2T=0,prevO2=env.o2,prevCO2=env.co2,prevT=0;
function drawSpark(){const c=$('#spark'),g=c.getContext('2d'),w=c.width,h=c.height;g.clearRect(0,0,w,h);if(O2H.length<2)return;
  const B0=OCEAN?17:19.5,B1=OCEAN?22:23.5;const lo=Math.min(B0-1,...O2H)-0.3,hi=Math.max(B1,...O2H)+0.3,Y=v=>h-4-(v-lo)/(hi-lo)*(h-8),X=i=>i/(240-1)*w;
  g.fillStyle='rgba(164,209,139,0.07)';g.fillRect(0,Y(B1),w,Y(B0)-Y(B1));g.beginPath();O2H.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v)));g.strokeStyle='#a4d18b';g.lineWidth=3;g.stroke();
  g.lineTo(X(O2H.length-1),h);g.lineTo(0,h);g.closePath();g.fillStyle='rgba(164,209,139,0.12)';g.fill();g.fillStyle='#e6ece3';g.beginPath();g.arc(X(O2H.length-1),Y(O2H[O2H.length-1]),5,0,6.283);g.fill();
  g.fillStyle='#66786d';g.font='18px JetBrains Mono, monospace';g.fillText(OCEAN?'溶氧充足区':'19.5–23.5% 舒适区',8,Y(B1)+18);}
const DO=()=>env.o2/20.9*6.9,PH=()=>clamp(8.25-(env.co2-420)*0.0004,7.5,8.5);
function renderEnv(){if(OCEAN){$('#o2').innerHTML=`${DO().toFixed(2)}<small>mg/L</small>`;$('#co2').innerHTML=`${PH().toFixed(2)}<small>pH</small>`;}else{$('#o2').innerHTML=`${env.o2.toFixed(2)}<small>%</small>`;$('#co2').innerHTML=`${Math.round(env.co2)}<small>ppm</small>`;}
  const gh=(env.day+env.time)*24;if(gh>prevT+0.2){const k=1/(gh-prevT),d1=(env.o2-prevO2)*k*(OCEAN?6.9/20.9:1),d2=(env.co2-prevCO2)*k*(OCEAN?-0.0004:1);$('#o2d').textContent=`${d1>=0?'+':'−'}${Math.abs(d1).toFixed(2)} /时`;$('#co2d').textContent=`${d2>=0?'+':'−'}${Math.abs(d2).toFixed(OCEAN?3:0)} /时`;prevO2=env.o2;prevCO2=env.co2;prevT=gh;}
  $('#pOut').textContent='+'+env.P.toFixed(1);$('#rOut').textContent='−'+env.R.toFixed(1);$('#lightOut').textContent=Math.round(env.light*100)+'%'+(env.lamp&&env.daylight<0.5?' 灯':'');
  const ORow=(n,c,v,txt)=>`<tr><td class="n"><i style="background:${c}"></i>${n}</td><td colspan="2"><div class="bar" style="width:100%"><b style="width:${Math.round(clamp(v,0,1)*100)}%;background:${c}"></b></div></td><td class="num" style="text-align:right">${txt}</td></tr>`;
  if(OCEAN)$('#zoneRows').innerHTML=ORow('水温','#e0845a',(env.temp-20)/12,env.temp.toFixed(1)+'°')+ORow('盐度','#b9dde4',(env.sal-28)/14,env.sal.toFixed(1)+'‰')+ORow('营养盐','#c9a066',env.nut/1.2,Math.round(env.nut*100)+'')+ORow('浮游生物','#9ad0c8',env.plank,Math.round(env.plank*100)+'%')+ORow('藻类','#8ab04a',env.algae,Math.round(env.algae*100)+'%');
  else $('#zoneRows').innerHTML=env.zones.map((z,i)=>`<tr><td class="n"><i style="background:${ZONES[i].color}"></i>${ZONES[i].name}</td><td><div class="bar"><b style="width:${Math.round(z.m*100)}%"></b></div></td><td><div class="bar h"><b style="width:${Math.round(z.h*100)}%"></b></div></td><td class="num" style="text-align:right">${z.T.toFixed(0)}°</td></tr>`).filter((r,i)=>MODE.zone==null||i===MODE.zone).join('')+(MODE.pond?
    `<tr><td class="n"><i style="background:var(--water)"></i>水塘</td><td colspan="2"><div class="bar" style="width:100%"><b style="width:${Math.round(env.pond*100)}%"></b></div></td><td class="num" style="text-align:right">${Math.round(env.pond*100)}%</td></tr>`+`<tr><td class="n"><i style="background:#7a9a3a"></i>藻类</td><td colspan="2"><div class="bar" style="width:100%"><b style="width:${Math.round(env.algae*100)}%;background:#8ab04a"></b></div></td><td class="num" style="text-align:right">${Math.round(env.algae*100)}%</td></tr>`:'');
  const al=[];if(OCEAN){if(env.temp>29)al.push(['bad',`水温 ${env.temp.toFixed(1)}°C，珊瑚在白化。关补光灯或换水降温。`]);if(env.sal>38)al.push(['warn','盐度太高了：水在蒸发。用“补淡水”对着水面淋一会儿。']);if(env.sal<32)al.push(['warn','淡水加多了，盐度偏低。换水可以拉回 35‰。']);if(env.nut>0.75)al.push(['warn','营养盐偏高，藻类会疯长。换水，或少喂一点。']);if(env.algae>0.65)al.push(['warn','藻类覆盖珊瑚。多养海胆，或者换水。']);if(DO()<5.4)al.push(['bad','溶氧偏低，鱼会浮头。打开造浪泵，或放一块气石。']);if(env.plank<0.12)al.push(['warn','浮游生物不够吃了。撒点浮游饵料。']);
    if(!al.length)al.push(['ok','水质稳定。天黑后水母会发出微光，海鳗开始出洞巡游。']);$('#alerts').innerHTML=al.slice(0,3).map(a=>`<div class="alert ${a[0]}">${a[1]}</div>`).join('');drawSpark();return;}
  const Z=i=>MODE.zone==null||MODE.zone===i;if(env.co2<200)al.push(['warn','CO₂ 偏低，光合作用受限。多养些动物，或者通风。']);if(env.o2<18.5)al.push(['bad','氧气偏低，动物会更快衰弱。通风，或者多种植物。']);if(env.o2>24)al.push(['warn','氧气偏高，超出平衡区间。开一下通风。']);
  if(Z(0)&&env.zones[0].m>0.42)al.push(['warn','沙漠太湿，仙人掌会烂根。']);if(Z(3)&&env.zones[3].m<0.5)al.push(['warn','雨林土壤偏干。开水泵，或者对雨林降雨。']);if(Z(1)&&env.zones[1].m<0.22)al.push(['warn','草甸太干，草在枯黄，蟋蟀会挨饿。']);
  if(MODE.zone===0&&env.zones[0].m<0.04)al.push(['warn','太干了，连仙人掌都在缩水。偶尔下点小雨。']);if(MODE.zone===2&&env.zones[2].m<0.55)al.push(['warn','溪沼变干了。开水泵，或者降雨。']);
  if(MODE.pond&&env.pond<0.25)al.push(['warn','水塘快干了，对着水面降雨可以补水。']);if(MODE.pond&&env.algae>0.7)al.push(['warn','藻类爆发，水变绿了。开水泵循环，或让蝌蚪多一些。']);if(env.zones.some(z=>z.mold>20))al.push(['bad','湿度过高，霉菌正在伤害植物。通风可以缓解。']);
  if(!al.length)al.push(['ok',{desert:'一切平稳。清晨沙蜥会爬上加热岩晒背。',meadow:'一切平稳。天黑后蟋蟀开始鸣叫，萤火虫在草尖闪烁。'}[MK]||'一切平稳。等到夜里，萤火虫会亮起来，雨蛙开始合唱。']);$('#alerts').innerHTML=al.slice(0,3).map(a=>`<div class="alert ${a[0]}">${a[1]}</div>`).join('');drawSpark();}
function updateHUD(){const hh=Math.floor(env.time*24);$('#clock').textContent=`第 ${env.day} 天 · ${clockStr()}`;const ph=hh>=5&&hh<7?['黎明','#f0a070']:hh>=7&&hh<17?['白昼','#f0b25a']:hh>=17&&hh<19?['黄昏','#e0845a']:['夜晚','#8aa0e0'];
  $('#phase').innerHTML=`<i style="background:${ph[1]}"></i>${ph[0]}`;$('#weather').textContent=OCEAN?(rain.intensity>0.2?'补水中':env.heat>0?'海洋热浪':env.pump?'水流':'静水'):rain.intensity>0.2?'降雨中':env.heat>0?'热浪':env.zones[MODE.zone!=null?MODE.zone:3].h>0.85?'雾气':'晴';
  $('#coins').textContent=Math.floor(env.coins);$('#income').textContent=`${(env.score*0.0038-(env.pump?0.03:0)-(env.lamp?0.08:0))*DAY>=0?'+':''}${Math.round((env.score*0.0038-(env.pump?0.03:0)-(env.lamp?0.08:0))*DAY)}/天`;$('#score').textContent=env.score;}

/* =================== per-frame visuals =================== */
const cSunLow=new Col(0xffa860),cSunHigh=new Col(0xfff3e2),cHemiDay=new Col(0xd6e8ff),cHemiNight=new Col(0x34426a),WCLEAR=new Col(0x1d3b38),WGREEN=new Col(0x2f4a1a);
let slowT=0,wetT=0,grassT=0,condT=0,slimeT=0;const _hp=new V3();
function updateVisuals(rdt,gdt){const th=(env.time-0.25)*Math.PI*2,sh=Math.sin(th),dl=env.daylight;
  sun.position.set(Math.cos(th)*30,8+Math.max(0.15,sh)*28,16);sun.intensity=3.2*dl;sun.color.copy(cSunLow).lerp(cSunHigh,smooth(0,0.6,sh));hemi.intensity=0.12+0.5*dl;hemi.color.copy(cHemiNight).lerp(cHemiDay,dl);moon.intensity=0.45*(1-dl);
  scene.environmentIntensity=0.1+0.55*dl+(env.lamp?0.15:0);scene.background.copy(BG_NIGHT).lerp(BG_DAY,dl);scene.fog.color.copy(scene.background);
  lampLight.intensity+=((env.lamp?320:0)-lampLight.intensity)*Math.min(1,rdt*5);lampPanels.forEach(m=>m.emissiveIntensity=env.lamp?1.6:0);
  heatLight.intensity=MODE.heat&&dl>0.2?40:0;for(const hr of HEATROCKS)hr.bulb.material.emissiveIntensity=dl>0.2?2.2:0.1;heatMat.emissiveIntensity=0.04+0.3*dl;
  TX.waterN.offset.x+=rdt*0.012;TX.waterN.offset.y+=rdt*0.008;water.position.y=env.waterY;water.visible=!!MODE.pond&&env.pond>0.02;waterMat.color.copy(WCLEAR).lerp(WGREEN,smooth(0.3,0.9,env.algae));waterMat.opacity=0.78+0.15*env.algae;
  flowTex.offset.y-=rdt*0.35;streamMesh.visible=env.pump;fall.visible=env.pump;fallTex.offset.y-=rdt*1.6;pool.visible=true;
  foam.forEach((f,i)=>{f.ph+=rdt*(1.5+i*0.2);const s=env.pump?0.6+0.25*Math.sin(f.ph):0;f.s.scale.setScalar(s*1.4);f.s.material.opacity=env.pump?0.45+0.15*Math.sin(f.ph*1.3):0;f.s.position.set(POOL.x+Math.sin(i*2.1)*0.35,SY0+0.1+i*0.03,-HD+1.25+Math.cos(i*1.7)*0.25);});
  for(const r of ripples){if(r.t>=1)continue;r.t+=rdt*1.3;const s=r.s*(0.2+r.t*1.6);r.m.scale.set(s,s,s);r.m.material.opacity=(1-r.t)*0.55;if(r.t>=1)r.m.visible=false;}
  U.uTime.value+=rdt;U.uWind.value+=((1+rain.intensity*1.6+(env.vent>0?2.4:0))-U.uWind.value)*Math.min(1,rdt*2);
  updateRain(rdt);decorFX(rdt);if(OCEAN)oceanVisuals(rdt,dl);
  if(snd.fallGain)snd.fallGain.gain.setTargetAtTime(snd.on?(MODE.stream&&env.pump?0.1:0)+(OCEAN?(env.pump?0.07:0.03):0)+Math.min(0.08,DECOR.filter(d=>d.fount).length*0.03*(env.pump?1:0)):0,snd.ctx.currentTime,0.4);
  for(const m of mist){if(m.off)continue;let target;if(m.zi<0)target=env.pump?0.28:0;else{const z=env.zones[m.zi];target=smooth(0.7,0.99,z.h)*0.15*(env.vent>0?0.2:1)+(isNight()?0.05:0);if(m.x0==null)m.x0=m.x;m.x+=m.v*rdt;if(Math.abs(m.x-m.x0)>3.5)m.v*=-1;}
    m.s.material.opacity+=(target-m.s.material.opacity)*Math.min(1,rdt);m.s.position.set(m.x,heightAt(m.x,m.z)+m.y,m.z);}
  const vs=env.vent>0?5:1;for(let i=0;i<DN;i++){const s=dustSeed[i];s[3]+=rdt*vs*0.2;dustPos[i*3]=clamp(s[0]+Math.sin(s[3]*0.7+i)*0.8,-HW+0.1,HW-0.1);dustPos[i*3+1]=OCEAN?BOT+0.5+((s[1]-s[3]*0.08)%(WT-BOT-1)+(WT-BOT-1))%(WT-BOT-1):s[1]+Math.sin(s[3]*0.5+i*0.3)*0.5;dustPos[i*3+2]=clamp(s[2]+Math.cos(s[3]*0.6+i)*0.6,-HD+0.1,HD-0.1);}
  dustGeo.attributes.position.needsUpdate=true;dust.material.opacity=OCEAN?0.12+0.2*dl:0.06+0.3*dl;
  slowT+=rdt;if(slowT>0.3){slowT=0;for(const p of plants)if(p.alive)placePlant(p);flushPlants();
    for(const w of webs){w.line.geometry.setDrawRange(0,Math.floor(w.total*w.progress/2)*2);const hz=env.zones[zoneAt(w.x,w.z)].h;w.dp.material.opacity=w.progress>=1?smooth(0.6,0.9,hz)*0.9:0;}
    webLineMat.opacity=0.22+0.3*dl;for(const d of detritus)d.mesh.scale.setScalar(0.45+Math.min(1,d.amount)*0.6);}
  condT+=rdt;if(condT>0.5){condT=0;const CL=condLevel;for(const c of condPanes){c.mesh.visible=CL>0&&!glassHidden;if(!CL||glassHidden)continue;const cp=camera.position,look=c.d.side==='front'?cp.z>HD:c.d.side==='left'?cp.x<-HW:cp.x>HW;const vk=CL===2?1:(look?0.18:0.7);const col=c.mesh.geometry.attributes.color,pos=c.mesh.geometry.attributes.position;const hw=c.d.w/2;for(let i=0;i<col.count;i++){const lx=pos.getX(i),ly=pos.getY(i);let wx,wz;
      if(c.d.side==='front'){wx=lx;wz=HD-0.5;}else if(c.d.side==='left'){wx=-HW+0.5;wz=lx;}else{wx=HW-0.5;wz=-lx;}const h=env.zones[zoneAt(wx,wz)].h;const yN=(ly+c.H/2)/c.H;const band=CL===2?(0.3+0.7*yN):Math.max(smooth(0.72,1,yN),smooth(hw-2.2,hw,Math.abs(lx))*0.8,smooth(0.12,0,yN)*0.5);col.setW(i,clamp(smooth(CL===2?0.58:0.72,0.99,h)*band*vk*(isNight()?0.9:0.65)*(0.8+0.4*fbm(lx*0.4+3,ly*0.4,2)),0,CL===2?0.9:0.6));}col.needsUpdate=true;}}
  wetT+=rdt;if(wetT>1){wetT=0;refreshTerrainWet();}
  grassT+=rdt;if(grassT>2){grassT=0;refreshGrass();}
  slimeT+=rdt;if(slimeT>0.5){refreshSlime(slimeT*env.speed);slimeT=0;}
  for(let i=seedPuffs.length-1;i>=0;i--){const s=seedPuffs[i];s.t+=rdt;if(s.t>6)seedPuffs.splice(i,1);}
  // agents
  for(const k of SPK){if(k==='ant')continue;const S=SPEC[k];for(const a of pop[k]){if(!a.alive||!a.m)continue;if(a.heldBy){heldPos(a.heldBy,_hp);a.x=_hp.x;a.z=_hp.z;a.y=_hp.y;}
    if(S.anim)S.anim(a,gdt);if(a.heldBy&&a.m.root&&!a.m.body){a.m.root.position.copy(_hp);const pr=a.heldBy.st/Math.max(0.1,a.heldBy.S.hunt?a.heldBy.S.hunt.eatT:5);a.m.root.scale.multiplyScalar(clamp(pr,0.35,1));}
    if(a.stuck&&a.m.root&&!a.m.body){a.m.root.position.copy(a.stuckPos);a.m.root.position.x+=Math.sin(a.ph*37)*0.006;}}}
  let ai=0,li=0;const walk=ant.walk.array;for(const a of pop.ant){if(!a.alive||a.hidden)continue;let x=a.x,z=a.z,y;if(a.heldBy){heldPos(a.heldBy,_hp);x=_hp.x;z=_hp.z;y=_hp.y;}else if(a.stuck){x=a.stuckPos.x;y=a.stuckPos.y;z=a.stuckPos.z;}else y=heightAt(x,z)+0.003;
    const f=0.1,hx=Math.cos(a.h)*f,hz=Math.sin(a.h)*f;const pitch=a.heldBy?0.8:Math.atan2(heightAt(x+hx,z+hz)-heightAt(x-hx,z-hz),2*f);a.y=y;
    dummy.position.set(x,y,z);dummy.rotation.set(0,-a.h,pitch,'YZX');dummy.scale.setScalar(1.4*a.scale);dummy.updateMatrix();ant.mesh.setMatrixAt(ai,dummy.matrix);
    a.wph=(a.wph||0)+gdt*a.speed*55;walk[ai*2]=a.wph;walk[ai*2+1]=a.speed>0?1:0;ai++;
    if(a.carry&&!a.heldBy){dummy.position.y+=0.06;dummy.rotation.set(0.3,-a.h+0.3,pitch,'YZX');dummy.scale.setScalar(1.3);dummy.updateMatrix();ant.leafMesh.setMatrixAt(li++,dummy.matrix);}}
  ant.mesh.count=ai;ant.leafMesh.count=li;ant.mesh.instanceMatrix.needsUpdate=true;ant.leafMesh.instanceMatrix.needsUpdate=true;ant.walk.needsUpdate=true;
  const vis=pop.firefly.filter(f=>f.flying).sort((a,b)=>b.glow-a.glow);flyLights.forEach((l,i)=>{const f=vis[i];if(f){l.position.set(f.x,f.y,f.z);l.intensity=f.glow*2.2;}else l.intensity=0;});
  const s=selected;if(s&&s.alive&&s.kind!=='zone'){selRing.visible=true;const sz=s.kind==='plant'?Math.max(0.35,s.h*plantScale(s)*0.4):followSize(s)*0.14;selRing.scale.setScalar(sz*(1+Math.sin(U.uTime.value*4)*0.05));
    const gy=s.kind==='plant'&&s.T.water?env.waterY:surfaceY(s.x,s.z);selRing.position.set(s.x,gy+0.02,s.z);}else selRing.visible=false;
  if(bokehPass){const on=Q.dof&&!!cam.follow&&cam.fmode!=='eye';bokehPass.enabled=on;if(on){bokehPass.uniforms.focus.value=camera.position.distanceTo(cam.t);bokehPass.uniforms.aperture.value=0.0022;bokehPass.uniforms.maxblur.value=0.009;}}
  if(bloomPass)bloomPass.enabled=Q.bloom;}
/* labels */
const zlabels=ZONES.map(z=>{const d=document.createElement('div');d.className='zlabel';d.textContent=z.name;$('#labels').appendChild(d);return{d,p:new V3(z.cx,0,HD-0.7)};});zlabels.forEach(l=>l.p.y=heightAt(l.p.x,l.p.z)+0.2);
const flabel=document.createElement('div');flabel.className='flabel';flabel.innerHTML='<div class="nm"></div><div class="st"></div>';$('#labels').appendChild(flabel);
function updateLabels(){const w=canvas.clientWidth,h=canvas.clientHeight;const show=cam.r>16&&!cam.follow&&MODE.zone==null;for(const l of zlabels){_v.copy(l.p).project(camera);const vis=show&&_v.z<1&&Math.abs(_v.x)<1.1&&Math.abs(_v.y)<1.1;l.d.style.opacity=vis?1:0;if(vis)l.d.style.transform=`translate(${(_v.x*0.5+0.5)*w}px,${(-_v.y*0.5+0.5)*h}px) translate(-50%,-50%)`;}
  const s=selected;if(s&&s.alive&&s.kind==='animal'&&cam.fmode!=='eye'){_v.set(s.x,(s.y||0)+0.12*followSize(s)*Math.max(0.5,s.scale),s.z).project(camera);if(_v.z<1){flabel.style.display='block';flabel.style.transform=`translate(${(_v.x*0.5+0.5)*w}px,${(-_v.y*0.5+0.5)*h-6}px) translate(-50%,-100%)`;flabel.firstChild.textContent=s.name;flabel.lastChild.textContent=STATE_TXT[s.state]||'';return;}}
  flabel.style.display='none';}

/* ---- ocean visuals & mode UI ---- */
const TUT=[{k:'cam',t:'用 W A S D 或拖动鼠标移动镜头',r:10},{k:'follow',t:'点一只动物，让镜头跟着它',r:10},{k:'plant',t:'用“种植”种下一株植物',r:15},{k:'decor',t:'用“布景”摆一件布景',r:15},{k:'fast',t:'把时间调到 3× 看一天过去',r:10}];
function tutDone(k){const t=TUT.find(x=>x.k===k);if(!t||t.done)return;t.done=true;env.coins+=t.r;toast(`上手任务完成：${t.t}　<b>+${t.r} 孢子</b>`);if(TUT.every(x=>x.done))setTimeout(()=>toast('上手任务全部完成。右边“委托”会持续给你新目标'),1500);ctDirty=true;if(!$('#tab-contracts').hidden)renderContracts();}
let glassHidden=false,zen=false;const GLASSY=[];
tank.traverse(o=>{if(!o.isMesh||!o.material)return;const m=o.material;if(m===glassMat||m===sheenMat||o===lid||(m.map&&m.map===TX.streak)||(m.color&&m.color.getHex()===0x151816&&o.position.y>BOT+0.5)||o.position.y>TOP+0.1)GLASSY.push(o);});
function setGlass(h){glassHidden=h;GLASSY.forEach(o=>o.visible=!h);HEATROCKS.forEach(r=>r.parts&&r.parts.slice(1).forEach(o=>o.visible=!h));condT=1;$('#glassBtn').setAttribute('aria-pressed',h);try{localStorage.setItem('ark-glass',h?1:0);}catch(e){}}
function setZen(z){zen=z;document.body.classList.toggle('zen',z);$('#zenBtn').setAttribute('aria-pressed',z);if(z){$('#settings').hidden=true;$('#setBtn').setAttribute('aria-pressed','false');}}
$('#glassBtn').addEventListener('click',()=>{setGlass(!glassHidden);toast(glassHidden?'玻璃和缸架已隐藏':'玻璃已恢复');});
$('#zenBtn').addEventListener('click',()=>setZen(true));$('#zenExit').addEventListener('click',()=>setZen(false));
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();if(k==='g')$('#glassBtn').click();else if(k==='h')setZen(!zen);else if(k==='escape'&&zen)setZen(false);});
try{if(localStorage.getItem('ark-glass')==='1')setGlass(true);}catch(e){}
let uwT=9;let condLevel=1;try{const v=localStorage.getItem('ark-cond');if(v!=null)condLevel=+v;}catch(e){}
function renderCond(){$$('#condSeg button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.c===condLevel));}$$('#condSeg button').forEach(b=>b.addEventListener('click',()=>{condLevel=+b.dataset.c;try{localStorage.setItem('ark-cond',condLevel);}catch(e){}renderCond();condT=1;}));renderCond();
const PZO={seagrass:[0,1],kelp:[0,1],staghorn:[2,3],brain:[2,3],table:[3],fan:[2,3],anemone:[2,3]};
const OC_DAY=new Col(0x0e4f6a),OC_NIGHT=new Col(0x020c16),OC_VOL=new Col(0x0f5a76),OC_GREEN=new Col(0x2f6a48);
function oceanVisuals(rdt,dl){const F=oceanFX;if(!F)return;const t=U.uTime.value;
  CAUS.value=clamp(dl*(env.pump?1:0.75)+(env.lamp&&dl<0.5?0.35:0),0,1);
  const lit=0.12+0.88*dl+(env.lamp?0.15:0),gr=smooth(0.3,0.9,env.algae);UW.col.value.set(lerp(0.01,0.03,gr)*lit,lerp(0.062,0.09,gr)*lit,lerp(0.1,0.05,gr)*lit);UW.sigV.value.set(0.07,0.028+gr*0.01,0.02+gr*0.03);
  uwT+=rdt;if(uwT>2){uwT=0;uwSweep(agentGroup);uwSweep(tank);}
  F.vol.material.color.copy(OC_VOL).lerp(OC_GREEN,smooth(0.3,0.9,env.algae));F.vol.material.opacity=0.14+0.1*env.algae;
  F.sn.offset.x+=rdt*(env.pump?0.03:0.008);F.sn.offset.y+=rdt*(env.pump?0.02:0.005);
  for(const r of F.rays){r.m.rotation.set(0,Math.atan2(camera.position.x-r.m.position.x,camera.position.z-r.m.position.z),r.tilt);r.m.material.opacity=dl*0.09*(0.6+0.4*Math.sin(t*0.4+r.ph));}
  CMO.jelly.emissiveIntensity=isNight()?0.7:0.04;U.uWind.value=(env.pump?1.4:0.5)+Math.sin(t*0.3)*0.25;}
function relabel(sel,txt){const b=$(sel);if(!b)return;const n=[...b.childNodes].reverse().find(n=>n.nodeType===3&&n.textContent.trim());if(n)n.textContent=txt;}
if(OCEAN){relabel('[data-tool="rain"]','补淡水');relabel('#ventBtn','换水');relabel('#pumpBtn','造浪泵');
  $('#o2').previousElementSibling.textContent='溶解氧 DO';$('#co2').previousElementSibling.textContent='酸碱度 pH';const th=document.querySelector('.zones thead');if(th)th.innerHTML='<tr><th>水质</th><th colspan="2"></th><th style="text-align:right">数值</th></tr>';
  dust.material.color.setHex(0xcfe6ee);dust.material.blending=THREE.NormalBlending;}
if(!MODE.stream&&!OCEAN)$('#pumpBtn').style.display='none';
{let arm=0;const hb=$('#homeBtn');if(hb)hb.addEventListener('click',()=>{if(Date.now()-arm<3000){location.reload();return;}arm=Date.now();hb.textContent='再点一次确认（当前缸不会保存）';setTimeout(()=>{hb.textContent='返回首页';},3000);});}

/* =================== loop =================== */
let last=performance.now(),uiT=0,panelT=0,scoreT=0;
function frame(now){requestAnimationFrame(frame);if(window.__freeze){last=now;return;}const rdt=Math.min(0.05,(now-last)/1000);last=now;const gdt=rdt*env.speed;
  if(gdt>0){const n=Math.ceil(gdt/0.1),st=gdt/n;for(let i=0;i<n;i++)simStep(st);o2T+=gdt;if(o2T>3){o2T=0;O2H.push(env.o2);if(O2H.length>240)O2H.shift();}}
  updateVisuals(rdt,gdt);applyCam(rdt);directorTick();updateLabels();sndListener();
  if(usePost())composer.render(rdt);else renderer.render(scene,camera);
  scoreT+=rdt;if(scoreT>1){scoreT=0;computeScore();checkContracts();refreshLocks();}
  uiT+=rdt;if(uiT>0.3){uiT=0;updateHUD();if(selected&&!$('#inspect').hidden&&!inspHover)renderInspect();if(logDirty&&!$('#tab-log').hidden){renderLog();logDirty=false;}}
  panelT+=rdt;if(panelT>1){panelT=0;if(!$('#tab-env').hidden)renderEnv();if(!$('#tab-contracts').hidden)renderContracts();if(!$('#tab-species').hidden)renderSpecies();}}
resize();renderQual();updateToggles();renderPalette();computeScore();renderContracts();renderEnv();renderSpecies();updateHUD();refreshTerrainWet();
{const t0=(env.time-0.25)*Math.PI*2;env.daylight=smooth(-0.05,0.22,Math.sin(t0));env.light=env.daylight;}
setMsg('就绪');
initPost().then(()=>{});
requestAnimationFrame(frame);
setTimeout(()=>{LOADED=true;$('#loading').classList.add('gone');},300);
setTimeout(()=>{$('#hint').style.opacity=0;},12000);
logEvent('info',`${MODE.name}启动。W A S D 移动镜头，试试打开“导演模式”`,null,0);
