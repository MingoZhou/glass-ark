
/* =================== keyboard camera (WASD) =================== */
const keys=new Set();
/* Space rises straight up, Ctrl sinks straight down (camera height, not zoom) */
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;const k=e.key.toLowerCase();
  if(k==='control'){keys.add('control');return;}if(e.ctrlKey||e.metaKey)return;
  if(k===' '){if(INTRO)return;e.preventDefault();if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur();keys.add(' ');return;}
  if((k.length===1&&'wasdqerf'.includes(k))||k.startsWith('arrow')||k==='shift'){keys.add(k);if(k.startsWith('arrow'))e.preventDefault();}});
addEventListener('keyup',e=>{if(e.key===' ')e.preventDefault();},true);
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
const _kd=new V3(),_kb=new V3();
function clampTarget(){const t=cam.tT;t.x=clamp(t.x,-HW+0.25,HW-0.25);t.z=clamp(t.z,-HD+0.35,HD-0.25);t.y=clamp(t.y,heightAt(t.x,t.z)+0.12,TOP-0.3);}
function camKeys(dt){if(!keys.size)return;const fast=keys.has('shift')?2.8:1;dt=Math.min(dt,0.05);
  let mx=0,mz=0;if(keys.has('w')||keys.has('arrowup'))mz+=1;if(keys.has('s')||keys.has('arrowdown'))mz-=1;if(keys.has('a')||keys.has('arrowleft'))mx-=1;if(keys.has('d')||keys.has('arrowright'))mx+=1;
  if(mx||mz){tutDone('cam');directorOff();if(cam.follow)stopFollow();if(cam.fmode==='eye'||cam.fmode==='chase')cam.fmode='orbit';const sp=(1.2+cam.r*0.32)*fast*dt;
    if(mz){camera.getWorldDirection(_kd);_kb.copy(cam.tT);cam.tT.addScaledVector(_kd,sp*mz);clampTarget();const moved=_kb.sub(cam.tT).multiplyScalar(-1).dot(_kd)*mz;const rest=sp-moved;
      if(rest>1e-4){const r0=cam.tR;cam.tR=clamp(cam.tR-rest*mz,0.8,80);const used=Math.abs(r0-cam.tR);if(rest-used>1e-4&&mz>0){_kd.y=0;if(_kd.lengthSq()>1e-6){_kd.normalize();cam.tT.addScaledVector(_kd,rest-used);clampTarget();}}}}
    if(mx){cam.tT.x+=Math.cos(cam.theta)*sp*mx;cam.tT.z+=-Math.sin(cam.theta)*sp*mx;clampTarget();}}
  const vy=(keys.has(' ')?1:0)-(keys.has('control')?1:0);if(vy){tutDone('cam');directorOff();if(cam.follow)stopFollow();if(cam.fmode==='eye'||cam.fmode==='chase')cam.fmode='orbit';const dy=vy*(1+cam.r*0.18)*fast*dt,y0=cam.tT.y;cam.tT.y+=dy;clampTarget();
    /* the target is already on the ground: keep sinking by lowering the eye itself (flatter angle), down to just above the ground */
    const left=dy-(cam.tT.y-y0);if(vy<0&&left<-1e-4){const h=cam.tR*Math.cos(cam.tPhi)+left;cam.tPhi=Math.min(1.56,Math.acos(clamp(h/cam.tR,-1,1)));}}
  if(keys.has('q')||keys.has('e')||keys.has('r')||keys.has('f'))directorHold();
  if(keys.has('q'))cam.tTheta+=1.5*dt*fast;if(keys.has('e'))cam.tTheta-=1.5*dt*fast;
  if(keys.has('r'))cam.tR=clamp(cam.tR*Math.exp(-1.3*dt*fast),0.6,80);if(keys.has('f'))cam.tR=clamp(cam.tR*Math.exp(1.3*dt*fast),0.6,80);}

