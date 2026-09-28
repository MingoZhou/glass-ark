
/* =================== rain & atmosphere fx =================== */
const RN=2200,rainPos=new Float32Array(RN*6).fill(-100),drops=[];for(let i=0;i<RN;i++)drops.push({on:false,x:0,y:0,z:0,v:0});
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rainLines=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xd6ecf5,transparent:true,opacity:0.5,depthWrite:false}));rainLines.frustumCulled=false;rainLines.renderOrder=6;tank.add(rainLines);
const rain={active:false,global:0,cx:0,cz:0,intensity:0,ptr:0,cloud:[],R:2.4};
for(let i=0;i<9;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.soft,color:0xc9d6d8,transparent:true,depthWrite:false,opacity:0}));s.scale.setScalar(rand(2,3.2));s.renderOrder=7;tank.add(s);rain.cloud.push({s,ox:rand(-1.6,1.6),oz:rand(-1.2,1.2)});}
const SPN=500,splPos=new Float32Array(SPN*3).fill(-100),spl=[];for(let i=0;i<SPN;i++)spl.push({t:1,x:0,y:0,z:0,vx:0,vy:0,vz:0});
const splGeo=new THREE.BufferGeometry();splGeo.setAttribute('position',new THREE.BufferAttribute(splPos,3));
const splPts=new THREE.Points(splGeo,new THREE.PointsMaterial({map:TX.soft,color:0xe6f5fa,size:0.07,transparent:true,opacity:0.8,depthWrite:false}));splPts.frustumCulled=false;tank.add(splPts);let splPtr=0;
function splash(x,y,z,n){for(let k=0;k<(n||2);k++){const s=spl[splPtr++%SPN];s.t=0;s.x=x;s.y=y;s.z=z;s.vx=rand(-0.6,0.6);s.vy=rand(0.8,1.6);s.vz=rand(-0.6,0.6);}}
function updateRain(rdt){const want=rain.active||rain.global>0?1:0;rain.intensity+=(want-rain.intensity)*Math.min(1,rdt*(want?4:2));if(rain.global>0)rain.global-=rdt;
  const I=rain.intensity;let n=I*(rain.global>0?2600:900)*rdt;
  while(n>0){if(n<1&&Math.random()>n)break;n--;const d=drops[rain.ptr++%RN];let x,z;if(rain.global>0){x=rand(-HW+0.3,HW-0.3);z=rand(-HD+0.6,HD-0.3);}else{const r=rain.R*Math.sqrt(Math.random()),a=rand(0,6.283);x=clamp(rain.cx+Math.cos(a)*r,-HW+0.2,HW-0.2);z=clamp(rain.cz+Math.sin(a)*r,-HD+0.4,HD-0.2);}
    d.on=true;d.x=x;d.z=z;d.y=TOP-0.2-rand(0,0.6);d.v=rand(9,12);}
  for(let i=0;i<RN;i++){const d=drops[i],o=i*6;if(!d.on){rainPos[o+1]=rainPos[o+4]=-100;continue;}d.y-=d.v*rdt;const gy=OCEAN?WT:surfaceY(d.x,d.z);
    if(d.y<=gy){d.on=false;if(OCEAN){if(Math.random()<0.06)splash(d.x,gy,d.z,1);}else if(inWater(d.x,d.z)){if(Math.random()<0.1)ripple(d.x,d.z,0.22);}else if(Math.random()<0.15)splash(d.x,gy,d.z);rainPos[o+1]=rainPos[o+4]=-100;continue;}
    rainPos[o]=d.x;rainPos[o+1]=d.y;rainPos[o+2]=d.z;rainPos[o+3]=d.x;rainPos[o+4]=d.y+0.3;rainPos[o+5]=d.z;}
  rainGeo.attributes.position.needsUpdate=true;
  for(let i=0;i<SPN;i++){const s=spl[i];if(s.t>=1){splPos[i*3+1]=-100;continue;}s.t+=rdt*3;s.vy-=9*rdt;s.x+=s.vx*rdt;s.y+=s.vy*rdt;s.z+=s.vz*rdt;splPos[i*3]=s.x;splPos[i*3+1]=s.y;splPos[i*3+2]=s.z;}splGeo.attributes.position.needsUpdate=true;
  rain.cloud.forEach(c=>{c.s.material.opacity=rain.global>0?0:I*0.5;c.s.position.set(rain.cx+c.ox,TOP-0.5,rain.cz+c.oz);});
  if(I>0.05){if(OCEAN){env.sal=Math.max(28,env.sal-(rain.global>0?0.09:0.015)*rdt*I);}else if(rain.global>0){env.zones.forEach(z=>{z.m=Math.min(1,z.m+0.045*rdt*I);z.h=Math.min(1,z.h+0.03*rdt*I);});env.pond=Math.min(1,env.pond+0.02*rdt*I);}
    else{const zi=zoneAt(rain.cx,rain.cz),z=env.zones[zi];z.m=Math.min(1,z.m+0.05*rdt*I);z.h=Math.min(1,z.h+0.03*rdt*I);if(MODE.pond&&pondD(rain.cx,rain.cz)<1.4)env.pond=Math.min(1,env.pond+0.05*rdt*I);env.rainZone[zi]=1;
      const c=tcell(rain.cx,rain.cz);turf[c]=Math.min(turfCap[c],turf[c]+0.002*rdt);}}
  sndRain(I);}
