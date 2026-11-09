
/* =================== creative mode: build phase =================== */
/* Before the tank is opened time is frozen and everything is free: paint substrates, sculpt the ground,
   place hardscape and plants. 开缸 starts the clock; after that the tank plays like any other. */
var CRE={brush:null,size:1.2,stroke:null,hover:null,hit:null,undo:[],ring:null,dirty:null,painted:false};
function inBuild(){return !!MODE.create&&env.cphase==='build';}
function creRing(){if(CRE.ring)return CRE.ring;const N=72,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3*2),3));
  const m=new THREE.LineBasicMaterial({color:0xf0b25a,transparent:true,opacity:0.95,depthTest:false});const l=new THREE.LineSegments(g,m);l.renderOrder=20;l.frustumCulled=false;l.visible=false;tank.add(l);CRE.ring=l;return l;}
function ringUpdate(){const l=creRing(),h=CRE.hit;if(!h||!CRE.brush||!inBuild()){l.visible=false;return;}l.visible=true;
  const a=l.geometry.attributes.position.array,M=36,R=CRE.brush.k==='water'||CRE.brush.k==='drain'?0.35:CRE.size;let k=0;
  const pt=(t,r)=>{const x=clamp(h.x+Math.cos(t)*r,-HW,HW),z=clamp(h.z+Math.sin(t)*r,-HD,HD);a[k++]=x;a[k++]=heightAt(x,z)+0.04;a[k++]=z;};
  for(let i=0;i<M;i++){const t0=i/M*6.2832,t1=(i+1)/M*6.2832;pt(t0,R);pt(t1,R);}
  for(let i=0;i<M;i++){const t0=i/M*6.2832,t1=(i+0.5)/M*6.2832;pt(t0,R*0.4);pt(t1,R*0.4);}
  l.geometry.attributes.position.needsUpdate=true;
  l.material.color.set(CRE.brush.k==='mat'?CMAT[CRE.brush.m].c:CRE.brush.k==='lower'?0x82c7d7:CRE.brush.k==='water'?0x6fc3e0:CRE.brush.k==='drain'?0xd98a5a:0xf0b25a).lerp(new Col(0xffffff),0.35);}
function dirtyAdd(x0,z0,x1,z1){const d=CRE.dirty;if(!d)CRE.dirty=[x0,z0,x1,z1];else{d[0]=Math.min(d[0],x0);d[1]=Math.min(d[1],z0);d[2]=Math.max(d[2],x1);d[3]=Math.max(d[3],z1);}}
/* one brush application at (hx,hz) over dt seconds */
function brushApply(hx,hz,dt){const R=CRE.size,B=CRE.brush,step=W/GX;
  const i0=clamp(Math.floor((hx-R+HW)/step),0,GX),i1=clamp(Math.ceil((hx+R+HW)/step),0,GX),j0=clamp(Math.floor((hz-R+HD)/step),0,GZ),j1=clamp(Math.ceil((hz+R+HD)/step),0,GZ);
  let src=null;if(B.k==='smooth'){src=new Float32Array((i1-i0+3)*(j1-j0+3));for(let j=j0-1;j<=j1+1;j++)for(let i=i0-1;i<=i1+1;i++)src[(j-j0+1)*(i1-i0+3)+(i-i0+1)]=HG[clamp(j,0,GZ)*GR+clamp(i,0,GX)];}
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=-HW+i*step,z=-HD+j*step,d=Math.hypot(x-hx,z-hz)/R;if(d>=1)continue;const f=smooth(1,0.35,d),g=j*GR+i;
    if(B.k==='mat'){if(Math.random()<f*dt*9)MATG[g]=B.m;}
    else if(B.k==='raise'||B.k==='lower'){const top=lerp(6,3.6,smooth(4,HD,z));HG[g]=clamp(HG[g]+(B.k==='raise'?1:-1)*1.25*dt*Math.pow(f,1.4),-0.8,top);}
    else{const w=i1-i0+3,c=(j-j0+1)*w+(i-i0+1);let a=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)a+=src[c+dj*w+di];HG[g]=lerp(HG[g],a/9,clamp(f*dt*8,0,1));}}
  if(B.k==='mat')CRE.painted=true;
  terrUpdate(hx-R,hz-R,hx+R,hz+R);dirtyAdd(hx-R,hz-R,hx+R,hz+R);}