/* =================== decor (landscaping) =================== */
const DECOR=[];sub.decor=OCEAN?'liverock':'boulder';if(!SPK.includes(sub.animal))sub.animal=SPK.find(k=>!SPEC[k].unlock)||SPK[0];if(!PLANT_KEYS.includes(sub.plant))sub.plant=PLANT_KEYS[0];
const DECOR_T=OCEAN?{
  liverock:{name:TR`活石`,cost:20,r:0.95,color:'#9a6a7a',hint:TR`珊瑚能长在上面，海鳗会躲进缝里`},
  arch:{name:TR`礁石拱门`,cost:55,r:1.7,color:'#b86a86',hint:TR`鱼群喜欢从拱门下穿过`},
  wreck:{name:TR`沉船残骸`,cost:80,r:1.9,color:'#6d5646',hint:TR`观赏值 +，也是海鳗的新巢穴`},
  airstone:{name:TR`气石`,cost:30,r:0.35,color:'#cfe6ee',hint:TR`持续冒泡，提高溶氧`},
}:{
  boulder:{name:TR`圆石`,cost:15,r:0.8,color:'#8a7a68',hint:TR`挡路、遮阴，给小动物躲藏`},
  slate:{name:TR`层岩`,cost:25,r:1.05,color:'#6f6a62',hint:TR`叠起来的片岩，蜥蜴爱爬`},
  wood:{name:TR`沉木`,cost:20,r:1.25,color:'#7a5a3e',hint:TR`慢慢腐朽，喂养鼠妇和蘑菇`},
  stump:{name:TR`树桩`,cost:18,r:0.6,color:'#8a6a48',hint:TR`潮湿处会长蘑菇`},
  fountain:{name:TR`小瀑布岩`,cost:60,r:1.15,color:'#7fc0cf',hint:TR`流水加湿周围，开水泵才运转`},
  heatrock:{name:TR`加热岩`,cost:45,r:0.85,color:'#d0703a',hint:TR`沙蜥早上在上面晒背`},
};
const wreckMat=new THREE.MeshStandardMaterial({map:TX.bark,normalMap:TX.barkN,color:0x8a7a6a,roughness:0.95});
const fountMat=fallMat.clone();fountMat.map=fallTex;
const basinMat=makeWaterMat({shal:0x8fb3a4,deep:0x1c4a44,fixed:0.35,abs:1.6,ns:0.45});
if(OCEAN&&typeof causticify==='function')causticify(wreckMat);
const zoneRockCol=(x,z)=>[[0xb07a58,false],[0x857563,false],[0x77756c,true],[0x6a6c66,true]][zoneAt(x,z)];
function decorOK(type,x,z,sc){const T=DECOR_T[type],r=T.r*(sc||1);if(Math.abs(x)>HW-r*0.8-0.2||z>HD-r*0.8-0.2)return{ok:false,msg:TR`太靠近玻璃了`};if(z<-HD+0.8+r*0.5)return{ok:false,msg:TR`太靠近后面了`};
  if(!OCEAN){for(let k=0;k<7;k++){const a=k/7*6.283,rr=k?r*0.8:0;if(inWater(x+Math.cos(a)*rr,z+Math.sin(a)*rr,0.05))return{ok:false,msg:TR`不能放在水里`};}}
  if(blocked(x,z,type==='airstone'?0:r*0.55))return{ok:false,msg:TR`和别的石头、树干重叠了`};if(DECOR.some(d=>Math.hypot(d.x-x,d.z-z)<d.r*0.6+r*0.6))return{ok:false,msg:TR`和别的布景重叠了`};
  if(colony&&Math.hypot(colony.x-x,colony.z-z)<r+0.7)return{ok:false,msg:TR`会压到蚁巢`};return{ok:true};}
