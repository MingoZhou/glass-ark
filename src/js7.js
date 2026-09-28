
/* =================== post-processing =================== */
let composer=null,bloomPass=null,bokehPass=null;
async function initPost(){try{const [a,b,c,d,e]=await Promise.all([import('three/addons/postprocessing/EffectComposer.js'),import('three/addons/postprocessing/RenderPass.js'),import('three/addons/postprocessing/UnrealBloomPass.js'),import('three/addons/postprocessing/OutputPass.js'),import('three/addons/postprocessing/BokehPass.js')]);
  const rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:4});composer=new a.EffectComposer(renderer,rt);composer.addPass(new b.RenderPass(scene,camera));
  bokehPass=new e.BokehPass(scene,camera,{focus:10,aperture:0.002,maxblur:0.008});bokehPass.enabled=false;composer.addPass(bokehPass);
  bloomPass=new c.UnrealBloomPass(new V2(256,256),0.42,0.55,0.9);composer.addPass(bloomPass);composer.addPass(new d.OutputPass());resize();}catch(err){console.warn('post-processing unavailable',err);composer=null;}}
function usePost(){return composer&&(Q.bloom||Q.dof);}

/* =================== camera rig =================== */
const cam={t:new V3(0,1.6,0),tT:new V3(0,1.6,0),theta:0.32,phi:1.06,r:46,tTheta:0.32,tPhi:1.06,tR:46,follow:null,fmode:'orbit',eyeLook:new V3()};
const SIZE={ant:0.9,cricket:1.3,snail:1.2,butterfly:1.6,isopod:1,firefly:1.3,spider:1.4,mantis:2,frog:2.1,lizard:3.4,snake:4.6,damsel:1.5,clown:1.5,jelly:2.2,shrimp:1.2,crab:1.8,starfish:1.8,urchin:1.5,grouper:3.6,moray:4.4};
function followSize(a){if(a.sp==='frog'&&a.stage!=='adult')return 1.1;if(a.sp==='butterfly'&&a.stage!=='adult')return 1.1;return SIZE[a.sp]||2;}
function startFollow(a,mode,auto){cam.follow=a;cam.fmode=mode||cam.fmode||'orbit';cam.tR=followSize(a)*(mode==='chase'?1.3:1.6);cam.tPhi=Math.min(cam.tPhi,1.2);if(!auto){director.lockUntil=performance.now()+15000;}}
function stopFollow(){cam.follow=null;cam.tR=Math.max(cam.tR,14);}
function applyCam(dt){camKeys(dt);const k=1-Math.pow(0.002,dt);const f=cam.follow;
  if(f&&(!f.alive||f.hidden)){if(f.alive&&f.hidden){}else{cam.follow=null;}}
  if(f&&f.alive&&!f.hidden){cam.tT.set(f.x,(f.y||heightAt(f.x,f.z))+0.06*followSize(f),f.z);
    if(cam.fmode==='chase'){cam.tTheta=Math.atan2(-Math.cos(f.h),-Math.sin(f.h));cam.tPhi=1.22;}
    if(cam.fmode==='eye'){const s=Math.max(0.3,f.scale||1)*followSize(f);const fx=Math.cos(f.h),fz=Math.sin(f.h);const eye=new V3(f.x-fx*0.08*s,(f.y||0)+0.07*s+0.03,f.z-fz*0.08*s);
      camera.position.lerp(eye,1-Math.pow(0.0005,dt));cam.eyeLook.lerp(new V3(f.x+fx*2,(f.y||0)+0.02,f.z+fz*2),1-Math.pow(0.002,dt));camera.lookAt(cam.eyeLook);camera.near=0.01;camera.updateProjectionMatrix();cam.t.copy(cam.tT);return;}}
  let dth=angDiff(cam.theta,cam.tTheta);cam.theta+=dth*k;cam.phi+=(cam.tPhi-cam.phi)*k;cam.r+=(cam.tR-cam.r)*k;cam.t.lerp(cam.tT,f?1-Math.pow(0.0005,dt):k);
  const sp=Math.sin(cam.phi);camera.position.set(cam.t.x+cam.r*sp*Math.sin(cam.theta),cam.t.y+cam.r*Math.cos(cam.phi),cam.t.z+cam.r*sp*Math.cos(cam.theta));
  const gy=heightAt(clamp(camera.position.x,-HW,HW),clamp(camera.position.z,-HD,HD));if(Math.abs(camera.position.x)<HW&&Math.abs(camera.position.z)<HD&&camera.position.y<gy+0.08)camera.position.y=gy+0.08;
  camera.lookAt(cam.t);const nn=cam.r<4?0.01:0.05;if(camera.near!==nn){camera.near=nn;camera.updateProjectionMatrix();}}