/* after a stroke (or undo): recompute climate, decor contact shadows and everything that sits on the ground */
function creSettle(full){const d=full?[-HW,-HD,HW,HD]:CRE.dirty;CRE.dirty=null;if(!d)return;const repaint=full||CRE.painted;
  computeUG();const hits=DECOR.filter(o=>(o.ao||[]).some(a=>a[0]+a[2]>d[0]&&a[0]-a[2]<d[2]&&a[1]+a[2]>d[1]&&a[1]-a[2]<d[3]));
  for(const o of hits)for(const a of o.ao){d[0]=Math.min(d[0],a[0]-a[2]);d[1]=Math.min(d[1],a[1]-a[2]);d[2]=Math.max(d[2],a[0]+a[2]);d[3]=Math.max(d[3],a[1]+a[2]);}
  terrUpdate(d[0]-1,d[1]-1,d[2]+1,d[3]+1);
  for(const o of DECOR)for(const a of o.ao||[])if(a[0]+a[2]>d[0]-1&&a[0]-a[2]<d[2]+1&&a[1]+a[2]>d[1]-1&&a[1]-a[2]<d[3]+1)stampAO(...a);
  refreshTerrainWet();
  for(const o of DECOR){if(o._h0==null)continue;const dy=heightAt(o.x,o.z)-o._h0;o._h0=null;if(Math.abs(dy)>1e-4)for(const p of o.parts)if(p&&p.position)p.position.y+=dy;}
  for(const p of plants)if(p.alive)placePlant(p);flushPlants();
  creWaterSync(true);buildGroundCover();regrowGrass();buildSubstrate();if(repaint)bdBuild();}
/* water: after the ground or the ponds change, re-flood every pond, redraw it, and drown / strand plants */
function creWaterSync(reflood){if(reflood){const lost=creWaterRebuild();if(lost)toast(lost>1?TR`有 ${lost} 处水塘的坑被填平了，水已经流走`:TR`有一处水塘的坑被填平了，水已经流走`);}
  wtexHeights();wtexLevels(true);creWaterMeshes();if(WCUBE)WCUBE.dirty=true;let n=0;
  for(const p of plants){if(!p.alive)continue;p.mbP=null;const wet=inWater(p.x,p.z,0.05);if(p.T.water?!inPond(p.x,p.z,0.02):wet){removePlant(p);n++;}}
  if(n){flushPlants();toast(TR`${n} 株植物被水淹掉或搁浅了，已经移走`);}}
function creWaterClick(x,z,kind){const at=gIdx(x,z);
  if(kind==='drain'){const i=CPONDS.findIndex(p=>p.cells.includes(at)||(CWL[at]>HG[at]&&Math.abs(CWL[at]-p.level)<1e-4));if(i<0){toast(TR`这里没有水`);return;}
    creSnapshot();CPONDS.splice(i,1);creWaterRebuild();creWaterSync(false);buildGroundCover();regrowGrass();toast(TR`抽干了这片水`);return;}
  if(CPONDS.some(p=>p.cells.includes(at))){toast(TR`这里已经有水了`);return;}
  const r=creFloodAt(x,z);if(r.err){toast(r.err==='small'?TR`坑太小了，先用“挖低”挖大一点`:TR`这里太浅了，先用“挖低”挖出一个坑，水会涨到坑边为止`);return;}
  creSnapshot();CPONDS.push({x,z,cells:[]});creWaterRebuild();creWaterSync(false);buildGroundCover();regrowGrass();
  const p=CPONDS[CPONDS.length-1];toast(TR`注满了一片水塘，最深 ${(p.level-HG[gIdx(x,z)]).toFixed(1)} 格`);}
function creSnapshot(){CRE.undo.push({h:HG.slice(),m:MATG.slice(),w:CPONDS.map(p=>({x:p.x,z:p.z,cells:[]}))});if(CRE.undo.length>25)CRE.undo.shift();$('#bbUndo').disabled=false;for(const o of DECOR)o._h0=heightAt(o.x,o.z);}
function creUndo(){const s=CRE.undo.pop();$('#bbUndo').disabled=!CRE.undo.length;if(!s){toast(TR`没有可以撤销的步骤`);return;}
  for(const o of DECOR)o._h0=heightAt(o.x,o.z);HG.set(s.h);MATG.set(s.m);CPONDS.length=0;CPONDS.push(...(s.w||[]));creSettle(true);}