const mist=[];for(let i=0;i<46;i++){const zi=i<8?-1:1+(i%3);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.soft,color:0xe8f0ee,transparent:true,depthWrite:false,opacity:0}));const sc=zi<0?rand(1.2,2.2):rand(2.4,4.4);s.scale.set(sc*1.6,sc,1);s.renderOrder=5;tank.add(s);
  const x=zi<0?POOL.x+rand(-1,1):MODE.zone!=null?rand(-HW+2,HW-2):ZONES[zi].cx+rand(-3,3),z=zi<0?POOL.z+rand(-0.4,1.2):rand(-8,8);const off=OCEAN||(zi<0&&!MODE.stream)||(MODE.zone===0);if(off)s.visible=false;mist.push({s,off,zi:MODE.zone!=null&&zi>0?MODE.zone:zi,x,z,y:zi<0?rand(0.3,2):rand(0.5,2),v:rand(0.05,0.14)*(Math.random()<0.5?-1:1)});}
const DN=600,dustPos=new Float32Array(DN*3),dustSeed=[];for(let i=0;i<DN;i++)dustSeed.push([rand(-HW,HW),rand(0.5,TOP-0.5),rand(-HD,HD),rand(0,10)]);
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({map:TX.soft,color:0xfff2d2,size:0.06,transparent:true,opacity:0.3,depthWrite:false,blending:THREE.AdditiveBlending}));dust.frustumCulled=false;tank.add(dust);
const foam=[];for(let i=0;i<7;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.soft,color:0xffffff,transparent:true,depthWrite:false,opacity:0.5}));s.renderOrder=6;tank.add(s);foam.push({s,ph:rand(0,6)});if(!MODE.stream)s.visible=false;}
const seedPuffs=[];

/* =================== simulation =================== */
const ZBIAS=[7,1,-1,2];
const turfZone=new Uint8Array(turf.length);for(let c=0;c<turf.length;c++)turfZone[c]=zoneAt(-HW+(c%TNX)+0.5,-HD+Math.floor(c/TNX)+0.5);
function plantMoist(p){let m=env.zones[p.zone].m;if(p.mbP==null){const dp=pondD(p.x,p.z);p.mbP=dp<2?0.32*(1-smooth(1,2,dp)):0;const q=streamQ(p.x,p.z);p.mbS=q.d<2?0.3*(1-smooth(0.6,2,q.d)):0;}
  if(env.pond>0.08)m+=p.mbP;if(env.pump)m+=p.mbS;return Math.min(1,m);}
