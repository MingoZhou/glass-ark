
/* =================== plant builders =================== */
setMsg('培育植物…');await tick();
const HSL=(h,s,l)=>new Col().setHSL(h,s,l);
function blade(M,bx,bz,h,lean,w,dirA,c0,c1,segs,hr,kw){const dx=Math.cos(dirA),dz=Math.sin(dirA),px=-dz,pz=dx;let prev=null;
  for(let s=0;s<=segs;s++){const t=s/segs,y=h*t,off=lean*t*t*h,cx=bx+dx*off,cz=bz+dz*off,ww=w*(1-t*0.9);_c.copy(c0).lerp(c1,t);const k=wk(y,hr,kw);
    const a=M.v(cx-px*ww,y,cz-pz*ww,0,t,_c,k),b=M.v(cx+px*ww,y,cz+pz*ww,1,t,_c,k);if(prev)M.q(prev[0],prev[1],b,a);prev=[a,b];}
  return new V3(bx+dx*lean*h,h,bz+dz*lean*h);}
function lathePart(pts,seg,ribs,ribAmp,vScale,colFn){const g=new THREE.LatheGeometry(pts,seg);const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(ribs){const a=Math.atan2(x,z),f=1+ribAmp*Math.cos(a*ribs);p.setX(i,x*f);p.setZ(i,z*f);}if(vScale)uv.setY(i,uv.getY(i)*vScale);}
  g.computeVertexNormals();return colorize(g,0xffffff,0,colFn);}
function bBarrel(v){const parts=[];const heads=v===2?irand(2,3):1;
  for(let k=0;k<heads;k++){const R=rand(0.3,0.44)*(k?0.72:1),H=R*rand(1.05,1.35),pts=[];
    for(let i=0;i<=18;i++){const t=i/18,y=t*1.04*H,e=(y-0.42*H)/(0.62*H);pts.push(new V2(Math.max(0.004,R*Math.sqrt(Math.max(0,1-e*e))),y));}
    const g=lathePart(pts,60,20,0.06,0,(x,y,z,c)=>c.multiplyScalar(0.62+0.38*Math.min(1,y/H*2.5)));
    const ox=k?rand(-0.5,0.5):0,oz=k?rand(-0.5,0.5):0;g.translate(ox,-0.03,oz);parts.push({g,m:'barrel'});
    if(v===1&&k===0){const M=new Mesher();for(let f=0;f<10;f++){const a=f/10*6.283;addLeaf(M,new V3(Math.cos(a)*R*0.25,H*1.0,Math.sin(a)*R*0.25),a,{len:0.1,wid:0.05,lift:1.1,droop:4,tint:new Col(0xffd86a),segs:2,flat:true});}parts.push({g:M.geo(),m:'lilyPetal'});}}
  return{parts,h:0.6};}
function bSaguaro(v){const parts=[];const R=rand(0.24,0.32),H=rand(2.2,3.3);
  const col=(x,y,z,c)=>c.multiplyScalar(0.7+0.3*Math.min(1,y*2));
  const lathe=(h,r)=>{const pts=[];for(let i=0;i<=16;i++){const t=i/16;let rr=r*(1-0.08*t);if(t>0.86){const u=(t-0.86)/0.14;rr=r*Math.sqrt(Math.max(0,1-u*u));}pts.push(new V2(Math.max(rr,0.004),t*h));}return lathePart(pts,36,12,0.08,h/1.2,col);};
  parts.push({g:lathe(H,R),m:'column'});
  const arms=v+1;for(let k=0;k<arms;k++){const y0=H*rand(0.35,0.6),ang=k/arms*6.283+rand(-0.5,0.5),out=rand(0.45,0.7),up=rand(0.55,1.15);const M=new Mesher();
    addTubeR(M,[new V3(0,y0,0),new V3(out*0.55,y0+0.02,0),new V3(out,y0+0.22,0),new V3(out,y0+up,0)],[R*0.7,R*0.62,R*0.6,R*0.58],WHITE,24,1,0,2);
    const g=M.geo();const cap=colorize(new THREE.SphereGeometry(R*0.58,24,8,0,6.283,0,Math.PI/2),0xffffff,0);cap.translate(out,y0+up,0);g.rotateY(ang);cap.rotateY(ang);parts.push({g,m:'column'},{g:cap,m:'column'});}
  return{parts,h:H};}
function bAloe(v){const M=new Mesher(),parts=[];const n=irand(13,18);
  for(let i=0;i<n;i++){const t=i/n;addLeaf(M,new V3(0,0.02+t*0.03,0),i*2.39996,{len:lerp(0.9,0.38,t)*rand(0.9,1.1),wid:lerp(0.17,0.1,t),lift:lerp(0.5,1.35,t),droop:lerp(1.3,0.5,t),fold:0.55,tint:HSL(0.36,0.2,rand(0.72,0.9)),hr:0.7,wind:0.25,segs:6});}
  parts.push({g:M.geo(),m:'aloe'});
  if(v===2){const S=new Mesher(),F=new Mesher();const top=new V3(0.05,1.25,0.02);addTube(S,[new V3(0,0.1,0),new V3(0.03,0.7,0),top],0.018,0.01,new Col(0x6b7a4a),6,1.3,0.4);
    for(let k=0;k<14;k++){const y=1.0+k*0.02,a=k*2.4;addLeaf(F,new V3(top.x+Math.cos(a)*0.03,y,top.z+Math.sin(a)*0.03),a,{len:0.08,wid:0.035,lift:-1.2,droop:0,tint:new Col(0xff8a3a),segs:2,flat:true,hr:1.3});}
    parts.push({g:S.geo(),m:'stem'},{g:F.geo(),m:'lilyPetal'});}
  return{parts,h:0.75};}
function bEche(v){const parts=[];const heads=irand(2,5);
  for(let hh=0;hh<heads;hh++){const cx=hh?rand(-0.28,0.28):0,cz=hh?rand(-0.28,0.28):0,s=rand(0.7,1.1)*(hh?0.8:1);
    [[11,0.13,0.3],[8,0.085,0.65],[6,0.045,1.05],[4,0.012,1.35]].forEach(([n,r,tilt],ri)=>{for(let k=0;k<n;k++){const a=k/n*6.283+ri*0.45;
      const g=new THREE.SphereGeometry(0.1*s,10,8);g.scale(0.52,0.22,1.1);g.translate(0,0,0.1*s);colorize(g,0x8fb6a8,0.05,(x,y,z,c)=>{if(z>0.17*s)c.lerp(new Col(0xd98b9b),0.8);});
      g.rotateX(-tilt);g.rotateY(Math.PI/2-a);g.translate(cx+Math.cos(a)*r*s,0.02+ri*0.025*s,cz+Math.sin(a)*r*s);parts.push({g,m:'succ'});}});}
  return{parts,h:0.22};}