/* pointer: a held brush paints; everything else (other buttons, second finger) falls through to the camera */
addEventListener('pointerdown',e=>{if(e.target!==canvas||!inBuild()||!CRE.brush||e.button!==0||!e.isPrimary||CRE.stroke)return;
  e.stopImmediatePropagation();e.preventDefault();
  if(CRE.brush.k==='water'||CRE.brush.k==='drain'){const h=groundHit(rayFrom(e));if(h)creWaterClick(h.x,h.z,CRE.brush.k);return;}
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  creSnapshot();CRE.stroke={id:e.pointerId};CRE.hover={clientX:e.clientX,clientY:e.clientY};if(typeof initSound==='function')initSound();},{capture:true});
addEventListener('pointermove',e=>{if(!inBuild()||!CRE.brush)return;if(CRE.stroke&&e.pointerId!==CRE.stroke.id)return;if(e.target!==canvas&&!CRE.stroke){CRE.hover=null;return;}
  CRE.hover={clientX:e.clientX,clientY:e.clientY};if(CRE.stroke)e.stopImmediatePropagation();},{capture:true});
const creEnd=e=>{if(!CRE.stroke||e.pointerId!==CRE.stroke.id)return;e.stopImmediatePropagation();CRE.stroke=null;creSettle(false);if(CRE.painted){CRE.painted=false;}};
addEventListener('pointerup',creEnd,{capture:true});addEventListener('pointercancel',creEnd,{capture:true});
canvas.addEventListener('pointerleave',()=>{if(!CRE.stroke)CRE.hover=null;});
let creLast=performance.now();
function creTick(now){requestAnimationFrame(creTick);const dt=Math.min(0.05,(now-creLast)/1000);creLast=now;if(!MODE.create)return;
  CRE.hit=CRE.hover&&CRE.brush&&inBuild()?groundHit(rayFrom(CRE.hover)):null;
  if(CRE.stroke&&CRE.hit)brushApply(CRE.hit.x,CRE.hit.z,dt);ringUpdate();}

/* ---- build bar ---- */
const BB_HINT={mat:TR`按住拖动铺上`,raise:TR`按住拖动抬高地面，堆出山坡`,lower:TR`按住拖动挖低地面`,smooth:TR`按住拖动把地面抹平`,water:TR`点一下低洼处注水，水会涨到坑边为止`,drain:TR`点一下水面，把这片水抽干`};
function setBrush(b){CRE.brush=b;if(b&&tool!=='observe')setTool('observe');
  $$('#bbMats .bb-m').forEach(x=>x.setAttribute('aria-pressed',!!b&&b.k==='mat'&&+x.dataset.m===b.m?'true':'false'));
  $$('#buildbar [data-brush]').forEach(x=>x.setAttribute('aria-pressed',!!b&&b.k===x.dataset.brush?'true':'false'));
  $$('#buildbar [data-btool]').forEach(x=>x.setAttribute('aria-pressed',!b&&tool===x.dataset.btool?'true':'false'));
  canvas.classList.toggle('paint',!!b||tool!=='observe');
  const h=$('#hint');h.textContent=b?(b.k==='mat'?TR`${BB_HINT.mat}${CMAT[b.m].n} · 右键或双指拖动旋转镜头`:BB_HINT[b.k]+TR` · 右键或双指拖动旋转镜头`):tool==='observe'?TR`拖动旋转镜头 · 选一种底材或工具开始造景`:h.textContent;h.style.opacity=1;}
