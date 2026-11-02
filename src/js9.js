
/* =================== opening shot · director hand-off · onboarding chip =================== */
// The first minute decides whether the tank feels alive. Instead of dropping the player on a far-away
// overview behind two data panels, the tank introduces itself: an establishing shot of the whole tank,
// a slow glide down to one animal, then director mode keeps finding moments until the player takes over.
// Any input skips the intro. Rotating/zooming only pauses the director; navigating (WASD, panning) hands
// the camera to the player.
var INTRO=null;
const INTRO_LINE={mixed:'沙漠、草甸、溪沼、雨林连成一片',desert:'沙丘、仙人掌和晒太阳的沙蜥',meadow:'野花与蟋蟀，蝴蝶完成变态发育',
  marsh:'大水塘、香蒲和合唱的雨蛙',jungle:'瀑布、雾气、蕨类和夜里的萤火虫',ocean:'珊瑚礁、小丑鱼、螃蟹和伏击的海鳗'};
const HERO_PREF=['frog','clown','lizard','butterfly','mantis','crab','snail','grouper','cricket','damsel','shrimp','spider','isopod','ant'];
const HERO_FIRST={meadow:'butterfly',desert:'lizard',ocean:'clown'};  // the species each tank's card promises
const INTRO_PHI=0.98;  // arrival angle: a little overhead so dunes and plants don't hide the animal
const INTRO_HOLD=1.6,INTRO_GLIDE=7.4,INTRO_END=9.6;  // seconds: establishing shot, arrival, hand-off
const easeIO=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

// distance at which the whole tank fits on screen at the default viewing angle (portrait phones need more)
function fitR(){const vf=camera.fov*Math.PI/360,hf=Math.atan(Math.tan(vf)*camera.aspect);
  return clamp(Math.max((HW+2)/Math.tan(hf),(HD+2)/Math.tan(vf)),30,80);}

// a visible, characterful animal near the middle of the tank
function pickHero(){let best=null,bs=-Infinity;const pref=[...new Set([HERO_FIRST[MK],...HERO_PREF].filter(Boolean))];
  pref.forEach((k,i)=>{for(const a of pop[k]||[]){if(!a.alive||a.hidden||a.wrapped||a.stage==='egg'||a.stage==='pupa')continue;
    const s=(pref.length-i)*10-Math.abs(a.x)*0.35-Math.abs(a.z)*0.25-(a.stage&&a.stage!=='adult'?15:0);if(s>bs){bs=s;best=a;}}});
  if(!best){const pool=[];for(const k of SPK)for(const b of pop[k]||[])if(b.alive&&!b.hidden&&b.stage!=='egg')pool.push(b);if(pool.length)best=pick(pool);}
  return best;}

// arrival direction with the clearest line of sight: within ±90° of the planned angle, prefer the one whose
// camera→animal line passes farthest from tall plants (a saguaro in front of a lizard ruins the shot)
function clearTheta(h,r,phi,base){const sp=Math.sin(phi);let best=base,bs=-Infinity;
  for(let k=-3;k<=3;k++){const th=base+k*Math.PI/6,cx=h.x+r*sp*Math.sin(th),cz=h.z+r*sp*Math.cos(th),dx=cx-h.x,dz=cz-h.z,L2=dx*dx+dz*dz||1;
    let clear=3;for(const p of plants){if(!p.alive)continue;const ph=p.h*plantScale(p);if(ph<0.5)continue;
      const u=clamp(((p.x-h.x)*dx+(p.z-h.z)*dz)/L2,0.05,1),d=Math.hypot(p.x-(h.x+dx*u),p.z-(h.z+dz*u))-Math.max(0.2,ph*0.22);if(d<clear)clear=d;}
    const s=Math.min(clear,1.2)-Math.abs(k)*0.05;if(s>bs){bs=s;best=th;}}
  return best;}

