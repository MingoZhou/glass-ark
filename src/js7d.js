
/* =================== keyboard camera (WASD) =================== */
const keys=new Set();
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();if((k.length===1&&'wasdqerf'.includes(k))||k.startsWith('arrow')||k==='shift'){keys.add(k);if(k.startsWith('arrow'))e.preventDefault();}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
const _kd=new V3(),_kb=new V3();
function clampTarget(){const t=cam.tT;t.x=clamp(t.x,-HW+0.25,HW-0.25);t.z=clamp(t.z,-HD+0.35,HD-0.25);t.y=clamp(t.y,heightAt(t.x,t.z)+0.12,TOP-0.3);}
function camKeys(dt){if(!keys.size)return;const fast=keys.has('shift')?2.8:1;dt=Math.min(dt,0.05);
  let mx=0,mz=0;if(keys.has('w')||keys.has('arrowup'))mz+=1;if(keys.has('s')||keys.has('arrowdown'))mz-=1;if(keys.has('a')||keys.has('arrowleft'))mx-=1;if(keys.has('d')||keys.has('arrowright'))mx+=1;
  if(mx||mz){tutDone('cam');if(cam.follow)stopFollow();if(cam.fmode==='eye'||cam.fmode==='chase')cam.fmode='orbit';const sp=(1.2+cam.r*0.32)*fast*dt;
    if(mz){camera.getWorldDirection(_kd);_kb.copy(cam.tT);cam.tT.addScaledVector(_kd,sp*mz);clampTarget();const moved=_kb.sub(cam.tT).multiplyScalar(-1).dot(_kd)*mz;const rest=sp-moved;
      if(rest>1e-4){const r0=cam.tR;cam.tR=clamp(cam.tR-rest*mz,0.8,80);const used=Math.abs(r0-cam.tR);if(rest-used>1e-4&&mz>0){_kd.y=0;if(_kd.lengthSq()>1e-6){_kd.normalize();cam.tT.addScaledVector(_kd,rest-used);clampTarget();}}}}
    if(mx){cam.tT.x+=Math.cos(cam.theta)*sp*mx;cam.tT.z+=-Math.sin(cam.theta)*sp*mx;clampTarget();}}
  if(keys.has('q'))cam.tTheta+=1.5*dt*fast;if(keys.has('e'))cam.tTheta-=1.5*dt*fast;
  if(keys.has('r'))cam.tR=clamp(cam.tR*Math.exp(-1.3*dt*fast),0.6,80);if(keys.has('f'))cam.tR=clamp(cam.tR*Math.exp(1.3*dt*fast),0.6,80);}

/* =================== decor (landscaping) =================== */
const DECOR=[];sub.decor=OCEAN?'liverock':'boulder';if(!SPK.includes(sub.animal))sub.animal=SPK.find(k=>!SPEC[k].unlock)||SPK[0];if(!PLANT_KEYS.includes(sub.plant))sub.plant=PLANT_KEYS[0];
const DECOR_T=OCEAN?{
  liverock:{name:'活石',cost:20,r:0.95,color:'#9a6a7a',hint:'珊瑚能长在上面，海鳗会躲进缝里'},
  arch:{name:'礁石拱门',cost:55,r:1.7,color:'#b86a86',hint:'鱼群喜欢从拱门下穿过'},
  wreck:{name:'沉船残骸',cost:80,r:1.9,color:'#6d5646',hint:'观赏值 +，也是海鳗的新巢穴'},
  airstone:{name:'气石',cost:30,r:0.35,color:'#cfe6ee',hint:'持续冒泡，提高溶氧'},
}:{
  boulder:{name:'圆石',cost:15,r:0.8,color:'#8a7a68',hint:'挡路、遮阴，给小动物躲藏'},
  slate:{name:'层岩',cost:25,r:1.05,color:'#6f6a62',hint:'叠起来的片岩，蜥蜴爱爬'},
  wood:{name:'沉木',cost:20,r:1.25,color:'#7a5a3e',hint:'慢慢腐朽，喂养鼠妇和蘑菇'},
  stump:{name:'树桩',cost:18,r:0.6,color:'#8a6a48',hint:'潮湿处会长蘑菇'},
  fountain:{name:'小瀑布岩',cost:60,r:1.15,color:'#7fc0cf',hint:'流水加湿周围，开水泵才运转'},
  heatrock:{name:'加热岩',cost:45,r:0.85,color:'#d0703a',hint:'沙蜥早上在上面晒背'},
};
const wreckMat=new THREE.MeshStandardMaterial({map:TX.bark,normalMap:TX.barkN,color:0x8a7a6a,roughness:0.95});
const fountMat=fallMat.clone();fountMat.map=fallTex;
const basinMat=new THREE.MeshStandardMaterial({color:0x2a4a45,roughness:0.05,transparent:true,opacity:0.75,normalMap:TX.waterN,normalScale:new V2(0.4,0.4),depthWrite:false});
if(OCEAN&&typeof causticify==='function')causticify(wreckMat);
const zoneRockCol=(x,z)=>[[0xb07a58,false],[0x857563,false],[0x77756c,true],[0x6a6c66,true]][zoneAt(x,z)];
function decorOK(type,x,z){const T=DECOR_T[type],r=T.r;if(Math.abs(x)>HW-r*0.8-0.2||z>HD-r*0.8-0.2)return{ok:false,msg:'太靠近玻璃了'};if(z<-HD+0.8+r*0.5)return{ok:false,msg:'太靠近后面的岩壁了'};
  if(!OCEAN){for(let k=0;k<7;k++){const a=k/7*6.283,rr=k?r*0.8:0;if(inWater(x+Math.cos(a)*rr,z+Math.sin(a)*rr,0.05))return{ok:false,msg:'不能放在水里'};}}
  if(blocked(x,z,type==='airstone'?0:r*0.55))return{ok:false,msg:'和别的石头、树干重叠了'};if(DECOR.some(d=>Math.hypot(d.x-x,d.z-z)<d.r*0.6+r*0.6))return{ok:false,msg:'和别的布景重叠了'};
  if(colony&&Math.hypot(colony.x-x,colony.z-z)<r+0.7)return{ok:false,msg:'会压到蚁巢'};return{ok:true};}