function bFox(v){const M=new Mesher(),MH=new Mesher();const c0=new Col(0x3a5622),c1=new Col(0xaebc5c);
  for(let b=0;b<irand(10,16);b++){const a=rand(0,6.28),r=rand(0,0.1);blade(M,Math.cos(a)*r,Math.sin(a)*r,rand(0.3,0.62),rand(0.15,0.5),rand(0.012,0.02),rand(0,6.28),c0,c1,4,0.7,1);}
  const ns=irand(3,6);for(let k=0;k<ns;k++){const a=rand(0,6.28),bx=Math.cos(a)*0.05,bz=Math.sin(a)*0.05,h=rand(0.55,0.9),da=rand(0,6.28),dx=Math.cos(da),dz=Math.sin(da);
    const p2=new V3(bx+dx*0.18,h*0.86,bz+dz*0.18),tip=new V3(bx+dx*0.3,h*0.9,bz+dz*0.3);addTube(M,[new V3(bx,0,bz),new V3(bx+dx*0.05,h*0.5,bz+dz*0.05),p2,tip],0.007,0.005,new Col(0x7a9444),4,0.8,1);
    const dir=new V3().subVectors(tip,p2).normalize();dir.y-=0.6;dir.normalize();const s1=new V3().crossVectors(dir,UP).normalize(),s2=new V3().crossVectors(dir,s1).normalize();
    addCard(MH,tip,dir,s1,0.17,0.055,WHITE,0.8,1);addCard(MH,tip,dir,s2,0.17,0.055,WHITE,0.8,1);}
  return{parts:[{g:M.geo(),m:'blade'},{g:MH.geo(),m:'foxHead'}],h:0.8};}
function bDaisy(v){const M=new Mesher(),MS=new Mesher(),MF=new Mesher();
  for(let i=0;i<irand(6,10);i++)addLeaf(M,new V3(0,0.01,0),rand(0,6.28),{len:rand(0.12,0.2),wid:0.07,lift:0.45,droop:2.4,tint:HSL(0.28,0.45,0.5),hr:0.5,wind:0.4,segs:3});
  const n=v===2?irand(5,8):irand(2,5);for(let k=0;k<n;k++){const a=rand(0,6.28),bx=Math.cos(a)*0.04,bz=Math.sin(a)*0.04,h=rand(0.26,0.52);const top=new V3(bx+rand(-0.08,0.08),h,bz+rand(-0.08,0.08));
    addTube(MS,[new V3(bx,0,bz),new V3((bx+top.x)/2+rand(-0.02,0.02),h*0.55,(bz+top.z)/2),top],0.006,0.004,new Col(0x5c8a36),4,0.5,1);
    addDisc(MF,top,new V3(0.3+rand(-0.1,0.1),1,rand(-0.2,0.2)),rand(0.06,0.085),-0.25,WHITE,0.5,1);}
  return{parts:[{g:M.geo(),m:'leafBroad'},{g:MS.geo(),m:'stem'},{g:MF.geo(),m:'daisy'}],h:0.5};}
function bCosmos(v){const MB=new Mesher(),MS=new Mesher(),MF=new Mesher();const n=irand(3,6);
  for(let k=0;k<n;k++){const a=rand(0,6.28),bx=Math.cos(a)*0.06,bz=Math.sin(a)*0.06,h=rand(0.7,1.2);const mid=new V3(bx+rand(-0.1,0.1),h*0.55,bz+rand(-0.1,0.1)),top=new V3(mid.x+rand(-0.12,0.12),h,mid.z+rand(-0.12,0.12));
    addTube(MS,[new V3(bx,0,bz),mid,top],0.008,0.005,new Col(0x557f33),4,1,1);
    for(let j=0;j<7;j++){const t=rand(0.15,0.8),p=new V3().lerpVectors(new V3(bx,0,bz),top,t);      for(let q=0;q<3;q++){const da=rand(0,6.28);const P=p.clone();const s=MB.n;const L=rand(0.08,0.14);const dx=Math.cos(da),dz=Math.sin(da);_c.setHSL(0.27,0.45,0.4);for(let r=0;r<=2;r++){const tt=r/2;const x=P.x+dx*L*tt,z=P.z+dz*L*tt,y=P.y+0.03*tt-0.02*tt*tt;MB.v(x-dz*0.006,y,z+dx*0.006,0,tt,_c,wk(y,1,1));MB.v(x+dz*0.006,y,z-dx*0.006,1,tt,_c,wk(y,1,1));}MB.q(s,s+1,s+3,s+2);MB.q(s+2,s+3,s+5,s+4);}}
    addDisc(MF,top,new V3(0.35+rand(-0.1,0.1),1,rand(-0.2,0.2)),rand(0.1,0.13),-0.1,WHITE,1,1);}
  return{parts:[{g:MB.geo(),m:'blade'},{g:MS.geo(),m:'stem'},{g:MF.geo(),m:'cosmos'+v}],h:1.0};}
function bDand(v){const M=new Mesher(),MS=new Mesher(),MF=new Mesher();
  for(let i=0;i<irand(7,11);i++)addLeaf(M,new V3(0,0.01,0),i*2.39996,{len:rand(0.2,0.33),wid:0.08,lift:0.3,droop:1.3,tint:HSL(0.27,0.35,rand(0.55,0.7)),hr:0.4,wind:0.3,segs:4});
  const n=irand(1,3);for(let k=0;k<n;k++){const a=rand(0,6.28),h=rand(0.18,0.36),top=new V3(Math.cos(a)*0.06,h,Math.sin(a)*0.06);addTube(MS,[new V3(0,0,0),new V3(top.x*0.5,h*0.6,top.z*0.5),top],0.006,0.005,new Col(0x7a9a50),4,0.4,1);
    if(v<2)addDisc(MF,top,new V3(0.2,1,0),0.05,-0.35,WHITE,0.4,1);
    else{for(const d of[new V3(1,0,0),new V3(0,1,0),new V3(0,0,1)]){const side=new V3().crossVectors(d,Math.abs(d.y)>0.9?new V3(1,0,0):UP).normalize();addCard(MF,top.clone().addScaledVector(d,-0.075),d,side,0.15,0.15,WHITE,0.4,1);}}}
  return{parts:[{g:M.geo(),m:'dand'},{g:MS.geo(),m:'stem'},{g:MF.geo(),m:v<2?'dandF':'puff'}],h:0.3};}
function bClover(v){const MS=new Mesher(),MC=new Mesher(),parts=[];const n=irand(20,34);
  for(let k=0;k<n;k++){const a=rand(0,6.28),r=Math.sqrt(Math.random())*0.38,x=Math.cos(a)*r,z=Math.sin(a)*r,h=rand(0.05,0.14);const top=new V3(x+rand(-0.02,0.02),h,z+rand(-0.02,0.02));
    addTube(MS,[new V3(x,0,z),top],0.003,0.003,new Col(0x5a8a3a),3,0.15,1);addDisc(MC,top,new V3(rand(-0.3,0.3),1,rand(-0.3,0.3)),rand(0.045,0.065),0.12,HSL(0.27,0.3,rand(0.7,0.95)),0.15,1);}
  if(v>=1){for(let k=0;k<irand(3,7);k++){const a=rand(0,6.28),r=rand(0,0.3),g=colorize(new THREE.SphereGeometry(0.028,8,6),v===1?0xf4f0f4:0xe7a6c8,0.15);g.scale(1,0.9,1);g.translate(Math.cos(a)*r,rand(0.14,0.2),Math.sin(a)*r);parts.push({g,m:'fungus'});}}
  parts.push({g:MS.geo(),m:'stem'},{g:MC.geo(),m:'clover'});return{parts,h:0.15};}
