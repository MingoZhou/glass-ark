
/* =================== ocean species =================== */
Trail.prototype.retract=function(d){let rem=d;const p=this.p;while(rem>0&&p.length>4){const n=p.length;const dx=p[n-2]-p[n-4],dz=p[n-1]-p[n-3],l=Math.hypot(dx,dz);if(l>rem){p[n-2]-=dx/l*rem;p[n-1]-=dz/l*rem;rem=0;}else{p.length-=2;rem-=l;}}return{x:p[p.length-2],z:p[p.length-1]};};
const PREDS_O=['grouper','moray'];
function swimTo(a,tx,ty,tz,sp,dt,turn){const dx=tx-a.x,dy=ty-a.y,dz=tz-a.z;a.turnTo(Math.atan2(dz,dx),turn||3,dt);const hd=Math.hypot(dx,dz);a.pitch=lerp(a.pitch||0,clamp(Math.atan2(dy,Math.max(0.25,hd)),-0.7,0.7),Math.min(1,dt*2.5));
  const cp=Math.cos(a.pitch);a.x+=Math.cos(a.h)*cp*sp*dt;a.y+=Math.sin(a.pitch)*sp*dt;a.z+=Math.sin(a.h)*cp*sp*dt;a.speed=sp;clampSwim(a);return Math.hypot(dx,dy,dz);}
function clampSwim(a){if(a.x<-HW+0.5||a.x>HW-0.5||a.z<-HD+1.1||a.z>HD-0.5){a.turnTo(Math.atan2(-a.z,-a.x),4,0.05);}a.x=clamp(a.x,-HW+0.4,HW-0.4);a.z=clamp(a.z,-HD+1.0,HD-0.4);
  const g=heightAt(a.x,a.z)+0.15*a.scale;if(a.y<g)a.y=g;if(a.y>WT-0.25)a.y=WT-0.25;const o=blocked(a.x,a.z,0.05);if(o&&o.top!=null&&a.y<o.top+0.1){const ang=Math.atan2(a.z-o.z,a.x-o.x);a.x=o.x+Math.cos(ang)*(o.r+0.06);a.z=o.z+Math.sin(ang)*(o.r+0.06);}}
function randWater(){return{x:rand(-16,16),z:rand(-9,9.5),y:0};}
function feedPlankton(a,dt,rate){if(env.plank>0.03&&a.energy<0.95){const e=rate*dt*Math.min(1,env.plank*2);a.energy=Math.min(1,a.energy+e);env.plank=Math.max(0,env.plank-e*0.012);return true;}return false;}
function threatNear(a,r){for(const q of queryAgents(a.x,a.z,r)){if(!PREDS_O.includes(q.sp)||!q.S.diet[a.sp]||q.state==='eat'||q.state==='recover')continue;const d=dist3(a,q);const sneaky=q.state==='stalk'||q.state==='lurk'||q.lurk;if(sneaky?d<0.42:(q.state==='chase'||q.state==='strike')?d<Math.min(r,1.1):(q.energy<q.S.hunt.hungry&&d<r*0.6))return q;}return null;}
function oceanBottom(a,dt,sp,foodFn){const zi=zoneAt(a.x,a.z);a.tt-=dt;if(a.tt<=0){a.tt=rand(1.5,3);if(!a.target||!a.target.alive)a.target=foodFn?foodFn(a):null;}
  if(a.target&&a.target.alive){const d=a.seek(a.target.x,a.target.z,sp,dt,3);if(d<0.15){a.state='eat';a.speed=0;const t=a.target;if(t.kind==='detritus'){const e=Math.min(t.amount,0.03*dt);t.amount-=e;a.energy=Math.min(1,a.energy+e*1.6);env.nut=Math.min(1,env.nut+e*0.02);}else if(t.turf!=null){turf[t.turf]=Math.max(0.02,turf[t.turf]-0.004*dt);a.energy=Math.min(1,a.energy+0.02*dt);if(turf[t.turf]<0.15||a.energy>0.97)a.target=null;}}else a.state='forage';return;}
  a.state='idle';a.roam(sp*0.6,dt);}
