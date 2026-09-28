
/* =================== agents =================== */
const SHARED_GEO=new Set([FROG_GEO,WING_GEO.fore,WING_GEO.hind]);
const NAMES=['团子','豆豆','小满','阿布','芝麻','年糕','可乐','棉花','栗子','汤圆','麦穗','星星','米粒','布丁','青团','阿福','小雨','石头','乌龙','椰子','饭团','橙子','小鹿','糯米','小葵','雪糕','瓜子','山竹','阿翠','小灰','闪闪','点点','球球','豆包','花卷','奶茶','柚子','芋圆','小墨','阿金','大宝','二丫','泡泡','小九','阿呆','皮蛋','蘑菇','小可'];
const isNight=()=>env.daylight<0.18;
const clockStr=()=>{const t=env.time*24,h=Math.floor(t),m=Math.floor((t-h)*60);return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;};
const LOG=[];let logDirty=true;
const stats={hunts:0,emerged:0,metamorph:0,hatched:0,births:0,webs:0,mush:0,planted:{},placed:{}};
function logEvent(kind,text,who,prio){const e={id:++UID,day:env.day,t:clockStr(),kind,text,who:who&&who.id?who:null,x:who?who.x:0,z:who?who.z:0,prio:prio||1};LOG.unshift(e);if(LOG.length>80)LOG.pop();logDirty=true;if(typeof onDirectorEvent==='function')onDirectorEvent(e);}
function bumpExcite(v){env.excite=Math.min(40,env.excite+v);}

const pop={};const AGS=2,AG=new Map();
function gridRebuild(){AG.clear();for(const k in pop)for(const a of pop[k]){if(!a.alive)continue;const key=Math.floor((a.x+HW)/AGS)+','+Math.floor((a.z+HD)/AGS);let arr=AG.get(key);if(!arr){arr=[];AG.set(key,arr);}arr.push(a);}}
function queryAgents(x,z,r){const out=[];const i0=Math.floor((x-r+HW)/AGS),i1=Math.floor((x+r+HW)/AGS),j0=Math.floor((z-r+HD)/AGS),j1=Math.floor((z+r+HD)/AGS);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const arr=AG.get(i+','+j);if(!arr)continue;for(const a of arr)if(a.alive&&(a.x-x)**2+(a.z-z)**2<=r*r)out.push(a);}return out;}
const dist3=(a,b)=>Math.hypot(a.x-b.x,(a.y||0)-(b.y||0),a.z-b.z);

class Agent{
  constructor(sp,x,z,o){o=o||{};this.sp=sp;this.S=SPEC[sp];this.kind='animal';this.id=++UID;this.x=x;this.z=z;this.y=heightAt(x,z);this.h=o.h!=null?o.h:rand(0,6.283);
    this.stage=o.stage||(this.S.stages?this.S.stages[this.S.stages.length-1]:'adult');this.energy=o.energy!=null?o.energy:rand(0.6,0.85);this.age=o.age!=null?o.age:rand(0.1,0.5)*this.S.life;this.life=this.S.life*rand(0.85,1.2);
    this.state='idle';this.st=0;this.speed=0;this.ph=rand(0,10);this.alive=true;this.scale=o.scale!=null?o.scale:1;this.name=o.name||(this.S.noName?`${this.S.name} #${this.id}`:pick(NAMES));
    this.kills=0;this.kids=0;this.diary=[];this.wz=0;this.tt=rand(0,1);this.stageT=0;this.m=null;
    pop[sp].push(this);if(this.S.init)this.S.init(this,o);this.buildModel();}
  buildModel(){this.disposeModel();const b=this.S.model?this.S.model(this):null;this.m=b;if(b&&b.root)agentGroup.add(b.root);}
  disposeModel(){const m=this.m;if(!m)return;if(m.root){agentGroup.remove(m.root);m.root.traverse(o=>{if(o.geometry&&!o.isSprite&&!SHARED_GEO.has(o.geometry))o.geometry.dispose();if(o.isSprite)o.material.dispose();});}
    if(m.tip){agentGroup.remove(m.tip);m.tip.geometry.dispose();}this.m=null;}
  setStage(s){this.stage=s;this.stageT=0;this.buildModel();}
  note(t){this.diary.unshift(`第${env.day}天 ${clockStr()} ${t}`);if(this.diary.length>6)this.diary.pop();}
  turnTo(a,rate,dt){this.h+=clamp(angDiff(this.h,a),-rate*dt,rate*dt);}
  seek(tx,tz,sp,dt,rate){this.turnTo(Math.atan2(tz-this.z,tx-this.x),rate||5,dt);this.step(sp,dt);return Math.hypot(tx-this.x,tz-this.z);}
  roam(sp,dt){this.wz=clamp(this.wz+(Math.random()-0.5)*8*dt,-1.8,1.8);this.h+=this.wz*dt;const zp=this.S.zones[zoneAt(this.x,this.z)];
    if(zp<0.35){let best=-1,bi=0;this.S.zones.forEach((v,i)=>{const s=v-Math.abs(ZONES[i].cx-this.x)*0.03;if(s>best){best=s;bi=i;}});this.turnTo(Math.atan2(rand(-4,4)-this.z,ZONES[bi].cx-this.x),1.6,dt);}
    this.step(sp,dt);}
  step(sp,dt){this.speed=sp;if(sp<=0)return;const nx=this.x+Math.cos(this.h)*sp*dt,nz=this.z+Math.sin(this.h)*sp*dt;
    if(nx<-HW+0.4||nx>HW-0.4||nz<-HD+1.0||nz>HD-0.4){this.turnTo(Math.atan2(-this.z,-this.x),6,dt);return;}
    if(!this.flying){
      if(this.S.swimOnly||this.stage==='tadpole'){if(!inWater(nx,nz,0.08)){this.turnTo(Math.atan2(POND.z-this.z,POND.x-this.x),6,dt);return;}}
      else if(!this.S.swim&&inWater(nx,nz,-0.02)){this.turnTo(this.h+Math.PI,4,dt);return;}
      const o=blocked(nx,nz,0.04);if(o){const a=Math.atan2(this.z-o.z,this.x-o.x);this.turnTo(a+Math.PI/2*(angDiff(a,this.h)>0?1:-1),7,dt);return;}}
    this.x=nx;this.z=nz;}
  groundY(){return this.S.swim&&inWater(this.x,this.z)?waterSurf(this.x,this.z)-0.06:heightAt(this.x,this.z);}
  die(reason){if(!this.alive)return;this.alive=false;stats.dead=stats.dead||{};const dk=this.sp+':'+reason;stats.dead[dk]=(stats.dead[dk]||0)+1;
    if(this.held){this.held.heldBy=null;this.held.state='idle';this.held=null;}
    if(this.web)removeWeb(this.web);if(this.cocoon){tank.remove(this.cocoon);this.cocoon.geometry.dispose();}
    if(this.stuck){const w=this.stuck;const i=w.stuck.indexOf(this);if(i>=0)w.stuck.splice(i,1);}
    this.disposeModel();
    if(reason!=='eaten'&&reason!=='hatched'&&this.S.corpse)addDetritus(this.x,this.z,this.S.corpse*this.scale,'corpse');
    if((reason==='starved'||reason==='old')&&this.S.lvl>=2)logEvent('warn',`${this.S.name}「${this.name}」${reason==='old'?'寿终正寝':'饿死了'}`,this,1);
    if(typeof onEntityGone==='function')onEntityGone(this);}
}
function tryBreed(a,prob,dt,x,z,o){const S=a.S;if(a.scale<1||a.energy<0.8||a.age<S.life*0.12||count(a.sp)>=capOf(a.sp)||Math.random()>prob*dt)return null;
  a.energy-=0.35;const n=new Agent(a.sp,x==null?a.x+rand(-0.3,0.3):x,z==null?a.z+rand(-0.3,0.3):z,Object.assign({scale:0.5,age:0,energy:0.7},o||{}));a.kids++;stats.births++;
  a.note(`生下了「${n.name}」`);if(S.lvl>=2||Math.random()<0.2)logEvent('life',`${S.name}「${a.name}」繁殖了，新成员「${n.name}」`,n,2);return n;}
const count=sp=>pop[sp].length;
const capOf=sp=>Math.round(SPEC[sp].cap*(sp==='ant'?(QK==='low'?0.6:1):1));

/* ---- predation ---- */
function preyOK(pred,p){if(!p.alive||p.heldBy||p.stuck||p.hidden||p.safe||p===pred)return false;const r=pred.S.diet&&pred.S.diet[p.sp];if(!r)return false;if(r.stages&&!r.stages.includes(p.stage))return false;if(p.stage==='egg'||p.stage==='pupa')return false;if(r.cond&&!r.cond(p,pred))return false;if(p.rolled||p.retracted)return false;return true;}
function findPrey(a){let best=null,bs=1e9;for(const p of queryAgents(a.x,a.z,a.S.hunt.sense)){if(!preyOK(a,p))continue;const s=dist3(a,p)/(a.S.diet[p.sp].w||1);if(s<bs){bs=s;best=p;}}return best;}
function huntTick(a,dt){const H=a.S.hunt;
  if(a.state==='eat'){a.st-=dt;a.speed=0;if(a.st<=0)finishEat(a);return true;}
  if(a.state==='strike'){a.st-=dt;a.speed=0;const prog=1-a.st/H.strikeT;if(H.lunge&&prog<0.45)a.step(H.lunge,dt);
    if(!a.struck&&prog>=H.hitAt){a.struck=true;const p=a.prey;if(p&&p.alive&&!p.heldBy&&!p.stuck&&dist3(a,p)<(H.reach*a.scale+0.08)*1.5&&Math.random()<H.success*(p.flee?0.55:1)){catchPrey(a,p);return true;}a.missed=true;if(p&&p.alive&&p.S.flee)startFlee(p,a);}
    if(a.st<=0&&a.state==='strike'){a.state='recover';a.st=a.missed?0.8:0.2;if(a.missed&&Math.random()<0.25)logEvent('hunt',`${a.S.name}「${a.name}」扑空了`,a,1);}
    return true;}
  if(a.state==='recover'){a.st-=dt;a.speed=0;if(a.st<=0)a.state='idle';return true;}
  if(a.energy>H.hungry&&a.state!=='stalk'&&a.state!=='chase')return false;
  a.searchT=(a.searchT||0)-dt;
  if(!a.prey||!preyOK(a,a.prey)||dist3(a,a.prey)>H.sense*1.5){if(a.searchT>0){a.prey=null;if(a.state==='stalk'||a.state==='chase')a.state='idle';return false;}a.searchT=0.6;a.prey=findPrey(a);if(!a.prey){if(a.state==='stalk'||a.state==='chase')a.state='idle';return false;}}
  const p=a.prey,d=dist3(a,p);
  if(d<H.reach*a.scale+0.04){a.state='strike';a.st=H.strikeT;a.struck=false;a.missed=false;a.h=Math.atan2(p.z-a.z,p.x-a.x);a.strikeAt={x:p.x,y:p.y,z:p.z};return true;}
  if(H.move){H.move(a,p,dt,d<H.stalkR?'stalk':'chase');return true;}
  if(d<H.stalkR){a.state='stalk';a.seek(p.x,p.z,H.stalkSp*a.scale,dt,4);}else{a.state='chase';a.seek(p.x,p.z,H.chaseSp*a.scale,dt,5);}
  return true;}