function bCattail(v){const MR=new Mesher(),MS=new Mesher();
  for(let i=0;i<irand(10,15);i++)addLeaf(MR,new V3(rand(-0.08,0.08),0,rand(-0.08,0.08)),rand(0,6.28),{len:rand(1.2,2.0),wid:0.07,lift:rand(1.3,1.5),droop:rand(0.25,0.6),fold:0.4,segs:7,hr:1.6,wind:1,tint:HSL(0.2,0.3,rand(0.7,0.9))});
  for(let k=0;k<irand(2,4);k++){const bx=rand(-0.06,0.06),bz=rand(-0.06,0.06),h=rand(1.5,2.1),top=new V3(bx+rand(-0.05,0.05),h,bz+rand(-0.05,0.05));
    addTube(MS,[new V3(bx,0,bz),new V3(bx,h*0.5,bz),top],0.012,0.009,new Col(0x6a8440),5,1.8,1);const s0=top.clone().multiplyScalar(0.98);s0.y=h*0.82;addTubeR(MS,[s0,new V3(top.x,h*0.9,top.z),new V3(top.x,h*0.98,top.z)],[0.03,0.046,0.03],new Col(0x5a3a22),8,1.8,1);addTube(MS,[new V3(top.x,h,top.z),new V3(top.x,h+0.15,top.z)],0.006,0.003,new Col(0x8a7a50),3,1.8,1);}
  return{parts:[{g:MR.geo(),m:'reed'},{g:MS.geo(),m:'stem'}],h:1.8};}
function bLily(v){const MP=new Mesher(),parts=[];for(let k=0;k<irand(3,6);k++){const a=rand(0,6.28),r=k?rand(0.2,0.5):0;addDisc(MP,new V3(Math.cos(a)*r,0.004*k,Math.sin(a)*r),new V3(0,1,0).applyAxisAngle(new V3(Math.cos(a+1),0,Math.sin(a+1)),0),rand(0.2,0.34),0,HSL(0.3,0.3,rand(0.75,0.95)),1,0);}
  parts.push({g:MP.geo(),m:'lily'});
  if(v>0){const F=new Mesher();const c=new V3(rand(-0.1,0.1),0.02,rand(-0.1,0.1));for(let ring=0;ring<2;ring++)for(let k=0;k<8;k++){const a=k/8*6.283+ring*0.4;addLeaf(F,c,a,{len:ring?0.12:0.15,wid:0.055,lift:ring?1.15:0.75,droop:ring?1:1.4,fold:0.3,tint:v===1?WHITE:new Col(0xffe2ee),segs:3,flat:true});}
    parts.push({g:F.geo(),m:'lilyPetal'});const g=colorize(new THREE.SphereGeometry(0.03,10,8),0xf2cf4a,0.1);g.translate(c.x,c.y+0.04,c.z);parts.push({g,m:'fungus'});}
  return{parts,h:0.12};}
function bFern(v){const M=new Mesher();const n=irand(10,16);
  for(let i=0;i<n;i++){const a=i/n*6.283+rand(-0.25,0.25),t=Math.random();addLeaf(M,new V3(0,0.02,0),a,{len:rand(0.75,1.35)*(v===2?1.2:1),wid:rand(0.38,0.52),lift:rand(1.05,1.4),droop:rand(1.4,1.9),fold:-0.12,segs:8,hr:1,wind:1,tint:HSL(0.28+rand(-0.02,0.02),0.35,rand(0.7,0.95))});}
  return{parts:[{g:M.geo(),m:'fern'}],h:1.0};}
function bMoss(v){const parts=[];for(let k=0;k<irand(6,11);k++){const r=rand(0.07,0.2);const g=new THREE.IcosahedronGeometry(r,2);g.scale(1,0.36,1);g.translate(rand(-0.32,0.32),r*0.08,rand(-0.32,0.32));colorize(g,HSL(rand(0.24,0.3),rand(0.3,0.5),rand(0.6,0.95)).getHex(),0.2);parts.push({g,m:'moss'});}return{parts,h:0.12};}
function bMonstera(v){const MS=new Mesher(),ML=new Mesher();const n=irand(5,8);
  for(let i=0;i<n;i++){const a=i/n*6.283+rand(-0.3,0.3),L=rand(0.8,1.4)*(v===2?1.2:1),dx=Math.cos(a),dz=Math.sin(a);const tip=new V3(dx*0.38*L,0.92*L,dz*0.38*L);
    addTube(MS,[new V3(0,0,0),new V3(dx*0.12*L,0.55*L,dz*0.12*L),tip],0.022,0.014,new Col(0x3f6e2c),5,1.6,1);
    addLeaf(ML,tip,a,{len:rand(0.8,1.1),wid:rand(0.8,1.0),lift:rand(-0.15,0.3),droop:0.75,fold:-0.08,segs:6,hr:1.6,wind:1,tint:HSL(0.3,0.3,rand(0.7,0.95))});}
  return{parts:[{g:MS.geo(),m:'stem'},{g:ML.geo(),m:'monstera'}],h:1.6};}
function bBrom(v){const M=new Mesher(),parts=[];const n=irand(16,21);
  for(let i=0;i<n;i++){const t=i/n;addLeaf(M,new V3(0,0.03+t*0.04,0),i*2.39996,{len:lerp(0.62,0.32,t),wid:lerp(0.11,0.08,t),lift:lerp(0.7,1.45,t),droop:lerp(1.7,1.2,t),fold:0.35,segs:6,hr:0.6,wind:0.4,tint:HSL(0.3,0.2,rand(0.75,0.95))});}
  parts.push({g:M.geo(),m:'brom'});
  if(v>=1){const F=new Mesher();for(let k=0;k<7;k++)addLeaf(F,new V3(0,0.08,0),k*0.9,{len:0.22,wid:0.06,lift:1.35,droop:0.6,fold:0.3,segs:3,tint:v===1?new Col(0xff4a5a):new Col(0xffa34a),hr:0.6,wind:0.3,flat:true});parts.push({g:F.geo(),m:'lilyPetal'});}
  return{parts,h:0.55};}