function resize(){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<0.8?52:36;camera.updateProjectionMatrix();
  if(composer){composer.setSize(w,h);composer.setPixelRatio(renderer.getPixelRatio());}if(camera.aspect<0.8&&cam.tR>30&&!cam.follow){cam.tR=cam.r=70;}}
addEventListener('resize',resize);

/* =================== director =================== */
const director={on:false,lockUntil:0,prio:0,next:0};
function onDirectorEvent(e){if(!director.on||!e.who||!e.who.alive||e.prio<2)return;const now=performance.now();if(now<director.lockUntil&&e.prio<=director.prio)return;director.prio=e.prio;director.lockUntil=now+10000;
  selectEntity(e.who,true);startFollow(e.who,'orbit',true);caption(e.text);}
function directorTick(){if(!director.on)return;const now=performance.now();if(now<director.lockUntil||now<director.next)return;
  const hunters=[];for(const k of['snake','lizard','frog','mantis','spider','grouper','moray'])if(pop[k])for(const a of pop[k])if(a.alive&&(a.state==='stalk'||a.state==='chase'||a.state==='toPrey'))hunters.push(a);
  let a=hunters.length?pick(hunters):null;if(!a){const pool=[];for(const k of SPK)for(const b of pop[k])if(b.alive&&!b.hidden&&b.stage!=='egg')pool.push(b);if(pool.length)a=pick(pool);}
  if(a){director.prio=1;director.lockUntil=now+12000;selectEntity(a,true);startFollow(a,pick(['orbit','orbit','chase']),true);caption(`${a.S.name}「${a.name}」`);}director.next=now+2000;}
let capT=0;function caption(t){const c=$('#directorCap');c.textContent=t;c.style.opacity=1;clearTimeout(capT);capT=setTimeout(()=>c.style.opacity=0,4200);}

/* =================== picking & tools =================== */
const raycaster=new THREE.Raycaster(),ndc=new V2();
function rayFrom(e){const r=canvas.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.ray;}
function groundHit(ray){const o=ray.origin,d=ray.direction;let t=0.05;if(o.y>TOP&&d.y<0)t=Math.max(t,(o.y-TOP)/-d.y);
  for(;t<160;t+=0.05){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<BOT-1)break;if(Math.abs(x)<HW&&Math.abs(z)<HD){const s=surfaceY(x,z);if(y<=s)return{x,y:s,z};}}return null;}
function pickEntity(ray){const o=ray.origin,d=ray.direction;let best=null,bs=1;const v=new V3();
  const test=(e,px,py,pz,rad,bias)=>{v.set(px-o.x,py-o.y,pz-o.z);const t=v.dot(d);if(t<0)return;const perp=Math.sqrt(Math.max(0,v.lengthSq()-t*t));const tol=Math.max(0.012*t,rad);const s=perp/tol*(bias||1);if(s<bs){bs=s;best=e;}};
  for(const k of SPK)for(const a of pop[k]){if(!a.alive||a.hidden||a.wrapped)continue;test(a,a.x,(a.y||heightAt(a.x,a.z))+0.04,a.z,{ant:0.08,lizard:0.3,snake:0.3,frog:0.2,mantis:0.2,grouper:0.35,moray:0.3,jelly:0.28,crab:0.2}[k]||0.14);}
  for(const p of plants)if(p.alive){const s=plantScale(p);test(p,p.x,plantBaseY(p)+p.h*s*0.45,p.z,Math.max(0.2,p.h*s*0.35),1.4);}
  return best;}
