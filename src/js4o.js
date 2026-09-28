
/* =================== ocean creature models =================== */
const CMO={};
if(OCEAN){const fm=(tex)=>new THREE.MeshPhysicalMaterial({map:tex,roughness:0.28,clearcoat:0.9,clearcoatRoughness:0.2,side:THREE.DoubleSide});
  CMO.damsel=fm(TX.damsel);CMO.clown=fm(TX.clown);CMO.grouper=fm(TX.grouper);CMO.moray=new THREE.MeshPhysicalMaterial({map:TX.moray,roughness:0.35,clearcoat:1,side:THREE.DoubleSide});TX.moray.wrapS=TX.moray.wrapT=THREE.RepeatWrapping;
  CMO.fin=c=>new THREE.MeshStandardMaterial({map:TX.fin,color:c,transparent:true,opacity:0.82,side:THREE.DoubleSide,depthWrite:false,roughness:0.4});
  CMO.jelly=new THREE.MeshPhysicalMaterial({color:0xd8ecf8,transparent:true,opacity:0.4,roughness:0.12,clearcoat:1,side:THREE.DoubleSide,depthWrite:false,emissive:0x3a8aff,emissiveIntensity:0});
  CMO.gonad=new THREE.MeshStandardMaterial({color:0xf0a0c8,transparent:true,opacity:0.8,emissive:0xff66cc,emissiveIntensity:0,depthWrite:false});
  CMO.line=new THREE.LineBasicMaterial({color:0xe8f4ff,transparent:true,opacity:0.5,depthWrite:false});}
const FISH={damsel:{L:0.22,R:0.045,FY:1.5,FZ:0.5,mat:'damsel',fin:0x3a7fff,tail:0xffd02a},clown:{L:0.2,R:0.046,FY:1.35,FZ:0.58,mat:'clown',fin:0xf07a1c,tail:0xf07a1c},grouper:{L:0.85,R:0.125,FY:1.15,FZ:0.72,mat:'grouper',fin:0xb8342a,tail:0xb8342a}};
const FIN_MATS={};function finMat(c){if(!FIN_MATS[c])FIN_MATS[c]=CMO.fin(c);return FIN_MATS[c];}
function shapeGeo(pts,sx,sy){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();const g=new THREE.ShapeGeometry(s,8);const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);uv.setXY(i,Math.min(1,Math.abs(x)),y*0.5+0.5);p.setXY(i,x*sx,y*sy);}return g;}
const FIN_GEO={tail:[[0,0],[-0.45,0.5],[-0.95,0.85],[-0.78,0.3],[-0.72,0],[-0.78,-0.3],[-0.95,-0.85],[-0.45,-0.5]],dorsal:[[0.3,0],[0.15,0.5],[-0.2,0.7],[-0.6,0.55],[-0.9,0.2],[-1,0]],pec:[[0,0.1],[-0.5,0.35],[-0.9,0.1],[-0.8,-0.15],[-0.3,-0.12]]};
function fishProf(F){return(t,p,o)=>{let r;if(t<0.08)r=lerp(0.3,0.82,t/0.08);else if(t<0.32)r=lerp(0.82,1,(t-0.08)/0.24);else if(t<0.82)r=lerp(1,0.3,(t-0.32)/0.5);else r=lerp(0.3,0.16,(t-0.82)/0.18);o.r=r*F.R*(p?p.s:1);o.fy=F.FY;o.fz=F.FZ;};}
function buildFish(kind){const F=FISH[kind],root=new THREE.Group();const body=new SpineBody(14,12,fishProf(F),CMO[F.mat],null,1);root.add(body.mesh);const R=F.R;
  const tail=new THREE.Mesh(shapeGeo(FIN_GEO.tail,R*2.4,R*2.3*F.FY*0.8),finMat(F.tail));const dorsal=new THREE.Mesh(shapeGeo(FIN_GEO.dorsal,R*4.2,R*1.1*F.FY),finMat(F.fin));
  const pecL=new THREE.Mesh(shapeGeo(FIN_GEO.pec,R*1.6,R*0.9),finMat(F.fin)),pecR=pecL.clone();const anal=new THREE.Mesh(shapeGeo(FIN_GEO.dorsal,R*2.4,R*0.8*F.FY),finMat(F.fin));
  const eyes=mm([sph(R*0.2,0x0a0a0a,[0,0,R*F.FZ*0.75]),sph(R*0.2,0x0a0a0a,[0,0,-R*F.FZ*0.75]),sph(R*0.27,0xe8e0c0,[-R*0.02,0,R*F.FZ*0.7]),sph(R*0.27,0xe8e0c0,[-R*0.02,0,-R*F.FZ*0.7])],CM.eye);
  root.add(tail,dorsal,pecL,pecR,anal,eyes);return{root,body,tail,dorsal,pecL,pecR,anal,eyes,F,pts:Array.from({length:14},()=>new V3())};}