function bTree(){const H=rand(6.2,8.4);const MB=new Mesher(),ML=new Mesher(),MV=new Mesher(),ME=new Mesher();
  const pts=[new V3(0,-0.3,0),new V3(rand(-0.3,0.3),H*0.3,rand(-0.3,0.3)),new V3(rand(-0.5,0.5),H*0.62,rand(-0.5,0.5)),new V3(rand(-0.4,0.4),H,rand(-0.4,0.4))];
  addTubeR(MB,pts,[0.36,0.26,0.19,0.12],WHITE,14,H,0.08,4);const trunk=new THREE.CatmullRomCurve3(pts);
  for(let k=0;k<5;k++){const a=k/5*6.283+rand(-0.3,0.3),dx=Math.cos(a),dz=Math.sin(a);addTubeR(MB,[new V3(dx*0.15,1.3,dz*0.15),new V3(dx*0.55,0.45,dz*0.55),new V3(dx*1.05,-0.08,dz*1.05)],[0.14,0.1,0.05],WHITE,8,H,0,1);}
  const cluster=(c,n,sz)=>{for(let i=0;i<n;i++)addLeaf(ML,c.clone().add(new V3(rand(-0.2,0.2),rand(-0.1,0.2),rand(-0.2,0.2))),rand(0,6.28),{len:rand(0.45,0.75)*sz,wid:rand(0.22,0.3)*sz,lift:rand(-0.3,0.55),droop:1.1,fold:0.12,segs:4,hr:H,wind:0.9,tint:HSL(0.28+rand(-0.02,0.03),0.45,rand(0.5,0.85))});};
  const nb=irand(4,6);for(let k=0;k<nb;k++){const t=rand(0.5,0.95),s=trunk.getPointAt(t),a=k/nb*6.283+rand(-0.4,0.4),dx=Math.cos(a),dz=Math.sin(a),L=rand(1.4,2.4);
    const bp=[s,s.clone().add(new V3(dx*L*0.45,L*0.35,dz*L*0.45)),s.clone().add(new V3(dx*L,L*0.5+rand(-0.2,0.3),dz*L))];addTubeR(MB,bp,[0.1,0.07,0.035],WHITE,7,H,0.15,2);
    cluster(bp[2],irand(12,16),1.1);cluster(bp[1],irand(5,8),0.9);
    if(Math.random()<0.7){const r0=bp[1].clone();const gy=-r0.y+0.3;addTube(MV,[r0,r0.clone().add(new V3(rand(-0.1,0.1),gy*0.5,rand(-0.1,0.1))),r0.clone().add(new V3(rand(-0.15,0.15),gy,rand(-0.15,0.15)))],0.012,0.008,new Col(0x5a4a34),4,H,0.2);}}
  cluster(pts[3],irand(16,22),1.2);
  for(let e=0;e<2;e++){const t=rand(0.3,0.55),c=trunk.getPointAt(t);c.x+=0.2;for(let i=0;i<9;i++)addLeaf(ME,c,i*2.4,{len:rand(0.2,0.3),wid:0.07,lift:1.1,droop:1.6,fold:0.3,segs:4,hr:H,wind:0.1});}
  return{parts:[{g:MB.geo(),m:'bark'},{g:ML.geo(),m:'leafBroad'},{g:MV.geo(),m:'stem'},{g:ME.geo(),m:'brom'}],h:H};}
function bMush(v){const parts=[];for(let k=0;k<irand(2,5);k++){const s=rand(0.6,1.2)*(k?0.75:1),ox=k?rand(-0.12,0.12):0,oz=k?rand(-0.12,0.12):0,sh=0.17*s,sr=0.016*s,cr=0.07*s;
    const st=lathePart([new V2(sr*1.4,0),new V2(sr,sh*0.5),new V2(sr*0.9,sh)],12,0,0,0,(x,y,z,c)=>c.set(0xefe6d2));st.translate(ox,0,oz);parts.push({g:st,m:'fungus'});
    const cp=[];cp.push(new V2(sr*1.1,sh+0.004));cp.push(new V2(cr*0.96,sh-0.004));for(let i=0;i<=10;i++){const th=Math.PI/2*(1-i/10);cp.push(new V2(Math.max(0.002,cr*Math.sin(th)),sh+cr*0.6*Math.cos(th)));}
    const capC=v===0?0xc8261e:v===1?0x8a5a32:0xd89a3a;const cap=lathePart(cp,20,0,0,0,(x,y,z,c)=>{if(y<sh+0.003)c.set(0xe8dcc0);else c.set(capC).multiplyScalar(0.85+0.3*((y-sh)/(cr*0.6)));});cap.translate(ox,0,oz);parts.push({g:cap,m:'fungus'});
    if(v===0)for(let w=0;w<9;w++){const a=rand(0,6.28),th=rand(0.1,1.2);const g=colorize(new THREE.SphereGeometry(0.008*s,6,4),0xf6f1e4,0);g.scale(1,0.5,1);g.translate(ox+Math.cos(a)*cr*Math.sin(th),sh+cr*0.6*Math.cos(th),oz+Math.sin(a)*cr*Math.sin(th));parts.push({g,m:'fungus'});}}
  return{parts,h:0.25};}


/* ---- ocean plants ---- */
if(OCEAN){MATS.coral=wind(new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.55,clearcoat:0.3}));TX.kelp.wrapS=TX.kelp.wrapT=TX.fan.wrapS=TX.fan.wrapT=THREE.ClampToEdgeWrapping;
  MATS.kelp=wind(new THREE.MeshStandardMaterial({map:TX.kelp,alphaTest:0.4,side:THREE.DoubleSide,vertexColors:true,roughness:0.6}));MATS.fan=wind(new THREE.MeshStandardMaterial({map:TX.fan,alphaTest:0.3,side:THREE.DoubleSide,vertexColors:true,roughness:0.6}));
  for(const k of['coral','kelp','fan','blade','stem'])causticify(MATS[k]);}
function bSeagrass(v){const M=new Mesher();const c0=new Col(0x2a5626),c1=new Col(0x7ab05a);for(let b=0;b<irand(16,26);b++){const a=rand(0,6.28),r=rand(0,0.2);blade(M,Math.cos(a)*r,Math.sin(a)*r,rand(0.5,1.1),rand(0.05,0.3),rand(0.014,0.022),rand(0,6.28),c0,c1,6,1,1);}return{parts:[{g:M.geo(),m:'blade'}],h:1};}
function bKelp(v){const MS=new Mesher(),ML=new Mesher(),parts=[];const H=rand(4.5,7.2);const n=irand(2,4);
  for(let k=0;k<n;k++){const bx=rand(-0.15,0.15),bz=rand(-0.15,0.15),h=H*rand(0.75,1),pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new V3(bx+Math.sin(t*3+k)*0.3*t,h*t,bz+Math.cos(t*2+k)*0.25*t));}
    addTube(MS,pts,0.022,0.012,new Col(0x6a5a24),5,H,0.9);const curve=new THREE.CatmullRomCurve3(pts);
    for(let t=0.12;t<0.98;t+=rand(0.05,0.08)){const p=curve.getPointAt(t);addLeaf(ML,p,rand(0,6.28),{len:rand(0.5,0.85),wid:rand(0.14,0.22),lift:rand(-0.2,0.6),droop:0.8,fold:0.1,segs:4,hr:H,wind:1});const g=sph(0.035,0x9a8a3a,[p.x,p.y,p.z]);const aw=new Float32Array(g.attributes.position.count).fill(wk(p.y,H,1));g.setAttribute('aWind',new THREE.BufferAttribute(aw,1));parts.push({g,m:'coral'});}}
  for(let i=0;i<5;i++)parts.push({g:sph(0.06,0x5a4a20,[rand(-0.12,0.12),0.02,rand(-0.12,0.12)],[1,0.6,1]),m:'coral'});
  parts.push({g:MS.geo(),m:'stem'},{g:ML.geo(),m:'kelp'});return{parts,h:H};}
function bStag(v){const M=new Mesher(),parts=[];const base=[new Col(0x8a5ad0),new Col(0xe0789c),new Col(0x4aa8d0)][v],tip=base.clone().lerp(new Col(0xffffff),0.55);
  const br=(p,dir,len,r,d)=>{const q=p.clone().addScaledVector(dir,len);addTube(M,[p,p.clone().lerp(q,0.5).add(new V3(rand(-0.03,0.03),0,rand(-0.03,0.03))),q],r,r*0.78,base.clone().lerp(tip,d/3.5),6,1,0);
    if(d<3){const nn=irand(2,3);for(let i=0;i<nn;i++){const nd=dir.clone().add(new V3(rand(-0.75,0.75),rand(0.15,0.6),rand(-0.75,0.75))).normalize();br(q,nd,len*rand(0.6,0.8),r*0.74,d+1);}}else parts.push({g:sph(r*1.2,tip.getHex(),[q.x,q.y,q.z]),m:'coral'});};
  for(let i=0;i<irand(3,5);i++)br(new V3(rand(-0.1,0.1),-0.02,rand(-0.1,0.1)),new V3(rand(-0.6,0.6),1,rand(-0.6,0.6)).normalize(),rand(0.22,0.32),0.05,0);
  parts.push({g:M.geo(),m:'coral'});return{parts,h:0.9};}