function track(fn){const o0=OBST.length;const parts=fn()||[];return{parts,obst:OBST.slice(o0)};}
function buildDecor(type,x,z,opt){const yaw=opt&&opt.yaw!=null?opt.yaw:rand(0,6.283),sc=type==='heatrock'?1:clamp(opt&&opt.s||1,0.5,2),gy=heightAt(x,z),ao=[];let parts=[],extra={};const o0=OBST.length;
  const ctr=(ax,az)=>[x+Math.cos(yaw)*ax-Math.sin(yaw)*az,z+Math.sin(yaw)*ax+Math.cos(yaw)*az];
  if(type==='boulder'){const [c,moss]=zoneRockCol(x,z),r=rand(0.62,0.85);parts.push(addRock(x,z,r,c,moss,rand(0.65,0.85)));ao.push([x,z,r*1.5,0.35]);}
  else if(type==='slate'){const [c,moss]=zoneRockCol(x,z);const a=addRock(x,z,1.0,c,moss,0.26);ao.push([x,z,1.5,0.35]);const [x2,z2]=ctr(0.2,-0.1);const b=addRock(x2,z2,0.72,c,moss,0.28,false);b.position.y=a.position.y+0.34;const [x3,z3]=ctr(-0.1,0.12);const d=addRock(x3,z3,0.45,c,moss,0.32,false);d.position.y=b.position.y+0.26;parts.push(a,b,d);OBST[OBST.length-1].top=d.position.y+0.15;}
  else if(type==='wood'){const M=new Mesher();const L=2.3,pts=[];for(let i=0;i<5;i++){const t=i/4-0.5;const [px,pz]=ctr(t*L,Math.sin(t*3+yaw)*0.2);pts.push(new V3(px,heightAt(px,pz)+0.16-(t*t)*0.1,pz));}
    addTube(M,pts,0.26,0.14,new Col(0xffffff),14,1,0,3);const [bx,bz]=ctr(0.3,0);const br=[pts[2].clone(),new V3(bx,pts[2].y+0.5,bz+0.35),new V3(bx+0.25,pts[2].y+0.9,bz+0.5)];addTube(M,br,0.1,0.03,new Col(0xffffff),8,1,0,1);
    const g=M.geo();colorize(g,0xd8c8b4,0.18,(px,py,pz,c)=>{if(py>heightAt(px,pz)+0.3&&fbm(px*3,pz*3,2)>0.5)c.set(0x6a9a40);});const m=new THREE.Mesh(g,MATS.bark);m.castShadow=m.receiveShadow=true;tank.add(m);parts.push(m);
    for(const t of[-0.3,0.3]){const [ox,oz]=ctr(t*L,0);OBST.push({x:ox,z:oz,r:0.45,top:gy+0.4});}ao.push([x,z,1.4,0.3]);extra.rot=1;}
  else if(type==='stump'){const M=new Mesher();const base=new V3(x,gy-0.1,z);addTube(M,[base,new V3(x,gy+0.35,z),new V3(x+0.02,gy+0.62,z)],0.46,0.38,new Col(0xffffff),16,1,0,2);
    for(let k=0;k<5;k++){const a=yaw+k*1.26+rand(-0.2,0.2);addTube(M,[new V3(x+Math.cos(a)*0.25,gy+0.25,z+Math.sin(a)*0.25),new V3(x+Math.cos(a)*0.6,gy+0.05,z+Math.sin(a)*0.6),new V3(x+Math.cos(a)*0.85,gy-0.08,z+Math.sin(a)*0.85)],0.14,0.04,new Col(0xffffff),8,1,0,1);}
    const g=M.geo();colorize(g,0xc4ac8c,0.15,(px,py,pz,c)=>{if(fbm(px*4,py*4+pz,2)>0.58)c.set(0x5f8a3a);});const m=new THREE.Mesh(g,MATS.bark);m.castShadow=m.receiveShadow=true;tank.add(m);
    const topM=new THREE.Mesh(new THREE.CircleGeometry(0.37,28),new THREE.MeshStandardMaterial({map:TX.rings||null,color:0xc9a878,roughness:0.9}));topM.rotation.x=-Math.PI/2;topM.position.set(x+0.02,gy+0.61,z);topM.receiveShadow=true;tank.add(topM);
    parts.push(m,topM);OBST.push({x,z,r:0.5,top:gy+0.62});ao.push([x,z,1.1,0.3]);extra.rot=1;}
  else if(type==='fountain'){const [c,moss]=zoneRockCol(x,z);const [bx,bz]=ctr(0,-0.5);const back=addRock(bx,bz,0.74,c,true,1.3);ao.push([bx,bz,1.3,0.35]);
    const top=back.position.y+0.74*1.3*0.9;const [lx,lz]=ctr(0,0.08);const lip=addRock(lx,lz,0.38,c,moss,0.3,false);lip.position.y=top-0.12;
    const [fx,fz]=ctr(0,0.42);const H=top-0.1-gy;
    const g=new THREE.PlaneGeometry(0.3,H,1,10);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++){uv.setY(i,1-uv.getY(i));const t=(H/2-p.getY(i))/H;p.setX(i,p.getX(i)*(1+t*0.5));p.setZ(i,t*t*0.22);}g.computeVertexNormals();
    const sheet=new THREE.Mesh(g,fountMat);sheet.position.set(fx,gy+H/2,fz);sheet.rotation.y=-yaw;sheet.renderOrder=3;tank.add(sheet);
    const [px2,pz2]=ctr(0,0.82);const basin=new THREE.Mesh(new THREE.CircleGeometry(0.45,32),basinMat);basin.rotation.x=-Math.PI/2;basin.position.set(px2,heightAt(px2,pz2)+0.06,pz2);basin.renderOrder=2;tank.add(basin);
    const ring=[];for(let k=0;k<7;k++){const a=k/7*6.283;const rx=px2+Math.cos(a)*0.52,rz=pz2+Math.sin(a)*0.52;ring.push(addRock(rx,rz,rand(0.12,0.19),c,moss,0.7,false));}
    parts.push(back,lip,sheet,basin,...ring);extra.fount={x:px2,y:basin.position.y,z:pz2,fx,fz,sheet};}
  else if(type==='heatrock'){const hr=addHeatRock({x,z,bulb:null,mesh:null},false);parts=hr.parts;extra.heat=hr;ao.push([x,z,1.6,0.3]);}
  else if(type==='liverock'){const r=rand(0.7,1.05);parts.push(addLiveRock(x,z,r,rand(0.7,0.95)));ao.push([x,z,r*1.5,0.3]);}
  else if(type==='arch'){const M=new Mesher();const [ax,az]=ctr(-1.35,0),[bx,bz]=ctr(1.35,0),[m1x,m1z]=ctr(-0.7,0),[m2x,m2z]=ctr(0.7,0);const top=rand(1.8,2.4);
    addTubeR(M,[new V3(ax,heightAt(ax,az)-0.2,az),new V3(m1x,gy+top*0.85,m1z),new V3(m2x,gy+top,m2z),new V3(bx,heightAt(bx,bz)-0.2,bz)],[0.62,0.42,0.4,0.6],WHITE,16,1,0,3);
    const g=M.geo();colorize(g,0x7a6a78,0.25,(px,py,pz,c)=>{const f=fbm(px*1.5,pz*1.5+py,2);if(f>0.55)c.set(0xb86a86);else if(f<0.35)c.set(0x5a7a4a);});const m=new THREE.Mesh(g,MATS.rock);m.castShadow=m.receiveShadow=true;tank.add(m);parts.push(m);
    OBST.push({x:ax,z:az,r:0.55,top:gy+1.2},{x:bx,z:bz,r:0.55,top:gy+1.2});ao.push([ax,az,1.1,0.3],[bx,bz,1.1,0.3]);}
  else if(type==='wreck'){const G=new THREE.Group();G.position.set(x,gy-0.15,z);G.rotation.set(0,yaw,rand(0.18,0.32));
    const add=(geo,px,py,pz,rx,ry,rz)=>{const m=new THREE.Mesh(geo,wreckMat);m.position.set(px,py,pz);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=m.receiveShadow=true;G.add(m);return m;};
    add(new THREE.BoxGeometry(3.3,0.18,0.24),0,0.1,0);add(new THREE.BoxGeometry(0.2,1.1,0.22),1.62,0.55,0,0,0,-0.35);
    for(let i=0;i<7;i++){const arc=i===2||i===5?Math.PI*0.55:Math.PI;const rib=add(new THREE.TorusGeometry(0.72,0.055,6,14,arc),-1.35+i*0.45,0.78,0,0,Math.PI/2,Math.PI);rib.scale.set(1,1.05,1);}
    for(let k=0;k<6;k++){const th=0.25+k*0.24;for(const side of[-1,1]){if(side>0&&k>2)continue;if(Math.random()<0.28)continue;const len=rand(1.6,3.1);add(new THREE.BoxGeometry(len,0.05,0.2),rand(-0.2,0.2)+(3.1-len)*(Math.random()<0.5?-0.5:0.5),0.78-0.74*Math.cos(th),side*0.74*Math.sin(th),side*th,0,0);}}
    add(new THREE.CylinderGeometry(0.06,0.09,2.4,8),0.3,0.5,0.9,1.25,0,0.2);add(new THREE.BoxGeometry(0.5,0.35,0.4),-0.9,0.25,0.25,0,0.4,0.1);
    tank.add(G);parts.push(G);for(const t of[-0.8,0.8]){const [ox,oz]=ctr(t,0);OBST.push({x:ox,z:oz,r:0.85,top:gy+0.9});}ao.push([x,z,2.2,0.35]);}
  else if(type==='airstone'){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.14,14),new THREE.MeshStandardMaterial({color:0xd8e2e4,roughness:0.95}));m.position.set(x,gy+0.05,z);m.castShadow=true;tank.add(m);parts.push(m);extra.air=1;}
  /* player scale: everything about the decor's foot point — meshes, footprint, contact shadow */
  if(sc!==1){const M=new THREE.Matrix4().makeTranslation(x,gy,z).multiply(new THREE.Matrix4().makeScale(sc,sc,sc)).multiply(new THREE.Matrix4().makeTranslation(-x,-gy,-z));
    for(const p of parts)p.applyMatrix4(M);for(const o of OBST.slice(o0)){o.x=x+(o.x-x)*sc;o.z=z+(o.z-z)*sc;o.r*=sc;if(o.top!=null)o.top=gy+(o.top-gy)*sc;}
    for(const a of ao){a[0]=x+(a[0]-x)*sc;a[1]=z+(a[1]-z)*sc;a[2]*=sc;}}
  for(const a of ao)stampAO(...a);
  return{type,x,z,yaw,s:sc,r:DECOR_T[type].r*sc,parts,obst:OBST.slice(o0),ao,cost:DECOR_T[type].cost,...extra};}