let tool='observe';const sub={plant:'daisy',animal:'cricket',rain:'spot'};let down=null,moveSel=null;const pointers=new Map();let pinch0=0,pinchC=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);pinchC={x:(a.x+b.x)/2,y:(a.y+b.y)/2};rain.active=false;down=null;return;}
  down={x:e.clientX,y:e.clientY,btn:e.button,moved:0,shift:e.shiftKey};
  if(tool==='rain'&&e.button===0){const h=groundHit(rayFrom(e));if(h){rain.active=true;rain.cx=h.x;rain.cz=h.z;initSound();}}});
canvas.addEventListener('pointermove',e=>{const prev=pointers.get(e.pointerId);
  if(prev){const dx=e.clientX-prev.x,dy=e.clientY-prev.y;prev.x=e.clientX;prev.y=e.clientY;
    if(pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),c={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(pinch0>0)cam.tR=clamp(cam.tR*pinch0/d,0.6,80);if(pinchC&&!cam.follow)panBy(c.x-pinchC.x,c.y-pinchC.y);pinch0=d;pinchC=c;return;}
    if(down){down.moved+=Math.abs(dx)+Math.abs(dy);
      if(rain.active){const h=groundHit(rayFrom(e));if(h){rain.cx=h.x;rain.cz=h.z;}}
      else if(down.btn===2||down.shift){panBy(dx,dy);}
      else if(tool==='shovel'&&down.btn===0){if(down.moved>7){down.brush=1;const r=rayFrom(e);shovelAt(r,groundHit(r),true);}}
      else{if(down.moved>40)tutDone('cam');cam.tTheta-=dx*0.006;cam.tPhi=clamp(cam.tPhi-dy*0.005,0.12,1.55);if(cam.fmode==='chase')cam.fmode='orbit';}}}
  updateCursor(e);});