function bBrain(v){const g=new THREE.SphereGeometry(0.45,96,48,0,6.2832,0,Math.PI*0.62);const p=g.attributes.position;const seed=rand(0,50);const rid=new Float32Array(p.count);
  for(let i=0;i<p.count;i++){const q=new V3(p.getX(i),p.getY(i),p.getZ(i)).normalize();const n=fbm(q.x*2+seed,q.y*2+q.z*1.7+seed,3);const r=Math.abs(Math.sin(n*42));rid[i]=r;q.multiplyScalar(0.45*(1+0.045*r));q.y=q.y*0.65-0.05;p.setXYZ(i,q.x,q.y,q.z);}
  g.computeVertexNormals();const base=[0x8a9a4a,0xb07a4a,0x6a9a9a][v];colorize(g,base,0.05,(x,y,z,c,i)=>{c.multiplyScalar(rid[i]<0.35?0.55:1.1);});return{parts:[{g,m:'coral'}],h:0.3};}
function bTable(v){const parts=[];const col=[0xb07a9a,0x9ab070,0xc09a6a][v];parts.push({g:lathePart([new V2(0.08,0),new V2(0.05,0.2),new V2(0.06,0.32)],12,0,0,0,(x,y,z,c)=>c.set(col).multiplyScalar(0.7)),m:'coral'});
  for(let k=0;k<irand(2,3);k++){const R=rand(0.45,0.7)*(k?0.75:1);const g=new THREE.CylinderGeometry(R,R*0.85,0.05,48,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),f=1+0.12*(fbm(Math.cos(a)*2+k,Math.sin(a)*2,2)-0.5);p.setX(i,x*f);p.setZ(i,z*f);}g.computeVertexNormals();
    colorize(g,col,0.15,(x,y,z,c)=>{if(Math.hypot(x,z)>R*0.85)c.lerp(new Col(0xf0e6d0),0.5);});g.translate(k?rand(-0.2,0.2):0,0.32+k*0.12,k?rand(-0.2,0.2):0);parts.push({g,m:'coral'});}return{parts,h:0.5};}
function bFan(v){const M=new Mesher();const tint=[WHITE,new Col(0xe0b0ff),new Col(0xffd0a0)][v];for(let k=0;k<2;k++){const a=rand(0,3.14)+k*0.5;addCard(M,new V3(0,0.02,0),UP.clone(),new V3(Math.cos(a),0,Math.sin(a)),rand(0.8,1.1),rand(0.8,1.1),tint,1,0.8);}return{parts:[{g:M.geo(),m:'fan'}],h:1};}
function bAnemone(v){const M=new Mesher(),parts=[];const col=[[0x4a8a4a,0xc05ad0],[0xd06a8a,0xf0d0e0],[0xd08a3a,0xf0e0a0]][v];const c0=new Col(col[0]),c1=new Col(col[1]);
  parts.push({g:lathePart([new V2(0.14,0),new V2(0.12,0.08),new V2(0.13,0.13),new V2(0.02,0.14)],20,0,0,0,(x,y,z,c)=>c.set(0x8a4a4a)),m:'coral'});
  const n=irand(45,60);for(let i=0;i<n;i++){const a=i*2.39996,r=Math.sqrt((i+1)/n)*0.12,L=rand(0.16,0.28);const b=new V3(Math.cos(a)*r,0.13,Math.sin(a)*r);const d=new V3(Math.cos(a)*(0.3+r*3),1,Math.sin(a)*(0.3+r*3)).normalize();
    addTubeR(M,[b,b.clone().addScaledVector(d,L*0.5),b.clone().addScaledVector(d,L).add(new V3(0,-0.03,0))],[0.012,0.009,0.006],c0.clone().lerp(c1,0.5),4,0.4,1);const tp=b.clone().addScaledVector(d,L).add(new V3(0,-0.03,0));const g=sph(0.011,c1.getHex(),[tp.x,tp.y,tp.z]);g.setAttribute('aWind',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(wk(tp.y,0.4,1)),1));parts.push({g,m:'coral'});}
  parts.push({g:M.geo(),m:'coral'});return{parts,h:0.4};}