function clearUnder(x,z,r){let n=0;for(const p of plants){if(!p.alive||p.T.water)continue;if(Math.hypot(p.x-x,p.z-z)<r+(p.T.single?0.3:0)){removeLitter(p);n++;}}
  for(let j=0;j<TNZ;j++)for(let i=0;i<TNX;i++){const cx=-HW+i+0.5,cz=-HD+j+0.5;if(Math.hypot(cx-x,cz-z)<r*0.8){const c=j*TNX+i;turf[c]=Math.min(turf[c],0.05);}}
  if(n)flushPlants();refreshGrass();return n;}
function removeLitter(p){if(p.T.single)stampAO(p.x,p.z,1.8,0.3,true);removePlant(p,false);}
function placeDecor(type,x,z,opt){const sc=opt&&opt.s||1,ok=decorOK(type,x,z,sc);if(!ok.ok){toast(ok.msg);return null;}const T=DECOR_T[type];if(!spend(T.cost))return null;
  const n=clearUnder(x,z,T.r*sc*0.85);const d=buildDecor(type,x,z,opt);DECOR.push(d);decorChanged();if(d.heat&&glassHidden)d.heat.parts.slice(1).forEach(o=>o.visible=false);if(d.air)env.airstones=(env.airstones||0)+1;bumpExcite(2);tutDone('decor');
  toast(TR`摆放 <b>${T.name}</b>　${costTxt(T.cost)}${n?TR`　（挪走了 ${n} 株植物）`:''}`);logEvent('info',TR`你摆放了${T.name}`,null,0);return d;}