function catchPrey(a,p){if(a.sp==='snake')stats.snakeHunts=(stats.snakeHunts||0)+1;p.heldBy=a;p.state='caught';p.flee=null;p.hop=null;a.held=p;a.state='eat';a.st=a.S.hunt.eatT;stats.hunts++;bumpExcite(3);
  const nm=p.S.stageNames&&p.stage!=='adult'?p.S.stageNames[p.stage]:p.S.name;a.note(`捕获了一只${nm}`);if(p.name&&!p.S.noName)p.note(`被${a.S.name}「${a.name}」捉住了`);
  logEvent('hunt',`${a.S.name}「${a.name}」捕获了${nm}${p.S.noName?'':'「'+p.name+'」'}`,a,3);}
function finishEat(a){const p=a.held;a.held=null;a.state='idle';if(p&&p.alive){a.energy=Math.min(1,a.energy+(a.S.diet[p.sp].v||0.2));a.kills++;p.die('eaten');}if(a.S.onAte)a.S.onAte(a);}
function startFlee(p,from){const F=p.S.flee;if(!F||p.heldBy||p.stuck)return;if(F.mode==='roll'){if(!p.rolled){p.rolled=true;p.rollT=rand(4,8);}return;}if(F.mode==='retract'){p.retracted=true;p.rollT=rand(6,12);return;}p.flee={from,t:rand(F.dur*0.7,F.dur*1.2)};}
function fleeTick(p,dt){if(p.rolled||p.retracted){p.rollT-=dt;p.speed=0;p.state=p.rolled?'rolled':'retracted';if(p.rollT<=0){p.rolled=false;p.retracted=false;p.state='idle';}return true;}
  if(!p.flee)return false;const f=p.flee;f.t-=dt;if(f.t<=0||!f.from.alive){p.flee=null;return false;}
  const ang=Math.atan2(p.z-f.from.z,p.x-f.from.x)+Math.sin(p.ph*3)*0.5;p.state='flee';
  if(p.S.flee.mode==='hop'){if(!p.hop)startHop(p,ang,rand(0.5,1.0));}else if(p.flying){p.turnTo(ang,8,dt);p.step(p.S.flee.speed,dt);p.y+=dt*0.8;}else{p.turnTo(ang,8,dt);p.step(p.S.flee.speed*p.scale,dt);}return true;}
function alertTick(p,dt){p.alertT=(p.alertT||0)-dt;if(p.alertT>0||!p.S.flee)return;p.alertT=0.3;
  for(const q of queryAgents(p.x,p.z,p.S.flee.r)){if(q===p||!q.S.diet||!q.S.diet[p.sp]||q.state==='eat'||q.heldBy)continue;const tg=q.prey===p;if(!tg&&q.energy>q.S.hunt.hungry)continue;if(Math.random()<(tg?(q.state==='stalk'?0.18:0.6):0.25)){startFlee(p,q);return;}}}
function startHop(a,ang,len){len*=a.scale;let x1=clamp(a.x+Math.cos(ang)*len,-HW+0.5,HW-0.5),z1=clamp(a.z+Math.sin(ang)*len,-HD+1.1,HD-0.5);
  if(blocked(x1,z1,0.05)||(!a.S.swim&&inWater(x1,z1,-0.02))){x1=a.x;z1=a.z;}a.h=ang;const sw=a.S.swim&&inWater(a.x,a.z)&&inWater(x1,z1);
  a.hop={x0:a.x,z0:a.z,x1,z1,t:0,dur:sw?1.2:(a.S.hopDur||0.4),hgt:sw?0:(a.S.hopH||0.25)*a.scale*(0.6+len),swim:sw,y0:a.groundY()};}
function hopTick(a,dt){const H=a.hop;H.t=Math.min(1,H.t+dt/H.dur);a.x=lerp(H.x0,H.x1,H.t);a.z=lerp(H.z0,H.z1,H.t);a.speed=1;if(H.t>=1){a.hop=null;a.speed=0;if(inWater(a.x,a.z))ripple(a.x,a.z,0.35);return false;}return true;}
function hopY(a){const H=a.hop;if(!H)return a.groundY();const y1=a.groundY();return lerp(H.y0,y1,H.t)+Math.sin(Math.PI*H.t)*H.hgt;}

/* ---- detritus ---- */
const detritus=[];const detMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9});
function addDetritus(x,z,amount,kind){const parts=[];
  if(kind==='pellet'){for(let i=0;i<9;i++)parts.push(xf(colorize(new THREE.CylinderGeometry(0.03,0.03,0.06,6),0xb07a3c,0.2),[rand(-0.1,0.1),0.025,rand(-0.1,0.1)],[Math.PI/2,rand(0,3),0]));}
  else if(kind==='corpse')parts.push(sph(0.08,0x4a3a2a,[0,0.01,0],[1.5,0.35,1],10,8));
  else for(let i=0;i<6;i++){const g=colorize(new THREE.CircleGeometry(0.08,7),pick([0x8a6a3a,0x6e5230,0xa07a44]),0.2);g.rotateX(-Math.PI/2);g.scale(1,1,0.55);g.rotateY(rand(0,6));g.translate(rand(-0.14,0.14),0.012+i*0.004,rand(-0.14,0.14));parts.push(g);}
  const mesh=mm(parts,detMat);mesh.position.set(x,heightAt(x,z),z);mesh.receiveShadow=true;tank.add(mesh);const d={kind:'detritus',sub:kind,x,z,amount,mesh,alive:true,id:++UID};detritus.push(d);return d;}
function removeDet(d){d.alive=false;tank.remove(d.mesh);d.mesh.geometry.dispose();}
function nearestDet(x,z,r){let best=null,bd=r*r;for(const d of detritus){if(!d.alive)continue;const q=(d.x-x)**2+(d.z-z)**2;if(q<bd){bd=q;best=d;}}return best;}

/* ---- slime trails ---- */
const SLN=1400;const slime=(function(){const g=new THREE.PlaneGeometry(0.1,0.05);g.rotateX(-Math.PI/2);const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xd6e2dc,roughness:0.04,metalness:0.2,transparent:true,opacity:0.3,depthWrite:false}),SLN);m.count=0;m.frustumCulled=false;m.renderOrder=1;tank.add(m);return{m,x:new Float32Array(SLN),z:new Float32Array(SLN),h:new Float32Array(SLN),t:new Float32Array(SLN).fill(99),ptr:0};})();
function addSlime(x,z,h){const i=slime.ptr++%SLN;slime.x[i]=x;slime.z[i]=z;slime.h[i]=h;slime.t[i]=0;slime.m.count=Math.min(SLN,slime.ptr);}
function refreshSlime(dt){const S=slime;for(let i=0;i<S.m.count;i++){S.t[i]+=dt;const f=Math.max(0,1-S.t[i]/(DAY*0.6));dummy.position.set(S.x[i],heightAt(S.x[i],S.z[i])+0.006,S.z[i]);dummy.rotation.set(0,-S.h[i],0);dummy.scale.set(1,1,f);dummy.updateMatrix();S.m.setMatrixAt(i,dummy.matrix);}S.m.instanceMatrix.needsUpdate=true;}

/* ---- ant colony ---- */
let colony=null;
function makeColony(x,z){const g=new THREE.ConeGeometry(0.75,0.34,40,6);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+(fbm(p.getX(i)*5,p.getZ(i)*5,2)-0.5)*0.08);g.computeVertexNormals();
  const parts=[colorize(g,0x8a6a45,0.3,(x,y,z,c)=>c.lerp(new Col(0x5d4430),smooth(0.1,-0.15,y)*0.5))];for(const [hx,hz,hy] of[[0,0,0.17],[0.3,0.1,0.07],[-0.2,-0.28,0.06]])parts.push(xf(colorize(new THREE.CircleGeometry(0.05,10),0x0e0906,0),[hx,hy,hz],[-Math.PI/2+0.3,0,0]));
  const mesh=mm(parts,detMat);mesh.position.set(x,heightAt(x,z)+0.16,z);mesh.receiveShadow=mesh.castShadow=true;tank.add(mesh);colony={x,z,store:4,mesh,spot:null};}
function antFood(a){return nearestPlant(a.x,a.z,3.2,p=>p.T.antFood&&p.growth>0.35)||nearestDet(a.x,a.z,3.5);}