const PT={
  barrel:{name:'金琥',moist:[0,0.36],o2:0.5,cost:10,grow:0.5,seed:0.0004,build:bBarrel,cap:70,cast:true,size:[0.85,1.2],hint:'沙漠',color:'#6f9a55'},
  saguaro:{name:'柱状仙人掌',moist:[0,0.36],o2:1.2,cost:28,grow:0.3,seed:0.0002,build:bSaguaro,cap:40,cast:true,size:[0.85,1.15],hint:'沙漠',color:'#5a8a52'},
  aloe:{name:'芦荟',moist:[0.04,0.45],o2:0.6,cost:12,grow:0.6,seed:0.0006,build:bAloe,cap:60,cast:true,size:[0.8,1.2],hint:'沙漠',nectar:true,color:'#86ab8c'},
  echeveria:{name:'石莲花',moist:[0,0.42],o2:0.3,cost:6,grow:0.7,seed:0.0009,build:bEche,cap:80,size:[0.8,1.3],hint:'沙漠',color:'#9cbfae',snailFood:true},
  foxtail:{name:'狗尾草',moist:[0.2,0.75],o2:0.4,cost:4,grow:1.4,seed:0.003,build:bFox,cap:140,size:[0.8,1.2],hint:'草甸',antFood:true,color:'#aebc5c'},
  daisy:{name:'雏菊',moist:[0.25,0.75],o2:0.35,cost:6,grow:1.1,seed:0.002,build:bDaisy,cap:120,size:[0.8,1.25],hint:'草甸',nectar:true,host:true,antFood:true,color:'#f3f0e6'},
  cosmos:{name:'波斯菊',moist:[0.25,0.7],o2:0.5,cost:8,grow:1,seed:0.0016,build:bCosmos,cap:90,cast:true,size:[0.85,1.2],hint:'草甸',nectar:true,host:true,perch:true,color:'#e2629c'},
  dandelion:{name:'蒲公英',moist:[0.2,0.78],o2:0.3,cost:5,grow:1.2,seed:0.001,build:bDand,cap:90,size:[0.9,1.3],hint:'草甸',nectar:true,host:true,antFood:true,color:'#f7cf2a'},
  clover:{name:'三叶草',moist:[0.3,0.88],o2:0.35,cost:4,grow:1.3,seed:0.0025,build:bClover,cap:120,size:[0.8,1.3],hint:'草甸 · 溪沼',host:true,antFood:true,snailFood:true,color:'#4d8b36'},
  cattail:{name:'香蒲',moist:[0.55,1],o2:0.9,cost:9,grow:1,seed:0.0012,build:bCattail,cap:80,cast:true,size:[0.8,1.15],hint:'水边',perch:true,color:'#8a7a50'},
  lily:{name:'睡莲',water:true,moist:[0,1],o2:0.7,cost:10,grow:0.9,seed:0.0012,build:bLily,cap:60,size:[0.8,1.3],hint:'水面',nectar:true,color:'#4f8a45'},
  fern:{name:'蕨',moist:[0.5,1],o2:0.8,cost:8,grow:1,seed:0.0013,build:bFern,cap:120,cast:true,size:[0.8,1.3],hint:'雨林 · 溪沼',snailFood:true,color:'#4b8a3a'},
  moss:{name:'苔藓',moist:[0.45,1],o2:0.25,cost:3,grow:1.2,seed:0.0025,build:bMoss,cap:120,size:[0.8,1.4],hint:'雨林 · 溪沼',snailFood:true,isoFood:true,color:'#6b9a3c'},
  monstera:{name:'龟背竹',moist:[0.5,1],o2:1.2,cost:18,grow:0.7,seed:0.0005,build:bMonstera,cap:60,cast:true,size:[0.85,1.25],hint:'雨林',snailFood:true,perch:true,color:'#2f6b28'},
  bromeliad:{name:'凤梨',moist:[0.45,1],o2:0.6,cost:12,grow:0.8,seed:0.0006,build:bBrom,cap:60,cast:true,size:[0.85,1.3],hint:'雨林',nectar:true,color:'#c2474b'},
  tree:{name:'雨林树',moist:[0.5,1],o2:4.0,cost:60,grow:0.25,seed:0.00006,build:bTree,single:true,cast:true,size:[0.9,1.1],hint:'雨林',perch:true,color:'#3e7a33'},
  seagrass:{name:'海草',ocean:true,o2:0.5,cost:4,grow:1.3,seed:0.003,build:bSeagrass,cap:160,size:[0.8,1.3],hint:'沙地 · 海草床',color:'#5a9a4a'},
  kelp:{name:'巨藻',ocean:true,o2:1.4,cost:14,grow:0.6,seed:0.0006,build:bKelp,cap:40,cast:true,size:[0.8,1.1],hint:'沙地 · 开阔水',color:'#a8913a'},
  staghorn:{name:'鹿角珊瑚',ocean:true,coral:true,o2:0.6,cost:16,grow:0.35,seed:0.0006,build:bStag,cap:80,cast:true,size:[0.8,1.3],hint:'礁石区',color:'#9a6ad0'},
  brain:{name:'脑珊瑚',ocean:true,coral:true,o2:0.4,cost:14,grow:0.25,seed:0.0003,build:bBrain,cap:50,cast:true,size:[0.7,1.3],hint:'礁坪',color:'#8a9a4a'},
  table:{name:'桌面珊瑚',ocean:true,coral:true,o2:0.5,cost:18,grow:0.3,seed:0.0003,build:bTable,cap:40,cast:true,size:[0.8,1.3],hint:'礁坪',color:'#b07a9a'},
  fan:{name:'海扇',ocean:true,coral:true,o2:0.3,cost:12,grow:0.4,seed:0.0004,build:bFan,cap:50,size:[0.8,1.3],hint:'礁石区',color:'#d8506a'},
  anemone:{name:'海葵',ocean:true,coral:true,host:true,o2:0.2,cost:15,grow:0.5,seed:0.0004,build:bAnemone,cap:40,size:[0.9,1.4],hint:'礁坪 · 小丑鱼的家',color:'#7ad06a'},
  mushroom:{name:'蘑菇',fungus:true,moist:[0.4,1],o2:0,cost:0,grow:4,seed:0,build:bMush,cap:60,size:[0.9,1.4],hint:'腐殖质上自生',snailFood:true,isoFood:true,life:1.6,color:'#c8261e'},
};
const PZ={barrel:[0],saguaro:[0],aloe:[0],echeveria:[0],foxtail:[1],daisy:[1,2],cosmos:[1],dandelion:[1],clover:[1,2],cattail:[2],lily:[2],fern:[2,3],moss:[2,3],monstera:[3],bromeliad:[3],tree:[3]};
const PLANT_KEYS=Object.keys(PT).filter(k=>{const T=PT[k];if(T.fungus)return false;if(OCEAN)return !!T.ocean;if(T.ocean)return false;if(k==='lily'&&!MODE.pond)return false;return MODE.zone==null||PZ[k].includes(MODE.zone);});

/* =================== plant instances =================== */
const plants=[],PR={},WITHER=OCEAN?new Col(1.9,1.9,1.85):new Col(0.82,0.66,0.4),dummy=new THREE.Object3D();
const PG=new Map(),PGS=2;const pgk=(x,z)=>Math.floor((x+HW)/PGS)+','+Math.floor((z+HD)/PGS);
function pgAdd(p){const k=pgk(p.x,p.z);let a=PG.get(k);if(!a){a=[];PG.set(k,a);}a.push(p);}
function pgDel(p){const a=PG.get(pgk(p.x,p.z));if(a){const i=a.indexOf(p);if(i>=0)a.splice(i,1);}}
function nearPlants(x,z,r,f){const out=[];const i0=Math.floor((x-r+HW)/PGS),i1=Math.floor((x+r+HW)/PGS),j0=Math.floor((z-r+HD)/PGS),j1=Math.floor((z+r+HD)/PGS);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const a=PG.get(i+','+j);if(!a)continue;for(const p of a){if(!p.alive)continue;const d=(p.x-x)**2+(p.z-z)**2;if(d<=r*r&&(!f||f(p)))out.push(p);}}return out;}
function nearestPlant(x,z,r,f){let best=null,bd=r*r;for(const p of nearPlants(x,z,r,f)){const d=(p.x-x)**2+(p.z-z)**2;if(d<bd){bd=d;best=p;}}return best;}
function getPR(type,v){const key=type+':'+v;let r=PR[key];if(r)return r;const T=PT[type],b=T.build(v),{geo,keys}=mergeG(b.parts);const mats=keys.map(k=>MATS[k]);
  const mesh=new THREE.InstancedMesh(geo,mats.length===1?mats[0]:mats,T.cap);mesh.count=0;mesh.castShadow=!!T.cast;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.setColorAt(0,WHITE);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);tank.add(mesh);r={mesh,items:[],h:b.h,cap:T.cap,dirty:false};PR[key]=r;return r;}
function addPlant(type,x,z,growth,v){const T=PT[type];if(v==null)v=type==='dandelion'?irand(0,1):irand(0,2);
  const p={kind:'plant',type,T,x,z,v,growth:growth==null?rand(0.55,1):growth,health:1,pollen:0,zone:zoneAt(x,z),id:++UID,alive:true,age:0,rot:rand(0,6.283),tilt:rand(-0.07,0.07),size:rand(T.size[0],T.size[1]),tint:new Col(rand(0.88,1),rand(0.92,1),rand(0.86,1)),eaten:0};
  if(T.single){const b=T.build(v),{geo,keys}=mergeG(b.parts);p.mesh=new THREE.Mesh(geo,keys.map(k=>MATS[k]));p.mesh.castShadow=true;p.mesh.receiveShadow=true;p.h=b.h;tank.add(p.mesh);stampAO(x,z,1.8,0.3);OBST.push(p.obst={x,z,r:0.45});}
  else{const r=getPR(type,v);if(r.items.length>=r.cap)return null;p.r=r;p.idx=r.items.length;r.items.push(p);r.mesh.count=r.items.length;p.h=r.h;}
  plants.push(p);pgAdd(p);placePlant(p);return p;}