function removeDecor(d,quiet){const i=DECOR.indexOf(d);if(i<0)return;DECOR.splice(i,1);if(DSEL&&DSEL.d===d&&!quiet)decorDeselect();
  for(const m of d.parts){tank.remove(m);m.traverse&&m.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  for(const o of d.obst){const j=OBST.indexOf(o);if(j>=0)OBST.splice(j,1);}for(const a of d.ao)stampAO(a[0],a[1],a[2],a[3],true);
  if(d.heat){const j=HEATROCKS.indexOf(d.heat);if(j>=0)HEATROCKS.splice(j,1);}if(d.air)env.airstones=Math.max(0,(env.airstones||0)-1);
  decorChanged();
  for(const k of SPK)for(const a of pop[k])if(a.home&&d.obst.includes(a.home)){const rs=OBST.filter(o=>o.top!=null&&o.r>0.7);if(rs.length&&SPEC[k].init)SPEC[k].init(a);}
  if(quiet)return;const g=MODE.create&&env.cphase==='build'?0:Math.round(d.cost*0.5);env.coins+=g;toast(TR`移除了${DECOR_T[d.type].name}${g?TR`　+${g} 孢子`:''}`);}
/* ---- editing a placed decor: select it, then rotate / resize / move / remove from a small card ---- */
var DSEL=null;
function decorRing(){if(decorRing.l)return decorRing.l;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(64*3),3));
  const l=new THREE.LineLoop(g,new THREE.LineBasicMaterial({color:0xf0b25a,transparent:true,opacity:0.95,depthTest:false}));l.renderOrder=20;l.frustumCulled=false;l.visible=false;tank.add(l);return decorRing.l=l;}
function decorRingUpdate(){const l=decorRing(),d=DSEL&&DSEL.d;if(!d){l.visible=false;return;}l.visible=true;const a=l.geometry.attributes.position.array,R=d.r*0.85+0.15,pulse=DSEL.moving?0.5+0.5*Math.sin(performance.now()/160):1;
  for(let i=0;i<64;i++){const t=i/64*6.2832,x=clamp(d.x+Math.cos(t)*R,-HW,HW),z=clamp(d.z+Math.sin(t)*R,-HD,HD);a[i*3]=x;a[i*3+1]=heightAt(x,z)+0.05;a[i*3+2]=z;}l.geometry.attributes.position.needsUpdate=true;l.material.opacity=0.45+0.5*pulse;l.material.color.set(DDRAG.d&&!DDRAG.valid?0xff6a4a:0xf0b25a);}
function decorSelect(d){DSEL={d,moving:false};const T=DECOR_T[d.type];$('#deName').textContent=T.name;$('#decorEdit').hidden=false;$('#deScale').textContent=Math.round(d.s*100)+'%';
  $$('#decorEdit [data-de="smaller"],#decorEdit [data-de="bigger"]').forEach(b=>b.disabled=d.type==='heatrock');$('#decorEdit').classList.remove('moving');decorRingUpdate();}
function decorDeselect(){DSEL=null;$('#decorEdit').hidden=true;decorRingUpdate();}
/* rebuild the decor with a new angle / size / place; if the new spot is not allowed it goes back where it was */
function decorEdit(d,ch){const i=DECOR.indexOf(d);if(i<0)return null;const nx=ch.x!=null?ch.x:d.x,nz=ch.z!=null?ch.z:d.z,yaw=d.yaw+(ch.dyaw||0),s=clamp(d.s*(ch.ds||1),0.5,2);
  removeDecor(d,true);const ok=decorOK(d.type,nx,nz,s);
  const n=ok.ok?build(nx,nz,s):(build(d.x,d.z,d.s),toast(ok.msg),null);return n;
  function build(x,z,sc){const o=buildDecor(d.type,x,z,{yaw,s:sc});DECOR.splice(i,0,o);if(o.heat&&glassHidden)o.heat.parts.slice(1).forEach(m=>m.visible=false);if(o.air)env.airstones=(env.airstones||0)+1;
    if(sc>d.s||x!==d.x||z!==d.z)clearUnder(x,z,o.r*0.85);decorChanged();if(DSEL&&DSEL.d===d){DSEL.d=o;$('#deScale').textContent=Math.round(o.s*100)+'%';}decorRingUpdate();return o;}}
function decorAction(a){if(!DSEL)return;const d=DSEL.d;
  if(a==='left')decorEdit(d,{dyaw:Math.PI/8});else if(a==='right')decorEdit(d,{dyaw:-Math.PI/8});
  else if(a==='smaller'){if(d.s<=0.51){toast(TR`已经是最小了`);return;}decorEdit(d,{ds:1/1.15});}else if(a==='bigger'){if(d.s>=1.99){toast(TR`已经是最大了`);return;}decorEdit(d,{ds:1.15});}
  else if(a==='move'){DSEL.moving=!DSEL.moving;$('#decorEdit').classList.toggle('moving',DSEL.moving);if(DSEL.moving)toast(TR`点击缸里的新位置，把它挪过去`);}
  else if(a==='copy')decorCopy(d);
  else if(a==='remove'){decorDeselect();removeDecor(d);}else if(a==='close')decorDeselect();}