const _f=new V3(),_s=new V3(),_bm=new THREE.Matrix4();
function placeOn(obj,B,i,off){_bm.makeBasis(B.T[i],B.Uv[i],B.S[i]);obj.quaternion.setFromRotationMatrix(_bm);obj.position.copy(B.C[i]);if(off)obj.position.addScaledVector(B.Uv[i],off);}
function fishAnim(a,dt){const m=a.m,F=m.F,L=F.L*a.scale;const cp=Math.cos(a.pitch||0);_f.set(Math.cos(a.h)*cp,Math.sin(a.pitch||0),Math.sin(a.h)*cp);_s.set(-Math.sin(a.h),0,Math.cos(a.h));
  a.wph=(a.wph||0)+dt*(3+Math.min(3,a.speed||0)*14);const amp=0.08+Math.min(0.12,(a.speed||0)*0.1);
  for(let i=0;i<14;i++){const t=i/13;const lat=Math.sin(a.wph-t*4.5)*amp*(0.12+t*t)*L;m.pts[i].set(a.x-_f.x*t*L+_s.x*lat,a.y-_f.y*t*L,a.z-_f.z*t*L+_s.z*lat);}
  m.body.prof=fishProf(F);m.body.update(m.pts,{s:a.scale});const B=m.body,R=F.R*a.scale;
  placeOn(m.tail,B,13);m.tail.rotateY(Math.sin(a.wph-4.5)*0.3);m.tail.scale.setScalar(a.scale);
  placeOn(m.dorsal,B,5,R*F.FY*0.85);m.dorsal.scale.setScalar(a.scale);placeOn(m.anal,B,8,-R*F.FY*0.7);m.anal.rotateX(Math.PI);m.anal.scale.setScalar(a.scale);
  placeOn(m.pecL,B,3);m.pecL.position.addScaledVector(B.S[3],R*F.FZ*0.9);m.pecL.rotateX(-1.2-Math.sin(a.ph*9)*0.3);m.pecL.scale.setScalar(a.scale);
  placeOn(m.pecR,B,3);m.pecR.position.addScaledVector(B.S[3],-R*F.FZ*0.9);m.pecR.rotateX(1.2+Math.sin(a.ph*9)*0.3);m.pecR.scale.setScalar(a.scale);
  placeOn(m.eyes,B,1,R*F.FY*0.18);m.eyes.scale.setScalar(a.scale);}
function buildMoray(){const root=new THREE.Group();const body=new SpineBody(50,10,(t,p,o)=>{let r;if(t<0.05)r=lerp(0.03,0.058,t/0.05);else if(t<0.8)r=0.062;else r=lerp(0.062,0.008,(t-0.8)/0.2);o.r=r*(p?p.s:1);o.fy=1.25;o.fz=0.8;},CMO.moray,null,3);root.add(body.mesh);
  const eyes=mm([sph(0.011,0x0a0a0a,[0,0,0.04]),sph(0.011,0x0a0a0a,[0,0,-0.04])],CM.eye);root.add(eyes);return{root,body,eyes,pts:Array.from({length:50},()=>new V3())};}
function buildShrimp(){const root=new THREE.Group();const P=[],red=0xd8402a,wh=0xf6f0e6;
  for(let k=0;k<8;k++){const t=k/7,x=0.08-t*0.17,y=0.035+Math.sin(t*Math.PI)*0.02,r=0.024*(1-t*0.55);P.push(sph(r,k%2?red:0xe85a3a,[x,y,0],[0.9,1,0.85],10,8,(x2,y2,z2,c)=>{if(y2>r*0.55&&Math.abs(z2)<r*0.35)c.set(wh);}));}
  for(const an of[-0.7,0,0.7])P.push(sph(0.02,red,[-0.1,0.035,Math.sin(an)*0.02],[1.4,0.2,0.7]));
  P.push(seg([0.1,0.045,0],[0.14,0.05,0],0.004,0.001,red,4),sph(0.007,0x111111,[0.095,0.05,0.014]),sph(0.007,0x111111,[0.095,0.05,-0.014]));
  for(const s of[1,-1])for(let k=0;k<5;k++){const x=0.06-k*0.02;P.push(seg([x,0.025,s*0.01],[x+0.005,0,s*0.032],0.003,0.002,wh,3));}
  root.add(mm(P,CM.chitin));const ant=new THREE.Group();ant.position.set(0.1,0.05,0);ant.add(mm([seg([0,0,0.006],[0.12,0.08,0.05],0.0018,0.001,wh,3),seg([0.12,0.08,0.05],[0.24,0.06,0.1],0.0012,0.0008,wh,3),seg([0,0,-0.006],[0.12,0.08,-0.05],0.0018,0.001,wh,3),seg([0.12,0.08,-0.05],[0.24,0.06,-0.1],0.0012,0.0008,wh,3)],CM.soft));root.add(ant);
  return{root,ant};}