function plantBaseY(p){return p.T.water?env.waterY+0.004:heightAt(p.x,p.z)-0.02;}
function plantScale(p){return p.size*(0.3+0.7*p.growth);}
function plantTop(p){return plantBaseY(p)+p.h*plantScale(p)*0.92;}
function placePlant(p){const y=plantBaseY(p),s=plantScale(p);
  if(p.T.single){p.mesh.position.set(p.x,y,p.z);p.mesh.rotation.set(p.tilt*0.3,p.rot,0);p.mesh.scale.setScalar(s);return;}
  dummy.position.set(p.x,y,p.z);dummy.rotation.set(p.tilt,p.rot,p.tilt*0.6);dummy.scale.setScalar(s);dummy.updateMatrix();p.r.mesh.setMatrixAt(p.idx,dummy.matrix);
  _c.copy(p.tint).lerp(WITHER,Math.pow(1-p.health,0.8));p.r.mesh.setColorAt(p.idx,_c);p.r.dirty=true;}
function removePlant(p,litter){if(!p.alive)return;p.alive=false;pgDel(p);
  if(p.T.single){tank.remove(p.mesh);p.mesh.geometry.dispose();const i=OBST.indexOf(p.obst);if(i>=0)OBST.splice(i,1);}
  else{const r=p.r,last=r.items.pop();if(last!==p){r.items[p.idx]=last;last.idx=p.idx;placePlant(last);}r.mesh.count=r.items.length;r.dirty=true;}
  if(litter&&!p.T.fungus)addDetritus(p.x,p.z,0.25+0.4*p.growth*(p.T.single?3:1),'litter');
  if(typeof onEntityGone==='function')onEntityGone(p);}
function setVariant(p,v){if(p.T.single||p.v===v)return;const r=p.r,last=r.items.pop();if(last!==p){r.items[p.idx]=last;last.idx=p.idx;placePlant(last);}r.mesh.count=r.items.length;r.dirty=true;
  const r2=getPR(p.type,v);if(r2.items.length>=r2.cap){p.r=r;p.idx=r.items.length;r.items.push(p);r.mesh.count=r.items.length;placePlant(p);return;}p.v=v;p.r=r2;p.idx=r2.items.length;r2.items.push(p);r2.mesh.count=r2.items.length;p.h=r2.h;placePlant(p);}
function flushPlants(){for(const k in PR){const r=PR[k];if(r.dirty){r.mesh.instanceMatrix.needsUpdate=true;if(r.mesh.instanceColor)r.mesh.instanceColor.needsUpdate=true;r.dirty=false;}}}
function spacingOK(x,z,d){return nearPlants(x,z,d).length===0;}
function suit(type,x,z){const T=PT[type];if(OCEAN){if(Math.abs(x)>HW-0.4||Math.abs(z)>HD-0.4)return{ok:false,msg:'太靠近玻璃了'};if(z<-HD+0.9)return{ok:false,msg:'太靠近岩壁了'};const o=blocked(x,z,0.05);if(o&&!(T.coral&&o.top!=null))return{ok:false,msg:'这里有障碍物'};return{ok:true,fit:oceanFit(T)>-0.05};}if(Math.abs(x)>HW-0.4||Math.abs(z)>HD-0.4)return{ok:false,msg:'太靠近玻璃了'};if(z<-HD+0.9)return{ok:false,msg:'太靠近岩壁了'};
  if(blocked(x,z,0.05))return{ok:false,msg:'这里有石头或树干'};
  if(T.water)return inPond(x,z,0.08)?{ok:true,fit:true}:{ok:false,msg:'睡莲只能种在水塘里'};
  if(inWater(x,z,-0.02))return{ok:false,msg:'这里是水面'};
  const zi=zoneAt(x,z),m=localMoist(x,z,zi);return{ok:true,fit:m>=T.moist[0]&&m<=T.moist[1],zi,m};}

/* =================== turf (dense grass field) =================== */
function oceanFit(T){let bad=0;const t=env.temp;if(T.coral){if(t>29)bad+=(t-29)*0.12;if(t<21)bad+=(21-t)*0.08;if(env.algae>0.62)bad+=(env.algae-0.62)*0.8;}else{if(t>31)bad+=(t-31)*0.08;}const sd=Math.abs(env.sal-35);if(sd>3)bad+=(sd-3)*0.06;return -bad;}
const TNX=36,TNZ=22,turf=new Float32Array(TNX*TNZ),turfCap=new Float32Array(TNX*TNZ);
const tcell=(x,z)=>clamp(Math.floor(x+HW),0,TNX-1)+clamp(Math.floor(z+HD),0,TNZ-1)*TNX;
for(let j=0;j<TNZ;j++)for(let i=0;i<TNX;i++){const x=-HW+i+0.5,z=-HD+j+0.5,w=zoneW(zu(x,z));const c=j*TNX+i;turfCap[c]=OCEAN?clamp(0.3+0.45*reefAt(x,z),0,1):clamp(w[1]*1+w[2]*0.55+w[3]*0.22+w[0]*0.05,0,1)*(z<-HD+1.2?0.2:1);turf[c]=turfCap[c]*rand(0.6,0.9);}
function grassClusterGeo(c0,c1,n,hmin,hmax){const M=new Mesher();for(let b=0;b<n;b++){const a=rand(0,6.28),r=rand(0,0.06);blade(M,Math.cos(a)*r,Math.sin(a)*r,rand(hmin,hmax),rand(0.1,0.45),rand(0.01,0.018),rand(0,6.28),c0,c1,3,hmax,1);}return M.geo();}
const GN=Math.floor(16000);
const grass=(function(){const geo=OCEAN?grassClusterGeo(new Col(0x5a2a2a),new Col(0xa05a4a),7,0.05,0.14):grassClusterGeo(new Col(0x33501f),new Col(0x9fb85a),8,0.14,0.4);const mesh=new THREE.InstancedMesh(geo,MATS.blade,GN);mesh.frustumCulled=false;mesh.receiveShadow=true;
  const gx=new Float32Array(GN),gz=new Float32Array(GN),gs=new Float32Array(GN),gr=new Float32Array(GN),gc=new Int32Array(GN),gy=new Float32Array(GN),gzi=new Uint8Array(GN),gb=new Float32Array(GN);const cells=[];for(let i=0;i<TNX*TNZ;i++)cells.push([]);let n=0,tries=0;
  while(n<GN&&tries<GN*12){tries++;const x=rand(-HW+0.3,HW-0.3),z=rand(-HD+0.9,HD-0.3),c=tcell(x,z);if(Math.random()>turfCap[c]*0.95)continue;if(OCEAN&&Math.random()<0.45)continue;if(pondD(x,z)<1.18||streamQ(x,z).d<0.75||Math.hypot(x-POOL.x,z-POOL.z)<POOL.r*1.4||slopeAt(x,z)>1.3||blocked(x,z,0.05))continue;
    gx[n]=x;gz[n]=z;gs[n]=rand(0.7,1.35);gr[n]=rand(0,6.28);gc[n]=c;gy[n]=heightAt(x,z)-0.01;gzi[n]=zoneAt(x,z);gb[n]=localMoist(x,z,gzi[n])-env.zones[gzi[n]].m;cells[c].push(n);n++;}
  mesh.count=Math.floor(n*Q.grass);mesh.setColorAt(0,WHITE);tank.add(mesh);return{mesh,n,gx,gz,gs,gr,gc,gy,gzi,gb,cells};})();