function bbTool(t){if(t!=='observe'&&tool===t)t='observe';CRE.brush=null;setTool(t);setBrush(null);}
function creInitUI(){const box=$('#bbMats');box.innerHTML='';
  CMAT.forEach((M,i)=>{const b=document.createElement('button');b.type='button';b.className='bb-m';b.dataset.m=i;b.setAttribute('aria-pressed','false');
    b.innerHTML=`<i style="background:linear-gradient(135deg,#${new Col(M.c2).getHexString()},#${new Col(M.c).getHexString()})"></i>${M.n}`;
    b.addEventListener('click',()=>setBrush(CRE.brush&&CRE.brush.k==='mat'&&CRE.brush.m===i?null:{k:'mat',m:i}));box.appendChild(b);});
  $$('#buildbar [data-brush]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.brush;setBrush(CRE.brush&&CRE.brush.k===k?null:{k});}));
  $$('#buildbar [data-btool]').forEach(b=>b.addEventListener('click',()=>bbTool(b.dataset.btool)));
  const sz=$('#bbSize');sz.addEventListener('input',()=>{CRE.size=+sz.value;});CRE.size=+sz.value;
  $('#bbUndo').addEventListener('click',creUndo);$('#bbUndo').disabled=true;
  $('#bbOpen').addEventListener('click',()=>{const np=plants.filter(p=>p.alive).length,nd=DECOR.length;
    $('#openSum').textContent=TR`现在缸里有 ${np} 株植物、${nd} 件布景。开缸后会给你 150 孢子，用来投放第一批动物。`;const d=$('#openDlg');d.showModal?d.showModal():d.setAttribute('open','');});
  $('#openNo').addEventListener('click',()=>$('#openDlg').close());
  $('#openYes').addEventListener('click',()=>{$('#openDlg').close();creOpen();});
  addEventListener('keydown',e=>{if(!inBuild()||e.target.closest&&e.target.closest('input,textarea'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();creUndo();}
    else if(e.key==='Escape'&&CRE.brush){setBrush(null);}
    else if(e.key==='['||e.key===']'){CRE.size=clamp(CRE.size+(e.key===']'?0.2:-0.2),0.4,3);sz.value=CRE.size;}});
  /* the tool buttons (plant/decor/shovel) keep their pressed state in step with the bar */
  const st=setTool;setTool=function(t){st(t);if(inBuild()){if(t!=='observe')CRE.brush=null;$$('#buildbar [data-btool]').forEach(x=>x.setAttribute('aria-pressed',!CRE.brush&&tool===x.dataset.btool&&t!=='observe'?'true':'false'));
    $$('#bbMats .bb-m,#buildbar [data-brush]').forEach(x=>{if(!CRE.brush)x.setAttribute('aria-pressed','false');});}};}
function creEnterBuild(){document.body.classList.add('build');CRE.glass0=glassHidden;introGlass(true);$('#buildbar').hidden=false;setSpeed(0);director.on=false;$('#dirBtn').setAttribute('aria-pressed','false');
  cam.follow=null;cam.tT.set(0,1.0,0);cam.tR=fitR()*0.92;cam.tTheta=0.0;cam.tPhi=0.92;
  const h=$('#hint');h.textContent=TR`选一种底材，在缸里按住拖动铺开 · 抬高 / 挖低塑造地形 · 造景期间一切免费`;h.style.opacity=1;}
function creOpen(){env.cphase='live';CRE.brush=null;CRE.stroke=null;CRE.undo.length=0;ringUpdate();document.body.classList.remove('build');$('#buildbar').hidden=true;introGlass(!!CRE.glass0);
  setTool('observe');env.coins=150;setSpeed(1);director.on=true;$('#dirBtn').setAttribute('aria-pressed','true');director.next=0;
  if(!contracts.length)for(let i=0;i<3;i++)newContract();restorePanels();renderTutHint();
  toast(TR`开缸了！时间开始流动。点“投放”放入第一批动物，<b>+150 孢子</b>`);logEvent('life',TR`你打开了亲手布置的创造缸`,null,2);saveNow();}
function creStart(){creInitUI();if(env.cphase!=='live')env.cphase='build';requestAnimationFrame(creTick);
  if(inBuild()){creEnterBuild();}
  else{director.on=true;$('#dirBtn').setAttribute('aria-pressed','true');restorePanels();renderTutHint();}}
/* glass fit for everything else already in the tank (decor, vines, ground cover, substrate pebbles, animals):
   skip the shell itself — terrain, substrate wall, glass layers, lid hardware and the stand */
(function(){const T=new THREE.Box3(),ex=new Set(),inc=new Set();
  tank.traverse(o=>{if(!o.isMesh&&!o.isInstancedMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];
    let skip=o===terrain||o===SUBMESH||o.userData.noFit||GLASSY.includes(o);
    if(!skip){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();T.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);if(T.min.y<BOT-0.05||(!o.isInstancedMesh&&T.min.y>TOP-1))skip=true;}
    for(const m of ms){if(!m)continue;if(skip||(m.transparent&&!m.depthWrite))ex.add(m);else inc.add(m);}});
  for(const m of inc)if(!ex.has(m))glassFit(m);})();
if(MODE.create)creStart();