function introStart(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r0=fitR(),th0=0.32,ph0=1.0;cam.follow=null;cam.t.set(0,1.2,0);cam.tT.copy(cam.t);cam.r=cam.tR=r0;cam.theta=cam.tTheta=th0;cam.phi=cam.tPhi=ph0;
  INTRO={t:reduce?INTRO_GLIDE:0,hero:pickHero(),from:{x:0,y:1.2,z:0,r:r0,theta:th0,phi:ph0},glass0:glassHidden};
  introGlass(true);  // the establishing shot looks in from outside: no lid bars or condensation in the way
  $('#introTitle').textContent=MODE.name;$('#introLine').textContent=INTRO_LINE[MK]||'';
  document.body.classList.add('intro');}

function introTick(dt){const I=INTRO;if(!I)return;I.t+=dt;
  let h=I.hero;if(!h||!h.alive||h.hidden){h=I.hero=pickHero();}
  const e=easeIO(clamp((I.t-INTRO_HOLD)/(INTRO_GLIDE-INTRO_HOLD),0,1)),F=I.from;
  if(h){const hs=followSize(h),hy=(h.y||heightAt(h.x,h.z))+0.06*hs,r1=hs*1.6;
    if(I.th1==null||I.th1h!==h){I.th1h=h;I.th1=clearTheta(h,r1,INTRO_PHI,F.theta+0.9);}
    cam.t.set(F.x+(h.x-F.x)*e,F.y+(hy-F.y)*e,F.z+(h.z-F.z)*e);
    cam.r=Math.exp(Math.log(F.r)+(Math.log(r1)-Math.log(F.r))*e);
    cam.theta=F.theta+(I.th1-F.theta)*e+Math.max(0,I.t-INTRO_GLIDE)*0.1;cam.phi=F.phi+(INTRO_PHI-F.phi)*e;}
  else cam.theta+=dt*0.05;  // nothing alive to visit: slow turntable
  cam.tT.copy(cam.t);cam.tR=cam.r;cam.tTheta=cam.theta;cam.tPhi=cam.phi;
  if(!I.capOff&&I.t>INTRO_GLIDE-1.4){I.capOff=true;$('#introCap').classList.add('off');}
  if(!I.named&&I.t>=INTRO_GLIDE&&h){I.named=true;caption(`${h.S.name}「${h.name}」`);}
  if(I.t>=INTRO_END)introEnd(false);}

// like setGlass() but temporary: doesn't touch the saved preference
function introGlass(h){glassHidden=h;GLASSY.forEach(o=>o.visible=!h);HEATROCKS.forEach(r=>r.parts&&r.parts.slice(1).forEach(o=>o.visible=!h));condT=1;}

function introEnd(byUser){const I=INTRO;if(!I)return;INTRO=null;document.body.classList.remove('intro');introGlass(I.glass0);
  const h=I.hero&&I.hero.alive&&!I.hero.hidden?I.hero:null;
  director.on=true;$('#dirBtn').setAttribute('aria-pressed','true');director.next=0;
  if(h){if(!I.named)caption(`${h.S.name}「${h.name}」`);selectEntity(h,true);startFollow(h,'orbit',true);director.prio=1;director.lockUntil=performance.now()+(byUser?6000:9000);}
  else director.lockUntil=0;
  restorePanels();renderTutHint();
  $('#hint').style.opacity=1;setTimeout(()=>{if(tool==='observe')$('#hint').style.opacity=0;},12000);
  setTimeout(()=>toast(`导演模式已开启：镜头会自动追踪捕猎、羽化和孵化。${IS_MOBILE?'双指拖动可以接管镜头':'拖动镜头或按 W A S D 随时接管'}`),byUser?200:700);}