const DRY=new Col(1.05,0.86,0.5);
function refreshGrass(){const G=grass;for(let i=0;i<G.n;i++){const c=G.gc[i],t=turf[c];const x=G.gx[i],z=G.gz[i];dummy.position.set(x,G.gy[i],z);dummy.rotation.set(0,G.gr[i],0);const s=G.gs[i]*(0.2+0.8*t);dummy.scale.set(s,s*(0.5+0.5*t),s);dummy.updateMatrix();G.mesh.setMatrixAt(i,dummy.matrix);
    const m=Math.min(1,env.zones[G.gzi[i]].m+G.gb[i]);_c.copy(WHITE).lerp(DRY,clamp(1-m*1.9,0,0.85));_c.multiplyScalar(0.85+hash2(i,3)*0.25);G.mesh.setColorAt(i,_c);}
  G.mesh.instanceMatrix.needsUpdate=true;G.mesh.instanceColor.needsUpdate=true;}

/* =================== static scatter =================== */
function scatter(geo,mat,N,accept,cfg){N=Math.floor(N);const mesh=new THREE.InstancedMesh(geo,mat,N);mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=!!cfg.cast;let n=0,tries=0;
  while(n<N&&tries<N*25){tries++;const x=rand(-HW+0.2,HW-0.2),z=rand(-HD+0.6,HD-0.2);const w=accept(x,z);if(!w||Math.random()>w)continue;const y=heightAt(x,z)+(cfg.y||0);
    dummy.position.set(x,y,z);dummy.rotation.set(rand(-1,1)*(cfg.tilt||0),rand(0,6.28),rand(-1,1)*(cfg.tilt||0));const s=rand(cfg.s[0],cfg.s[1]);dummy.scale.set(s,s*(cfg.sy||1),s);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);
    mesh.setColorAt(n,cfg.col?cfg.col(x,z):WHITE);n++;}
  mesh.count=n;tank.add(mesh);return mesh;}
setMsg('铺设地表…');await tick();
if(!OCEAN)(function(){const S=Q.scatter;
  const peb=new THREE.IcosahedronGeometry(0.07,1);const pp=peb.attributes.position;for(let i=0;i<pp.count;i++){const v=new V3(pp.getX(i),pp.getY(i),pp.getZ(i));v.multiplyScalar(0.8+0.4*hash2(Math.round(v.x*50),Math.round(v.y*50+v.z*30)));pp.setXYZ(i,v.x,v.y*0.6,v.z);}peb.computeVertexNormals();colorize(peb,0xffffff,0);
  scatter(peb,MATS.pebble,4200*S,(x,z)=>{const w=zoneW(zu(x,z));const q=streamQ(x,z);let a=w[0]*0.25+(q.d<1.3?0.9:0)+(pondD(x,z)<1.4&&pondD(x,z)>0.6?0.6:0)+(Math.hypot(x-POOL.x,z-POOL.z)<2?0.8:0);return a;},{s:[0.5,1.8],y:0.01,col:(x,z)=>{const w=zoneW(zu(x,z));return new Col().setHSL(0.08,w[0]*0.3+0.08,rand(0.35,0.6));}});
  const lit=new Mesher();addLeaf(lit,new V3(-0.08,0.012,0),0,{len:0.17,wid:0.1,lift:0.08,droop:1,fold:0.12,segs:3,flat:true,wind:0});const litG=lit.geo();
  const litM=new THREE.MeshStandardMaterial({map:TX.litter,alphaTest:0.45,side:THREE.DoubleSide,roughness:0.85});
  scatter(litG,litM,5200*S,(x,z)=>{const w=zoneW(zu(x,z));return inWater(x,z,-0.05)?0:w[3]*0.95+w[2]*0.25+w[1]*0.08;},{s:[0.7,1.5],col:()=>new Col().setHSL(rand(0.05,0.1),rand(0.3,0.55),rand(0.45,0.75))});
  const tw=new Mesher();addTube(tw,[new V3(-0.15,0.01,0),new V3(0,0.02,0.01),new V3(0.15,0.01,-0.01)],0.008,0.005,new Col(0x5a4632),4,1,0);const twG=tw.geo();
  scatter(twG,MATS.stem,900*S,(x,z)=>{const w=zoneW(zu(x,z));return inWater(x,z)?0:w[3]*0.7+w[1]*0.2+w[0]*0.15;},{s:[0.6,1.6],col:()=>new Col().setHSL(0.07,0.25,rand(0.5,0.8))});
  const dry=grassClusterGeo(new Col(0x7a6a44),new Col(0xdccb96),9,0.12,0.34);
  scatter(dry,MATS.blade,1300*S,(x,z)=>{const w=zoneW(zu(x,z));return w[0]*0.6*(1-smooth(0.3,0.9,Math.abs(Math.sin(x*0.42+z*0.28))));},{s:[0.8,1.6]});
  const gcM=new Mesher();for(let i=0;i<6;i++)addLeaf(gcM,new V3(0,0.01,0),i*1.05,{len:0.11,wid:0.07,lift:0.5,droop:3,segs:3,hr:0.2,wind:0.3});
  scatter(gcM.geo(),MATS.leafVar,1600*S,(x,z)=>{const w=zoneW(zu(x,z));return inWater(x,z,-0.05)?0:w[3]*0.8;},{s:[0.7,1.5],col:()=>new Col().setHSL(rand(0.25,0.32),0.3,rand(0.6,0.9))});
  const val=new Mesher();for(let b=0;b<6;b++)blade(val,rand(-0.05,0.05),rand(-0.05,0.05),rand(0.35,0.6),rand(0.05,0.2),0.012,rand(0,6.28),new Col(0x1f4a24),new Col(0x4f8a3a),5,0.6,1);
  scatter(val.geo(),MATS.blade,700*S,(x,z)=>pondD(x,z)<0.85?0.9:0,{s:[0.7,1.3],water:true});
})();

if(OCEAN)(function(){const S=Q.scatter;
  const peb=new THREE.IcosahedronGeometry(0.07,1);peb.scale(1,0.5,1);colorize(peb,0xffffff,0);
  scatter(peb,MATS.pebble,1300*S,(x,z)=>0.2+reefAt(x,z)*0.6,{s:[0.35,1.1],y:0.01,col:()=>new Col().setHSL(rand(0.05,0.12),rand(0.1,0.3),rand(0.45,0.8))});
  const sh=new Mesher();const pts=[],rad=[];for(let i=0;i<=24;i++){const t=i/24,th=t*9.4;const R=0.03*Math.exp(0.16*(th-9.4));pts.push(new V3(R*Math.cos(th),(1-t)*0.05,R*Math.sin(th)));rad.push(Math.max(0.002,R*0.8));}addTubeR(sh,pts,rad,WHITE,8,1,0,1);
  const shg=sh.geo();colorize(shg,0xf2e2c8,0.2);const shm=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.35,clearcoat:0.6});causticify(shm);
  scatter(shg,shm,500*S,(x,z)=>0.5-reefAt(x,z)*0.3,{s:[0.8,2],col:()=>new Col().setHSL(rand(0.02,0.1),rand(0.3,0.7),rand(0.6,0.9)),tilt:1.2});
  const rb=new THREE.CylinderGeometry(0.015,0.015,0.12,5);rb.rotateZ(Math.PI/2);colorize(rb,0xf4f0e6,0.2);
  scatter(rb,MATS.pebble,900*S,(x,z)=>reefAt(x,z)*0.9+0.1,{s:[0.6,1.6],y:0.01,col:()=>new Col().setHSL(0.08,0.1,rand(0.75,0.95))});})();