let plantAcc=0,turfAcc=0,webAcc=0;
function simStep(dt){
  env.time+=dt/DAY;if(env.time>=1){env.time-=1;env.day++;newDay();}
  const th=(env.time-0.25)*Math.PI*2;env.sunH=Math.sin(th);env.daylight=smooth(-0.05,0.22,env.sunH);env.light=Math.max(env.daylight,env.lamp?0.65:0);
  if(env.heat>0)env.heat-=dt;if(env.vent>0)env.vent-=dt;const L=env.light;
  if(env.shower&&env.time>env.shower.t){rain.global=10;env.shower=null;toast(OCEAN?'<b>自动补水</b>：顶部淋入一批淡水':'<b>午后阵雨</b>：顶部喷淋自动开启');logEvent('info','午后阵雨',null,1);}
  if(env.visit&&env.time>0.75){const g=Math.round(env.score*0.8);env.coins+=g;env.visit=0;toast(`参观日结算：观赏值 ${env.score}，门票收入 <b>+${g} 孢子</b>`);logEvent('life',`参观日门票收入 ${g} 孢子`,null,2);}
  if(OCEAN)oceanStep(dt,L);else{
  for(let i=0;i<4;i++){const z=env.zones[i];const Tt=18+env.daylight*9+ZBIAS[i]+(env.lamp?2.5:0)-z.m*4+(env.heat>0&&(i<2||MODE.zone!=null)?6:0);z.T+=(Tt-z.T)*Math.min(1,0.05*dt);
    const ev=0.0014*(0.4+L)*(z.T/25)*z.m*(env.heat>0?1.8:1);z.m-=ev*dt;z.h+=ev*1.2*dt;z.h+=((z.m*0.85+0.1)-z.h)*0.015*dt;z.h-=0.0015*(z.h-0.25)*dt*(env.vent>0?28:1);
    if(z.h>0.94)z.mold+=dt;else z.mold=Math.max(0,z.mold-dt*2);if(z.mold>20&&!z.moldWarned){z.moldWarned=true;if(MODE.zone==null||i===MODE.zone){logEvent('warn',`${ZONES[i].name}湿度过高，开始长霉`,null,2);toast(`${ZONES[i].name}湿度过高，<b>霉菌滋生</b>。通风可以缓解`);}}if(z.mold<=0)z.moldWarned=false;}
  const ZBASE=[0.08,0.46,0.66,0.62];for(let i=0;i<4;i++){const z=env.zones[i];z.m+=(ZBASE[i]-z.m)*0.004*dt;}
  const mz=env.zones[MODE.zone!=null?MODE.zone:2],jz=env.zones[MODE.zone!=null?MODE.zone:3];
  if(env.pump){mz.m+=(0.8-mz.m)*0.006*dt;if(MODE.zone==null||MODE.zone===3){jz.h+=(0.9-jz.h)*0.003*dt;jz.m+=(0.72-jz.m)*0.0015*dt;}}
  if(MODE.pond&&env.pond>0.05){const pull=(0.78-mz.m)*0.02*dt;if(pull>0){mz.m+=pull;env.pond-=pull*0.2;}}env.pond-=0.0003*dt*(0.5+L)*(env.heat>0?1.6:1)*(env.pump?0.7:1);
  if(MODE.zone==null)for(let i=0;i<3;i++){const a=env.zones[i],b=env.zones[i+1],dm=(a.m-b.m)*0.0012*dt,dh=(a.h-b.h)*0.008*dt;a.m-=dm;b.m+=dm;a.h-=dh;b.h+=dh;}
  env.zones.forEach(z=>{z.m=clamp(z.m,0,1);z.h=clamp(z.h,0.05,1);z.fert=clamp(z.fert,0.05,1.2);});env.pond=clamp(env.pond,0,1);env.waterY=waterLevelY();
  env.algae=clamp(env.algae+(0.0009*L*(0.3+mz.fert)*(1-env.algae)-(env.pump?0.0006:0)*env.algae)*dt,0.02,1);}
  const co2f=Math.min(1.35,(env.co2/(env.co2+350))/0.545);
  plantAcc+=dt;if(plantAcc>=0.5){updatePlants(plantAcc,L,co2f);plantAcc=0;}
  turfAcc+=dt;if(turfAcc>=1){for(let c=0;c<turf.length;c++){if(turfCap[c]<=0)continue;const mo=env.zones[turfZone[c]].m;const fit=OCEAN?(0.35+env.nut*2.2)*(env.temp>30?0.6:1):mo<0.2?(MK==='desert'?0.25:-0.5):mo>0.95?0.3:1;turf[c]=clamp(turf[c]+0.004*L*fit*turfAcc*(turfCap[c]-turf[c]+0.05)*(fit<0?1:1),0.02,turfCap[c]);}turfAcc=0;}
  gridRebuild();
  let R=env.plantR||0;
  for(const k of SPK){const list=pop[k],S=SPEC[k];for(let i=0;i<list.length;i++){const a=list[i];if(!a.alive)continue;
    a.age+=dt/DAY;a.ph+=dt;const burn=S.stageBurn?S.stageBurn[a.stage]:S.burn;a.energy-=burn*dt*(env.o2<18?1.6:1)*(OCEAN?env.stress:1)*(a.state==='dormant'||a.state==='sleep'?0.35:1);
    if(a.heldBy){if(!a.heldBy.alive){a.heldBy=null;a.state='idle';}continue;}
    if(a.stuck){a.stuckT+=dt;a.x=a.stuckPos.x;a.y=a.stuckPos.y;a.z=a.stuckPos.z;a.energy-=0.004*dt;if(!a.wrapped&&a.stuckT>45&&Math.random()<0.03*dt){const w=a.stuck;const j=w.stuck.indexOf(a);if(j>=0)w.stuck.splice(j,1);a.stuck=null;a.state='idle';logEvent('hunt',`${S.name}${S.noName?'':'「'+a.name+'」'}挣脱了蛛网`,a,1);}if(a.energy<=0&&!a.wrapped)a.die('starved');continue;}
    S.update(a,dt);
    if(a.alive&&a.scale<1&&(!S.stages||a.stage==='adult')&&k!=='frog')a.scale=Math.min(1,a.scale+dt/DAY*0.5);
    if(a.alive&&k==='frog'&&a.stage==='adult'&&a.scale<1)a.scale=Math.min(1,a.scale+dt/DAY*0.35);
    R+=S.resp*a.scale*(a.stage==='egg'||a.stage==='pupa'?0.1:1);
    if(a.alive&&(a.energy<=0||(a.age>a.life&&(!S.stages||a.stage==='adult'))))a.die(a.energy<=0?'starved':'old');}}
  for(const k of SPK)if(pop[k].some(a=>!a.alive))pop[k]=pop[k].filter(a=>a.alive);
  webAcc+=dt;if(webAcc>0.2){webCatch();webAcc=0;}
  if(DECOR.length)decorSim(dt);
  if(colony&&colony.store>=3.5+count('ant')*0.06&&count('ant')<capOf('ant')){colony.store-=3.5;new Agent('ant',colony.x+rand(-0.15,0.15),colony.z+rand(-0.15,0.15),{energy:0.8,age:0});}
  if(colony)colony.store=Math.min(colony.store,50);
  for(const d of detritus){if(!d.alive)continue;const e=Math.min(d.amount,0.0012*dt);d.amount-=e;if(OCEAN)env.nut+=e*0.06;else env.zones[zoneAt(d.x,d.z)].fert+=e*0.5;R+=0.25*Math.min(1,d.amount);if(d.amount<=0.01){removeDet(d);continue;}
    if(!OCEAN&&d.sub!=='pellet'&&env.zones[zoneAt(d.x,d.z)].h>0.62&&Math.random()<0.004*dt&&plants.filter(p=>p.type==='mushroom').length<45){const x=d.x+rand(-0.3,0.3),z=d.z+rand(-0.3,0.3);if(!inWater(x,z)&&spacingOK(x,z,0.2)){addPlant('mushroom',x,z,0.15,irand(0,2));stats.mush++;}}}
  if(detritus.some(d=>!d.alive))for(let i=detritus.length-1;i>=0;i--)if(!detritus[i].alive)detritus.splice(i,1);
  const P=(env.plantP||0)+env.turfP*L*Math.min(1,co2f);env.P=P;env.R=R;const net=P-R;
  env.o2+=net*0.00022*dt;env.co2-=net*0.07*dt;const leak=env.vent>0?30:1;if(OCEAN){env.nut=clamp(env.nut+R*0.00004*dt,0.02,1.5);const sat=20.9*(1-(env.temp-25)*0.02);env.o2+=(sat-env.o2)*0.0025*dt*(env.pump?2.5:0.8)*(1+(env.airstones||0)*0.7);}else env.o2+=(20.9-env.o2)*0.0025*dt*leak;env.co2+=(420-env.co2)*0.016*dt*leak;env.o2=clamp(env.o2,12,30);env.co2=clamp(env.co2,60,6000);
  if(OCEAN?(env.o2<17||env.stress>1.25):(env.o2<19||env.o2>24))env.dayOk=false;
  env.excite=Math.max(0,env.excite-dt*0.03);
  env.coins+=(env.score*0.0038-(env.pump?0.03:0)-(env.lamp?0.08:0))*dt;if(env.coins<0)env.coins=0;
  if(env.pump&&env.coins<=0){env.pump=false;updateToggles();toast(OCEAN?'孢子用完了，造浪泵自动关闭':'孢子用完了，水泵自动关闭');}
}
function oceanStep(dt,L){
  const Tt=24+env.daylight*1.8+(env.lamp?1.4:0)+(env.heat>0?6.5:0)-(env.vent>0?3:0);env.temp+=(Tt-env.temp)*Math.min(1,0.02*dt);
  env.sal+=0.0042*dt*(0.5+L)*(env.temp/25)*(env.heat>0?1.8:1)*(env.pump?1.15:1);
  const nf=env.nut/(env.nut+0.15);
  env.plank=clamp(env.plank+(0.0028*(0.3+L)*nf*(1-env.plank)-0.00015*env.plank)*dt,0,1);
  const graze=count('urchin')+count('shrimp')*0.25+count('starfish')*0.3+count('crab')*0.2+count('damsel')*0.04;
  const ag=0.0011*L*nf*(env.temp/25)*(1-env.algae)-0.00006*graze*env.algae;
  env.algae=clamp(env.algae+ag*dt,0.02,1);env.nut=clamp(env.nut-Math.max(0,ag)*0.12*dt,0.02,1.5);
  const sd=Math.abs(env.sal-35);
  env.stress=1+(env.temp>29?(env.temp-29)*0.18:0)+(sd>3?(sd-3)*0.12:0)+(env.nut>0.8?(env.nut-0.8)*0.6:0)+(env.o2<17?(17-env.o2)*0.15:0);
  if(env.temp>30&&!env.hotWarned){env.hotWarned=true;logEvent('warn','水温超过 30°C，珊瑚开始白化',null,2);toast('水温超过 30°C，<b>珊瑚开始白化</b>。关灯或换水降温');}if(env.temp<28.5)env.hotWarned=false;
  if(sd>3.5&&!env.salWarned){env.salWarned=true;const hi=env.sal>35;logEvent('warn',hi?'盐度过高':'盐度过低',null,2);toast(hi?'蒸发让<b>盐度升高</b>了，补点淡水吧':'淡水加太多，<b>盐度偏低</b>');}if(sd<2.5)env.salWarned=false;
  if(env.algae>0.7&&!env.algWarned){env.algWarned=true;logEvent('warn','藻类爆发，覆盖珊瑚',null,2);toast('<b>藻类爆发</b>：营养盐太高，换水或多养海胆');}if(env.algae<0.55)env.algWarned=false;}