function buildCrab(){const root=new THREE.Group(),top=0xd4502a,und=0xf0c8a0;
  root.add(mm([sph(0.09,top,[0,0.065,0],[0.75,0.42,1.15],18,12,(x,y,z,c)=>{if(y<0)c.set(und);else if(hash2(x*300,z*300)>0.85)c.multiplyScalar(0.7);}),seg([0.05,0.08,0.025],[0.07,0.12,0.03],0.005,0.004,top,4),seg([0.05,0.08,-0.025],[0.07,0.12,-0.03],0.005,0.004,top,4),sph(0.01,0x111111,[0.07,0.125,0.03]),sph(0.01,0x111111,[0.07,0.125,-0.03])],CM.chitin));
  const claws=[];for(const s of[1,-1]){const g=new THREE.Group();g.position.set(0.05,0.06,s*0.07);g.add(mm([seg([0,0,0],[0.05,0.01,s*0.05],0.013,0.011,top,6),seg([0.05,0.01,s*0.05],[0.09,0.02,s*0.06],0.012,0.012,top,6),sph(0.032,top,[0.115,0.02,s*0.065],[1.5,0.8,0.9]),seg([0.15,0.03,s*0.065],[0.19,0.02,s*0.06],0.008,0.003,0x3a1a10,4),seg([0.15,0.01,s*0.065],[0.185,0.0,s*0.06],0.007,0.003,0x3a1a10,4)],CM.chitin));root.add(g);claws.push(g);}
  const legs=[];for(const s of[1,-1])for(let k=0;k<4;k++){const piv=new THREE.Group();piv.position.set(0.025-k*0.03,0.055,s*0.085);piv.add(mm([seg([0,0,0],[-0.01,0.035,s*0.08],0.008,0.006,top,5),seg([-0.01,0.035,s*0.08],[-0.02,-0.055,s*0.13],0.006,0.003,top,5)],CM.chitin));root.add(piv);legs.push({piv,k,s});}
  return{root,claws,legs};}
function buildStar(){const col=pick([0xe2663a,0xd04a6a,0x3a6ad0,0xe8a23a]);const P=[sph(0.045,col,[0,0.016,0],[1,0.4,1])];
  for(let k=0;k<5;k++){const g=sph(0.045,col,[0,0,0],[2.7,0.38,0.8],12,8,(x,y,z,c)=>{if(y>0&&hash2(x*300,z*300)>0.75)c.lerp(new Col(0xfff0d0),0.6);});g.translate(0.11,0.013,0);g.rotateY(k/5*6.283);P.push(g);}
  const root=new THREE.Group();root.add(mm(P,CM.chitin));return{root};}
function buildUrchin(){const P=[sph(0.06,0x3a1a3a,[0,0.05,0],[1,0.8,1],14,10)];const n=90;for(let i=0;i<n;i++){const y=1-i/(n-1)*1.3,r=Math.sqrt(Math.max(0,1-y*y)),th=i*2.39996;const d=new V3(Math.cos(th)*r,y,Math.sin(th)*r);const p0=new V3(0,0.05,0).addScaledVector(d,0.05);P.push(seg(p0,p0.clone().addScaledVector(d,rand(0.08,0.13)),0.004,0.0006,0x5a2a6a,3));}
  const root=new THREE.Group();root.add(mm(P,CM.chitin));return{root};}
function buildJelly(){const root=new THREE.Group();const pts=[];for(let i=0;i<=14;i++){const t=i/14,a=t*Math.PI/2;pts.push(new V2(Math.max(0.002,0.2*Math.sin(a)*(1+0.08*(1-t))),0.13*Math.cos(a)));}
  const bell=new THREE.Mesh(new THREE.LatheGeometry(pts,32),CMO.jelly);bell.renderOrder=6;root.add(bell);
  for(let k=0;k<4;k++){const t=new THREE.Mesh(new THREE.TorusGeometry(0.035,0.008,6,16,Math.PI*1.6),CMO.gonad);t.rotation.set(Math.PI/2,0,k*Math.PI/2);t.position.set(Math.cos(k*Math.PI/2)*0.05,0.07,Math.sin(k*Math.PI/2)*0.05);bell.add(t);}
  const M=new Mesher();for(let k=0;k<4;k++){const a=k/4*6.283+0.4;blade(M,Math.cos(a)*0.02,Math.sin(a)*0.02,0.28,0.15,0.03,a,new Col(0xf0e0f0),new Col(0xd8c8e8),6,1,0);}const arms=new THREE.Mesh(M.geo(),CMO.jelly);arms.rotation.x=Math.PI;root.add(arms);
  const NT=48,tpos=new Float32Array(NT*3*2*3);const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tpos,3));const tent=new THREE.LineSegments(tg,CMO.line);tent.frustumCulled=false;root.add(tent);
  return{root,bell,arms,tent,tpos,NT};}