/* grass under a stone or a log is hidden, and grows back once the piece is moved away */
function decorChanged(){DECOR_COVER.length=0;for(const d of DECOR){DECOR_COVER.push([d.x,d.z,d.r*0.85]);for(const o of d.obst)if(o.top!=null||o.r>0.2)DECOR_COVER.push([o.x,o.z,o.r*0.92]);}if(!OCEAN)refreshGrass();}
/* a copy of the selected piece, same angle and size, in the nearest free spot next to it */
function decorCopy(d){for(let ring=0;ring<4;ring++)for(let k=0;k<12;k++){const an=k/12*6.2832+ring*0.26,R=d.r*(2.05+ring*0.8),x=d.x+Math.cos(an)*R,z=d.z+Math.sin(an)*R;
    if(Math.abs(x)>HW-0.4||Math.abs(z)>HD-0.4||!decorOK(d.type,x,z,d.s).ok)continue;const n=placeDecor(d.type,x,z,{yaw:d.yaw,s:d.s});if(n)decorSelect(n);return;}
  toast(TR`旁边没有地方放复制品了`);}
/* ---- press and drag a placed piece: it slides over the ground, stays inside the glass, and settles on release ---- */
const DDRAG={d:null};const _rc=new THREE.Raycaster();
function decorPick(ray){_rc.set(ray.origin,ray.direction);let best=null,bd=1e9;for(const d of DECOR){const h=_rc.intersectObjects(d.parts,true)[0];if(h&&h.distance<bd){bd=h.distance;best=d;}}
  if(!best){const h=groundHit(ray);if(h)best=decorAt(h.x,h.z);}return best;}
function decorDragOK(){return !!(DDRAG.d&&DDRAG.valid);}
addEventListener('pointerdown',e=>{if(e.target!==canvas||e.button!==0||!e.isPrimary||DDRAG.d||INTRO)return;if(tool!=='observe'&&tool!=='decor')return;
  if(typeof CRE!=='undefined'&&CRE.brush&&MODE.create&&env.cphase==='build')return;if(DSEL&&DSEL.moving)return;
  const ray=rayFrom(e);if(tool==='observe'&&pickEntity(ray))return;const d=decorPick(ray);if(!d)return;
  e.stopImmediatePropagation();e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  const g=groundHit(ray)||{x:d.x,z:d.z};DDRAG.d=d;DDRAG.id=e.pointerId;DDRAG.sx=e.clientX;DDRAG.sy=e.clientY;DDRAG.moved=false;DDRAG.ox=d.x;DDRAG.oz=d.z;DDRAG.cx=d.x;DDRAG.cz=d.z;DDRAG.offx=g.x-d.x;DDRAG.offz=g.z-d.z;DDRAG.valid=true;
  for(const o of d.obst){const j=OBST.indexOf(o);if(j>=0)OBST.splice(j,1);}},{capture:true});
function decorDragTo(nx,nz){const d=DDRAG.d,dy=heightAt(nx,nz)-heightAt(DDRAG.cx,DDRAG.cz),dx=nx-DDRAG.cx,dz=nz-DDRAG.cz;for(const p of d.parts){p.position.x+=dx;p.position.y+=dy;p.position.z+=dz;}DDRAG.cx=nx;DDRAG.cz=nz;}
addEventListener('pointermove',e=>{if(!DDRAG.d||e.pointerId!==DDRAG.id)return;e.stopImmediatePropagation();const d=DDRAG.d;
  if(!DDRAG.moved){if(Math.hypot(e.clientX-DDRAG.sx,e.clientY-DDRAG.sy)<7)return;DDRAG.moved=true;decorSelect(d);$('#decorEdit').classList.add('dragging');}
  const h=groundHit(rayFrom(e));if(!h)return;const R=d.r+0.12,nx=clamp(h.x-DDRAG.offx,-HW+R,HW-R),nz=clamp(h.z-DDRAG.offz,-HD+0.8+d.r*0.5,HD-R);
  decorDragTo(nx,nz);d.x=nx;d.z=nz;DDRAG.valid=decorOK(d.type,nx,nz,d.s).ok;decorRingUpdate();},{capture:true});
function decorDragEnd(e,cancel){if(!DDRAG.d||(e&&e.pointerId!==DDRAG.id))return;if(e)e.stopImmediatePropagation();const d=DDRAG.d,moved=DDRAG.moved;DDRAG.d=null;$('#decorEdit').classList.remove('dragging');
  if(!moved){for(const o of d.obst)OBST.push(o);if(selected)deselect();decorSelect(d);return;}
  const nx=DDRAG.cx,nz=DDRAG.cz;d.x=DDRAG.ox;d.z=DDRAG.oz;
  if(cancel){decorDragTo(DDRAG.ox,DDRAG.oz);for(const o of d.obst)OBST.push(o);decorRingUpdate();return;}
  decorEdit(d,{x:nx,z:nz});}