function updatePlants(dt,L,co2f){let P=0,R=0,tp=0;
  for(const p of plants){if(!p.alive)continue;const T=p.T,z=env.zones[p.zone];let bad=0;
    if(OCEAN){bad=-oceanFit(T);}
    else if(T.fungus){p.age+=dt/DAY;p.growth=Math.min(1,p.growth+0.02*dt);if(p.age>T.life||z.h<0.45)p.health-=0.02*dt;z.fert+=0.0002*dt;}
    else if(T.water){if(!inPond(p.x,p.z,0))bad=0.35;}
    else{const m=plantMoist(p);if(m<T.moist[0])bad=T.moist[0]-m;else if(m>T.moist[1])bad=m-T.moist[1];if(z.mold>20&&p.type!=='barrel'&&p.type!=='saguaro'&&p.type!=='echeveria'&&p.type!=='aloe')bad+=0.1;}
    if(!T.fungus)p.health=clamp(p.health+(bad>0?-bad*0.03:0.012)*dt,0,1);else p.health=clamp(p.health,0,1);
    if(!T.fungus){const gr=L*p.health*(OCEAN?(0.25+env.nut*1.6)*(T.coral?0.4+env.plank:1):(0.4+z.fert))*Math.min(1,co2f)*0.006*T.grow*dt*(1-p.growth);p.growth=Math.min(1,p.growth+gr);if(OCEAN)env.nut=Math.max(0.02,env.nut-gr*0.02);else z.fert-=gr*0.04;
      const ps=T.o2*L*p.health*p.growth*co2f;P+=ps;R+=T.o2*0.05*p.growth*(L<0.1?1:0.3);if(!OCEAN){z.m-=0.000006*p.growth*dt*T.o2;z.h+=0.000005*p.growth*dt*T.o2;}p.age+=dt/DAY;
      if(p.type==='dandelion'){if(p.v<2&&p.growth>0.95&&p.age>0.6&&Math.random()<0.01*dt)setVariant(p,2);else if(p.v===2&&Math.random()<0.02*dt){for(let k=0;k<3;k++){const a=rand(0,6.28),r=rand(0.8,3),x=p.x+Math.cos(a)*r,zz=p.z+Math.sin(a)*r;const s=suit('dandelion',x,zz);if(s.ok&&s.fit&&spacingOK(x,zz,0.35)&&plants.length<600)addPlant('dandelion',x,zz,0.1,0);}seedPuffs.push({x:p.x,y:plantTop(p),z:p.z,t:0});setVariant(p,irand(0,1));p.growth=0.6;p.age=0;}}
      if(p.growth>0.85&&p.health>0.7&&plants.length<600&&Math.random()<T.seed*(1+p.pollen*0.9)*dt){p.pollen=Math.max(0,p.pollen-1);const a=rand(0,6.283),r=rand(0.4,1.5)*(T.single?2.5:1),x=p.x+Math.cos(a)*r,zz=p.z+Math.sin(a)*r;const s=suit(p.type,x,zz);if(s.ok&&s.fit!==false&&spacingOK(x,zz,T.single?1.6:0.32))addPlant(p.type,x,zz,0.1);}}
    if(p.eaten>0.2&&!T.single){p.eaten=0;}
    if(p.health<=0||p.growth<0.04)removePlant(p,true);}
  if(plants.some(p=>!p.alive))for(let i=plants.length-1;i>=0;i--)if(!plants[i].alive)plants.splice(i,1);
  let ts=0;for(let c=0;c<turf.length;c++)ts+=turf[c];env.turfP=ts*0.035;env.plantP=P;env.plantR=R;}