function track(fn){const o0=OBST.length;const parts=fn()||[];return{parts,obst:OBST.slice(o0)};}
function buildDecor(type,x,z){const yaw=rand(0,6.283),gy=heightAt(x,z),ao=[];let parts=[],extra={};const o0=OBST.length;
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
  for(const a of ao)stampAO(...a);
  return{type,x,z,r:DECOR_T[type].r,parts,obst:OBST.slice(o0),ao,cost:DECOR_T[type].cost,...extra};}
function clearUnder(x,z,r){let n=0;for(const p of plants){if(!p.alive||p.T.water)continue;if(Math.hypot(p.x-x,p.z-z)<r+(p.T.single?0.3:0)){removeLitter(p);n++;}}
  for(let j=0;j<TNZ;j++)for(let i=0;i<TNX;i++){const cx=-HW+i+0.5,cz=-HD+j+0.5;if(Math.hypot(cx-x,cz-z)<r*0.8){const c=j*TNX+i;turf[c]=Math.min(turf[c],0.05);}}
  if(n)flushPlants();refreshGrass();return n;}
function removeLitter(p){if(p.T.single)stampAO(p.x,p.z,1.8,0.3,true);removePlant(p,false);}
function placeDecor(type,x,z){const ok=decorOK(type,x,z);if(!ok.ok){toast(ok.msg);return;}const T=DECOR_T[type];if(!spend(T.cost))return;
  const n=clearUnder(x,z,T.r*0.85);const d=buildDecor(type,x,z);DECOR.push(d);if(d.heat&&glassHidden)d.heat.parts.slice(1).forEach(o=>o.visible=false);if(d.air)env.airstones=(env.airstones||0)+1;bumpExcite(2);tutDone('decor');
  toast(`摆放 <b>${T.name}</b>　−${T.cost} 孢子${n?`　（挪走了 ${n} 株植物）`:''}`);logEvent('info',`你摆放了${T.name}`,null,0);}
function removeDecor(d){const i=DECOR.indexOf(d);if(i<0)return;DECOR.splice(i,1);
  for(const m of d.parts){tank.remove(m);m.traverse&&m.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  for(const o of d.obst){const j=OBST.indexOf(o);if(j>=0)OBST.splice(j,1);}for(const a of d.ao)stampAO(a[0],a[1],a[2],a[3],true);
  if(d.heat){const j=HEATROCKS.indexOf(d.heat);if(j>=0)HEATROCKS.splice(j,1);}if(d.air)env.airstones=Math.max(0,(env.airstones||0)-1);
  for(const k of SPK)for(const a of pop[k])if(a.home&&d.obst.includes(a.home)){const rs=OBST.filter(o=>o.top!=null&&o.r>0.7);if(rs.length&&SPEC[k].init)SPEC[k].init(a);}
  const g=Math.round(d.cost*0.5);env.coins+=g;toast(`移除了${DECOR_T[d.type].name}　+${g} 孢子`);}
function decorAt(x,z){let best=null,bd=1e9;for(const d of DECOR){const dd=Math.hypot(d.x-x,d.z-z);if(dd<d.r*0.95&&dd<bd){bd=dd;best=d;}}return best;}
let shovelRef=0,shovelN=0,shovelT=0;
function shovelAt(ray,h,brush){if(!brush){const ent=pickEntity(ray);if(ent&&ent.kind==='plant'){digPlant(ent);flushPlants();shovelToast();return;}if(h){const d=decorAt(h.x,h.z);if(d){removeDecor(d);return;}}}
  if(!h)return;let n=0;for(const p of plants){if(!p.alive)continue;if(Math.hypot(p.x-h.x,p.z-h.z)<(brush?0.5:0.4)+(p.T.single?0.3:0)){digPlant(p);n++;if(!brush)break;}}
  if(n){flushPlants();shovelToast();}else if(!brush)toast('这里没有可以铲的植物');}
function digPlant(p){if(!p.alive)return;const g=PT[p.type].cost*0.3;shovelRef+=g;shovelN++;env.coins+=g;if(selected===p)deselect();removeLitter(p);}
function shovelToast(){clearTimeout(shovelT);shovelT=setTimeout(()=>{if(shovelN)toast(`铲除了 ${shovelN} 株植物　+${Math.round(shovelRef)} 孢子`);shovelN=0;shovelRef=0;},350);}
function decorSim(dt){for(const d of DECOR){
    if(d.fount&&env.pump){const z=env.zones[zoneAt(d.x,d.z)];z.m=Math.min(1,z.m+(0.82-z.m)*0.0015*dt);z.h=Math.min(1,z.h+(0.85-z.h)*0.0012*dt);}
    if(d.rot&&!OCEAN&&Math.random()<0.0015*dt){const z=env.zones[zoneAt(d.x,d.z)];z.fert=Math.min(1.2,z.fert+0.01);if(z.h>0.6&&plants.filter(p=>p.type==='mushroom').length<45){const a=rand(0,6.28),x=d.x+Math.cos(a)*d.r*0.9,zz=d.z+Math.sin(a)*d.r*0.9;if(!inWater(x,zz)&&!blocked(x,zz,0)&&spacingOK(x,zz,0.2)){addPlant('mushroom',x,zz,0.15,irand(0,2));stats.mush++;flushPlants();}}}}}
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