// skip on any deliberate input; the event still reaches its normal handler
function introSkip(){if(INTRO)introEnd(true);}
canvas.addEventListener('pointerdown',introSkip,true);
canvas.addEventListener('wheel',introSkip,{capture:true,passive:true});
addEventListener('keydown',e=>{if(!INTRO||e.ctrlKey||e.metaKey||e.altKey||e.key==='Shift')return;if(e.key==='Escape'||e.key===' ')e.preventDefault();introSkip();},true);
$('#introSkip').addEventListener('click',introSkip);

/* director yields to the player */
let dirOffToasted=false;
function directorHold(ms){if(director.on&&!INTRO)director.lockUntil=Math.max(director.lockUntil,performance.now()+(ms||20000));}
function directorOff(){if(!director.on||INTRO)return;director.on=false;$('#dirBtn').setAttribute('aria-pressed','false');caption('');
  if(!dirOffToasted){dirOffToasted=true;toast('你接管了镜头。想继续自动观赏，点右上角的导演模式按钮');}}

/* side panels: closed by default so the tank gets the screen; desktop remembers what you opened */
const narrowUI=()=>matchMedia('(max-width:860px)').matches;
function setPanel(side,on){const el=$('#'+side),v=on==null?!el.classList.contains('open'):on;el.classList.toggle('open',v);
  if(v&&narrowUI())$('#'+(side==='left'?'right':'left')).classList.remove('open');
  const lo=$('#left').classList.contains('open');document.body.classList.toggle('left-open',lo);
  $('#leftToggle').setAttribute('aria-pressed',lo);$('#rightToggle').setAttribute('aria-pressed',$('#right').classList.contains('open'));
  syncOverlay();
  if(!narrowUI())try{localStorage.setItem('ark-panels',JSON.stringify({l:$('#left').classList.contains('open'),r:$('#right').classList.contains('open')}));}catch(e){}}
/* phones: one panel at a time over a dim backdrop. The × inside each panel, a tap on the backdrop
   and the system back gesture all close it (back would otherwise leave the game). */
var histArmed=false,histSkip=false;
function anyOverlay(){return !$('#settings').hidden||$('#left').classList.contains('open')||$('#right').classList.contains('open');}
function closeOverlays(){const s=$('#settings');if(!s.hidden){s.hidden=true;$('#setBtn').setAttribute('aria-pressed','false');}
  if($('#left').classList.contains('open'))setPanel('left',false);if($('#right').classList.contains('open'))setPanel('right',false);syncOverlay();}
function syncOverlay(){const sc=$('#scrim');if(!sc)return;const on=narrowUI()&&anyOverlay();sc.hidden=!on;if(on)$('#inspect').hidden=true;
  if(on&&!histArmed){try{history.pushState({arkOverlay:1},'');histArmed=true;}catch(e){}}
  else if(!on&&histArmed){histArmed=false;histSkip=true;try{history.back();}catch(e){histSkip=false;}}}
addEventListener('popstate',()=>{if(histSkip){histSkip=false;return;}if(histArmed){histArmed=false;closeOverlays();}});
$('#scrim').addEventListener('click',closeOverlays);
$$('.sheet-x[data-close]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const w=b.dataset.close;
  if(w==='settings'){$('#settings').hidden=true;$('#setBtn').setAttribute('aria-pressed','false');syncOverlay();}else setPanel(w,false);}));
function restorePanels(){if(narrowUI())return;try{const s=JSON.parse(localStorage.getItem('ark-panels')||'null');if(s){setPanel('left',!!s.l);setPanel('right',!!s.r);}}catch(e){}}

/* onboarding chip: the next 上手任务 stays visible even with the panels closed */
function renderTutHint(){const el=$('#tutHint');if(!el)return;const t=TUT.find(x=>!x.done);if(!t){el.hidden=true;return;}
  const n=TUT.filter(x=>x.done).length,txt=t.t;
  el.hidden=false;el.innerHTML=`<b>上手 ${n+1}/${TUT.length}</b><span>${txt}</span><em>+${t.r}</em>`;}