function turfFood(a){let best=null,bv=0.25;for(let k=0;k<6;k++){const x=a.x+rand(-2,2),z=a.z+rand(-2,2);if(Math.abs(x)>HW-0.5||z<-HD+1.1||z>HD-0.5)continue;const c=tcell(x,z);if(turf[c]>bv){bv=turf[c];best={x,z,alive:true,turf:c};}}return best;}
function bottomPose(a,lift,s){poseGround(a.m.root,a,heightAt(a.x,a.z)+(lift||0),s);}

Object.assign(SPEC,{
 damsel:{name:'蓝魔雀鲷',role:'群游 · 滤食',lvl:1,ocean:true,cost:16,batch:5,life:6,burn:0.0022,resp:0.05,zones:[1,1,1,1],color:'#3a7fff',habitat:'开阔水',cap:60,corpse:0.08,
  flee:{mode:'swim',r:1.3,speed:1.6,dur:1.2},
  fact:'成群游动，彼此保持距离又一起转向。吃水里的浮游生物。遇到石斑鱼会整群炸开。',
  model:()=>buildFish('damsel'),init(a){a.flying=true;a.y=heightAt(a.x,a.z)+rand(1,4);a.vx=Math.cos(a.h)*0.4;a.vy=0;a.vz=Math.sin(a.h)*0.4;a.pitch=0;a.wp=randWater();a.wp.y=rand(1.5,WT-1.5);},
  update(a,dt){let cx=0,cy=0,cz=0,ax=0,ay=0,az=0,sx=0,sy=0,sz=0,n=0;
    for(const b of queryAgents(a.x,a.z,1.4)){if(b===a||b.sp!=='damsel')continue;const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.hypot(dx,dy,dz);if(d>1.4)continue;n++;cx+=b.x;cy+=b.y;cz+=b.z;ax+=b.vx;ay+=b.vy;az+=b.vz;if(d<0.3){sx-=dx/(d*d+0.02);sy-=dy/(d*d+0.02);sz-=dz/(d*d+0.02);}}
    let fx=0,fy=0,fz=0;if(n){fx+=(cx/n-a.x)*0.7+(ax/n-a.vx)*1.2;fy+=(cy/n-a.y)*0.7+(ay/n-a.vy)*1.2;fz+=(cz/n-a.z)*0.7+(az/n-a.vz)*1.2;}fx+=sx*0.06;fy+=sy*0.06;fz+=sz*0.06;
    a.tt-=dt;if(a.tt<=0||Math.hypot(a.wp.x-a.x,a.wp.z-a.z)<1.5){a.tt=rand(4,9);a.wp=randWater();a.wp.y=isNight()?heightAt(a.wp.x,a.wp.z)+rand(0.4,1):rand(1.5,WT-1.2);}
    const wx=a.wp.x-a.x,wy=a.wp.y-a.y,wz=a.wp.z-a.z,wl=Math.hypot(wx,wy,wz)||1;fx+=wx/wl*0.5;fy+=wy/wl*0.5;fz+=wz/wl*0.5;
    const th=threatNear(a,1.5);let vmax=isNight()?0.35:0.7;if(th){const dx=a.x-th.x,dy=a.y-th.y,dz=a.z-th.z,d=Math.hypot(dx,dy,dz)||1;fx+=dx/d*4;fy+=dy/d*2;fz+=dz/d*4;vmax=1.7;a.flee={from:th,t:1};a.state='flee';}else{a.flee=null;a.state=feedPlankton(a,dt,0.02)?'feed':'school';}
    const g=heightAt(a.x,a.z);if(a.y<g+0.4)fy+=2;if(a.y>WT-0.6)fy-=2;if(a.x<-HW+1.5)fx+=2;if(a.x>HW-1.5)fx-=2;if(a.z<-HD+2)fz+=2;if(a.z>HD-1.5)fz-=2;
    a.vx+=fx*dt;a.vy+=fy*dt*0.6;a.vz+=fz*dt;const sp=Math.hypot(a.vx,a.vy,a.vz)||1;const k=clamp(sp,0.25,vmax)/sp;a.vx*=k;a.vy*=k;a.vz*=k;
    a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;a.h=Math.atan2(a.vz,a.vx);a.pitch=Math.atan2(a.vy,Math.hypot(a.vx,a.vz));a.speed=Math.hypot(a.vx,a.vy,a.vz);clampSwim(a);
    if(env.plank>0.2)tryBreed(a,0.0025,dt);},
  anim:fishAnim,
  mouth(a,o){o.set(a.x+Math.cos(a.h)*0.02,a.y,a.z+Math.sin(a.h)*0.02);},
 },
 clown:{name:'小丑鱼',role:'共生 · 滤食',lvl:1,ocean:true,cost:22,batch:2,life:8,burn:0.002,resp:0.05,zones:[0.5,0.8,1,1],color:'#f07a1c',habitat:'海葵',cap:14,corpse:0.08,
  flee:{mode:'swim',r:1.2,speed:1.4,dur:1.2},
  fact:'和海葵共生：海葵的触手会蜇别的鱼，却保护小丑鱼。遇到危险时它会钻进海葵里，捕食者就拿它没办法。',
  model:()=>buildFish('clown'),init(a){a.flying=true;a.y=heightAt(a.x,a.z)+rand(0.5,1.5);a.pitch=0;},
  update(a,dt){if(!a.host||!a.host.alive){a.tt-=dt;if(a.tt<=0){a.tt=3;a.host=nearestPlant(a.x,a.z,14,p=>p.type==='anemone'&&p.growth>0.3&&pop.clown.filter(c=>c.host===p).length<3);}}
    const th=threatNear(a,1.4);feedPlankton(a,dt,0.018);
    if(a.host&&a.host.alive){const h=a.host,top=plantBaseY(h)+0.35*plantScale(h);if(th){a.flee={from:th,t:1};a.state='hide';const d=swimTo(a,h.x,top-0.05,h.z,1.3,dt,6);a.safe=d<0.3;return;}
      a.flee=null;a.safe=false;const an=a.ph*0.7+a.id,r=0.28+0.12*Math.sin(a.ph*0.9);const d=swimTo(a,h.x+Math.cos(an)*r,top+0.15+0.15*Math.sin(a.ph*1.3),h.z+Math.sin(an)*r,0.35,dt,4);a.state=d<0.4?'home':'swim';if(d<0.45)a.safe=Math.random()<0.5;
      if(a.scale>=1)tryBreed(a,0.0025,dt,h.x+rand(-0.2,0.2),h.z+rand(-0.2,0.2));return;}
    a.safe=false;if(th){a.flee={from:th,t:1};a.state='flee';swimTo(a,a.x+(a.x-th.x)*2,a.y+0.3,a.z+(a.z-th.z)*2,1.3,dt,6);return;}
    a.state='swim';if(!a.wp||Math.hypot(a.wp.x-a.x,a.wp.z-a.z)<1){a.wp=randWater();a.wp.y=heightAt(a.wp.x,a.wp.z)+rand(0.5,2);}swimTo(a,a.wp.x,a.wp.y,a.wp.z,0.4,dt,2.5);},
  anim:fishAnim,
  mouth(a,o){o.set(a.x,a.y,a.z);},
 },
 jelly:{name:'海月水母',role:'漂流 · 滤食',lvl:1,ocean:true,cost:20,batch:2,life:7,burn:0.0015,resp:0.02,zones:[1,1,1,1],color:'#cfe6f5',habitat:'开阔水',cap:12,corpse:0,
  fact:'没有大脑也没有心脏，靠伞盖一张一合向上游，再慢慢沉下去。夜里伞盖会发出淡淡的蓝光。',
  model:()=>buildJelly(),init(a){a.flying=true;a.y=rand(3,WT-1.5);a.vy=0;a.pulse=rand(0,1);},
  update(a,dt){a.pulse+=dt/1.4;if(a.pulse>=1){a.pulse-=1;a.vy+=0.22;}a.vy-=0.07*dt;a.vy*=Math.pow(0.4,dt);a.y+=a.vy*dt;
    const cur=U.uWind.value*0.06;a.x+=Math.sin(a.ph*0.13+a.id)*cur*dt+Math.cos(a.h)*0.04*dt;a.z+=Math.cos(a.ph*0.11+a.id*2)*cur*dt+Math.sin(a.h)*0.04*dt;a.h+=Math.sin(a.ph*0.2+a.id)*0.2*dt;
    if(a.y<heightAt(a.x,a.z)+1)a.vy+=0.3*dt;if(a.y>WT-2.4)a.vy-=0.35*dt;clampSwim(a);a.speed=Math.abs(a.vy);a.state='drift';feedPlankton(a,dt,0.012);if(env.plank>0.3)tryBreed(a,0.0012,dt,null,null,{scale:0.6});},
  anim(a,dt){const m=a.m;m.root.position.set(a.x,a.y,a.z);m.root.scale.setScalar(a.scale*1.3);const s=Math.pow(Math.max(0,Math.sin(a.pulse*Math.PI*2)),2);m.bell.scale.set(1-0.14*s,1+0.16*s,1-0.14*s);m.arms.scale.set(1,1-0.1*s,1);
    const tp=m.tpos,NT=m.NT;let k=0;for(let i=0;i<NT;i++){const an=i/NT*6.283,x0=Math.cos(an)*0.19*(1-0.14*s),z0=Math.sin(an)*0.19*(1-0.14*s);let px=x0,py=0,pz=z0;for(let j=1;j<=3;j++){const nx=x0*(1-j*0.05)+Math.sin(a.ph*1.5+i+j)*0.015*j,ny=-j*0.075*(1+0.2*s),nz=z0*(1-j*0.05)+Math.cos(a.ph*1.3+i+j)*0.015*j;tp[k++]=px;tp[k++]=py;tp[k++]=pz;tp[k++]=nx;tp[k++]=ny;tp[k++]=nz;px=nx;py=ny;pz=nz;}}
    m.tent.geometry.attributes.position.needsUpdate=true;},
 },
 shrimp:{name:'清洁虾',role:'清道夫',lvl:1,ocean:true,cost:10,batch:4,life:6,burn:0.002,resp:0.03,zones:[0.6,0.8,1,1],color:'#d8402a',habitat:'礁石 · 沙地',cap:50,corpse:0,
  flee:{mode:'dart',r:0.8,speed:2,dur:0.5},
  fact:'在沙地和礁石上捡食碎屑、啃藻类，长长的白色触须不停摆动。受惊时尾巴一弹，瞬间向后蹿出去。',
  model:()=>buildShrimp(),
  update(a,dt){if(a.dart>0){a.dart-=dt;a.x-=Math.cos(a.h)*2*dt;a.z-=Math.sin(a.h)*2*dt;a.hy=Math.sin(a.dart/0.5*Math.PI)*0.25;a.state='flee';clampSwim(a);a.speed=2;return;}a.hy=0;
    const th=threatNear(a,0.8);if(th&&Math.random()<0.6){a.h=Math.atan2(th.z-a.z,th.x-a.x);a.dart=0.5;a.flee={from:th,t:0.5};return;}a.flee=null;
    oceanBottom(a,dt,isNight()?0.14:0.09,x=>nearestDet(x.x,x.z,3)||turfFood(x));if(a.energy>0.8)tryBreed(a,0.003,dt);},
  anim(a,dt){bottomPose(a,a.hy||0,a.scale*1.3);a.m.ant.rotation.set(Math.sin(a.ph*3)*0.15,Math.sin(a.ph*2.3)*0.25,0);},
 },
 crab:{name:'螃蟹',role:'清道夫',lvl:1.5,ocean:true,cost:18,batch:1,life:9,burn:0.0017,resp:0.08,zones:[0.6,1,1,0.9],color:'#d4502a',habitat:'沙地 · 礁石',cap:14,corpse:0.2,
  flee:{mode:'claw',r:0.9},
  fact:'横着走路，什么都吃：碎屑、藻类、死去的动物。遇到威胁会举起大钳子，很多鱼因此不敢下嘴。',
  model:()=>buildCrab(),init(a){a.side=Math.random()<0.5?1:-1;},
  update(a,dt){const th=threatNear(a,0.9);a.threat=Math.max(0,(a.threat||0)-dt);if(th){a.threat=2;a.state='threat';a.h=Math.atan2(th.z-a.z,th.x-a.x);a.speed=0;return;}
    if(Math.random()<0.1*dt)a.side*=-1;const sp=isNight()?0.14:0.09;a.tt-=dt;if(a.tt<=0){a.tt=2;if(!a.target||!a.target.alive)a.target=nearestDet(a.x,a.z,4)||turfFood(a);}
    if(a.target&&a.target.alive){const dx=a.target.x-a.x,dz=a.target.z-a.z,d=Math.hypot(dx,dz);if(d>0.16){a.turnTo(Math.atan2(dz,dx)-a.side*Math.PI/2,2,dt);const mv=a.h+a.side*Math.PI/2;const nx=a.x+Math.cos(mv)*sp*dt,nz=a.z+Math.sin(mv)*sp*dt;if(!blocked(nx,nz,0.05)){a.x=nx;a.z=nz;}a.speed=sp;a.state='forage';}
      else{a.state='eat';a.speed=0;const t=a.target;if(t.kind==='detritus'){const e=Math.min(t.amount,0.03*dt);t.amount-=e;a.energy=Math.min(1,a.energy+e*1.4);}else{turf[t.turf]=Math.max(0.02,turf[t.turf]-0.004*dt);a.energy=Math.min(1,a.energy+0.015*dt);if(a.energy>0.97)a.target=null;}}}
    else{a.state='idle';const mv=a.h+a.side*Math.PI/2;const nx=a.x+Math.cos(mv)*sp*0.5*dt,nz=a.z+Math.sin(mv)*sp*0.5*dt;if(!blocked(nx,nz,0.05)&&Math.abs(nx)<HW-0.5&&nz>-HD+1.1&&nz<HD-0.5){a.x=nx;a.z=nz;a.speed=sp*0.5;}else a.side*=-1;}
    if(a.energy>0.85)tryBreed(a,0.0014,dt);},
  anim(a,dt){bottomPose(a,0,a.scale*1.2);const m=a.m;const up=a.threat>0?1:0;m.claws.forEach((c,i)=>{c.rotation.z=up*0.9+Math.sin(a.ph*2+i)*0.05;c.rotation.x=(i?-1:1)*up*0.3;});
    m.legs.forEach(l=>{const o=Math.sin(a.ph*14+l.k*1.2+(l.s>0?0:Math.PI));l.piv.rotation.x=a.speed>0?o*0.3*l.s:0;l.piv.rotation.y=a.speed>0?Math.max(0,o)*0.2:0;});},
 },
 starfish:{name:'海星',role:'啃食藻类',lvl:1,ocean:true,cost:12,batch:1,life:14,burn:0.001,resp:0.02,zones:[0.8,1,1,1],color:'#e2663a',habitat:'礁石 · 沙地',cap:12,corpse:0.1,
  fact:'用腹面几百只管足慢慢爬行，把胃翻出来消化藻类和碎屑。断了一条腕还能长回来。',
  model:()=>buildStar(),update(a,dt){oceanBottom(a,dt,0.025,x=>turfFood(x)||nearestDet(x.x,x.z,2));if(a.energy>0.9)tryBreed(a,0.0006,dt);},
  anim(a,dt){bottomPose(a,0.003,a.scale*1.2);a.m.root.rotation.y+=Math.sin(a.ph*0.2)*0.05;},
 },
 urchin:{name:'海胆',role:'啃食藻类',lvl:1,ocean:true,cost:12,batch:1,life:14,burn:0.001,resp:0.02,zones:[0.6,0.8,1,1],color:'#5a2a6a',habitat:'礁石',cap:12,corpse:0.1,
  fact:'浑身是刺，几乎没有天敌。整天慢慢啃食礁石上的藻类，是珊瑚的好帮手：藻类少了，珊瑚才长得好。',
  model:()=>buildUrchin(),update(a,dt){oceanBottom(a,dt,0.02,turfFood);if(a.energy>0.9)tryBreed(a,0.0006,dt);},
  anim(a,dt){bottomPose(a,0,a.scale*1.2);},
 },
 grouper:{name:'石斑鱼',role:'伏击捕食者',lvl:3,ocean:true,cost:70,batch:1,life:14,burn:0.0018,resp:0.8,zones:[0.6,0.8,1,1],color:'#c43a2a',habitat:'礁石区',cap:4,corpse:0.6,
  diet:{damsel:{v:0.3},clown:{v:0.3},shrimp:{v:0.2},crab:{v:0.35,cond:p=>p.scale<0.9&&!(p.threat>0)}},
  hunt:{sense:3.5,stalkR:1.3,reach:0.5,strikeT:0.3,hitAt:0.5,success:0.62,eatT:3,hungry:0.7,move:(a,p,dt,mode)=>{a.state=mode;swimTo(a,p.x,p.y,p.z,mode==='stalk'?0.95:1.45,dt,mode==='stalk'?3:4.5);}},
  unlock:{need:()=>count('damsel')>=12,text:'蓝魔雀鲷达到 12 条后解锁'},
  fact:'礁石区的伏击者。慢慢贴近猎物，然后猛地张嘴，靠水流把小鱼直接吸进去。',
  model:()=>buildFish('grouper'),init(a){a.flying=true;a.y=heightAt(a.x,a.z)+rand(0.6,1.4);a.pitch=0;},
  update(a,dt){if(a.state==='strike'){const p=a.prey;if(p&&p.alive){a.h=Math.atan2(p.z-a.z,p.x-a.x);}}
    if(huntTick(a,dt)){if(a.state==='strike'&&a.prey){const p=a.prey;const d=dist3(a,p);if(d>0.05){a.x+=(p.x-a.x)/d*Math.min(d,2.4*dt);a.y+=(p.y-a.y)/d*Math.min(d,2.4*dt);a.z+=(p.z-a.z)/d*Math.min(d,2.4*dt);}}clampSwim(a);return;}
    a.state='patrol';if(!a.wp||a.tt<=0||Math.hypot(a.wp.x-a.x,a.wp.z-a.z)<1){a.tt=rand(6,12);a.wp={x:rand(0,16),z:rand(-8,8),y:0};a.wp.y=heightAt(a.wp.x,a.wp.z)+rand(0.5,1.6);}a.tt-=dt;swimTo(a,a.wp.x,a.wp.y,a.wp.z,isNight()?0.12:0.25,dt,1.5);
    if(a.age>a.life*0.2)tryBreed(a,0.0005,dt);},
  anim:fishAnim,
  mouth(a,o){o.set(a.x+Math.cos(a.h)*0.04,a.y,a.z+Math.sin(a.h)*0.04);},
 },
 moray:{name:'海鳗',role:'顶级捕食者',lvl:4,ocean:true,cost:130,batch:1,life:20,burn:0.0009,resp:1,zones:[0.5,0.5,1,1],color:'#6f7d2a',habitat:'礁石缝隙',cap:2,corpse:0.8,
  diet:{damsel:{v:0.25},clown:{v:0.25},shrimp:{v:0.15},crab:{v:0.4,cond:p=>!(p.threat>0)||Math.random()<0.3},grouper:{v:0.8,cond:p=>p.scale<0.75}},
  hunt:{sense:1.5,stalkR:1.5,reach:0.55,strikeT:0.45,hitAt:0.45,success:0.7,eatT:6,hungry:0.55,move:(a,p,dt,mode)=>{a.state=mode;if(a.lurk&&!isNight()){a.speed=0;a.turnTo(Math.atan2(p.z-a.z,p.x-a.x),2,dt);}else{a.seek(p.x,p.z,0.6,dt,3);}}},
  unlock:{need:()=>count('grouper')>=1&&count('crab')>=4,text:'有石斑鱼、螃蟹 4 只后解锁'},
  fact:'白天把身体藏在礁石缝里，只露出脑袋，一张一合地呼吸。等猎物游到嘴边，猛地窜出去一口咬住，再缩回洞里。',
  model:()=>buildMoray(),
  init(a){const rocks=OBST.filter(o=>o.top!=null&&o.r>0.7);const r=rocks.length?pick(rocks):{x:12,z:-6,r:1.5,top:2};a.home=r;const an=Math.atan2(2-r.z,-r.x)+rand(-0.8,0.8);a.den={x:r.x+Math.cos(an)*(r.r+0.08),z:r.z+Math.sin(an)*(r.r+0.08),h:an};a.x=a.den.x;a.z=a.den.z;a.h=an;a.trail=new Trail(1.9,a.x,a.z,a.h);a.lurk=true;},
  update(a,dt){const den=a.den;
    if(a.state==='strike'&&a.prey&&a.prey.alive){const p=a.prey;const d=Math.hypot(p.x-a.x,p.z-a.z);if(d>0.05){a.h=Math.atan2(p.z-a.z,p.x-a.x);a.x+=Math.cos(a.h)*Math.min(d,2.2*dt);a.z+=Math.sin(a.h)*Math.min(d,2.2*dt);}}
    if(huntTick(a,dt)){a.lurk=a.lurk&&a.state!=='chase';return;}
    if(!isNight()){const d=Math.hypot(den.x-a.x,den.z-a.z);if(d>0.05){a.state='return';const q=a.trail.retract(0.6*dt);a.x=q.x;a.z=q.z;if(Math.hypot(den.x-a.x,den.z-a.z)<0.08||a.trail.p.length<8){a.x=den.x;a.z=den.z;a.h=den.h;a.trail.reset(a.x,a.z,a.h);}a.speed=0.6;return;}
      a.lurk=true;a.state='lurk';a.speed=0;a.h=den.h+Math.sin(a.ph*0.4)*0.35;return;}
    a.lurk=false;a.state='roam';a.roam(0.3,dt);},
  anim(a,dt){const m=a.m;if(a.speed>0)a.trail.push(a.x,a.z);a.trail.sample(a.x,a.z,50,1.7*a.scale,m.pts);const out=a.lurk&&a.state!=='strike';
    for(let i=0;i<50;i++){const p=m.pts[i],t=i/49;const s=Math.sin(a.ph*3-i*0.35)*0.035*(a.speed>0?1:0.3)*t;p.x+=-Math.sin(a.h)*s;p.z+=Math.cos(a.h)*s;p.y=heightAt(p.x,p.z)+0.1+(out&&i<6?(6-i)*0.03:0);}
    m.body.update(m.pts,{s:a.scale});placeOn(m.eyes,m.body,2,0.03);m.eyes.scale.setScalar(a.scale);a.y=m.pts[0].y;},
  mouth(a,o){if(a.m&&a.m.body)o.copy(a.m.body.C[0]).addScaledVector(a.m.body.T[0],0.03);else o.set(a.x,a.y,a.z);},
 },
});
const LAND_ALLOW={mixed:null,desert:['ant','cricket','butterfly','spider','mantis','lizard','snake'],meadow:['ant','cricket','butterfly','isopod','spider','mantis','firefly','frog','lizard','snake'],
  marsh:['ant','cricket','snail','butterfly','isopod','firefly','spider','mantis','frog','snake'],jungle:['ant','cricket','snail','butterfly','isopod','firefly','spider','mantis','frog','lizard','snake']};
const SPK=Object.keys(SPEC).filter(k=>OCEAN?!!SPEC[k].ocean:!SPEC[k].ocean&&(!LAND_ALLOW[MK]||LAND_ALLOW[MK].includes(k)));
for(const k of Object.keys(SPEC))pop[k]=[];