function newDay(){if(env.dayOk)env.balanceDays++;else env.balanceDays=0;env.dayOk=true;env.rainZone=[0,0,0,0];for(const w of webs)w.age+=0;
  const r=Math.random();if(OCEAN){if(env.day>1&&r<0.22){env.heat=70;setTimeout(()=>{toast('<b>海洋热浪</b>：水温上升，珊瑚有白化风险');logEvent('warn','海洋热浪来袭',null,1);},0);}
    else if(env.day>1&&r<0.45){env.plank=Math.min(1,env.plank+0.4);env.nut=Math.min(1.5,env.nut+0.08);setTimeout(()=>{toast('<b>浮游生物爆发</b>：滤食动物的盛宴');logEvent('life','浮游生物爆发',null,1);},0);}
    else if(env.day>2&&r<0.63){env.visit=1;setTimeout(()=>toast('今天是<b>参观日</b>：傍晚 18:00 按观赏值结算门票'),0);}
    logEvent('info',`第 ${env.day} 天开始${env.balanceDays>0?'（昨日生态平衡）':''}`,null,0);return;}
  if(env.day>1&&r<(MK==='desert'?0.4:0.28)){env.heat=60;setTimeout(()=>{toast(MODE.zone!=null?'<b>午后热浪</b>：缸内升温，蒸发加快':'<b>午后热浪</b>：沙漠和草甸升温，蒸发加快');logEvent('warn','午后热浪来袭',null,1);},0);}
  else if(env.day>1&&r<(MK==='desert'?0.48:0.5)){env.shower={t:0.55+rand(0,0.15)};}
  else if(env.day>2&&r<0.68){env.visit=1;setTimeout(()=>toast('今天是<b>参观日</b>：傍晚 18:00 按观赏值结算门票'),0);}
  logEvent('info',`第 ${env.day} 天开始${env.balanceDays>0?'（昨日生态平衡）':''}`,null,0);}

/* =================== economy: score + contracts =================== */
function computeScore(){const sa=SPK.filter(k=>count(k)>0).length,pt=new Set(plants.filter(p=>p.alive&&!p.T.fungus).map(p=>p.type)).size;const animals=SPK.reduce((s,k)=>s+count(k),0);
  const div=40*(0.65*sa/SPK.length+0.35*pt/PLANT_KEYS.length);const bal=25*(OCEAN?(env.o2>=17?1:0.35):(env.o2>=19.5&&env.o2<=23.5?1:0.35)*(env.co2>180?1:0.6))*(OCEAN?(env.stress>1.3?0.6:1)*(env.algae>0.7?0.8:1):env.zones.some(z=>z.mold>20)?0.7:1);
  const ab=15*Math.min(1,animals/180);env.score=Math.round(div+bal+ab+Math.min(20,env.excite));}