$('#tutHint').addEventListener('click',()=>{setPanel('left',true);const b=$('#left .tabs button[data-tab="contracts"]');if(b)b.click();});

/* =================== save / load =================== */
/* One autosave per tank in localStorage. Everything here is a function declaration so js6 can call
   readSave/restore* while it builds the world (they're hoisted; no module-level consts are touched early). */
function saveKey(k){return 'ark-save-'+(k||MK);}
function readSave(k){try{const s=localStorage.getItem(saveKey(k));if(!s)return null;const o=JSON.parse(s);return o&&o.v===1&&o.mk===(k||MK)?o:null;}catch(e){return null;}}
function saveMeta(k){try{const s=localStorage.getItem('ark-meta-'+k);return s?JSON.parse(s):null;}catch(e){return null;}}
function serializeWorld(){const r=v=>Math.round(v*1000)/1000;const E={};
  for(const k of['time','day','o2','co2','coins','lamp','pump','vent','pond','algae','heat','score','balanceDays','dayOk','sal','nut','plank','temp','visit','jx'])if(env[k]!==undefined)E[k]=env[k];
  E.zones=env.zones.map(z=>Object.assign({},z));
  const P=plants.filter(p=>p.alive).map(p=>[p.type,r(p.x),r(p.z),p.v,r(p.growth),r(p.health),r(p.size),r(p.rot),p.by!=null?r(p.by):null]);
  const A=[];for(const k of SPK)for(const a of pop[k]){if(!a.alive)continue;A.push({sp:k,x:r(a.x),z:r(a.z),y:r(a.y||0),h:r(a.h),st:a.stage,sc:r(a.scale),e:r(a.energy),ag:r(a.age),l:r(a.life),n:a.name,k:a.kills,d:a.kids,t:r(a.stageT||0),id:a.id,mu:a.mut?1:0,g:a.gen||0,pa:a.par,ga:a.gpar,pm:a.pmut?1:0});}
  return{v:1,mk:MK,ts:Date.now(),E,P,A,turf:Array.from(turf,v=>Math.round(v*100)/100),D:DECOR.map(d=>[d.type,r(d.x),r(d.z)]),
    C:contracts.map(c=>({k:c.tpl.k,n:c.n,b:c.base,r:c.reward,u:c.due})),S:stats,T:TUT.filter(t=>t.done).map(t=>t.k),col:colony?{x:colony.x,z:colony.z,store:colony.store}:null};}
let saveOff=false;
function saveNow(){if(saveOff||INTRO)return false;try{const o=serializeWorld();localStorage.setItem(saveKey(),JSON.stringify(o));
  const old=saveMeta(MK);localStorage.setItem('ark-meta-'+MK,JSON.stringify({day:env.day,ts:o.ts,a:o.A.length,p:o.P.length,name:old&&old.name||''}));return true;}catch(e){return false;}}
function clearSave(k){try{localStorage.removeItem(saveKey(k));localStorage.removeItem('ark-meta-'+(k||MK));}catch(e){}}
function restoreEnv(S){const E=S.E||{};for(const k in E)if(k!=='zones')env[k]=E[k];if(E.zones)env.zones.forEach((z,i)=>E.zones[i]&&Object.assign(z,E.zones[i]));
  env.waterY=waterLevelY();if(S.S)for(const k in S.S)stats[k]=S.S[k];if(S.turf)S.turf.forEach((v,i)=>{if(i<turf.length)turf[i]=v;});}