addEventListener('pointerup',e=>decorDragEnd(e,false),{capture:true});addEventListener('pointercancel',e=>decorDragEnd(e,true),{capture:true});
addEventListener('pointerdown',e=>{if(DDRAG.d&&e.pointerId!==DDRAG.id)decorDragEnd(null,true);},{capture:true});
/* ---- the whole layout: copy as JSON, import, back to the tank's original look ---- */
function layoutJSON(){return JSON.stringify({game:'glass-ark',kind:'layout',v:1,tank:MK,decor:DECOR.map(d=>[d.type,+d.x.toFixed(2),+d.z.toFixed(2),+(d.yaw||0).toFixed(3),+(d.s||1).toFixed(2)])});}
async function layoutCopy(){const t=layoutJSON();let ok=false;try{await navigator.clipboard.writeText(t);ok=true;}catch(e){}
  if(!ok){const ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try{ok=document.execCommand('copy');}catch(e){}ta.remove();}
  if(ok)toast(TR`已复制布局（${DECOR.length} 件布景），以后可以在“导入布局”里粘贴`);else layoutDialog(t);}
function layoutFree(){return MODE.create&&env.cphase==='build';}
function layoutApply(list){const free=layoutFree();let cost=0,refund=0;const good=list.filter(r=>Array.isArray(r)&&DECOR_T[r[0]]&&isFinite(r[1])&&isFinite(r[2])&&Math.abs(r[1])<HW&&Math.abs(r[2])<HD);
  if(!free){for(const r of good)cost+=DECOR_T[r[0]].cost;for(const d of DECOR)refund+=Math.round(d.cost*0.5);if(env.coins+refund<cost){toast(TR`孢子不够：这套布局需要 ${cost} 孢子，现有 ${env.coins} + 拆掉旧布景退回 ${refund}`);return false;}}
  decorDeselect();for(const d of DECOR.slice())removeDecor(d,true);let n=0,skip=0;
  for(const r of good){const s=clamp(+r[4]||1,0.5,2);if(!decorOK(r[0],r[1],r[2],s).ok){skip++;continue;}clearUnder(r[1],r[2],DECOR_T[r[0]].r*s*0.85);const d=buildDecor(r[0],r[1],r[2],{yaw:+r[3]||0,s});DECOR.push(d);if(d.heat&&glassHidden)d.heat.parts.slice(1).forEach(o=>o.visible=false);if(d.air)env.airstones=(env.airstones||0)+1;n++;}
  if(!free){env.coins+=refund;let c=0;for(const d of DECOR)c+=d.cost;env.coins=Math.max(0,env.coins-c);}decorChanged();saveNow();
  toast(TR`导入了 ${n} 件布景${skip?TR`，${skip} 件放不下跳过了`:''}${free?'':TR`　花费 ${cost} 孢子，退回 ${refund}`}`);return true;}
function layoutDialog(prefill){const dlg=$('#layoutDlg');$('#layoutText').value=prefill||'';$('#layoutErr').textContent='';dlg.showModal?dlg.showModal():dlg.setAttribute('open','');}
function layoutImport(){let j=null;try{j=JSON.parse($('#layoutText').value.trim());}catch(e){}
  if(!j||j.kind!=='layout'||!Array.isArray(j.decor)){$('#layoutErr').textContent=TR`看起来不是玻璃方舟的布局数据，请粘贴“复制布局”得到的整段文字`;return;}
  if(j.tank&&(j.tank==='ocean')!==OCEAN){$('#layoutErr').textContent=OCEAN?TR`这是陆地缸的布局，海洋缸用不了`:TR`这是海洋缸的布局，陆地缸用不了`;return;}
  if(layoutApply(j.decor))$('#layoutDlg').close();}
let layoutSure=0;
function layoutReset(btn){if(!DECOR.length){toast(TR`现在就是原始的样子，没有摆放布景`);return;}if(performance.now()-layoutSure>5000){layoutSure=performance.now();btn.textContent=TR`再点一次确认`;toast(TR`再点一次“恢复默认”，会拆掉所有摆放的布景`);setTimeout(()=>{if(performance.now()-layoutSure>=4900)btn.textContent=TR`恢复默认`;},5000);return;}
  layoutSure=0;const free=layoutFree();let refund=0;decorDeselect();for(const d of DECOR.slice()){if(!free)refund+=Math.round(d.cost*0.5);removeDecor(d,true);}env.coins+=refund;decorChanged();toast(TR`已恢复默认布局${refund?TR`，退回 ${refund} 孢子`:''}`);btn.textContent=TR`恢复默认`;}