const CT=[
  {k:'emerge',sp:['butterfly'],t:n=>`让 ${n} 只毛毛虫羽化成蝴蝶`,n:[1,3],r:n=>30+n*15,prog:()=>stats.emerged},
  {k:'meta',sp:['frog'],t:n=>`让 ${n} 只蝌蚪变成小雨蛙`,n:[2,5],r:n=>25+n*8,prog:()=>stats.metamorph,req:()=>!!MODE.pond},
  {k:'hunts',t:n=>`记录 ${n} 次成功捕猎`,n:()=>OCEAN?[3,6]:[6,14],r:n=>20+n*(OCEAN?6:3),prog:()=>stats.hunts},
  {k:'ants',sp:['ant'],t:n=>`蚁群达到 ${n} 只`,n:[50,110],abs:true,r:n=>Math.round(20+n*0.4),prog:()=>count('ant')},
  {k:'crick',sp:['cricket'],t:n=>`蟋蟀种群达到 ${n} 只`,n:[20,40],abs:true,r:n=>20+n,prog:()=>count('cricket')},
  {k:'fire',sp:['firefly'],t:n=>`萤火虫达到 ${n} 只`,n:[16,32],abs:true,r:n=>Math.round(20+n*1.5),prog:()=>count('firefly')},
  {k:'flowers',land:1,t:n=>`缸里同时有 ${n} 株开花植物`,n:()=>MODE.zone==null?[60,100]:[25,45],abs:true,r:n=>Math.round(20+n*0.5),prog:()=>plants.filter(p=>p.alive&&p.T.nectar).length,req:()=>MK!=='desert'},
  {k:'mush',land:1,t:n=>`长出 ${n} 朵蘑菇`,n:[3,8],r:n=>15+n*4,prog:()=>stats.mush,req:()=>['mixed','marsh','jungle'].includes(MK)},
  {k:'hatch',land:1,t:n=>`孵化 ${n} 个新生命`,n:[10,25],r:n=>20+n,prog:()=>stats.hatched+stats.births},
  {k:'webs',sp:['spider'],t:n=>`园蛛织出 ${n} 张新网`,n:[2,4],r:n=>15+n*8,prog:()=>stats.webs},
  {k:'species',t:n=>`同时养活 ${n} 种动物`,n:()=>[Math.max(3,SPK.length-3),SPK.length-1],abs:true,r:n=>n*8,prog:()=>SPK.filter(k=>count(k)>0).length},
  {k:'o2day',land:1,t:()=>`氧气在 19.5–23.5% 之间保持一整天`,n:[1,1],abs:true,r:()=>45,prog:()=>env.balanceDays},
  {k:'jungle',land:1,t:()=>`用降雨把雨林空气湿度提到 90%`,n:[1,1],abs:true,r:()=>20,prog:()=>env.zones[3].h>=0.9?1:0,req:()=>MK==='mixed'||MK==='jungle'},
  {k:'desert',land:1,t:()=>`让沙漠缸的仙人掌长到 30 株`,n:[1,1],abs:true,r:()=>40,prog:()=>plants.filter(p=>p.alive&&(p.type==='barrel'||p.type==='saguaro')).length>=30?1:0,req:()=>MK==='desert'},
  {k:'snake',sp:['snake'],t:()=>`玉米蛇完成一次捕食`,n:[1,1],r:()=>60,prog:()=>stats.snakeHunts||0,req:()=>count('snake')>0},
  {k:'school',ocean:1,t:n=>`鱼群达到 ${n} 条`,n:[32,50],abs:true,r:n=>Math.round(20+n*0.8),prog:()=>count('damsel')+count('clown')},
  {k:'clowns',ocean:1,t:n=>`小丑鱼达到 ${n} 条`,n:[6,10],abs:true,r:n=>15+n*5,prog:()=>count('clown')},
  {k:'coral',ocean:1,t:n=>`同时拥有 ${n} 丛健康珊瑚`,n:[36,52],abs:true,r:n=>Math.round(20+n*0.9),prog:()=>plants.filter(p=>p.alive&&p.T.coral&&p.health>0.6).length},
  {k:'births',ocean:1,t:n=>`繁殖出 ${n} 个新生命`,n:[8,18],r:n=>20+n*2,prog:()=>stats.births},
  {k:'jelly',ocean:1,t:n=>`海月水母达到 ${n} 只`,n:[8,12],abs:true,r:n=>10+n*4,prog:()=>count('jelly')},
  {k:'water',ocean:1,t:()=>`水质稳定一整天（溶氧足、水温盐度正常）`,n:[1,1],abs:true,r:()=>45,prog:()=>env.balanceDays},
  {k:'crabs',ocean:1,t:n=>`螃蟹达到 ${n} 只`,n:[8,12],abs:true,r:n=>10+n*4,prog:()=>count('crab')},
];
const contracts=[];let ctDirty=true;
function newContract(){const used=new Set(contracts.map(c=>c.tpl.k));const pool=CT.filter(t=>!used.has(t.k)&&(OCEAN?!t.land&&(!t.sp):!t.ocean)&&(!t.sp||t.sp.every(k=>SPK.includes(k)))&&(!t.req||t.req()));if(!pool.length)return;const tpl=pick(pool);const nr=typeof tpl.n==='function'?tpl.n():tpl.n;const n=irand(nr[0],nr[1]);
  contracts.push({tpl,n,base:tpl.abs?0:tpl.prog(),reward:Math.round(tpl.r(n)),due:env.day+3,id:++UID});ctDirty=true;}