function restorePlants(S){for(const q of S.P||[]){if(!PT[q[0]])continue;const p=addPlant(q[0],q[1],q[2],q[4],q[3]);if(!p)continue;p.health=q[5];p.size=q[6];p.rot=q[7];if(q[8]!=null)p.by=q[8];placePlant(p);}}
function restoreAnimals(S){const idMap={};for(const q of S.A||[]){if(!SPK.includes(q.sp))continue;let a;try{a=new Agent(q.sp,q.x,q.z,{stage:q.st,scale:q.sc,energy:q.e,age:q.ag,name:q.n,h:q.h});}catch(e){continue;}
    a.life=q.l||a.life;a.kills=q.k||0;a.kids=q.d||0;if(q.t)a.stageT=q.t;if(a.flying&&q.y)a.y=q.y;
    a.gen=q.g||0;if(q.pa!=null)a.par=idMap[q.pa]!=null?idMap[q.pa]:-1;if(q.ga!=null)a.gpar=idMap[q.ga]!=null?idMap[q.ga]:-1;if(q.pm)a.pmut=1;if(q.mu)a.mut=1;if(q.id!=null)idMap[q.id]=a.id;
    if(q.sp==='butterfly'&&a.stage==='larva'&&!a.trail)a.trail=new Trail(0.45,a.x,a.z,a.h);}
  if(OCEAN)formSchools();}
/* damselfish share a waypoint per school so the shoal moves as one */
function formSchools(){const fish=(pop.damsel||[]).filter(a=>a.alive);const L=fish.filter(a=>a.x<0),R=fish.filter(a=>a.x>=0);
  for(const g of[L,R]){if(!g.length)continue;const sch={lead:g[0],tt:rand(3,6),wp:randWater()};sch.wp.y=g[0].y;g.forEach(a=>a.sch=sch);}}
function restoreContracts(S){for(const c of S.C||[]){const tpl=CT.find(t=>t.k===c.k);if(tpl)contracts.push({tpl,n:c.n,base:c.b,reward:c.r,due:c.u,id:++UID});}while(contracts.length<3){const n=contracts.length;newContract();if(contracts.length===n)break;}ctDirty=true;}
function restoreLate(S){for(const d of S.D||[]){if(!DECOR_T[d[0]])continue;const o=buildDecor(d[0],d[1],d[2]);DECOR.push(o);if(o.heat&&glassHidden)o.heat.parts.slice(1).forEach(m=>m.visible=false);if(o.air)env.airstones=(env.airstones||0)+1;}
  for(const k of S.T||[]){const t=TUT.find(x=>x.k===k);if(t)t.done=true;}renderTutHint();if(DECOR.length)refreshGrass();}
if(SAVE){restoreLate(SAVE);setTimeout(()=>toast(`已读取存档：${MODE.name} · 第 ${env.day} 天`),INTRO?10500:600);}
setInterval(saveNow,30000);
addEventListener('pagehide',saveNow);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow();});
{const hb=$('#homeBtn');if(hb){const nb=hb.cloneNode(true);hb.replaceWith(nb);nb.textContent='保存并返回首页';nb.addEventListener('click',()=>{saveNow();saveOff=true;location.reload();});}
  const rb=$('#resetBtn');let arm=0;if(rb)rb.addEventListener('click',()=>{if(Date.now()-arm>3000){arm=Date.now();rb.textContent='再点一次确认：清空这只缸的存档';setTimeout(()=>{rb.textContent='重新开始这只缸';},3000);return;}
    saveOff=true;clearSave();try{sessionStorage.setItem('ark-go',MK);}catch(e){}location.reload();});}
/* =================== save manager (home page) ===================
   One slot per tank. Rename only changes the label in the meta record; delete removes both keys.
   Export writes a JSON file with every save (or one); import validates it and overwrites matching tanks. */