$$('#decorEdit [data-de]').forEach(b=>b.addEventListener('click',()=>decorAction(b.dataset.de)));
$('#layoutGo').addEventListener('click',()=>layoutImport());
$$('#layBar [data-lay]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.lay;if(a==='copy')layoutCopy();else if(a==='import')layoutDialog('');else layoutReset(b);}));
function decorAt(x,z){let best=null,bd=1e9;for(const d of DECOR){const dd=Math.hypot(d.x-x,d.z-z);if(dd<d.r*0.95&&dd<bd){bd=dd;best=d;}}return best;}
let shovelRef=0,shovelN=0,shovelT=0;
function shovelAt(ray,h,brush){if(!brush){const ent=pickEntity(ray);if(ent&&ent.kind==='plant'){digPlant(ent);flushPlants();shovelToast();return;}if(h){const d=decorAt(h.x,h.z);if(d){removeDecor(d);return;}}}
  if(!h)return;let n=0;for(const p of plants){if(!p.alive)continue;if(Math.hypot(p.x-h.x,p.z-h.z)<(brush?0.5:0.4)+(p.T.single?0.3:0)){digPlant(p);n++;if(!brush)break;}}
  if(n){flushPlants();shovelToast();}else if(!brush)toast(TR`这里没有可以铲的植物`);}
function digPlant(p){if(!p.alive)return;const g=PT[p.type].cost*0.3;shovelRef+=g;shovelN++;env.coins+=g;if(selected===p)deselect();removeLitter(p);}
function shovelToast(){clearTimeout(shovelT);shovelT=setTimeout(()=>{if(shovelN)toast(TR`铲除了 ${shovelN} 株植物${shovelRef>=0.5&&!(MODE.create&&env.cphase==='build')?TR`　+${Math.round(shovelRef)} 孢子`:''}`);shovelN=0;shovelRef=0;},350);}
function decorSim(dt){for(const d of DECOR){
    if(d.fount&&env.pump){const z=env.zones[zoneAt(d.x,d.z)];z.m=Math.min(1,z.m+(0.82-z.m)*0.0015*dt);z.h=Math.min(1,z.h+(0.85-z.h)*0.0012*dt);}
    if(d.rot&&!OCEAN&&Math.random()<0.0015*dt){const z=env.zones[zoneAt(d.x,d.z)];z.fert=Math.min(1.2,z.fert+0.01);if(z.h>0.6&&plants.filter(p=>p.type==='mushroom').length<45){const a=rand(0,6.28),x=d.x+Math.cos(a)*d.r*0.9,zz=d.z+Math.sin(a)*d.r*0.9;if(!inWater(x,zz)&&!blocked(x,zz,0)&&spacingOK(x,zz,0.2)){addPlant('mushroom',x,zz,0.15,irand(0,2));stats.mush++;jot('mushroom',{x,z:zz});flushPlants();}}}}}
/* bubbles (ocean) */
const BN=OCEAN?500:1,bubPos=new Float32Array(BN*3).fill(-100),bubs=[];for(let i=0;i<BN;i++)bubs.push({t:1,x:0,y:-100,z:0,v:0,w:0});
const bubGeo=new THREE.BufferGeometry();bubGeo.setAttribute('position',new THREE.BufferAttribute(bubPos,3));
const bubPts=new THREE.Points(bubGeo,new THREE.PointsMaterial({map:TX.bubble||TX.soft,color:0xe8f8ff,size:0.09,transparent:true,opacity:0.85,depthWrite:false}));bubPts.frustumCulled=false;bubPts.renderOrder=8;if(OCEAN)tank.add(bubPts);let bubPtr=0;
function bubble(x,y,z,v){const b=bubs[bubPtr++%BN];b.t=0;b.x=x;b.y=y;b.z=z;b.v=v||rand(0.9,1.5);b.w=rand(0,6.28);}
function decorFX(rdt){for(const d of DECOR){if(d.fount&&env.pump&&Math.random()<rdt*14)splash(d.fount.fx+rand(-0.12,0.12),d.fount.y,d.fount.fz+rand(-0.05,0.2),1);if(d.fount)d.fount.sheet.visible=env.pump;
    if(d.air){let n=rdt*28;while(n>0){if(n<1&&Math.random()>n)break;n--;bubble(d.x+rand(-0.06,0.06),heightAt(d.x,d.z)+0.14,d.z+rand(-0.06,0.06));}}}
  if(!OCEAN)return;if(Math.random()<rdt*1.5){const p=plants.length?pick(plants):null;if(p&&p.alive&&(p.T.coral||p.type==='seagrass'||p.type==='kelp')&&env.light>0.4)bubble(p.x+rand(-0.1,0.1),plantTop(p),p.z+rand(-0.1,0.1),rand(0.5,0.8));}
  for(let i=0;i<BN;i++){const b=bubs[i];if(b.t<1)b.t+=rdt*0.1;if(b.t>=1||b.y<-50){bubPos[i*3+1]=-100;b.t=1;continue;}b.w+=rdt*8;b.y+=b.v*rdt;b.x+=Math.sin(b.w)*0.12*rdt;b.z+=Math.cos(b.w*0.8)*0.1*rdt;if(b.y>=WT-0.02){b.t=1;bubPos[i*3+1]=-100;continue;}bubPos[i*3]=b.x;bubPos[i*3+1]=b.y;bubPos[i*3+2]=b.z;}
  bubGeo.attributes.position.needsUpdate=true;}