function checkContracts(){for(let i=contracts.length-1;i>=0;i--){const c=contracts[i];const pr=c.tpl.prog()-c.base;
  if(pr>=c.n){env.coins+=c.reward;toast(`委托完成：${c.tpl.t(c.n)}　<b>+${c.reward} 孢子</b>`);logEvent('life',`完成委托：${c.tpl.t(c.n)}`,null,2);bumpExcite(4);contracts.splice(i,1);newContract();}
  else if(env.day>c.due){toast(`委托过期：${c.tpl.t(c.n)}`);contracts.splice(i,1);newContract();}}}

/* =================== initial world =================== */
setMsg('播种…');await tick();
const SZ=MODE.zone;
function randIn(zi,test,tries){for(let t=0;t<(tries||300);t++){const x=SZ!=null?rand(-HW+0.7,HW-0.7):clamp(ZONES[zi].cx+rand(-6,6),-HW+0.7,HW-0.7),z=rand(-HD+1.2,HD-0.6);if(zoneAt(x,z)!==zi)continue;if(test&&!test(x,z))continue;return[x,z];}return null;}
const okLand=(x,z,sp)=>!inWater(x,z,-0.05)&&pondD(x,z)>1.15&&streamQ(x,z).d>0.7&&!blocked(x,z,0.15)&&spacingOK(x,z,sp);
function seed(type,zi,n,sp,test){for(let i=0;i<n;i++){const p=randIn(zi,(x,z)=>okLand(x,z,sp)&&(!test||test(x,z)));if(p)addPlant(type,p[0],p[1]);}}
function seedLily(n){if(!MODE.pond)return;for(let i=0;i<n;i++){for(let t=0;t<80;t++){const a=rand(0,6.283),r=rand(0,POND.r*0.9),x=POND.x+Math.cos(a)*r,z=POND.z+Math.sin(a)*r;if(inPond(x,z,0.12)&&spacingOK(x,z,0.6)){addPlant('lily',x,z);break;}}}}
const nearPond=(x,z)=>{const d=pondD(x,z);return d>1.15&&d<1.9;};
function seedOcean(type,zs,n,sp,test){for(let i=0;i<n;i++){for(let t=0;t<200;t++){const x=rand(-HW+0.8,HW-0.8),z=rand(-HD+1.3,HD-0.6);if(!zs.includes(zoneAt(x,z)))continue;const s=suit(type,x,z);if(!s.ok||!spacingOK(x,z,sp))continue;if(test&&!test(x,z))continue;addPlant(type,x,z);break;}}}
if(OCEAN){
  seedOcean('seagrass',[0,1],34,0.4);seedOcean('kelp',[0,1],7,1.2,(x,z)=>z<-2);seedOcean('staghorn',[2,3],12,0.9);seedOcean('brain',[2,3],8,0.9);seedOcean('table',[3],5,1.3);seedOcean('fan',[3,2],8,0.8,(x,z)=>z<3);seedOcean('anemone',[2,3],4,1.4);
}else if(SZ==null){
  seed('saguaro',0,6,1.4);seed('barrel',0,12,0.8);seed('aloe',0,8,0.8);seed('echeveria',0,12,0.5);
  seed('foxtail',1,30,0.45);seed('daisy',1,20,0.45);seed('cosmos',1,12,0.6);seed('dandelion',1,12,0.45);seed('clover',1,12,0.6);
  seed('cattail',2,18,0.5,nearPond);seed('fern',2,6,0.7);seed('moss',2,8,0.45);seed('clover',2,6,0.6);seed('daisy',2,4,0.45);
  seedLily(12);
  seed('tree',3,5,2.8,(x,z)=>z<3);seed('monstera',3,10,1.1);seed('fern',3,22,0.7);seed('bromeliad',3,10,0.6);seed('moss',3,18,0.45);
  for(const [x,z] of[[11.5,5.4],[13,5.1],[14.3,4.9]])if(!inWater(x,z))addPlant('mushroom',x+0.1,z+0.45,0.8,0);
}else if(SZ===0){seed('saguaro',0,14,1.5);seed('barrel',0,26,0.8);seed('aloe',0,18,0.8);seed('echeveria',0,26,0.5);}
else if(SZ===1){seed('foxtail',1,60,0.45);seed('daisy',1,40,0.45);seed('cosmos',1,24,0.6);seed('dandelion',1,24,0.45);seed('clover',1,26,0.6);seedLily(7);}
else if(SZ===2){seed('cattail',2,34,0.5,nearPond);seed('fern',2,16,0.7);seed('moss',2,22,0.45);seed('clover',2,18,0.6);seed('daisy',2,14,0.45);seedLily(16);}
else{seed('tree',3,10,2.8,(x,z)=>z<4);seed('monstera',3,22,1.1);seed('fern',3,42,0.7);seed('bromeliad',3,22,0.6);seed('moss',3,34,0.45);seedLily(8);
  for(let i=0;i<6;i++){const p=randIn(3,(x,z)=>okLand(x,z,0.3));if(p)addPlant('mushroom',p[0],p[1],0.8,0);}}