/* ---- webs ---- */
const webs=[];const webLineMat=new THREE.LineBasicMaterial({color:0xeef3f0,transparent:true,opacity:0.45,depthWrite:false});
const zigMat=new THREE.MeshStandardMaterial({color:0xf6f6f0,roughness:0.8,transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false});
function makeWeb(x,z,ang,owner){const cy=heightAt(x,z)+rand(0.75,1.1),r=rand(0.45,0.6),n=new V3(Math.cos(ang),0,Math.sin(ang)),u=new V3(-Math.sin(ang),0,Math.cos(ang)),c=new V3(x,cy,z);
  const P=(rr,a)=>c.clone().addScaledVector(u,Math.cos(a)*rr).addScaledVector(UP,Math.sin(a)*rr);const pts=[],dew=[];
  for(let i=0;i<8;i++){const a0=i/8*6.283,a1=(i+1)/8*6.283;pts.push(P(r*1.04,a0),P(r*1.04,a1));}
  for(let i=0;i<26;i++){const a=i/26*6.283;pts.push(P(0.025,a),P(r*rand(0.96,1.03),a));}
  const steps=22*26;let prev=P(r*0.16,0);for(let k=1;k<=steps;k++){const a=k/26*6.283,q=P(r*(0.16+0.8*k/steps),a);pts.push(prev,q);if(k%4===0)dew.push(q.clone());prev=q;}
  for(const a of[0.4,2.7,4.4,5.3]){const p1=P(r*1.04,a),p2=a>3.2&&a<6?new V3(p1.x,heightAt(p1.x,p1.z),p1.z):p1.clone().add(new V3(0,0.5,0));pts.push(p1,p2);}
  const g=new THREE.BufferGeometry().setFromPoints(pts);g.setDrawRange(0,0);const line=new THREE.LineSegments(g,webLineMat);line.renderOrder=4;
  const dg=new THREE.BufferGeometry().setFromPoints(dew);const dp=new THREE.Points(dg,new THREE.PointsMaterial({map:TX.soft,size:0.045,color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
  const Z=new Mesher();for(const a0 of[0.785,2.356,3.927,5.498]){for(let k=0;k<7;k++){const r0=r*(0.08+k*0.05),r1=r*(0.08+(k+1)*0.05),o0=(k%2?1:-1)*0.025,o1=-o0;const perp=a0+Math.PI/2;
      const A=P(r0,a0).addScaledVector(u,Math.cos(perp)*o0).addScaledVector(UP,Math.sin(perp)*o0),B=P(r1,a0).addScaledVector(u,Math.cos(perp)*o1).addScaledVector(UP,Math.sin(perp)*o1);const s=Z.n;
      Z.v(A.x,A.y,A.z,0,0,WHITE);Z.v(B.x,B.y,B.z,1,0,WHITE);const off=n.clone().multiplyScalar(0.003);Z.v(B.x+off.x,B.y+0.008,B.z+off.z,1,1,WHITE);Z.v(A.x+off.x,A.y+0.008,A.z+off.z,0,1,WHITE);Z.q(s,s+1,s+2,s+3);}}
  const zig=new THREE.Mesh(Z.geo(),zigMat);zig.visible=false;
  tank.add(line,dp,zig);const w={x,z,c,n,u,r,P,line,dp,zig,total:pts.length,progress:0,owner,stuck:[],age:0,alive:true};webs.push(w);stats.webs++;return w;}
function removeWeb(w){if(!w.alive)return;w.alive=false;tank.remove(w.line,w.dp,w.zig);w.line.geometry.dispose();w.dp.geometry.dispose();w.dp.material.dispose();w.zig.geometry.dispose();for(const p of w.stuck){p.stuck=null;p.state='idle';}w.stuck.length=0;const i=webs.indexOf(w);if(i>=0)webs.splice(i,1);}
function webCatch(){for(const w of webs){if(w.progress<1)continue;
  for(const k of['butterfly','firefly','cricket']){for(const p of queryAgents(w.x,w.z,w.r+0.3)){if(p.sp!==k||p.stuck||p.heldBy||!p.alive)continue;if(k==='butterfly'&&(p.stage!=='adult'||p.emerge>0))continue;if(k==='firefly'&&!p.flying)continue;if(k==='cricket'&&!p.hop)continue;
    const dx=p.x-w.c.x,dy=(p.y||0)-w.c.y,dz=p.z-w.c.z;const along=dx*w.n.x+dz*w.n.z;const inx=dx-w.n.x*along,inz=dz-w.n.z*along;if(Math.abs(along)<0.07&&Math.hypot(inx,dy,inz)<w.r*0.95){
      p.stuck=w;p.state='stuck';p.hop=null;p.flee=null;p.stuckPos=new V3(p.x-w.n.x*along,p.y,p.z-w.n.z*along);w.stuck.push(p);p.stuckT=0;
      logEvent('hunt',`${p.S.name}${p.S.noName?'':'「'+p.name+'」'}撞上了蛛网`,p,2);bumpExcite(2);}}}}}

/* =================== species =================== */
const SPEC={
 ant:{name:'切叶蚁',role:'采集者',lvl:1,cost:18,batch:8,life:6,burn:0.002,resp:0.03,zones:[0.6,1,0.6,0.6],color:'#b0502c',habitat:'草甸 · 沙漠边缘',cap:260,noName:true,
  flee:{mode:'run',r:0.5,speed:0.9,dur:1},corpse:0,
  fact:'工蚁把叶片碎片搬回巢里培养真菌。找到食物后，同伴会沿着气味路线跟过去。天黑后全部回巢。',
  init(a){a.carry=0;a.hidden=false;},
  update(a,dt){if(!colony){a.roam(0.35,dt);return;}if(fleeTick(a,dt))return;alertTick(a,dt);const S=0.55;
    if(a.state==='home'){a.hidden=true;a.speed=0;if(a.energy<0.6&&colony.store>0.3){colony.store-=0.3;a.energy+=0.45;}if(!isNight()&&Math.random()<0.3*dt){a.state='idle';a.hidden=false;a.x=colony.x+rand(-0.15,0.15);a.z=colony.z+rand(-0.15,0.15);}return;}
    if(a.carry){a.state='carry';const d=a.seek(colony.x,colony.z,S*0.85,dt,6);if(d<0.3){colony.store+=a.carry;a.carry=0;a.target=null;if(a.energy<0.6&&colony.store>0.3){colony.store-=0.3;a.energy+=0.45;}a.state='idle';}return;}
    if(isNight()||(a.energy<0.28&&colony.store>0.6)){a.state=isNight()?'homeward':'hungry';const d=a.seek(colony.x,colony.z,S,dt,6);if(d<0.3){if(isNight())a.state='home';else if(colony.store>0.3){colony.store-=0.3;a.energy+=0.45;}}return;}
    a.tt-=dt;if(a.tt<=0){a.tt=rand(1,2.4);if(!a.target||!a.target.alive){const f=Math.random()<0.7?antFood(a):null;if(f)a.target=f;else if(colony.spot&&Math.random()<0.5)a.target={x:colony.spot.x+rand(-0.4,0.4),z:colony.spot.z+rand(-0.4,0.4),alive:true,point:true};
      else{const x=colony.x+rand(-4,4),z=colony.z+rand(-4,4),c=tcell(x,z);if(turf[c]>0.4)a.target={x,z,alive:true,turf:c};}}}
    const t=a.target;
    if(t&&t.alive){a.state='forage';const d=a.seek(t.x,t.z,S,dt,7);if(d<(t.kind==='plant'?0.22:0.14)){
      if(t.point)a.target=null;else if(t.turf!=null){if(turf[t.turf]>0.2){turf[t.turf]-=0.004;a.carry=0.16;a.energy=Math.min(1,a.energy+0.1);colony.spot={x:t.x,z:t.z};}a.target=null;}
      else if(t.kind==='plant'){if(t.growth>0.3){t.growth-=0.015;t.eaten+=0.015;a.carry=0.25;a.energy=Math.min(1,a.energy+0.12);colony.spot={x:t.x,z:t.z};}a.target=null;}
      else{t.amount-=0.12;a.carry=0.4;a.energy=Math.min(1,a.energy+0.15);colony.spot={x:t.x,z:t.z};a.target=null;}}}
    else{a.target=null;a.state='idle';a.roam(S*0.7,dt);if(Math.hypot(a.x-colony.x,a.z-colony.z)>6)a.turnTo(Math.atan2(colony.z-a.z,colony.x-a.x),1.5,dt);}},
 },
 cricket:{name:'蟋蟀',role:'食草 · 夜鸣',lvl:1,cost:14,batch:4,life:5,burn:0.0028,resp:0.05,zones:[0.5,1,0.6,0.35],color:'#8a6238',habitat:'草甸',cap:70,hopDur:0.38,hopH:0.28,corpse:0.1,
  flee:{mode:'hop',r:0.9,dur:1.2},
  fact:'吃草叶和腐殖质，是很多捕食者的主食。夜里雄性摩擦前翅鸣叫，受惊时一跳就是体长的十几倍。',
  model:()=>buildCricket(),
  update(a,dt){if(a.hop){hopTick(a,dt);return;}if(fleeTick(a,dt))return;alertTick(a,dt);
    if(a.chirp>0){a.chirp-=dt;a.state='chirp';a.speed=0;a.chirpS=(a.chirpS||0)-dt;if(a.chirpS<=0){a.chirpS=0.55;sfx('chirp',a);}return;}
    if(isNight()&&a.scale>=1&&Math.random()<0.03*dt){a.chirp=rand(2,4);return;}
    if(a.energy<0.88){const c=tcell(a.x,a.z);if(turf[c]>0.15){a.state='graze';a.speed=0;turf[c]-=0.003*dt;a.energy=Math.min(1,a.energy+0.03*dt);if(Math.random()<0.12*dt)startHop(a,a.h+rand(-1,1),rand(0.2,0.5));return;}
      const d=nearestDet(a.x,a.z,1.5);if(d){a.state='forage';if(a.seek(d.x,d.z,0.12,dt)<0.12){const e=Math.min(d.amount,0.02*dt);d.amount-=e;a.energy+=e*1.5;}return;}
      a.state='forage';if(Math.random()<0.9*dt){let best=a.h,bv=-1;for(let k=0;k<6;k++){const an=rand(0,6.28),x=a.x+Math.cos(an)*1.5,z=a.z+Math.sin(an)*1.5;const v=turf[tcell(x,z)];if(v>bv){bv=v;best=an;}}startHop(a,best,rand(0.4,0.9));}else a.roam(0.1,dt);return;}
    a.state='idle';if(Math.random()<0.15*dt)startHop(a,a.h+rand(-1.5,1.5),rand(0.3,0.8));else a.roam(0.05,dt);
    tryBreed(a,0.0045,dt);},
  anim(a,dt){const m=a.m;const y=a.hop?hopY(a):a.groundY();poseGround(m.root,a,y,1.25*a.scale);const e=a.hop?Math.sin(Math.PI*Math.min(1,a.hop.t*1.6)):0;m.hind.forEach(h=>h.rotation.z=-e*1.3);
    m.wings.rotation.x=a.state==='chirp'?Math.sin(performance.now()*0.09)*0.12:0;m.wings.position.y=a.state==='chirp'?0.012:0;},
  mouth(a,o){o.set(a.x+Math.cos(a.h)*0.16*a.scale,a.y+0.05,a.z+Math.sin(a.h)*0.16*a.scale);},
 },
 snail:{name:'蜗牛',role:'食草 · 慢行',lvl:1,cost:12,batch:2,life:10,burn:0.0011,resp:0.03,zones:[0,0.5,1,1],color:'#b98a52',habitat:'溪沼 · 雨林',cap:30,corpse:0.12,
  flee:{mode:'retract',r:0.5},
  fact:'靠腹足慢慢爬，身后留下一道亮晶晶的黏液。空气太干时缩回壳里休眠，下雨后又会出来。',
  model:a=>buildSnail(a),init(a){a.trail=new Trail(0.34,a.x,a.z,a.h);a.ext=1;a.slT=0;},
  update(a,dt){if(fleeTick(a,dt))return;alertTick(a,dt);const zi=zoneAt(a.x,a.z),hum=env.zones[zi].h;
    if(hum<0.5&&!(rain.intensity>0.3&&Math.hypot(rain.cx-a.x,rain.cz-a.z)<3)){a.state='dormant';a.speed=0;return;}
    if(a.energy<0.9){a.tt-=dt;if(a.tt<=0){a.tt=2;if(!a.target||!a.target.alive)a.target=nearestPlant(a.x,a.z,3,p=>p.T.snailFood&&p.growth>0.25);}
      if(a.target&&a.target.alive){const d=a.seek(a.target.x,a.target.z,0.05,dt,1.5);if(d<0.22){a.state='eat';a.speed=0;a.target.growth-=0.0015*dt;a.target.eaten+=0.0015*dt;a.energy=Math.min(1,a.energy+0.012*dt);}else a.state='forage';}
      else{a.state='idle';a.roam(0.035,dt);}}else{a.state='idle';a.roam(0.03,dt);}
    if(a.speed>0){a.slT-=dt;if(a.slT<=0){a.slT=0.5;addSlime(a.x-Math.cos(a.h)*0.15,a.z-Math.sin(a.h)*0.15,a.h);}}
    if(hum>0.6)tryBreed(a,0.0012,dt);},
  anim(a,dt){const m=a.m;a.trail.push(a.x,a.z);a.ext=lerp(a.ext,(a.retracted||a.state==='dormant')?0.25:1,Math.min(1,dt*3));const L=0.34*a.scale*(0.55+0.45*a.ext);a.trail.sample(a.x,a.z,14,L,m.pts);
    for(let i=0;i<14;i++){const p=m.pts[i];p.y=heightAt(p.x,p.z)+0.012*a.scale;}m.body.update(m.pts,{ext:a.ext*a.scale});
    const B=m.body,i=5;_m4.makeBasis(B.T[i],B.Uv[i],B.S[i]);m.shell.quaternion.setFromRotationMatrix(_m4);m.shell.position.copy(B.C[i]).addScaledVector(B.Uv[i],0.045*a.scale);m.shell.scale.setScalar(a.scale);
    _m4.makeBasis(B.T[0],B.Uv[0],B.S[0]);m.tent.quaternion.setFromRotationMatrix(_m4);m.tent.position.copy(B.C[0]);m.tent.scale.setScalar(Math.max(0.01,a.scale*Math.max(0,a.ext-0.3)/0.7));a.y=m.shell.position.y;},
  mouth(a,o){o.set(a.x,a.y,a.z);},
 },
 butterfly:{name:'蝴蝶',role:'传粉',lvl:1,stages:['egg','larva','pupa','adult'],stageNames:{egg:'卵',larva:'毛毛虫',pupa:'蛹',adult:'蝴蝶'},stageBurn:{egg:0,larva:0.0028,pupa:0,adult:0.005},
  cost:24,batch:2,life:3,burn:0.005,resp:0.05,zones:[0.4,1,0.7,0.9],color:'#f0a040',habitat:'花丛',cap:30,corpse:0.08,
  flee:{mode:'fly',r:0.7,speed:1.5,dur:1.2},
  fact:'完全变态：卵在寄主植物上孵出毛毛虫，毛毛虫吃叶子长大后化蛹，再羽化成蝴蝶。成虫吸花蜜时顺便传粉，被拜访过的花结籽更多。',
  VAR:['君主斑蝶','大闪蝶','金凤蝶'],
  model:a=>a.stage==='egg'?buildEgg(0xe8d86a):a.stage==='larva'?buildCaterpillar():a.stage==='pupa'?buildChrysalis():buildButterfly(a.variant),
  init(a,o){a.variant=o.variant!=null?o.variant:pick([0,0,1,2]);if(a.stage==='adult'){a.flying=true;a.y=heightAt(a.x,a.z)+rand(0.8,2);}if(a.stage==='larva')a.trail=new Trail(0.45,a.x,a.z,a.h);if(a.stage==='egg'&&o.host){a.host=o.host;}},
  update(a,dt){const st=a.stage;
    if(st==='egg'){a.speed=0;a.stageT+=dt/DAY;if(a.stageT>0.35){a.scale=0.4;a.trail=new Trail(0.45,a.x,a.z,a.h);a.setStage('larva');stats.hatched++;logEvent('life',`一只毛毛虫孵化了`,a,2);}return;}
    if(st==='pupa'){a.speed=0;a.stageT+=dt/DAY;if(a.stageT>0.6){a.setStage('adult');a.flying=true;a.emerge=5;a.scale=1;a.energy=0.8;a.age=0;stats.emerged++;bumpExcite(4);a.note('破蛹而出');logEvent('life',`蝴蝶「${a.name}」破蛹羽化了`,a,4);}return;}
    if(st==='larva'){alertTick(a,dt);a.stageT+=dt/DAY*(a.energy>0.4?1:0.3);a.scale=Math.min(1,0.4+0.6*a.stageT/1.1);
      if(a.stageT>1.1&&a.energy>0.45){if(!a.perch||!a.perch.alive)a.perch=nearestPlant(a.x,a.z,3,p=>p.h*plantScale(p)>0.45&&!p.T.water);
        if(a.perch){a.state='pupate';if(a.seek(a.perch.x,a.perch.z,0.06,dt,2)<0.15){a.y=plantBaseY(a.perch)+a.perch.h*plantScale(a.perch)*0.45;a.px=a.perch.x+rand(-0.05,0.05);a.pz=a.perch.z+rand(-0.05,0.05);a.x=a.px;a.z=a.pz;a.setStage('pupa');a.note('化蛹了');logEvent('life',`毛毛虫「${a.name}」化蛹了`,a,2);}return;}}
      a.tt-=dt;if(a.tt<=0){a.tt=2;if(!a.target||!a.target.alive||a.target.growth<0.2)a.target=nearestPlant(a.x,a.z,3,p=>p.T.host&&p.growth>0.25);}
      if(a.target&&a.target.alive){const d=a.seek(a.target.x,a.target.z,0.055,dt,2);if(d<0.18){a.state='eat';a.speed=0;a.target.growth-=0.002*dt;a.target.eaten+=0.002*dt;a.energy=Math.min(1,a.energy+0.02*dt);}else a.state='forage';}
      else{a.state='idle';a.roam(0.04,dt);}return;}
    // adult
    if(a.emerge>0){a.emerge-=dt;a.state='emerge';a.speed=0;return;}
    if(fleeTick(a,dt))return;alertTick(a,dt);
    if(isNight()&&!env.lamp){if(!a.perch||!a.perch.alive)a.perch=nearestPlant(a.x,a.z,8,p=>p.h*plantScale(p)>0.3&&!p.T.water);
      if(a.perch){const ty=plantTop(a.perch);const d=Math.hypot(a.perch.x-a.x,a.perch.z-a.z);if(d>0.08){a.seek(a.perch.x,a.perch.z,Math.min(0.9,d*2+0.05),dt,4);a.state='fly';}else{a.state='rest';a.speed=0;}a.y+=(ty-a.y)*Math.min(1,dt*2);}return;}
    a.perch=null;
    if(a.state==='sip'||a.state==='rest'||a.state==='lay'){a.st-=dt;a.speed=0;if(a.state==='lay'&&a.st<=0&&a.target&&a.target.alive){const t=a.target;const e=new Agent('butterfly',t.x+rand(-0.08,0.08),t.z+rand(-0.08,0.08),{stage:'egg',variant:a.variant,energy:0.8,age:0,scale:1,host:t});e.y=plantBaseY(t)+t.h*plantScale(t)*0.35;a.kids++;a.note('在'+t.T.name+'上产卵');a.energy-=0.25;}
      if(a.st<=0){a.state='fly';a.target=null;}return;}
    a.state='fly';a.tt-=dt;
    const wantLay=a.energy>0.7&&a.age>0.3&&count('butterfly')<capOf('butterfly')&&pop.butterfly.filter(b=>b.stage!=='adult').length<18&&Math.random()<0.0035*dt*60;
    if(a.tt<=0||wantLay){a.tt=rand(2,5);if(!a.target||!a.target.alive){if(wantLay){a.target=nearestPlant(a.x,a.z,8,p=>p.T.host&&p.growth>0.5);if(a.target)a.goal='lay';}if(!a.target&&a.energy<0.8){a.target=nearestPlant(a.x,a.z,9,p=>p.T.nectar&&p.health>0.5&&p.growth>0.45);a.goal='sip';}if(!a.target||!a.wp)a.wp={x:rand(-16,16),z:rand(-9,9),y:rand(0.9,3.4)};}}
    if(!a.wp)a.wp={x:rand(-16,16),z:rand(-9,9),y:rand(0.9,3.4)};
    let tx,tz,ty;if(a.target&&a.target.alive){tx=a.target.x;tz=a.target.z;ty=plantTop(a.target)+0.03;}else{tx=a.wp.x;tz=a.wp.z;ty=heightAt(tx,tz)+a.wp.y;}
    const hd=Math.hypot(tx-a.x,tz-a.z);
    if(hd<0.45&&a.target){const k=Math.min(1,dt*2.2);a.turnTo(Math.atan2(tz-a.z,tx-a.x),6,dt);a.x+=(tx-a.x)*k;a.z+=(tz-a.z)*k;a.speed=0.3;}else{a.h+=Math.sin(a.ph*2.3)*dt*2;a.seek(tx,tz,0.95,dt,2.6);}
    a.y+=(ty-a.y)*Math.min(1,dt*(hd<0.5?3:1))+Math.sin(a.ph*4.7)*dt*0.4;
    if(a.target&&a.target.alive&&hd<0.1&&Math.abs(a.y-ty)<0.12){if(a.goal==='lay'){a.state='lay';a.st=3;}else{a.state='sip';a.st=rand(2.5,5);a.energy=Math.min(1,a.energy+0.35);a.target.pollen=Math.min(3,a.target.pollen+1);env.pollinated=(env.pollinated||0)+1;a.target=null;}}
    else if(!a.target&&hd<0.5){a.wp=null;a.tt=0;}
    a.y=clamp(a.y,heightAt(a.x,a.z)+0.1,TOP-0.8);},
  anim(a,dt){const m=a.m,st=a.stage;
    if(st==='egg'||st==='pupa'){m.root.position.set(a.x,a.y,a.z);if(st==='pupa'){m.root.rotation.set(Math.sin(a.ph*0.7)*0.05,0,0);m.root.position.y=a.y-0.2;}return;}
    if(st==='larva'){a.trail.push(a.x,a.z);const L=0.45*a.scale;a.trail.sample(a.x,a.z,26,L,m.pts);const wave=a.speed>0?a.ph*6:0;
      for(let i=0;i<26;i++){const p=m.pts[i];p.y=heightAt(p.x,p.z)+0.03*a.scale+Math.max(0,Math.sin(wave-i*0.5))*0.018*a.scale*(a.speed>0?1:0);}
      m.body.mesh.scale.setScalar(1);m.body.prof=(t,pp,o)=>{o.r=(t<0.06?0.026:0.033*(1+0.1*Math.abs(Math.sin(t*Math.PI*11))))*(t>0.9?1-(t-0.9)*5:1)*a.scale;o.fy=0.95;o.fz=1;};m.body.update(m.pts);
      m.head.position.copy(m.body.C[0]).addScaledVector(m.body.T[0],0.012*a.scale);m.head.scale.setScalar(a.scale);a.y=m.body.C[0].y;return;}
    m.root.position.set(a.x,a.y,a.z);m.root.rotation.set(0,-a.h,a.state==='fly'?0.12:0,'YZX');m.root.scale.setScalar(1.15*a.scale);
    let f;if(a.state==='emerge'){const k=1-a.emerge/5;m.R.pv.scale.setScalar(0.25+0.75*k);m.L.pv.scale.setScalar(0.25+0.75*k);f=1.35;}
    else if(a.state==='fly'||a.state==='flee'){const cyc=(a.ph*3)%4;f=cyc<3?0.25+Math.sin(a.ph*27)*1.05:0.35;m.R.pv.scale.setScalar(1);m.L.pv.scale.setScalar(1);}
    else if(a.state==='stuck'||a.state==='caught'){f=0.4+Math.sin(a.ph*40)*0.5;}
    else f=1.2+Math.sin(a.ph*1.6)*0.28;
    m.R.pv.rotation.x=-f;m.L.pv.rotation.x=f;m.R.hp.rotation.x=0.12*Math.sin(a.ph*27-0.6);m.L.hp.rotation.x=-0.12*Math.sin(a.ph*27-0.6);},
 },
 isopod:{name:'鼠妇',role:'分解者',lvl:0.5,cost:10,batch:4,life:8,burn:0.0018,resp:0.03,zones:[0.1,0.5,1,1],color:'#8b949b',habitat:'潮湿地表',cap:60,corpse:0,
  flee:{mode:'roll',r:0.5},
  fact:'分解者：吃落叶、尸体和蘑菇，把养分还给土壤。受到惊吓会蜷成一个球，大多数捕食者拿球没办法。怕干，夜里更活跃。',
  model:()=>buildIsopod(),
  update(a,dt){if(fleeTick(a,dt))return;alertTick(a,dt);const m=localMoist(a.x,a.z,zoneAt(a.x,a.z));if(m<0.3)a.energy-=0.005*dt;const sp=isNight()?0.14:0.08;
    if(a.energy<0.92){a.tt-=dt;if(a.tt<=0){a.tt=2;if(!a.target||!a.target.alive)a.target=nearestDet(a.x,a.z,3.5)||nearestPlant(a.x,a.z,2.5,p=>p.T.isoFood&&p.growth>0.3);}
      if(a.target&&a.target.alive){const d=a.seek(a.target.x,a.target.z,sp,dt,3);if(d<0.16){a.state='eat';a.speed=0;const t=a.target;
          if(t.kind==='detritus'){const e=Math.min(t.amount,0.035*dt);t.amount-=e;a.energy=Math.min(1,a.energy+e*1.6);env.zones[zoneAt(t.x,t.z)].fert+=e*0.6;env.decomp=(env.decomp||0)+e;}else{t.growth-=0.002*dt;a.energy=Math.min(1,a.energy+0.015*dt);}
          if(a.energy>0.97)a.target=null;}else a.state='forage';}else{a.state='idle';a.target=null;a.roam(sp*0.7,dt);}}
    else{a.state='idle';a.roam(sp*0.6,dt);}
    if(m>0.4)tryBreed(a,0.004,dt);},
  anim(a,dt){const m=a.m;poseGround(m.root,a,a.groundY()+0.004,a.scale*1.1);m.flat.visible=!a.rolled;m.ball.visible=!!a.rolled;if(a.rolled)m.ball.rotation.z=a.ph*0.3;},
 },
 firefly:{name:'萤火虫',role:'夜间发光',lvl:1,cost:26,batch:4,life:4.5,burn:0.0012,resp:0.03,zones:[0,0.5,1,1],color:'#d5f77a',habitat:'水边 · 雨林',cap:50,corpse:0,
  flee:{mode:'fly',r:0.6,speed:1,dur:1},
  fact:'白天趴在叶子背面休息，夜里升空，用腹部的冷光按固定节奏闪烁寻找伴侣。喜欢潮湿的水边和雨林。',
  model:()=>buildFirefly(),init(a){a.rate=rand(1.6,2.6);a.glow=0;a.flying=false;},
  update(a,dt){if(!isNight()){a.flying=false;a.state='rest';a.speed=0;a.energy=Math.min(1,a.energy+0.004*dt);return;}
    if(fleeTick(a,dt))return;alertTick(a,dt);if(!a.flying){a.flying=true;a.y=heightAt(a.x,a.z)+0.3;}
    a.state='fly';a.roam(0.32,dt);const ty=heightAt(a.x,a.z)+0.35+(Math.sin(a.ph*0.4)*0.5+0.5)*1.4;a.y+=(ty-a.y)*dt*0.8;
    if(env.zones[zoneAt(a.x,a.z)].h>0.5)tryBreed(a,0.011,dt,null,null,{scale:1});},
  anim(a,dt){const m=a.m;a.glow=a.flying?Math.pow(Math.max(0,Math.sin(a.ph*a.rate)),6):0;m.sp.material.opacity=a.glow*0.95+(a.flying?0.06:0);m.sp.scale.setScalar(0.18+0.22*a.glow);
    if(a.flying){m.root.position.set(a.x,a.y,a.z);m.root.rotation.set(0,-a.h,0);}else{m.root.position.set(a.x,a.groundY()+0.015,a.z);}m.root.scale.setScalar(1.2);},
 },
 spider:{name:'园蛛',role:'结网猎手',lvl:2,cost:35,batch:1,life:8,burn:0.0012,resp:0.08,zones:[0.2,0.9,0.7,1],color:'#e0b43a',habitat:'草甸 · 雨林',cap:10,corpse:0.1,
  diet:{butterfly:{v:0.45,stages:['adult']},firefly:{v:0.3},cricket:{v:0.35},ant:{v:0.12},mantis:{v:0.5}},
  hunt:{sense:0.6,stalkR:0.4,reach:0.12,strikeT:0.3,hitAt:0.5,success:0.8,eatT:6,hungry:0.8,stalkSp:0.2,chaseSp:0.3},
  unlock:{need:()=>count('ant')>=25||count('cricket')>=10,text:'蚂蚁 25 只或蟋蟀 10 只后解锁'},
  fact:'在植物之间织圆网，网中央有“之”字形的白色丝带。猎物撞网后，它冲过去用丝把猎物裹起来，再慢慢吃掉。',
  model:()=>buildSpider(),init(a){a.webY=0;},
  update(a,dt){const w=a.web&&a.web.alive?a.web:null;if(!w)a.web=null;
    if(!w){if(a.state==='eat'){a.st-=dt;if(a.st<=0)finishEat(a);return;}a.state='wander';a.flying=false;a.roam(0.25,dt);a.y=heightAt(a.x,a.z);a.tt-=dt;
      if(a.tt<=0){a.tt=2;if(a.S.zones[zoneAt(a.x,a.z)]>0.5&&!inWater(a.x,a.z,-0.1)&&!webs.some(q=>Math.hypot(q.x-a.x,q.z-a.z)<2.2)){const host=nearestPlant(a.x,a.z,1.6,p=>p.h*plantScale(p)>0.55&&!p.T.water);if(host){a.web=makeWeb(a.x,a.z,rand(0,Math.PI),a);a.state='build';a.st=0;a.flying=true;a.note('开始织网');}}}return;}
    w.age+=dt/DAY;a.flying=true;
    if(a.state==='build'){a.st+=dt;w.progress=Math.min(1,a.st/9);const an=w.progress*22*6.283,rr=w.r*(0.16+0.8*w.progress);const p=w.P(rr,an);a.x=p.x;a.y=p.y;a.z=p.z;if(w.progress>=1){a.state='wait';a.wait=0;w.zig.visible=true;logEvent('life',`园蛛「${a.name}」织好了一张新网`,a,2);}return;}
    const home=w.c;
    if(a.state==='wait'){a.wait+=dt;a.x=home.x;a.y=home.y;a.z=home.z;const p=w.stuck.find(q=>q.alive&&!q.wrapped);if(p){a.prey=p;a.state='toPrey';return;}
      if(a.energy<0.8){for(const q of queryAgents(w.x,w.z,0.8)){if((q.sp==='ant'||q.sp==='cricket'||q.sp==='isopod'&&!q.rolled)&&!q.hidden&&!q.heldBy&&!q.stuck&&!q.hop&&Math.random()<0.3*dt){a.prey=q;a.state='drop';a.dropY=a.y;return;}}}
      if(w.age>1.4&&!isNight()){removeWeb(w);a.web=null;a.state='wander';}else if(a.energy<0.3&&a.wait>DAY*0.8){removeWeb(w);a.web=null;a.state='wander';}
      tryBreed(a,0.0012,dt,w.x+rand(-1.5,1.5),w.z+rand(-1.5,1.5));return;}
    if(a.state==='toPrey'){const p=a.prey;if(!p||!p.alive||p.stuck!==w){a.state='return';return;}const tp=p.stuckPos;const dx=tp.x-a.x,dy=tp.y-a.y,dz=tp.z-a.z,d=Math.hypot(dx,dy,dz);const s=Math.min(d,0.5*dt);if(d>0.02){a.x+=dx/d*s;a.y+=dy/d*s;a.z+=dz/d*s;}a.speed=0.5;if(d<0.04){a.state='wrap';a.st=2.5;}return;}
    if(a.state==='wrap'){a.st-=dt;a.speed=0;if(a.st<=0){const p=a.prey;if(p&&p.alive){p.wrapped=true;if(p.m&&p.m.root)p.m.root.visible=false;a.cocoon=buildCocoon();a.cocoon.position.copy(p.stuckPos);a.cocoon.scale.setScalar(p.sp==='cricket'||p.sp==='mantis'?1.3:1);tank.add(a.cocoon);a.state='feed';a.st=10;stats.hunts++;a.note(`用丝裹住了一只${p.S.name}`);logEvent('hunt',`园蛛「${a.name}」把${p.S.name}裹成了茧`,a,3);bumpExcite(3);}else a.state='return';}return;}
    if(a.state==='feed'){a.st-=dt;a.speed=0;if(a.st<=0){const p=a.prey;if(p&&p.alive){a.energy=Math.min(1,a.energy+(a.S.diet[p.sp]?a.S.diet[p.sp].v:0.3));a.kills++;const i=w.stuck.indexOf(p);if(i>=0)w.stuck.splice(i,1);p.stuck=null;p.die('eaten');}if(a.cocoon){tank.remove(a.cocoon);a.cocoon.geometry.dispose();a.cocoon=null;}a.prey=null;a.state='return';}return;}
    if(a.state==='return'){const dx=home.x-a.x,dy=home.y-a.y,dz=home.z-a.z,d=Math.hypot(dx,dy,dz);const s=Math.min(d,0.45*dt);if(d>0.02){a.x+=dx/d*s;a.y+=dy/d*s;a.z+=dz/d*s;}if(d<0.03)a.state='wait';return;}
    if(a.state==='drop'){const p=a.prey;if(!p||!p.alive||p.heldBy||p.hidden){a.state='climb';return;}a.x+= (p.x-a.x)*Math.min(1,dt*3);a.z+=(p.z-a.z)*Math.min(1,dt*3);const gy=heightAt(a.x,a.z);a.y=Math.max(gy+0.03,a.y-dt*1.2);
      if(a.y<=gy+0.035){if(Math.hypot(p.x-a.x,p.z-a.z)<0.18&&Math.random()<0.7){catchPrey(a,p);a.state='eatDrop';a.st=5;}else a.state='climb';}return;}
    if(a.state==='eatDrop'){a.st-=dt;if(a.st<=0){finishEat(a);a.state='climb';}return;}
    if(a.state==='climb'){a.x+=(home.x-a.x)*Math.min(1,dt*2);a.z+=(home.z-a.z)*Math.min(1,dt*2);a.y=Math.min(home.y,a.y+dt*0.8);if(a.y>=home.y-0.01)a.state='wait';return;}
    a.state='wait';},
  anim(a,dt){const m=a.m;m.root.scale.setScalar(a.scale*1.15);const w=a.web;
    if(w&&w.alive&&['build','wait','toPrey','wrap','feed','return'].includes(a.state)){m.root.position.set(a.x,a.y,a.z).addScaledVector(w.n,0.03);const fwd=new V3(0,-1,0),up=w.n.clone(),side=new V3().crossVectors(fwd,up);_m4.makeBasis(fwd,up,side);m.root.quaternion.setFromRotationMatrix(_m4);
      const walk=(a.state==='build'||a.state==='toPrey'||a.state==='return')?1:a.state==='wrap'?2:0;m.legs.forEach(l=>{const o=Math.sin(a.ph*(walk===2?30:10)+(l.k%2?Math.PI:0)+(l.s>0?0:Math.PI));l.piv.rotation.set(0,o*0.25*(walk?1:0),Math.max(0,o)*0.3*(walk?1:0));});}
    else{const y=a.state==='drop'||a.state==='climb'?a.y:heightAt(a.x,a.z)+0.02;m.root.quaternion.identity();poseGround(m.root,a,y,a.scale*1.15);const walk=a.speed>0?1:0;m.legs.forEach(l=>{const o=Math.sin(a.ph*14+(l.k%2?Math.PI:0)+(l.s>0?0:Math.PI));l.piv.rotation.set(0,o*0.28*walk,Math.max(0,o)*0.3*walk);});}},
  mouth(a,o){o.set(a.x,a.y+0.02,a.z);},
 },
 mantis:{name:'螳螂',role:'伏击猎手',lvl:2,cost:45,batch:1,life:7,burn:0.002,resp:0.12,zones:[0.2,1,0.6,0.9],color:'#78b046',habitat:'花丛 · 草甸',cap:6,corpse:0.15,
  diet:{butterfly:{v:0.45,stages:['adult','larva']},cricket:{v:0.4},firefly:{v:0.3},spider:{v:0.4,cond:p=>!p.web},ant:{v:0.08,w:0.3},isopod:{v:0.15,w:0.3}},
  hunt:{sense:2.0,stalkR:0.9,reach:0.4,strikeT:0.45,hitAt:0.35,success:0.75,eatT:9,hungry:0.72,stalkSp:0.05,chaseSp:0.12,move:(a,p,dt,mode)=>{a.state='stalk';if(a.perch&&a.energy<0.55&&Math.abs(p.y-a.y)>0.3){a.perch=null;a.onPerch=false;}if(a.perch){a.turnTo(Math.atan2(p.z-a.z,p.x-a.x),2,dt);a.speed=0;}else a.seek(p.x,p.z,mode==='stalk'?0.05:0.12,dt,3);}},
  unlock:{need:()=>count('cricket')>=10&&pop.butterfly.filter(b=>b.stage==='adult').length>=4,text:'蟋蟀 10 只、蝴蝶成虫 4 只后解锁'},
  fact:'停在花枝上左右摇晃、模仿被风吹动的叶子，等猎物靠近，再用带刺的前足在一瞬间夹住。',
  model:()=>buildMantis(),
  update(a,dt){if(huntTick(a,dt))return;
    if(!a.perch||!a.perch.alive){a.tt-=dt;if(a.tt<=0){a.tt=3;a.perch=nearestPlant(a.x,a.z,4,p=>(p.T.nectar||p.T.perch)&&p.h*plantScale(p)>0.3&&!p.T.water&&!p.T.single);a.onPerch=false;}}
    if(a.perch&&a.perch.alive){if(!a.onPerch){a.state='idle';const d=a.seek(a.perch.x,a.perch.z,0.08,dt,3);a.y=heightAt(a.x,a.z);if(d<0.12){a.onPerch=true;a.perchT=0;}}
      else{a.state='ambush';a.speed=0;a.x=a.perch.x+0.02;a.z=a.perch.z;a.y=plantTop(a.perch)-0.08;a.perchT+=dt/DAY;if(a.perchT>0.6&&a.energy<0.6){a.perch=null;a.onPerch=false;}}}
    else{a.state='idle';a.roam(0.07,dt);a.y=heightAt(a.x,a.z);}
    tryBreed(a,0.0008,dt);},
  anim(a,dt){const m=a.m;if(!a.onPerch)a.y=heightAt(a.x,a.z);poseGround(m.root,a,a.y,a.scale*1.1);if(a.onPerch)m.root.rotation.x=Math.sin(a.ph*1.4)*0.08;
    if(a.prey&&a.prey.alive){const la=angDiff(a.h,Math.atan2(a.prey.z-a.z,a.prey.x-a.x));m.head.rotation.y=-clamp(la,-0.8,0.8);}else m.head.rotation.y=Math.sin(a.ph*0.5)*0.4;
    let ext=0;if(a.state==='strike'){const pr=1-a.st/a.S.hunt.strikeT;ext=pr<0.35?pr/0.35:Math.max(0,1-(pr-0.35)/0.3);}m.fore.forEach(f=>{f.piv.rotation.z=ext*0.9;f.tib.rotation.z=-ext*1.6;});
    if(a.state==='eat')m.head.rotation.z=Math.sin(a.ph*9)*0.15;else m.head.rotation.z=0;},
  mouth(a,o){o.set(a.x+Math.cos(a.h)*0.2*a.scale,a.y+0.2*a.scale,a.z+Math.sin(a.h)*0.2*a.scale);},
 },
 frog:{name:'雨蛙',role:'两栖捕食者',lvl:2,stages:['egg','tadpole','adult'],stageNames:{egg:'卵块',tadpole:'蝌蚪',adult:'雨蛙'},stageBurn:{egg:0,tadpole:0.0016,adult:0.0021},
  cost:50,batch:1,life:9,burn:0.0021,resp:0.45,zones:[0,0.4,1,0.85],color:'#6aa83f',habitat:'溪沼 · 水边',cap:26,swim:true,hopDur:0.42,hopH:0.3,corpse:0.35,
  diet:{ant:{v:0.07,w:0.5},cricket:{v:0.3},isopod:{v:0.15},butterfly:{v:0.35,stages:['adult','larva'],cond:p=>p.stage!=='adult'||p.y-heightAt(p.x,p.z)<0.7},firefly:{v:0.2,cond:p=>p.flying&&p.y-heightAt(p.x,p.z)<0.8},spider:{v:0.3,cond:p=>!p.web},snail:{v:0.25,w:0.3}},
  hunt:{sense:2.2,stalkR:1.2,reach:0.7,strikeT:0.38,hitAt:0.45,success:0.8,eatT:1.8,hungry:0.7,move:(a,p,dt)=>{a.state='stalk';if(!a.hop){const d=Math.hypot(p.x-a.x,p.z-a.z);startHop(a,Math.atan2(p.z-a.z,p.x-a.x),Math.min(0.9,Math.max(0.25,d-0.5)));}else hopTick(a,dt);}},
  flee:{mode:'hop',r:1.3,dur:1.5},
  fact:'卵块漂在水面，孵出的蝌蚪吃藻类，一天多后长出四肢爬上岸。成蛙靠弹射长舌头捕虫，夜里鼓起声囊鸣叫，下雨时最热闹。',
  model:a=>a.stage==='egg'?buildSpawn():a.stage==='tadpole'?buildTadpole():buildFrog(),
  init(a){if(a.stage==='tadpole')a.trail=new Trail(0.22,a.x,a.z,a.h);a.croak=0;},
  update(a,dt){const st=a.stage;
    if(st==='egg'){a.speed=0;a.stageT+=dt/DAY;if(a.stageT>0.35){const n=irand(5,9);for(let i=0;i<n;i++){const t=new Agent('frog',a.x+rand(-0.25,0.25),a.z+rand(-0.25,0.25),{stage:'tadpole',scale:0.6,age:0,energy:0.7});}stats.hatched+=n;logEvent('life',`水塘里孵出了 ${n} 只蝌蚪`,a,3);bumpExcite(3);a.die('hatched');}return;}
    if(st==='tadpole'){a.stageT+=dt/DAY;a.scale=Math.min(1,0.6+a.stageT*0.4);a.state='swim';a.roam(0.16,dt);const al=env.algae;if(al>0.03){env.algae-=0.00004*dt;a.energy=Math.min(1,a.energy+0.012*dt);}
      if(a.stageT>1.2&&a.energy>0.4){a.scale=0.45;a.setStage('adult');a.age=0;stats.metamorph++;bumpExcite(3);a.note('长出四肢，爬上了岸');logEvent('life',`蝌蚪「${a.name}」变成了小雨蛙`,a,3);}return;}
    const zi=zoneAt(a.x,a.z);if(env.zones[zi].h<0.45&&!inWater(a.x,a.z))a.energy-=0.005*dt;
    a.croak=Math.max(0,a.croak-dt);if(isNight()&&a.scale>=0.9&&a.croak<=0&&Math.random()<(rain.intensity>0.2?0.35:0.12)*dt){a.croak=1.8;sfx('frog',a);}
    if(a.hop&&a.state!=='stalk'){hopTick(a,dt);return;}
    if(fleeTick(a,dt))return;alertTick(a,dt);
    if(huntTick(a,dt))return;
    a.state=inWater(a.x,a.z)?'swim':'idle';a.speed=0;a.idle=(a.idle||rand(1,3))-dt;
    if(a.idle<=0){a.idle=rand(1,3.5);let ang,len;const far=pondD(a.x,a.z)>2.2;if(far||env.zones[zi].h<0.55){ang=Math.atan2(POND.z-a.z,POND.x-a.x)+rand(-0.6,0.6);len=rand(0.5,0.9);}else{ang=a.h+rand(-1.6,1.6);len=rand(0.3,0.9);}startHop(a,ang,len);}
    if(isNight()&&a.scale>=1&&env.zones[2].h>0.6&&count('frog')<capOf('frog')&&pop.frog.filter(f=>f.stage==='adult').length<11&&a.energy>0.75&&Math.random()<0.0012*dt){const an=rand(0,6.28);const r=pondR(an)*0.85;const x=POND.x+Math.cos(an)*r,z=POND.z+Math.sin(an)*r;if(inPond(x,z,0.05)){new Agent('frog',x,z,{stage:'egg',age:0,energy:1});a.energy-=0.3;a.kids++;a.note('在水塘里产下卵块');logEvent('life',`雨蛙「${a.name}」在水塘里产卵了`,a,3);}}},
  anim(a,dt){const m=a.m,st=a.stage;
    if(st==='egg'){m.root.position.set(a.x,env.waterY-0.01,a.z);m.root.rotation.y=a.ph*0.05;return;}
    if(st==='tadpole'){a.trail.push(a.x,a.z);a.trail.sample(a.x,a.z,14,0.22*a.scale,m.pts);const wy=waterSurf(a.x,a.z)-0.12;for(let i=0;i<14;i++){const p=m.pts[i];const s=Math.sin(a.ph*14-i*0.8)*0.02*(i/13)*a.scale;const B=i>0?m.pts[i-1]:p;const dx=p.x-B.x,dz=p.z-B.z,l=Math.hypot(dx,dz)||1;p.x+=-dz/l*s;p.z+=dx/l*s;p.y=wy;}
      m.body.prof=(t,pp,o)=>{if(t<0.3){o.r=(0.034*Math.pow(Math.sin(Math.PI*(0.12+t/0.3*0.88)),0.6)+0.004)*a.scale;o.fy=0.8;o.fz=1;}else{o.r=(0.022*(1-(t-0.3)/0.7)+0.002)*a.scale;o.fy=2.3;o.fz=0.22;}};m.body.update(m.pts);a.y=wy;return;}
    let y=a.hop?hopY(a):a.groundY(),ext=0,pitch=0;if(a.hop&&!a.hop.swim){const t=a.hop.t;ext=Math.sin(Math.PI*Math.min(1,t*1.5));pitch=(0.45-t)*0.7;}else if(a.hop&&a.hop.swim)ext=Math.max(0,Math.sin(a.hop.t*Math.PI*3))*0.8;
    a.y=y;m.root.position.set(a.x,y,a.z);m.root.rotation.set(0,-a.h,pitch,'YZX');m.root.scale.setScalar(a.scale*1.05);
    m.hind.forEach(h=>{h.hip.rotation.z=-ext*1.5;h.knee.rotation.z=ext*2.2;h.ankle.rotation.z=-ext*0.6;});
    const cr=a.croak>0?Math.max(0,Math.sin((1.8-a.croak)*Math.PI*5)):0;m.sac.scale.setScalar(0.15+cr*0.95);
    const blink=a.state==='eat'&&a.st>a.S.hunt.eatT-0.8?0.35:(Math.sin(a.ph*0.9)>0.995?0.2:1);m.eyes.forEach(e=>e.scale.y=blink);
    const H=a.S.hunt;let tl=0;if(a.state==='strike'){const pr=1-a.st/H.strikeT;tl=pr<0.5?pr/0.5:1-(pr-0.5)/0.5;}else if(a.state==='eat'&&a.st>H.eatT-0.25){tl=(a.st-(H.eatT-0.25))/0.25*0.6;}
    if(tl>0.01){const tgt=a.strikeAt||{x:a.x,y:y,z:a.z};const hx=a.x+Math.cos(a.h)*0.19*a.scale,hz=a.z+Math.sin(a.h)*0.19*a.scale,hy=y+0.09*a.scale;const D=Math.hypot(tgt.x-hx,tgt.y-hy,tgt.z-hz)*tl;
      m.tongue.visible=true;m.tongue.scale.set(Math.max(0.001,D/(a.scale*1.05)),1,1);m.tongue.rotation.z=Math.atan2(tgt.y-hy,Math.hypot(tgt.x-hx,tgt.z-hz));
      m.tip.visible=true;const k=D/Math.max(1e-4,Math.hypot(tgt.x-hx,tgt.y-hy,tgt.z-hz));m.tip.position.set(hx+(tgt.x-hx)*k,hy+(tgt.y-hy)*k,hz+(tgt.z-hz)*k);a.tipPos=m.tip.position;}
    else{m.tongue.visible=false;m.tip.visible=false;a.tipPos=null;}},
  mouth(a,o){if(a.tipPos)o.copy(a.tipPos);else o.set(a.x+Math.cos(a.h)*0.18*a.scale,a.y+0.08*a.scale,a.z+Math.sin(a.h)*0.18*a.scale);},
 },
 lizard:{name:'沙蜥',role:'捕食者',lvl:3,cost:70,batch:1,life:12,burn:0.002,resp:0.9,zones:[1,0.9,0.3,0.35],color:'#c9a066',habitat:'沙漠 · 加热岩',cap:8,corpse:0.6,
  diet:{ant:{v:0.07,w:0.5},cricket:{v:0.3},isopod:{v:0.15},butterfly:{v:0.3,stages:['larva','adult'],cond:p=>p.stage==='larva'||p.y-heightAt(p.x,p.z)<0.35},mantis:{v:0.45,cond:p=>!p.onPerch},spider:{v:0.35,cond:p=>!p.web},snail:{v:0.3,w:0.5}},
  hunt:{sense:4.5,stalkR:1.1,reach:0.36,strikeT:0.35,hitAt:0.5,success:0.72,eatT:3,hungry:0.75,stalkSp:0.22,chaseSp:1.4,lunge:1.4},
  flee:{mode:'run',r:1.8,speed:2.0,dur:1.5},
  fact:'变温动物。早上体温低时趴在加热岩上晒太阳，暖和了才去捕猎；偶尔做几个俯卧撑宣示领地。',
  model:()=>buildLizard(),init(a){a.trail=new Trail(1.2,a.x,a.z,a.h);a.bt=0;a.move=0;a.push=0;a.tflick=0;},
  update(a,dt){a.tflick=Math.max(0,a.tflick-dt);if(Math.random()<0.25*dt)a.tflick=0.35;
    if(isNight()&&!env.lamp){a.state='sleep';a.speed=0;return;}
    if(fleeTick(a,dt))return;alertTick(a,dt);
    a.bt-=dt;if(a.bt<=0){a.moving=!a.moving;a.bt=a.moving?rand(0.35,0.9):rand(0.3,1.5);}
    const H=a.S.hunt;const baseChase=H.chaseSp;H.chaseSp=a.moving?1.4:0;const busy=huntTick(a,dt);H.chaseSp=baseChase;if(busy)return;
    const T=env.zones[zoneAt(a.x,a.z)].T;const sp=a.moving?1.0*(0.7+0.3*a.scale):0;
    if(T<30&&env.daylight>0.3&&a.energy>0.45){let hr=null,bd=1e9;for(const q of HEATROCKS){const dd=Math.hypot(q.x-a.x,q.z-a.z);if(dd<bd){bd=dd;hr=q;}}if(!hr)hr={x:a.x+0.01,z:a.z};const d=Math.hypot(hr.x-a.x,hr.z-a.z);a.state='bask';if(d>0.55)a.seek(hr.x,hr.z,sp,dt,4);else{a.speed=0;a.push=Math.max(0,a.push-dt);if(Math.random()<0.06*dt)a.push=1.2;}return;}
    a.state='idle';a.roam(sp*0.7,dt);if(a.age>a.life*0.15)tryBreed(a,0.0009,dt);},
  anim(a,dt){const m=a.m;a.trail.push(a.x,a.z);a.move=lerp(a.move,a.speed>0?1:0,Math.min(1,dt*8));a.gph=(a.gph||0)+dt*a.move*11;const L=1.15*a.scale;a.trail.sample(a.x,a.z,40,L,m.pts);
    const pu=a.state==='bask'?Math.max(0,Math.sin(a.push*Math.PI*3))*0.05:0;
    for(let i=0;i<40;i++){const p=m.pts[i],t=i/39;const s=Math.sin(a.gph-i*0.32)*0.045*a.move*(0.2+t)*a.scale;const B=i>0?m.pts[i-1]:m.pts[1];const dx=i>0?p.x-B.x:B.x-p.x,dz=i>0?p.z-B.z:B.z-p.z,l=Math.hypot(dx,dz)||1;p.x+=-dz/l*s;p.z+=dx/l*s;
      LIZ_PROF(t,null,m.body.o);p.y=heightAt(p.x,p.z)+m.body.o.r*m.body.o.fy*a.scale*0.95+(t<0.3?pu*(1-t/0.3)+0.02*a.scale:0);}
    m.body.prof=(t,pp,o)=>{LIZ_PROF(t,pp,o);o.r*=a.scale;};m.body.update(m.pts);const B=m.body;
    _m4.makeBasis(B.T[3],B.Uv[3],B.S[3]);m.eyes.quaternion.setFromRotationMatrix(_m4);m.eyes.position.copy(B.C[3]).addScaledVector(B.Uv[3],0.018*a.scale);m.eyes.scale.setScalar(a.scale);
    m.legs.forEach((l,k)=>{const i=l.ri;_m4.makeBasis(B.T[i],B.Uv[i],B.S[i]);l.piv.quaternion.setFromRotationMatrix(_m4);l.piv.position.copy(B.C[i]).addScaledVector(B.S[i],l.s*B.R[i]*0.7).addScaledVector(B.Uv[i],-B.R[i]*0.35);l.piv.scale.setScalar(a.scale);
      const ph=a.gph+(k%2?Math.PI:0)+(l.kind<0?Math.PI:0);l.piv.rotateY(Math.sin(ph)*0.6*a.move*l.s);l.piv.rotateX(Math.max(0,Math.cos(ph))*0.25*a.move*l.s);});
    let tl=0;if(a.state==='strike')tl=0.12;else if(a.tflick>0)tl=Math.sin(a.tflick/0.35*Math.PI)*0.06;
    if(tl>0.005){m.tongue.visible=true;_m4.makeBasis(B.T[0],B.Uv[0],B.S[0]);m.tongue.quaternion.setFromRotationMatrix(_m4);m.tongue.position.copy(B.C[0]);m.tongue.scale.set(tl*a.scale,a.scale,a.scale);}else m.tongue.visible=false;
    a.y=B.C[0].y;a.headPos=B.C[0];},
  mouth(a,o){if(a.m&&a.m.body)o.copy(a.m.body.C[0]).addScaledVector(a.m.body.T[0],0.02);else o.set(a.x,a.y,a.z);},
 },
 snake:{name:'玉米蛇',role:'顶级捕食者',lvl:4,cost:140,batch:1,life:20,burn:0.0009,resp:1.2,zones:[0.8,0.8,0.6,1],color:'#df8a47',habitat:'全缸',cap:2,corpse:1,
  diet:{frog:{v:0.7,stages:['adult'],cond:p=>p.scale>0.7},lizard:{v:0.8},cricket:{v:0.1,w:0.2}},
  hunt:{sense:4,stalkR:1.6,reach:0.45,strikeT:0.5,hitAt:0.4,success:0.65,eatT:16,hungry:0.45,stalkSp:0.12,chaseSp:0.5,lunge:2.2},
  unlock:{need:()=>(!SPK.includes('lizard')||count('lizard')>=3)&&(!SPK.includes('frog')||pop.frog.filter(f=>f.stage==='adult').length>=5),get text(){return[SPK.includes('lizard')?'沙蜥 3 只':'',SPK.includes('frog')?'成年雨蛙 5 只':''].filter(Boolean).join('、')+'后解锁';}},
  fact:'食物链的顶端。靠舌头收集气味追踪猎物，突袭后把猎物整只吞下，再找个温暖的地方慢慢消化好几天。',
  model:()=>buildSnake(),init(a){a.trail=new Trail(2.8,a.x,a.z,a.h);a.bulge=0;a.bt=0.1;a.tflick=0;},
  onAte(a){a.bulge=1;a.bt=0.12;a.state='digest';a.digest=DAY*0.8;},
  update(a,dt){a.tflick=Math.max(0,a.tflick-dt);if(Math.random()<0.4*dt)a.tflick=0.5;
    if(a.state==='eat'){a.bt=Math.min(0.35,a.bt+dt*0.02);}
    if(a.digest>0){a.digest-=dt;a.state='digest';a.bt=Math.min(0.7,a.bt+dt/DAY*0.8);a.bulge=Math.max(0,a.bulge-dt/DAY*0.9);if(Math.random()<0.1*dt){a.h+=rand(-0.5,0.5);}a.step(0.03,dt);return;}
    if(huntTick(a,dt)){if(a.state==='stalk'||a.state==='chase')a.h+=Math.sin(a.ph*2)*0.8*dt;return;}
    a.state='idle';a.h+=Math.sin(a.ph*1.3)*0.9*dt;a.roam(0.22,dt);if(isNight())a.speed*=0.5;},
  anim(a,dt){const m=a.m;a.trail.push(a.x,a.z);const L=2.6*a.scale;a.trail.sample(a.x,a.z,100,L,m.pts);
    for(let i=0;i<100;i++){const p=m.pts[i],t=i/99;SNAKE_PROF(t,a,m.body.o);p.y=heightAt(p.x,p.z)+m.body.o.r*m.body.o.fy*a.scale*0.95+(a.state==='strike'&&t<0.15?(0.15-t)*0.5:0);}
    m.body.prof=(t,pp,o)=>{SNAKE_PROF(t,a,o);o.r*=a.scale;};m.body.update(m.pts,a);const B=m.body;
    _m4.makeBasis(B.T[2],B.Uv[2],B.S[2]);m.eyes.quaternion.setFromRotationMatrix(_m4);m.eyes.position.copy(B.C[2]).addScaledVector(B.Uv[2],0.012*a.scale);m.eyes.scale.setScalar(a.scale);
    if(a.tflick>0){m.tongue.visible=true;_m4.makeBasis(B.T[0],B.Uv[0],B.S[0]);m.tongue.quaternion.setFromRotationMatrix(_m4);m.tongue.position.copy(B.C[0]);m.tongue.scale.setScalar(a.scale*(0.6+0.4*Math.abs(Math.sin(a.tflick*30))));}else m.tongue.visible=false;a.y=B.C[0].y;},
  mouth(a,o){if(a.m&&a.m.body)o.copy(a.m.body.C[0]).addScaledVector(a.m.body.T[0],0.03);else o.set(a.x,a.y,a.z);},
 },
};
function poseGround(root,a,y,s){const f=0.12,hx=Math.cos(a.h)*f,hz=Math.sin(a.h)*f;const pitch=Math.atan2(heightAt(a.x+hx,a.z+hz)-heightAt(a.x-hx,a.z-hz),2*f);root.position.set(a.x,y,a.z);root.rotation.set(0,-a.h,pitch,'YZX');root.scale.setScalar(s);a.y=y;}
function heldPos(a,o){const S=a.S;if(S.mouth)S.mouth(a,o);else o.set(a.x,a.y+0.05,a.z);return o;}