function saveRecord(k){try{const raw=localStorage.getItem(saveKey(k));if(!raw)return null;return{data:JSON.parse(raw),meta:saveMeta(k)||{}};}catch(e){return null;}}
function fmtWhen(ts){if(!ts)return '';const d=new Date(ts),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;}
/* inside the claude.ai preview the page may not download directly; ask the viewer through the downloads capability there */
async function downloadJSON(obj,name){const txt=JSON.stringify(obj);
  if(window.claude&&typeof window.claude.use==='function'){const dl=await window.claude.use('downloads').catch(()=>null);if(dl){await dl.save({filename:name,data:txt});return;}}
  const b=new Blob([txt],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
function exportSaves(keys){const out={format:'glass-ark-saves',v:1,exported:Date.now(),saves:{}};try{const j=localStorage.getItem('ark-journal');if(j){out.journal=JSON.parse(j);out.journalPhotos={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('ark-jp-'))out.journalPhotos[k.slice(7)]=localStorage.getItem(k);}}}catch(e){}for(const k of keys){const r=saveRecord(k);if(r)out.saves[k]=r;}
  const n=Object.keys(out.saves).length;if(!n&&!out.journal)return Promise.resolve(0);const d=new Date(),p=x=>String(x).padStart(2,'0');
  return downloadJSON(out,`glass-ark-${keys.length===1?keys[0]:'saves'}-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`).then(()=>n);}
function importSaves(text){let o;try{o=JSON.parse(text);}catch(e){return{err:'文件不是有效的 JSON'};}
  if(!o||o.format!=='glass-ark-saves'||!o.saves||typeof o.saves!=='object')return{err:'这不是玻璃方舟的存档文件'};
  const ok=[],bad=[];for(const k in o.saves){const r=o.saves[k];const d=r&&r.data;
    if(!MODES[k]||!d||d.v!==1||d.mk!==k||!Array.isArray(d.P)||!Array.isArray(d.A)||!d.E){bad.push(k);continue;}
    const m=r.meta||{};const meta={day:+(d.E.day||m.day||1),ts:+(d.ts||m.ts||Date.now()),a:d.A.length,p:d.P.length,name:typeof m.name==='string'?m.name.slice(0,24):''};
    try{localStorage.setItem(saveKey(k),JSON.stringify(d));localStorage.setItem('ark-meta-'+k,JSON.stringify(meta));ok.push(k);}catch(e){return{err:'浏览器存储空间不足，导入失败'};}}
  if(o.journal&&o.journal.v===1&&o.journal.e){try{const cur=JSON.parse(localStorage.getItem('ark-journal')||'null')||{v:1,e:{},mut:{},fresh:0};
    for(const k in o.journal.e){const a=cur.e[k],b=o.journal.e[k];if(!a||(b.star||1)>(a.star||1))cur.e[k]=b;}Object.assign(cur.mut=cur.mut||{},o.journal.mut||{});localStorage.setItem('ark-journal',JSON.stringify(cur));
    for(const k in o.journalPhotos||{}){const v=o.journalPhotos[k];if(typeof v==='string'&&v.startsWith('data:image/jpeg')&&v.length<60000&&!localStorage.getItem('ark-jp-'+k))localStorage.setItem('ark-jp-'+k,v);}ok.push('journal');}catch(e){}}
  return{ok,bad};}
function initSaveManager(){const dlg=$('#saves'),list=$('#savesList'),msg=$('#savesMsg'),file=$('#saveFile');if(!dlg||dlg.dataset.ready)return;dlg.dataset.ready='1';
  const say=t=>{msg.textContent=t;};
  const render=()=>{list.innerHTML='';for(const k of Object.keys(MODES)){const M=MODES[k],m=saveMeta(k),has=!!m&&!!localStorage.getItem(saveKey(k));
      const li=document.createElement('li');if(!has)li.className='empty';
      li.innerHTML=`<img src="assets/home/card-${k}.webp" alt="" width="72" height="48"><div class="si"><div class="sn"></div><div class="sm"></div></div><div class="sa"></div>`;
      li.querySelector('.sn').textContent=has&&m.name?m.name:M.name;
      li.querySelector('.sm').textContent=has?`${m.name?M.name+' · ':''}第 ${m.day} 天 · ${m.a} 只动物 · ${m.p} 株植物 · ${fmtWhen(m.ts)}`:'还没有存档';
      const sa=li.querySelector('.sa');
      if(has){const mk=(t,f,c)=>{const b=document.createElement('button');b.type='button';b.textContent=t;if(c)b.className=c;b.addEventListener('click',f);sa.appendChild(b);return b;};
        mk('重命名',()=>{const sn=li.querySelector('.sn');const inp=document.createElement('input');inp.maxLength=24;inp.value=m.name||'';inp.placeholder=M.name;inp.setAttribute('aria-label',`${M.name}存档的名字`);sn.replaceWith(inp);inp.focus();inp.select();
          let fin=false;const done=keep=>{if(fin)return;fin=true;if(keep){const mm=saveMeta(k)||m;mm.name=inp.value.trim().slice(0,24);try{localStorage.setItem('ark-meta-'+k,JSON.stringify(mm));}catch(e){}say(mm.name?`已重命名为“${mm.name}”`:'已恢复默认名字');}render();homeDecorate();};
          inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();done(true);}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();done(false);}});inp.addEventListener('blur',()=>done(true),{once:true});});
        mk('导出',()=>{exportSaves([k]).then(()=>say(`已导出${M.name}的存档`),e=>say(e&&e.code==='declined'?'已取消导出':'这里不能下载文件'));});
        let arm=0;const del=mk('删除',()=>{if(Date.now()-arm>3000){arm=Date.now();del.textContent='确认删除';del.classList.add('armed');setTimeout(()=>{del.textContent='删除';del.classList.remove('armed');},3000);return;}
          clearSave(k);say(`已删除${M.name}的存档`);render();homeDecorate();},'danger');}
      list.appendChild(li);}
    $('#saveExportAll').disabled=!Object.keys(MODES).some(k=>localStorage.getItem(saveKey(k)));};
  const open=()=>{say('');render();if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');};
  $('#saveOpen').addEventListener('click',open);
  $('#savesClose').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
  $('#saveExportAll').addEventListener('click',()=>{exportSaves(Object.keys(MODES)).then(n=>say(n?`已导出 ${n} 个存档`:'没有可以导出的存档'),e=>say(e&&e.code==='declined'?'已取消导出':'这里不能下载文件'));});
  $('#saveImport').addEventListener('click',()=>file.click());
  file.addEventListener('change',()=>{const f=file.files&&file.files[0];file.value='';if(!f)return;if(f.size>5e6){say('文件太大，不像是存档');return;}
    f.text().then(t=>{const r=importSaves(t);J=null;if(r.err){say(r.err);return;}
      say(r.ok.length?`已导入：${r.ok.map(k=>k==='journal'?'缸中见闻录':MODES[k].name).join('、')}${r.bad.length?`；跳过 ${r.bad.length} 个无效存档`:''}`:'文件里没有可用的存档');render();homeDecorate();});});}
/* home page: "存档 · 第 N 天" badges on the cards, and the main button continues the mixed tank if it has a save */
function homeDecorate(){$$('#home .mode[data-mode]').forEach(b=>{const k=b.dataset.mode,m=saveMeta(k);const old=b.querySelector('.mode-save');if(old)old.remove();if(!m)return;
    const s=document.createElement('span');s.className='mode-save';s.textContent=`${m.name||'存档'} · 第 ${m.day} 天`;const im=b.querySelector('.mode-img');(im||b).appendChild(s);b.setAttribute('aria-label',`${b.querySelector('.mode-name')?.firstChild?.textContent||k}，继续第 ${m.day} 天`);});
  const m=saveMeta('mixed'),l=$('#ctaLabel');if(l)l.textContent=m?`继续混合生态缸 · 第 ${m.day} 天`:'打开混合生态缸';
  initSaveManager();initJournal();
  try{const go=sessionStorage.getItem('ark-go');if(go){sessionStorage.removeItem('ark-go');const b=document.querySelector(`#home .mode[data-mode="${go}"]`);if(b)setTimeout(()=>b.click(),0);}}catch(e){}}

introStart();