flushPlants();refreshGrass();
if(SPK.includes('ant')){let cx=-5.2,cz=4.2;if(SZ!=null){for(let t=0;t<60;t++){const x=rand(-8,8),z=rand(2,7);if(okLand(x,z,0.6)){cx=x;cz=z;break;}}}makeColony(cx,cz);}
setMsg('唤醒生物…');await tick();
const spawnIn=(sp,zi,n,o,test)=>{if(!SPK.includes(sp))return;for(let i=0;i<n;i++){const p=randIn(zi,(x,z)=>!inWater(x,z,-0.1)&&!blocked(x,z,0.1)&&(!test||test(x,z)));if(p)new Agent(sp,p[0],p[1],o?Object.assign({},o):undefined);}};
function spawnFrogs(nA,nT,egg){if(!SPK.includes('frog')||!MODE.pond)return;
  for(let i=0;i<nA;i++){const a=rand(0,6.28),r=pondR(a)*1.25;new Agent('frog',POND.x+Math.cos(a)*r,POND.z+Math.sin(a)*r);}
  for(let i=0;i<nT;i++){for(let t=0;t<40;t++){const a=rand(0,6.28),r=rand(0.5,2.5)*(MODE.pond||1),x=POND.x+Math.cos(a)*r,z=POND.z+Math.sin(a)*r;if(inPond(x,z,0.2)){const t2=new Agent('frog',x,z,{stage:'tadpole',scale:0.7,age:0});t2.stageT=rand(0.2,0.9);break;}}}
  if(egg){const a=1.2,r=pondR(a)*0.8;new Agent('frog',POND.x+Math.cos(a)*r,POND.z+Math.sin(a)*r,{stage:'egg',age:0,energy:1});}}
function spawnButterflies(zi,nA,nL){spawnIn('butterfly',zi,nA);spawnIn('butterfly',zi,nL,{stage:'larva',scale:0.6,age:0});
  if(pop.butterfly)for(const b of pop.butterfly)if(b.stage==='larva'&&!b.trail){b.stageT=0.4;b.trail=new Trail(0.45,b.x,b.z,b.h);}}
const nAnt=SZ==null?40:32;if(colony)for(let i=0;i<nAnt;i++)new Agent('ant',colony.x+rand(-0.6,0.6),colony.z+rand(-0.6,0.6));
if(OCEAN){
  const oz=(sp,zs,n,o)=>{for(let i=0;i<n;i++){for(let t=0;t<200;t++){const x=rand(-HW+1,HW-1),z=rand(-HD+1.4,HD-0.8);if(!zs.includes(zoneAt(x,z))||blocked(x,z,0.15))continue;new Agent(sp,x,z,o?Object.assign({},o):undefined);break;}}};
  oz('damsel',[1,2,3],24);oz('jelly',[0,1,2],5);oz('shrimp',[2,3,1],14);oz('crab',[1,2,3],5);oz('starfish',[1,2],4);oz('urchin',[2,3],4);oz('grouper',[3],1);
  const anes=plants.filter(p=>p.type==='anemone');for(let i=0;i<4;i++){const h=anes[i%Math.max(1,anes.length)];if(h)new Agent('clown',h.x+rand(-0.3,0.3),h.z+rand(-0.3,0.3));else oz('clown',[3],1);}
}else if(SZ==null){
  spawnIn('cricket',1,16);spawnIn('snail',3,6);spawnIn('snail',2,3);spawnIn('isopod',3,12);spawnIn('isopod',2,6);
  spawnButterflies(1,6,3);
  spawnIn('firefly',2,6);spawnIn('firefly',3,8);spawnIn('spider',3,1);spawnIn('spider',1,1);spawnIn('mantis',1,1);spawnIn('lizard',0,3);
  spawnFrogs(5,5,true);
}else if(SZ===0){spawnIn('cricket',0,24);spawnButterflies(0,3,0);spawnIn('spider',0,1);spawnIn('mantis',0,1);spawnIn('lizard',0,6);}
else if(SZ===1){spawnIn('cricket',1,30);spawnButterflies(1,10,4);spawnIn('isopod',1,6);spawnIn('firefly',1,6);spawnIn('spider',1,2);spawnIn('mantis',1,1);spawnIn('lizard',1,2);spawnFrogs(3,3,false);}
else if(SZ===2){spawnIn('cricket',2,12);spawnIn('snail',2,8);spawnIn('isopod',2,14);spawnButterflies(2,6,2);spawnIn('firefly',2,12);spawnIn('spider',2,2);spawnIn('mantis',2,1);spawnFrogs(8,8,true);}
else{spawnIn('cricket',3,12);spawnIn('snail',3,10);spawnIn('isopod',3,20);spawnButterflies(3,6,2);spawnIn('firefly',3,14);spawnIn('spider',3,2);spawnIn('mantis',3,1);spawnIn('lizard',3,2);spawnFrogs(6,5,true);}
for(let i=0;i<3;i++)newContract();