function panBy(dx,dy){if(cam.follow){stopFollow();}const k=cam.r*0.0015;const right=new V3().setFromMatrixColumn(camera.matrixWorld,0),fwd=new V3().crossVectors(UP,right);cam.tT.addScaledVector(right,-dx*k).addScaledVector(fwd,dy*k);cam.tT.x=clamp(cam.tT.x,-HW,HW);cam.tT.z=clamp(cam.tT.z,-HD,HD);cam.tT.y=clamp(cam.tT.y,0,6);}
function endPtr(e){pointers.delete(e.pointerId);if(pointers.size<2){pinch0=0;pinchC=null;}if(rain.active){rain.active=false;down=null;return;}if(down&&down.moved<7&&!down.brush&&e.type==='pointerup')clickAt(e);down=null;}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);canvas.addEventListener('pointerleave',()=>{cursor.visible=false;});
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.tR=clamp(cam.tR*Math.exp(e.deltaY*0.0012),0.6,80);if(cam.fmode==='eye'&&e.deltaY>0)cam.fmode='orbit';},{passive:false});
const cursor=new THREE.Mesh(new THREE.RingGeometry(0.9,1,56),new THREE.MeshBasicMaterial({color:0xa4d18b,transparent:true,opacity:0.8,depthWrite:false,side:THREE.DoubleSide}));cursor.rotation.x=-Math.PI/2;cursor.visible=false;cursor.renderOrder=13;tank.add(cursor);
const selRing=new THREE.Mesh(new THREE.RingGeometry(0.85,1,56),new THREE.MeshBasicMaterial({color:0xf0b25a,transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));selRing.rotation.x=-Math.PI/2;selRing.visible=false;selRing.renderOrder=13;tank.add(selRing);
function updateCursor(e){if(tool==='observe'){cursor.visible=false;return;}const h=groundHit(rayFrom(e));if(!h){cursor.visible=false;return;}let r=0.3,c=0xa4d18b;
  if(tool==='rain'){r=rain.R;c=0x82c7d7;}else if(tool==='plant'){const s=suit(sub.plant,h.x,h.z);c=!s.ok?0xe7755d:s.fit?0xa4d18b:0xe9b451;r=sub.plant==='tree'?1.2:0.35;}
  else if(tool==='animal'){c=animalOK(sub.animal,h.x,h.z).ok?0xa4d18b:0xe7755d;}else if(tool==='move'){c=moveSel?0xf0b25a:0x98a89c;}else if(tool==='shovel'){r=0.5;c=0xe7755d;const d=decorAt(h.x,h.z);if(d){r=d.r;c=0xf0b25a;}}else if(tool==='decor'){const T=DECOR_T[sub.decor];r=T.r;c=decorOK(sub.decor,h.x,h.z).ok?0xa4d18b:0xe7755d;}
  cursor.material.color.setHex(c);cursor.visible=true;cursor.scale.setScalar(r);cursor.position.set(h.x,h.y+0.03,h.z);}
function spend(c){if(env.coins<c){toast(`孢子不够：需要 <b>${c}</b>，现在有 ${Math.floor(env.coins)}`);return false;}env.coins-=c;return true;}
function animalOK(sp,x,z){const S=SPEC[sp];if(S.unlock&&!S.unlock.need())return{ok:false,msg:S.unlock.text};if(inWater(x,z,0.02)&&sp!=='frog')return{ok:false,msg:'这里是水面'};if(blocked(x,z,0.05))return{ok:false,msg:'这里有障碍物'};if(count(sp)>=capOf(sp))return{ok:false,msg:`${S.name}已经太多了（上限 ${capOf(sp)}）`};return{ok:true};}
function clickAt(e){const ray=rayFrom(e);
  if(tool==='observe'){const ent=pickEntity(ray);if(ent){selectEntity(ent);return;}const h=groundHit(ray);if(h)showZone(h);else deselect();return;}
  if(tool==='move'){if(!moveSel){const ent=pickEntity(ray);if(ent&&ent.kind==='animal'&&!ent.heldBy){moveSel=ent;selectEntity(ent);toast(`拿起了${ent.S.name}「${ent.name}」，点击放下的位置`);}return;}
    const h=groundHit(ray);if(!h)return;const a=moveSel;moveSel=null;if(!a.alive)return;const water=inWater(h.x,h.z,0.05);
    if((a.stage==='tadpole'||a.stage==='egg'&&a.sp==='frog')&&!water){toast('蝌蚪和卵块只能放在水里');return;}if(water&&!a.S.swim&&!a.flying){toast('它不会游泳');return;}
    if(a.web){removeWeb(a.web);a.web=null;}a.x=h.x;a.z=h.z;a.hop=null;a.flee=null;a.target=null;a.perch=null;a.onPerch=false;a.prey=null;if(a.held){finishEat(a);}if(a.state!=='egg')a.state='idle';if(a.flying)a.y=h.y+0.8;if(a.trail)a.trail.reset(a.x,a.z,a.h);if(a.stage==='pupa'){a.y=h.y+0.3;}
    toast(`把「${a.name}」放到了${ZONES[zoneAt(h.x,h.z)].name}`);return;}
  if(tool==='shovel'){shovelAt(ray,groundHit(ray),false);return;}
  const h=groundHit(ray);if(!h)return;initSound();
  if(tool==='decor'){placeDecor(sub.decor,h.x,h.z);return;}
  if(tool==='plant'){const T=PT[sub.plant],s=suit(sub.plant,h.x,h.z);if(!s.ok){toast(s.msg);return;}if(!spacingOK(h.x,h.z,sub.plant==='tree'?1.6:0.25)){toast('离其他植物太近了');return;}
    const r=T.single?null:getPR(sub.plant,0);if(r&&r.items.length>=r.cap-2){toast(`${T.name}已经种满了`);return;}if(!spend(T.cost))return;
    addPlant(sub.plant,h.x,h.z,0.15);flushPlants();tutDone('plant');stats.planted[sub.plant]=1;toast(`种下 <b>${T.name}</b>　−${T.cost} 孢子${s.fit?'':'　<span style="color:var(--warn)">这里的湿度不太适合它</span>'}`);return;}
  if(tool==='animal'){const S=SPEC[sub.animal];const ok=animalOK(sub.animal,h.x,h.z);if(!ok.ok){toast(ok.msg);return;}if(!spend(S.cost))return;stats.placed[sub.animal]=1;
    if(sub.animal==='ant'&&!colony){makeColony(h.x,h.z);toast('建立了新的蚁巢');}
    let first=null;for(let i=0;i<S.batch;i++){const x=sub.animal==='ant'?colony.x+rand(-0.4,0.4):h.x+rand(-0.35,0.35),z=sub.animal==='ant'?colony.z+rand(-0.4,0.4):h.z+rand(-0.35,0.35);const a=new Agent(sub.animal,x,z,{energy:0.85,age:0.1*S.life});if(a.flying!==undefined&&sub.animal==='butterfly'){a.y=heightAt(x,z)+rand(0.6,1.4);}if(!first)first=a;}
    toast(`投放 <b>${S.name}</b>${S.batch>1?' ×'+S.batch:''}　−${S.cost} 孢子`);logEvent('life',`你投放了${S.name}${S.batch>1?' ×'+S.batch:'「'+first.name+'」'}`,first,1);return;}
  if(tool==='feed'&&OCEAN){if(!spend(2))return;env.plank=Math.min(1,env.plank+0.12);env.nut=Math.min(1.5,env.nut+0.015);addDetritus(h.x,h.z,0.6,'pellet');for(let i=0;i<14;i++)bubble(h.x+rand(-0.4,0.4),WT-rand(0.1,1.5),h.z+rand(-0.4,0.4),-0.3);toast('撒下一勺浮游饵料　−2 孢子');return;}
  if(tool==='feed'){if(inWater(h.x,h.z)){toast('饲料会泡烂，撒在地上吧');return;}if(!spend(2))return;addDetritus(h.x,h.z,1,'pellet');toast('撒下一撮昆虫饲料　−2 孢子');}}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='BUTTON'&&e.key===' ')return;if(e.key===' '){e.preventDefault();setSpeed(env.speed===0?1:0);}
  const m={'1':'observe','2':'rain','3':'plant','4':'animal','5':'feed','6':'move','7':'shovel','8':'decor'}[e.key];if(m)setTool(m);if(e.key==='Escape'){deselect();setTool('observe');stopFollow();}});

/* =================== selection =================== */
let selected=null;
function selectEntity(e,auto){selected=e;if(!auto&&e.kind==='animal')tutDone('follow');$('#inspect').hidden=false;inspDirty=true;renderInspect();if(!auto&&e.kind==='animal'){}}
function deselect(){selected=null;$('#inspect').hidden=true;selRing.visible=false;stopFollow();}
function showZone(h){selected={kind:'zone',zi:zoneAt(h.x,h.z),alive:true,x:h.x,z:h.z};$('#inspect').hidden=false;inspDirty=true;renderInspect();}
function onEntityGone(e){if(selected===e){const was=e;if(was.kind==='animal'&&cam.follow===was){toast(`「${was.name}」的故事结束了`);}selected=null;$('#inspect').hidden=true;}if(cam.follow===e)cam.follow=null;if(moveSel===e)moveSel=null;}
