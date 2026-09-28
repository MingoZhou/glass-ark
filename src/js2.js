
/* =================== renderer / scene =================== */
setMsg('准备渲染器…');await tick();
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=Q.shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const BG_DAY=new Col(0x18211d),BG_NIGHT=new Col(0x05080a);
scene.background=new Col(0x121914);scene.fog=new THREE.Fog(0x121914,70,160);
const camera=new THREE.PerspectiveCamera(36,1,0.02,320);
setMsg('绘制纹理…');await tick();
buildTextures();if(OCEAN)buildOceanTextures();
try{const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(renderer),0.04).texture;}catch(e){console.warn('env',e);}
scene.environmentIntensity=0.6;

/* =================== world constants =================== */
const HW=18,HD=11,W=36,D=22,TOP=12.5,BOT=-2.6,DAY=180;
const ZONES=OCEAN?[{key:'grass',name:'海草床',color:'#a7a676',cx:-13},{key:'sand',name:'沙地',color:'#dccba0',cx:-4.5},{key:'flat',name:'礁坪',color:'#8fb0a8',cx:3},{key:'reef',name:'礁石区',color:'#b3657f',cx:12.5}]:[{key:'desert',name:'沙漠',color:'#d8b67e',cx:-13},{key:'meadow',name:'草甸',color:'#9dba58',cx:-4.5},{key:'marsh',name:'溪沼',color:'#76aa9c',cx:3},{key:'jungle',name:'雨林',color:'#56984a',cx:12.5}];
const ZB=[-8,-1,7];
function zu(x,z){if(MODE.zone!=null)return ZONES[MODE.zone].cx;return x+(fbm(z*0.11+11.3,4.7,3)-0.5)*5+(fbm(x*0.07+1.7,z*0.07+3.1,2)-0.5)*2.4;}
function zoneW(u){const s0=smooth(ZB[0]-1.1,ZB[0]+1.1,u),s1=smooth(ZB[1]-1.1,ZB[1]+1.1,u),s2=smooth(ZB[2]-1.1,ZB[2]+1.1,u);return[1-s0,s0*(1-s1),s1*(1-s2),s2];}
function zoneAt(x,z){const u=zu(x,z);return u<ZB[0]?0:u<ZB[1]?1:u<ZB[2]?2:3;}
const POND={x:2.8,z:2.4,r:4.3*(MODE.pond||1)};const WT=TOP-0.7;
function pondR(a){return POND.r*(1+0.36*(fbm(Math.cos(a)*1.4+5,Math.sin(a)*1.4+5,3)-0.5));}
function pondD(x,z){if(!MODE.pond)return 99;const dx=x-POND.x,dz=z-POND.z;return Math.hypot(dx,dz)/pondR(Math.atan2(dz,dx));}
const POOL={x:10.8,z:-9.55,r:1.25};
const STREAM=[[10.8,-9.4],[10.3,-7.8],[9.2,-6],[7.9,-4.3],[6.6,-2.6],[5.6,-1.0]].map(p=>new V2(p[0],p[1]));
const SY0=3.4,POND_BASE=0.35;
const segL=[];let streamLen=0;for(let i=0;i<STREAM.length-1;i++){const l=STREAM[i].distanceTo(STREAM[i+1]);segL.push(l);streamLen+=l;}
function streamQ(x,z){if(!MODE.stream)return{d:99,s:0};let best=1e9,bs=0,acc=0;for(let i=0;i<STREAM.length-1;i++){const a=STREAM[i],b=STREAM[i+1],abx=b.x-a.x,abz=b.y-a.y;const t=clamp(((x-a.x)*abx+(z-a.y)*abz)/(abx*abx+abz*abz),0,1);const d=Math.hypot(x-(a.x+abx*t),z-(a.y+abz*t));if(d<best){best=d;bs=(acc+segL[i]*t)/streamLen;}acc+=segL[i];}return{d:best,s:bs};}
const streamY=s=>lerp(SY0,POND_BASE+0.06,Math.pow(s,0.75));
function reefAt(x,z){return smooth(2,9,x-z*0.4+(fbm(z*0.2,1.7,3)-0.5)*5);}
function rawHOcean(x,z){const n=fbm(x*0.1+3,z*0.1+8,4);let h=0.45+n*0.9+0.05*Math.sin(x*2.3+z*0.8+n*6)*(1-reefAt(x,z));h+=reefAt(x,z)*(0.6+1.8*fbm(x*0.25+9,z*0.25,4));h+=Math.pow(smooth(-3,-HD,z),1.5)*2.6;h-=smooth(-2,-14,x)*smooth(-3,6,z)*0.4;return h;}
function rawH(x,z){if(OCEAN)return rawHOcean(x,z);
  const u=zu(x,z),w=zoneW(u),n=fbm(x*0.12+5.1,z*0.12+7.3,4);
  const dv=Math.sin(x*0.42+z*0.28+fbm(x*0.16,z*0.16,3)*5);
  const desert=1.25+0.55*Math.pow(1-Math.abs(dv),1.6)+n*1.1+0.035*Math.sin(x*5.5+z*1.8+n*6);
  const meadow=0.95+n*1.15,marsh=0.6+n*0.55,jungle=1.2+fbm(x*0.17+2,z*0.17+9,4)*2.6;
  let h=w[0]*desert+w[1]*meadow+w[2]*marsh+w[3]*jungle;
  h+=Math.pow(smooth(-2.5,-HD,z),1.6)*(2.2+2.2*fbm(x*0.09+4,2.2,3));
  h-=smooth(6,HD,z)*0.35;
  const dp=pondD(x,z);if(dp<1.5)h=lerp(-0.85,h,smooth(0.45,1.5,dp));
  const dq=Math.hypot(x-POOL.x,z-POOL.z)/POOL.r;if(dq<1.7)h=Math.min(h,lerp(SY0-0.8,Math.max(h,SY0+0.35),smooth(0.55,1.4,dq)));
  const q=streamQ(x,z);
  if(q.d<2.4){const ys=streamY(q.s),bed=ys-0.32;const bank=Math.max(h,ys+0.3*(1-smooth(0.9,2.4,q.d)));const ch=lerp(bed,bank,smooth(0.3,0.72,q.d));h=(dp<1.3||dq<1.2)?Math.min(h,ch):ch;}
  return Math.max(h,-1);
}
setMsg('生成地形…');await tick();
const GX=360,GZ=220,GR=GX+1,HG=new Float32Array(GR*(GZ+1));
for(let j=0;j<=GZ;j++)for(let i=0;i<=GX;i++)HG[j*GR+i]=rawH(-HW+i*W/GX,-HD+j*D/GZ);
function heightAt(x,z){const fx=(x+HW)/W*GX,fz=(z+HD)/D*GZ;const i=clamp(Math.floor(fx),0,GX-1),j=clamp(Math.floor(fz),0,GZ-1);const tx=clamp(fx-i,0,1),tz=clamp(fz-j,0,1);
  const a=HG[j*GR+i],b=HG[j*GR+i+1],c=HG[(j+1)*GR+i],d=HG[(j+1)*GR+i+1];return lerp(lerp(a,b,tx),lerp(c,d,tx),tz);}
function slopeAt(x,z){const e=0.2;return Math.hypot(heightAt(x+e,z)-heightAt(x-e,z),heightAt(x,z+e)-heightAt(x,z-e))/(2*e);}
const OBST=[];
function blocked(x,z,m){for(const o of OBST){const dx=x-o.x,dz=z-o.z,r=o.r+(m||0);if(dx*dx+dz*dz<r*r)return o;}return null;}

/* =================== env state (needed by world) =================== */
const env={time:0.28,day:1,speed:1,o2:21.0,co2:470,coins:150,lamp:false,pump:true,vent:0,pond:0.7,algae:0.2,heat:0,
  light:0,daylight:0,sunH:0,waterY:0.3,P:0,R:0,turfP:0,plantP:0,plantR:0,score:0,excite:0,balanceDays:0,dayOk:true,rainZone:[0,0,0,0],visit:0,
  zones:[{m:0.12,h:0.22,T:30,fert:0.35,mold:0},{m:0.45,h:0.48,T:24,fert:0.55,mold:0},{m:0.74,h:0.74,T:22,fert:0.6,mold:0},{m:0.74,h:0.82,T:25,fert:0.7,mold:0}],sal:35,nut:0.25,plank:0.45,temp:25};
env.pump=!!(MODE.stream||OCEAN);if(OCEAN)env.zones.forEach(z=>{z.m=0;z.h=0;z.T=25;});else if(MODE.zone!=null){const Z0=env.zones[MODE.zone];env.zones.forEach(z=>Object.assign(z,{m:Z0.m,h:Z0.h,T:Z0.T,fert:Z0.fert}));}
const waterLevelY=()=>lerp(-0.2,0.5,clamp(env.pond,0,1));
env.waterY=waterLevelY();
function inPond(x,z,m){m=m||0;return pondD(x,z)<1.5&&heightAt(x,z)<env.waterY-m;}
function inStream(x,z,m){if(!env.pump)return false;const q=streamQ(x,z);if(q.d>0.6)return false;return heightAt(x,z)<streamY(q.s)-(m||0);}
function inPool(x,z,m){if(!MODE.stream)return false;return Math.hypot(x-POOL.x,z-POOL.z)<POOL.r*1.3&&heightAt(x,z)<SY0-(m||0);}
function inWater(x,z,m){return inPond(x,z,m)||inPool(x,z,m)||inStream(x,z,m);}
function waterSurf(x,z){if(inPond(x,z))return env.waterY;if(inPool(x,z))return SY0;const q=streamQ(x,z);return streamY(q.s);}
function surfaceY(x,z){const h=heightAt(x,z);return inWater(x,z)?Math.max(h,waterSurf(x,z)):h;}
function localMoist(x,z,zi){let m=env.zones[zi].m;const dp=pondD(x,z);if(dp<2&&env.pond>0.08)m+=0.32*(1-smooth(1,2,dp));if(env.pump){const q=streamQ(x,z);if(q.d<2)m+=0.3*(1-smooth(0.6,2,q.d));}return Math.min(1,m);}

/* =================== geometry helpers =================== */
class Mesher{constructor(){this.p=[];this.uv=[];this.c=[];this.w=[];this.i=[];}
  v(x,y,z,u,v,c,w){this.p.push(x,y,z);this.uv.push(u,v);this.c.push(c.r,c.g,c.b);this.w.push(w||0);return this.p.length/3-1;}
  q(a,b,c,d){this.i.push(a,b,c,a,c,d);} t(a,b,c){this.i.push(a,b,c);}
  get n(){return this.p.length/3;}
  geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('aWind',new THREE.Float32BufferAttribute(this.w,1));g.setIndex(this.i);g.computeVertexNormals();return g;}}
const _c=new Col();
function wk(y,hr,k){return Math.pow(clamp(y/hr,0,1.4),1.5)*(k==null?1:k);}
function addLeaf(M,base,yaw,o){const segs=o.segs||6,fx=Math.cos(yaw),fz=Math.sin(yaw),sx=-fz,sz=fx,st=o.len/segs,hw=o.wid/2,fold=o.fold||0,tint=o.tint||WHITE,hr=o.hr||1;
  let px=base.x,py=base.y,pz=base.z,el=o.lift,prev=null;const roll=o.roll||0,cr=Math.cos(roll),sr=Math.sin(roll);
  for(let k=0;k<=segs;k++){const t=k/segs;_c.copy(tint).multiplyScalar(o.flat?1:0.55+0.45*Math.min(1,t*1.8+0.1));const ww=wk(py,hr,o.wind);
    const ox=sx*hw*cr,oy=hw*sr,oz=sz*hw*cr;
    const a=M.v(px-ox,py-oy+fold*hw,pz-oz,0,t,_c,ww),m=M.v(px,py,pz,0.5,t,_c,ww),b=M.v(px+ox,py+oy+fold*hw,pz+oz,1,t,_c,ww);
    if(prev){M.q(prev[0],prev[1],m,a);M.q(prev[1],prev[2],b,m);}prev=[a,m,b];
    px+=Math.cos(el)*fx*st;pz+=Math.cos(el)*fz*st;py+=Math.sin(el)*st;el-=(o.droop||0)*st;}
  return new V3(px,py,pz);}
function addCard(M,p0,dir,side,len,wid,tint,hr,kw){const s=M.n;for(let k=0;k<=2;k++){const t=k/2;const c=p0.clone().addScaledVector(dir,len*t);for(let j=0;j<2;j++){const q=c.clone().addScaledVector(side,(j-0.5)*wid);M.v(q.x,q.y,q.z,j,t,tint,wk(q.y,hr,kw));}}M.q(s,s+1,s+3,s+2);M.q(s+2,s+3,s+5,s+4);}
function addDisc(M,c,nrm,R,cup,tint,hr,kw){const n=nrm.clone().normalize();const e1=new V3().crossVectors(n,Math.abs(n.y)<0.9?UP:new V3(1,0,0)).normalize(),e2=new V3().crossVectors(n,e1);const s=M.n,rings=3,seg=18;
  M.v(c.x,c.y+0.001,c.z,0.5,0.5,tint,wk(c.y,hr,kw));
  for(let r=1;r<=rings;r++){const rr=R*r/rings;for(let k=0;k<seg;k++){const a=k/seg*6.2832,ca=Math.cos(a),sa=Math.sin(a);const q=c.clone().addScaledVector(e1,ca*rr).addScaledVector(e2,sa*rr).addScaledVector(n,-cup*rr*rr/R);M.v(q.x,q.y,q.z,0.5+ca*0.5*r/rings,0.5+sa*0.5*r/rings,tint,wk(q.y,hr,kw));}}
  for(let k=0;k<seg;k++){M.t(s,s+1+k,s+1+(k+1)%seg);}
  for(let r=1;r<rings;r++){const o=s+1+(r-1)*seg,o2=o+seg;for(let k=0;k<seg;k++){const k2=(k+1)%seg;M.q(o+k,o2+k,o2+k2,o+k2);}}}
function addTubeR(M,pts,radii,col,rs,hr,kw,vs){const curve=new THREE.CatmullRomCurve3(pts);const n=Math.max(4,pts.length*4);const fr=curve.computeFrenetFrames(n,false);const s=M.n;
  for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),N=fr.normals[i],B=fr.binormals[i];const fi=t*(radii.length-1),i0=Math.floor(fi),r=lerp(radii[i0],radii[Math.min(radii.length-1,i0+1)],fi-i0);
    for(let j=0;j<=rs;j++){const a=j/rs*6.2832,ca=Math.cos(a),sa=Math.sin(a);const x=p.x+N.x*ca*r+B.x*sa*r,y=p.y+N.y*ca*r+B.y*sa*r,z=p.z+N.z*ca*r+B.z*sa*r;M.v(x,y,z,j/rs,t*(vs||1),col,wk(y,hr,kw));}}
  for(let i=0;i<n;i++)for(let j=0;j<rs;j++){const a=s+i*(rs+1)+j,b=a+rs+1;M.q(a,a+1,b+1,b);}}
function addTube(M,pts,r0,r1,col,rs,hr,kw,vs){addTubeR(M,pts,[r0,r1],col,rs,hr,kw,vs);}
function colorize(g,col,jit,fn){if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=p.count,arr=new Float32Array(n*3),base=new Col(col),c=new Col();jit=jit||0;
  for(let i=0;i<n;i++){c.copy(base);if(fn)fn(p.getX(i),p.getY(i),p.getZ(i),c,i);const k=1+(hash2(i*1.37,n)-0.5)*jit;arr[i*3]=c.r*k;arr[i*3+1]=c.g*k;arr[i*3+2]=c.b*k;}
  g.setAttribute('color',new THREE.BufferAttribute(arr,3));return g;}
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler();
function xf(g,p,r,s){_m4.compose(new V3(...(p||[0,0,0])),_q.setFromEuler(_e.set(...(r||[0,0,0]))),new V3(...(s||[1,1,1])));g.applyMatrix4(_m4);return g;}
function mergeG(parts){const keys=[];for(const p of parts)if(!keys.includes(p.m))keys.push(p.m);parts=parts.slice().sort((a,b)=>keys.indexOf(a.m)-keys.indexOf(b.m));
  let nv=0,ni=0;for(const p of parts){nv+=p.g.attributes.position.count;ni+=p.g.index?p.g.index.count:p.g.attributes.position.count;}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),col=new Float32Array(nv*3).fill(1),wd=new Float32Array(nv),idx=new Uint32Array(ni);
  const out=new THREE.BufferGeometry();let ov=0,oi=0,gs=0,cur=parts.length?parts[0].m:null;
  for(const p of parts){const g=p.g,A=g.attributes,n=A.position.count;if(!A.normal)g.computeVertexNormals();
    if(p.m!==cur){out.addGroup(gs,oi-gs,keys.indexOf(cur));gs=oi;cur=p.m;}
    pos.set(A.position.array.subarray(0,n*3),ov*3);nor.set(g.attributes.normal.array.subarray(0,n*3),ov*3);if(A.uv)uv.set(A.uv.array.subarray(0,n*2),ov*2);if(A.color&&A.color.itemSize===3)col.set(A.color.array.subarray(0,n*3),ov*3);if(A.aWind)wd.set(A.aWind.array.subarray(0,n),ov);
    if(g.index){const I=g.index.array;for(let k=0;k<I.length;k++)idx[oi+k]=I[k]+ov;oi+=I.length;}else{for(let k=0;k<n;k++)idx[oi+k]=ov+k;oi+=n;}ov+=n;}
  if(parts.length)out.addGroup(gs,oi-gs,keys.indexOf(cur));
  out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setAttribute('color',new THREE.BufferAttribute(col,3));out.setAttribute('aWind',new THREE.BufferAttribute(wd,1));
  out.setIndex(new THREE.BufferAttribute(idx,1));out.computeBoundingSphere();return{geo:out,keys};}

/* =================== materials =================== */
const U={uTime:{value:0},uWind:{value:1}};
const WIND_GLSL=`
vec4 _w0 = vec4(0.0,0.0,0.0,1.0);
#ifdef USE_INSTANCING
_w0 = instanceMatrix * _w0;
#endif
_w0 = modelMatrix * _w0;
float _ph = uTime*1.7 + _w0.x*0.35 + _w0.z*0.22;
float _gust = 0.55 + 0.45*sin(uTime*0.33 + _w0.x*0.05 + _w0.z*0.03);
float _sw = (sin(_ph)*0.7 + sin(_ph*2.3 + position.y*3.0)*0.3) * _gust;
transformed.x += aWind * _sw * uWind * 0.11;
transformed.z += aWind * cos(_ph*0.8 + 1.3) * uWind * 0.065 * _gust;
transformed.y -= aWind * abs(_sw) * uWind * 0.02;
transformed.xyz += aWind * vec3(sin(uTime*7.0 + position.x*23.0), 0.0, cos(uTime*6.3 + position.z*19.0)) * 0.006 * uWind;`;
function wind(m){m.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;sh.uniforms.uWind=U.uWind;sh.vertexShader='attribute float aWind;\nuniform float uTime;\nuniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+WIND_GLSL);};m.customProgramCacheKey=()=>'wind2';return m;}
const MATS={};
function mkMats(){
  const leaf=(tex,o)=>{tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;return wind(new THREE.MeshStandardMaterial(Object.assign({map:tex,alphaTest:0.42,side:THREE.DoubleSide,vertexColors:true,roughness:0.62,metalness:0},o||{})));};
  for(const k of['leafBroad','leafVar','litter','monstera','aloe','brom','reed','dand','fern','clover','lily','daisy','dandF','lilyPetal','foxHead'])MATS[k]=leaf(TX[k]);
  MATS.puff=leaf(TX.puff,{alphaTest:0.25,roughness:0.9});
  TX.cosmos.forEach((t,i)=>MATS['cosmos'+i]=leaf(t));
  MATS.blade=wind(new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:0.72}));
  MATS.stem=wind(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.7}));
  TX.bark.repeat.set(1,1);MATS.bark=wind(new THREE.MeshStandardMaterial({map:TX.bark,normalMap:TX.barkN,vertexColors:true,roughness:0.95}));
  MATS.barrel=new THREE.MeshStandardMaterial({map:TX.barrel,vertexColors:true,roughness:0.55});
  MATS.column=new THREE.MeshStandardMaterial({map:TX.column,vertexColors:true,roughness:0.55});
  MATS.succ=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.42,clearcoat:0.35,clearcoatRoughness:0.5});
  MATS.moss=wind(new THREE.MeshStandardMaterial({map:TX.moss,vertexColors:true,roughness:1}));
  MATS.fungus=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.5,clearcoat:0.4});
  MATS.rock=new THREE.MeshStandardMaterial({map:TX.rock,normalMap:TX.rockN,normalScale:new V2(1.2,1.2),vertexColors:true,roughness:0.92});
  MATS.pebble=new THREE.MeshStandardMaterial({map:TX.rock,vertexColors:true,roughness:0.55});
}
mkMats();

/* =================== lights =================== */
const hemi=new THREE.HemisphereLight(0xd6e8ff,0x3a2e1f,0.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,3);sun.castShadow=true;sun.shadow.mapSize.set(Q.shadow,Q.shadow);
Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:120});sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias=-0.0003;sun.shadow.normalBias=0.03;scene.add(sun,sun.target);
const moon=new THREE.DirectionalLight(0x8aa6ff,0);moon.position.set(-14,24,10);scene.add(moon);
const lampLight=new THREE.SpotLight(0xfff0dc,0,0,1.15,0.7,2);lampLight.position.set(0,TOP+1,0);lampLight.target.position.set(0,0,0);scene.add(lampLight,lampLight.target);
const heatLight=new THREE.SpotLight(0xffa860,0,0,0.5,0.6,2);scene.add(heatLight,heatLight.target);
const flyLights=[0,1,2].map(()=>{const l=new THREE.PointLight(0xc8ff70,0,3,2);scene.add(l);return l;});

/* =================== terrain =================== */
const tank=new THREE.Group();scene.add(tank);
const ST=QK==='high'?1:2;
const TW=GX/ST+1,TH=GZ/ST+1;
let terrain,tBase,tZW;
(function(){const n=TW*TH,pos=new Float32Array(n*3),col=new Float32Array(n*3),uv=new Float32Array(n*2);tBase=new Float32Array(n*3);tZW=new Float32Array(n*4);
  const Z=[new Col(0xcfae7c),new Col(0x6b7a3a),new Col(0x55602f),new Col(0x3b2d1f)];const c=new Col(),t=new Col();
  const sand2=new Col(0xe6cd9e),red=new Col(0xb0744c),grassy=new Col(0x71883a),dirt=new Col(0x7c6446),mud=new Col(0x3a3222),moss=new Col(0x4c7a2c),soil2=new Col(0x4a3726),peb=new Col(0x6c6352),rockc=new Col(0x7a6a58);
  for(let j=0;j<TH;j++)for(let i=0;i<TW;i++){const gi=i*ST,gj=j*ST,k=j*TW+i,x=-HW+gi*W/GX,z=-HD+gj*D/GZ,y=HG[gj*GR+gi];
    pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;uv[k*2]=x/3;uv[k*2+1]=z/3;
    const w=zoneW(zu(x,z));tZW.set(w,k*4);
    c.setRGB(0,0,0);for(let q=0;q<4;q++){t.copy(Z[q]).multiplyScalar(w[q]);c.add(t);}
    const n1=fbm(x*0.6+1,z*0.6+2,3),n2=fbm(x*0.25+7,z*0.25+3,3);
    if(w[0]>0.05){const dv=Math.sin(x*0.42+z*0.28+fbm(x*0.16,z*0.16,3)*5);c.lerp(sand2,w[0]*0.55*Math.pow(1-Math.abs(dv),2));if(n2>0.6)c.lerp(red,w[0]*smooth(0.6,0.72,n2)*0.7);}
    if(w[1]>0.05){c.lerp(grassy,w[1]*smooth(0.35,0.6,n1)*0.8);if(n2<0.36)c.lerp(dirt,w[1]*0.6);}
    if(w[3]>0.05){if(n1>0.55)c.lerp(moss,w[3]*smooth(0.55,0.68,n1));else if(n2<0.4)c.lerp(soil2,w[3]*0.5);}
    const dp=pondD(x,z);if(dp<1.7)c.lerp(mud,smooth(1.7,1.0,dp)*0.85);if(dp<1.05)c.lerp(peb,0.5);
    const q=streamQ(x,z);if(q.d<1.2){c.lerp(peb,smooth(1.2,0.45,q.d)*0.8);}if(MODE.stream&&Math.hypot(x-POOL.x,z-POOL.z)<POOL.r*1.4)c.lerp(peb,0.6);
    const sl=Math.hypot(HG[gj*GR+Math.min(GX,gi+1)]-HG[gj*GR+Math.max(0,gi-1)],HG[Math.min(GZ,gj+1)*GR+gi]-HG[Math.max(0,gj-1)*GR+gi])/0.2;c.lerp(rockc,smooth(0.9,1.8,sl)*0.6);
    if(OCEAN)oceanColor(c,x,z,y,n1,n2);
    let avg=0;for(const [di,dj] of[[4,0],[-4,0],[0,4],[0,-4]])avg+=HG[clamp(gj+dj,0,GZ)*GR+clamp(gi+di,0,GX)];avg/=4;const ao=1-clamp((avg-y)*1.4,-0.1,0.35);c.multiplyScalar(ao*(0.92+hash2(i,j)*0.12));
    tBase[k*3]=c.r;tBase[k*3+1]=c.g;tBase[k*3+2]=c.b;col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  const idx=new Uint32Array((TW-1)*(TH-1)*6);let o=0;for(let j=0;j<TH-1;j++)for(let i=0;i<TW-1;i++){const a=j*TW+i,b=a+1,c2=a+TW,d=c2+1;idx[o++]=a;idx[o++]=c2;idx[o++]=b;idx[o++]=b;idx[o++]=c2;idx[o++]=d;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
  terrain=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:TX.detail,normalMap:TX.groundN,normalScale:new V2(0.9,0.9),roughness:0.96}));terrain.receiveShadow=true;tank.add(terrain);})();
function oceanColor(c,x,z,y,n1,n2){const rf=reefAt(x,z);c.set(0xcbb892).multiplyScalar(0.72+0.26*n1);const rip=Math.sin(x*2.3+z*0.8+n2*6);c.multiplyScalar(0.94+0.06*rip);
  if(rf>0.05){_c.set(0x7c7078).lerp(new Col(0xb3657f),smooth(0.5,0.65,n2)*0.8).lerp(new Col(0x6d5a86),smooth(0.62,0.7,n1)*0.6);c.lerp(_c,smooth(0.05,0.5,rf));}
  const w=zoneW(zu(x,z));if(w[0]>0.1)c.lerp(new Col(0x9a9a6a),w[0]*0.45*smooth(0.45,0.6,n1));c.lerp(new Col(0xb9a57c),smooth(0.5,-0.2,y)*0.4);}
function stampAO(x,z,r,k,undo){const i0=Math.max(0,Math.floor((x-r+HW)/W*GX/ST)),i1=Math.min(TW-1,Math.ceil((x+r+HW)/W*GX/ST)),j0=Math.max(0,Math.floor((z-r+HD)/D*GZ/ST)),j1=Math.min(TH-1,Math.ceil((z+r+HD)/D*GZ/ST));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const px=-HW+i*ST*W/GX,pz=-HD+j*ST*D/GZ,d=Math.hypot(px-x,pz-z)/r;if(d>=1)continue;let f=1-k*(1-d*d);if(undo)f=1/f;const kk=(j*TW+i)*3;tBase[kk]*=f;tBase[kk+1]*=f;tBase[kk+2]*=f;}}
function refreshTerrainWet(){const a=terrain.geometry.attributes.color.array,m=env.zones.map(z=>z.m),n=a.length/3;
  for(let k=0;k<n;k++){const o=k*4,wet=tZW[o]*m[0]*1.3+tZW[o+1]*m[1]+tZW[o+2]*m[2]*0.75+tZW[o+3]*m[3]*0.7,f=1-0.32*clamp(wet,0,1);a[k*3]=tBase[k*3]*f;a[k*3+1]=tBase[k*3+1]*f;a[k*3+2]=tBase[k*3+2]*(f+0.025*wet);}
  terrain.geometry.attributes.color.needsUpdate=true;}

/* substrate layers seen through the glass */
(function(){const M=new Mesher(),N=180,clay=new Col(0xa65a32),mesh=new Col(0x222624),deep=new Col(0x2f2118),soil=new Col(0x4a3423),t=new Col();
  const edges=[s=>[-HW+s*W,HD-0.002],s=>[-HW+0.002,HD-s*D],s=>[HW-0.002,-HD+s*D]];
  for(const E of edges){for(let i=0;i<N;i++){const [x0,z0]=E(i/N),[x1,z1]=E((i+1)/N),t0=heightAt(x0,z0),t1=heightAt(x1,z1);const zc0=OCEAN?new Col(0xd8c79c):new Col(0xcfae7c).lerp(new Col(0x3b2d1f),clamp((zu(x0,z0)+8)/16,0,1));const u0=(x0+z0)/2,u1=(x1+z1)/2;
      const band=(ya0,ya1,yb0,yb1,cA,cB)=>{const s=M.n;M.v(x0,ya0,z0,u0,ya0/2,cA);M.v(x1,yb0,z1,u1,yb0/2,cA);M.v(x1,yb1,z1,u1,yb1/2,cB);M.v(x0,ya1,z0,u0,ya1/2,cB);M.q(s,s+1,s+2,s+3);};
      band(BOT,-1.9,BOT,-1.9,clay,clay);band(-1.9,-1.8,-1.9,-1.8,mesh,mesh);band(-1.8,t0-0.35,-1.8,t1-0.35,deep,soil);band(t0-0.35,t0,t1-0.35,t1,t.copy(zc0).multiplyScalar(0.6).clone(),zc0);}}
  const m=new THREE.Mesh(M.geo(),new THREE.MeshStandardMaterial({vertexColors:true,map:TX.soil,roughness:1,side:THREE.DoubleSide}));tank.add(m);
  const cnt=Math.floor(3200*Q.scatter),ball=new THREE.IcosahedronGeometry(0.1,1),inst=new THREE.InstancedMesh(ball,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.85}),cnt),d=new THREE.Object3D(),cc=new Col();
  for(let i=0;i<cnt;i++){const s=Math.random()*(W+2*D);let x,z;if(s<W){x=-HW+s;z=HD-0.07;}else if(s<W+D){x=-HW+0.07;z=-HD+(s-W);}else{x=HW-0.07;z=-HD+(s-W-D);}
    d.position.set(x,rand(BOT+0.08,-1.97),z);d.scale.setScalar(rand(0.65,1.2));d.rotation.set(rand(0,3),rand(0,3),0);d.updateMatrix();inst.setMatrixAt(i,d.matrix);inst.setColorAt(i,cc.setHSL(rand(0.04,0.07),rand(0.45,0.6),rand(0.28,0.42)));}
  tank.add(inst);})();

/* back cliff */
setMsg('堆砌岩壁…');await tick();
function cliffRel(x,y){const w=zoneW(zu(x,-HD));const n=fbm(x*0.28,y*0.28,4),m=fbm(x*1.1+3,y*1.1,3);const strata=y*1.5+fbm(x*0.12,y*0.1,2)*3;const fr=strata-Math.floor(strata);
  let rel=0.35+n*1.1+m*0.25+(1-fr)*0.22*(w[0]+w[1]*0.6+0.4);if(Math.abs(x-POOL.x)<0.7&&y>SY0-0.5&&y<LIP_Y+0.2)rel-=0.4*(1-Math.abs(x-POOL.x)/0.7);return rel*(smooth(-0.8,1.2,y)*0.8+0.2);}
const LIP_Y=7.4;
const topY=x=>OCEAN?9.6+fbm(x*0.35+7,1.3,3)*1.6:MODE.zone!=null?[8.2,9,9.6,10.6][MODE.zone]+fbm(x*0.35+7,1.3,3)*1.2:lerp(8.2,10.8,smooth(-12,4,x))+fbm(x*0.35+7,1.3,3)*1.2;
(function(){const g=new THREE.PlaneGeometry(W+0.3,12,240,80);g.translate(0,5,0);const p=g.attributes.position,uv=g.attributes.uv,cols=new Float32Array(p.count*3);const c=new Col(),t=new Col();
  const sand=new Col(0xc7a070),sand2=new Col(0x9a6a45),bas=new Col(0x5a5048),cork=new Col(0x5b4231),mossC=new Col(0x4a7a2a);
  for(let i=0;i<p.count;i++){const x=p.getX(i);let y=p.getY(i);const ty=topY(x);if(y>ty)y=ty;
    const w=zoneW(zu(x,-HD));const m=fbm(x*1.1+3,y*1.1,3);
    const strata=y*1.5+fbm(x*0.12,y*0.1,2)*3;const fr=strata-Math.floor(strata);
    const rel=cliffRel(x,y);
    p.setY(i,y);p.setZ(i,rel);uv.setXY(i,x/3,y/3);
    c.copy(cork).lerp(bas,w[2]+w[3]*0.7).multiplyScalar(0.75+0.5*m);
    t.copy(sand).lerp(sand2,0.5+0.5*Math.sin(strata*6.283*0.5));c.lerp(t,w[0]+w[1]*0.4);
    if(fr<0.18&&w[3]+w[2]>0.3&&m>0.4)c.lerp(mossC,(w[3]+w[2]*0.5)*0.9);
    if(w[3]>0.4&&fbm(x*0.7+9,y*0.7,3)>0.55)c.lerp(mossC,0.7*w[3]);
    if(OCEAN){c.set(0x5d5560).multiplyScalar(0.7+0.6*m);if(fbm(x*0.5+3,y*0.5,3)>0.55)c.lerp(new Col(0xc06a88),0.8);if(fbm(x*0.9,y*0.9+5,2)>0.62)c.lerp(new Col(0x7a4a8a),0.7);if(fbm(x*1.4+8,y*1.4,2)>0.64)c.lerp(new Col(0x4f7a40),0.6);}
    cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;}
  g.setAttribute('color',new THREE.BufferAttribute(cols,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,MATS.rock);m.position.z=-HD+0.02;m.receiveShadow=true;m.castShadow=false;tank.add(m);})();
/* hanging vines */
if(MODE.vines)(function(){const M=new Mesher(),MS=new Mesher(),stemC=new Col(0x4a5a2a);const vr=MODE.vines,nv=Math.round((18*Q.scatter+4)*(vr[1]-vr[0])/11*(MK==='marsh'?0.35:0.6));
  for(let v=0;v<nv;v++){const x=rand(vr[0],vr[1]),ty=topY(x)-0.1,len=rand(2.5,Math.min(8,ty-2)),z0=-HD+0.7;const pts=[];for(let k=0;k<=6;k++){const t=k/6;pts.push(new V3(x+Math.sin(t*3+v)*0.25,ty-len*t,z0+0.25*Math.sin(t*2.2+v)+t*0.5));}
    addTube(MS,pts,0.018,0.01,stemC,4,1,0);
    const curve=new THREE.CatmullRomCurve3(pts);for(let t=0.04;t<1;t+=rand(0.035,0.06)){const p=curve.getPointAt(t);const wv=t*1.2;const yaw=Math.PI/2+rand(-1.2,1.2);addLeaf(M,p,yaw,{len:rand(0.13,0.2),wid:rand(0.1,0.15),lift:rand(-0.6,0.2),droop:2,tint:new Col().setHSL(0.27,0.4,rand(0.55,0.8)),hr:1,wind:wv,segs:3});}}
  const g=M.geo();const aw=g.attributes.aWind;for(let i=0;i<aw.count;i++)aw.setX(i,Math.min(aw.getX(i),0.35));
  const m=new THREE.Mesh(g,MATS.leafVar);m.castShadow=true;m.receiveShadow=true;tank.add(m);const ms=new THREE.Mesh(MS.geo(),MATS.stem);tank.add(ms);})();

/* rocks */
function rockGeo(r,col,moss,seed,det){const g=new THREE.IcosahedronGeometry(1,det==null?4:det);const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){const v=new V3(p.getX(i),p.getY(i),p.getZ(i));const n=fbm(v.x*1.3+seed,v.y*1.3+v.z*0.9+seed,4)+0.3*fbm(v.x*4+seed,v.z*4+v.y*2,2);v.multiplyScalar(r*(0.7+0.55*n));p.setXYZ(i,v.x,v.y,v.z);uv.setXY(i,uv.getX(i)*r*1.6,uv.getY(i)*r*1.6);}
  g.computeVertexNormals();const nr=g.attributes.normal;return colorize(g,col,0.1,(x,y,z,c,i)=>{c.multiplyScalar(0.85+0.3*hash2(x*7+seed,z*7));if(moss&&nr.getY(i)>0.45&&fbm(x*2+seed,z*2,2)>0.35)c.lerp(new Col(0x4a7a2a),0.85);});}
function addRock(x,z,r,col,moss,sy,obst){const m=new THREE.Mesh(rockGeo(r,col,moss,rand(0,90)),MATS.rock);m.scale.set(1,sy||0.7,1);m.position.set(x,heightAt(x,z)-r*0.2,z);m.rotation.y=rand(0,6);m.castShadow=m.receiveShadow=true;tank.add(m);stampAO(x,z,r*1.5,0.35);if(obst!==false&&r>0.45)OBST.push({x,z,r:r*0.85});return m;}
[[-15.5,-7,2.2,0xb07a58,0.8],[-11,-8.6,1.5,0xb58563,0.9],[-16.3,6.5,1.1,0xa27052,0.7],[-9.5,5.8,0.7,0xb08060,0.7],[-13.4,1.2,0.55,0xa87a5a,0.6],[-6.5,-6.5,0.8,0x8a7a64,0.7],[-3.2,7.8,0.5,0x857563,0.6],
 [15.5,-7.5,1.7,0x6f716a,0.9,true],[16.6,5.5,1.1,0x676a63,0.8,true],[12.5,7.5,0.8,0x6a6c66,0.7,true],[9.6,1.6,0.6,0x707068,0.7,true],[13.8,-2.2,0.9,0x6a6a62,0.8,true],
 [7.4,6.2,0.45,0x77756c,0.6,true],[-1.2,3.9,0.4,0x807a6c,0.6,true],[6.2,-3.2,0.35,0x77756c,0.5,true],[8.7,-5.5,0.4,0x6f6e66,0.6,true],[10.1,-7.2,0.45,0x6f6e66,0.6,true],[11.6,-9.2,0.7,0x6a6a62,0.7,true]
].forEach(r=>{if(OCEAN)return;let col=r[3],moss=!!r[5];if(MODE.zone!=null){const zc=[[0xb07a58,false],[0x857563,false],[0x77756c,true],[0x6a6c66,true]][MODE.zone];col=zc[0];moss=zc[1];}addRock(r[0],r[1],r[2],col,moss,r[4]);});
const LIVE_ROCK=[0x8a6a7a,0x7a6a80,0x9a6a6a,0x6f6a78];function liveRockGeo(r,seed){const g=rockGeo(r,pick(LIVE_ROCK),false,seed);const nr=g.attributes.normal,cl=g.attributes.color,p=g.attributes.position;for(let i=0;i<cl.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);const f=fbm(x*2+seed,z*2+y,2);if(f>0.58)cl.setXYZ(i,0.72,0.3,0.42);else if(f<0.32&&nr.getY(i)>0.3)cl.setXYZ(i,0.3,0.45,0.28);}return g;}
function addLiveRock(x,z,r,sy){const m=new THREE.Mesh(liveRockGeo(r,rand(0,90)),MATS.rock);m.scale.set(1,sy||0.8,1);m.position.set(x,heightAt(x,z)-r*0.15,z);m.rotation.y=rand(0,6);m.castShadow=m.receiveShadow=true;tank.add(m);stampAO(x,z,r*1.5,0.3);OBST.push({x,z,r:r*0.85,top:m.position.y+r*(sy||0.8)});return m;}
if(OCEAN){[[12,-6,2.4,1],[15.5,1,1.8,0.9],[9,3.5,1.3,0.8],[14,6.5,1.1,0.8],[5,-4,1,0.7],[-2,-7,1.2,0.8],[-9,5,0.7,0.7],[-13,-5,0.9,0.7],[2,6,0.6,0.7],[7.5,-8.5,1.4,0.9]].forEach(r=>addLiveRock(...r));
  const M=new Mesher();const ap=[new V3(3.2,0,-1.5),new V3(4.2,2.2,-1.2),new V3(6.2,2.6,-0.8),new V3(7.4,0,-0.4)];ap[0].y=heightAt(3.2,-1.5)-0.2;ap[3].y=heightAt(7.4,-0.4)-0.2;addTubeR(M,ap,[0.75,0.5,0.45,0.7],WHITE,16,1,0,3);const ag=M.geo();colorize(ag,0x7a6a78,0.25,(x,y,z,c)=>{const f=fbm(x*1.5,z*1.5+y,2);if(f>0.55)c.set(0xb86a86);else if(f<0.35)c.set(0x5a7a4a);});const arch=new THREE.Mesh(ag,MATS.rock);arch.castShadow=arch.receiveShadow=true;tank.add(arch);OBST.push({x:3.3,z:-1.5,r:0.6,top:1.5},{x:7.3,z:-0.4,r:0.6,top:1.5});stampAO(3.3,-1.5,1.2,0.3);stampAO(7.3,-0.4,1.2,0.3);}
const HEATROCKS=[];const heatRock={x:-12.3,z:3.2,bulb:{material:{}},mesh:null};
const heatMat=new THREE.MeshStandardMaterial({map:TX.rock,normalMap:TX.rockN,vertexColors:true,roughness:0.85,emissive:0xff5a1c,emissiveIntensity:0.05});
function addHeatRock(hr,withLight){const heatRock=hr;const m=new THREE.Mesh(rockGeo(1.05,0x8d5b3d,false,7),heatMat);m.scale.set(1.2,0.3,0.95);m.position.set(heatRock.x,heightAt(heatRock.x,heatRock.z)-0.05,heatRock.z);m.castShadow=m.receiveShadow=true;tank.add(m);heatRock.y=m.position.y+0.3;heatRock.mesh=m;stampAO(heatRock.x,heatRock.z,1.6,0.3);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(0.45,24,12,0,6.283,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x202422,metalness:0.8,roughness:0.35,side:THREE.DoubleSide}));dome.position.set(heatRock.x,TOP-0.2,heatRock.z);tank.add(dome);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.16,16,10),new THREE.MeshStandardMaterial({color:0x221100,emissive:0xff9a40,emissiveIntensity:2}));bulb.position.set(heatRock.x,TOP-0.3,heatRock.z);tank.add(bulb);heatRock.bulb=bulb;
  if(withLight){heatLight.position.set(heatRock.x,TOP-0.4,heatRock.z);heatLight.target.position.set(heatRock.x,heatRock.y,heatRock.z);}HEATROCKS.push(heatRock);OBST.push(heatRock.obst={x:heatRock.x,z:heatRock.z,r:0.7,top:heatRock.y});heatRock.parts=[m,dome,bulb];return heatRock;}
if(MODE.heat)addHeatRock(heatRock,true);
/* logs */
if(MK==='mixed'||MK==='jungle')(function(){const M=new Mesher();const pts=[new V3(10.5,0,5.2),new V3(12,0,4.7),new V3(13.6,0,5.0),new V3(15.1,0,4.3)];pts.forEach(p=>p.y=heightAt(p.x,p.z)+0.22);
  addTube(M,pts,0.34,0.26,new Col(0xffffff),16,1,0,3);const g=M.geo();colorize(g,0xffffff,0.15,(x,y,z,c)=>{if(y>heightAt(x,z)+0.38&&fbm(x*3,z*3,2)>0.4)c.set(0x6a9a40);});
  const m=new THREE.Mesh(g,MATS.bark);m.castShadow=m.receiveShadow=true;tank.add(m);OBST.push({x:11.3,z:4.95,r:0.45},{x:12.8,z:4.85,r:0.45},{x:14.3,z:4.65,r:0.4});stampAO(12.8,4.8,1.2,0.3);
})();
if(MK==='mixed'||MK==='desert')(function(){
  const M2=new Mesher();const b=[new V3(-10.8,0,-1.8),new V3(-9.6,0,-1.2),new V3(-8.4,0,-1.5)];b.forEach(p=>p.y=heightAt(p.x,p.z)+0.08);addTube(M2,b,0.11,0.06,new Col(0xd8cbb8),8,1,0,2);
  const br=[new V3(-9.6,0,-1.2),new V3(-9.2,0.35,-0.7),new V3(-8.9,0.6,-0.2)];br.forEach(p=>p.y+=heightAt(p.x,p.z)+0.08);addTube(M2,br,0.06,0.02,new Col(0xd8cbb8),6,1,0,1);
  const m2=new THREE.Mesh(M2.geo(),MATS.bark);m2.castShadow=true;tank.add(m2);})();

/* water */
setMsg('注水…');await tick();
const waterMat=new THREE.MeshStandardMaterial({color:0x1d3b38,roughness:0.03,metalness:0,transparent:true,opacity:0.8,normalMap:TX.waterN,normalScale:new V2(0.28,0.28),envMapIntensity:1.5,depthWrite:false});
TX.waterN.repeat.set(4,4);
const water=new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.5,POND.r)*1.55,96),waterMat);water.rotation.x=-Math.PI/2;water.position.set(POND.x,env.waterY,POND.z);water.renderOrder=2;tank.add(water);
const flowTex=TX.waterN.clone();flowTex.needsUpdate=true;flowTex.repeat.set(1,1);
const streamMat=new THREE.MeshStandardMaterial({color:0x2a4a45,roughness:0.05,transparent:true,opacity:0.72,normalMap:flowTex,normalScale:new V2(0.45,0.45),envMapIntensity:1.5,depthWrite:false});
const NOOP=()=>{const o=new THREE.Object3D();return o;};
const pool=!MODE.stream?NOOP():new THREE.Mesh(new THREE.CircleGeometry(POOL.r*1.3,48),streamMat);pool.rotation.x=-Math.PI/2;pool.position.set(POOL.x,SY0,POOL.z);pool.renderOrder=2;tank.add(pool);
const streamMesh=!MODE.stream?NOOP():(function(){const curve=new THREE.SplineCurve(STREAM);const M=new Mesher();const n=80,wd=0.58;
  for(let i=0;i<=n;i++){const s=i/n,p=curve.getPointAt(s),tg=curve.getTangentAt(s),nx=-tg.y,nz=tg.x;const y=streamY(s)+0.015;for(let j=0;j<=4;j++){const f=(j/4-0.5)*2*wd;M.v(p.x+nx*f,y,p.y+nz*f,j/4,s*streamLen/2.5,WHITE);}}
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){const a=i*5+j,b=a+5;M.q(a,a+1,b+1,b);}
  const m=new THREE.Mesh(M.geo(),streamMat);m.renderOrder=2;tank.add(m);return m;})();
const fallTex=TX.fall;fallTex.repeat.set(1,2);
const fallMat=new THREE.MeshStandardMaterial({map:fallTex,color:0xe6f4f7,transparent:true,opacity:0.85,depthWrite:false,roughness:0.2,emissive:0x9ab8c2,emissiveIntensity:0.25,side:THREE.DoubleSide});
const fall=!MODE.stream?NOOP():(function(){const M=new Mesher();const n=24;for(let i=0;i<=n;i++){const t=i/n;const y=lerp(LIP_Y,SY0,Math.pow(t,1.25));const z=-HD+0.02+Math.max(cliffRel(POOL.x,y),cliffRel(POOL.x-0.3,y),cliffRel(POOL.x+0.3,y))+0.1+t*0.15;const wd=0.34+t*0.22;for(let j=0;j<=3;j++){const f=(j/3-0.5)*2*wd;M.v(POOL.x+f,y,z,j/3,t,WHITE);}}
  for(let i=0;i<n;i++)for(let j=0;j<3;j++){const a=i*4+j,b=a+4;M.q(a,a+1,b+1,b);}const m=new THREE.Mesh(M.geo(),fallMat);m.renderOrder=3;tank.add(m);return m;})();
if(MODE.stream)(function(){const pipe=new Mesher();const pts=[new V3(12.4,heightAt(12.4,-10.3),-10.3),new V3(12.3,4,-10.45),new V3(11.9,LIP_Y+0.1,-10.5),new V3(11.2,LIP_Y+0.05,-10.35)];addTube(pipe,pts,0.05,0.05,new Col(0x1c1f1e),8,1,0);
  const m=new THREE.Mesh(pipe.geo(),new THREE.MeshStandardMaterial({vertexColors:true,metalness:0.6,roughness:0.4}));tank.add(m);
  const box=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.35,0.35),new THREE.MeshStandardMaterial({color:0x202624,metalness:0.4,roughness:0.5}));box.position.set(12.4,heightAt(12.4,-10.3)+0.15,-10.25);box.castShadow=true;tank.add(box);})();

/* tank shell */
const glassMat=new THREE.MeshStandardMaterial({color:0xd4ece6,transparent:true,opacity:0.05,roughness:0.02,metalness:0,depthWrite:false,side:THREE.DoubleSide});
const sheenMat=new THREE.MeshStandardMaterial({color:0x000000,metalness:1,roughness:0.06,envMapIntensity:0.22,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const condPanes=[];
(function(){const H=TOP-BOT,yc=(TOP+BOT)/2;
  const defs=[{w:W,p:[0,yc,HD+0.04],r:0,side:'front'},{w:W,p:[0,yc,-HD-0.04],r:Math.PI,side:'back'},{w:D,p:[-HW-0.04,yc,0],r:-Math.PI/2,side:'left'},{w:D,p:[HW+0.04,yc,0],r:Math.PI/2,side:'right'}];
  for(const d of defs){const g=new THREE.PlaneGeometry(d.w,H);for(const mt of[glassMat,sheenMat]){const m=new THREE.Mesh(g,mt);m.position.set(...d.p);m.rotation.y=d.r;m.renderOrder=9;tank.add(m);}
    if(d.side==='back'||OCEAN)continue;
    const cg=new THREE.PlaneGeometry(d.w,H,40,12);const n=cg.attributes.position.count;cg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*4).fill(1),4));const uv=cg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*d.w/4,uv.getY(i)*H/4);
    const cm=new THREE.MeshStandardMaterial({map:TX.drop,vertexColors:true,transparent:true,depthWrite:false,roughness:0.2,side:THREE.DoubleSide});const mesh=new THREE.Mesh(cg,cm);mesh.position.set(...d.p);mesh.rotation.y=d.r;
    if(d.side==='front')mesh.position.z-=0.015;if(d.side==='left')mesh.position.x+=0.015;if(d.side==='right')mesh.position.x-=0.015;mesh.renderOrder=10;tank.add(mesh);condPanes.push({mesh,d,H});}
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:TX.streak,transparent:true,opacity:0.045,blending:THREE.AdditiveBlending,depthWrite:false}));sm.position.set(0,yc,HD+0.05);sm.renderOrder=11;tank.add(sm);
  const fm=new THREE.MeshStandardMaterial({color:0x151816,metalness:0.8,roughness:0.32});const t=0.12,HH=H+0.2;
  for(const sx of[-1,1])for(const sz of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(t,HH,t),fm);m.position.set(sx*(HW+0.06),yc,sz*(HD+0.06));m.castShadow=true;tank.add(m);}
  for(const y of[BOT-0.05,TOP+0.02])for(const sz of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(W+0.24,y<0?0.3:t,t),fm);m.position.set(0,y,sz*(HD+0.06));tank.add(m);}
  for(const y of[BOT-0.05,TOP+0.02])for(const sx of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(t,y<0?0.3:t,D+0.24),fm);m.position.set(sx*(HW+0.06),y,0);tank.add(m);}
  const plinth=new THREE.Mesh(new THREE.BoxGeometry(W+0.5,0.25,D+0.5),fm);plinth.position.y=BOT-0.2;plinth.receiveShadow=true;tank.add(plinth);})();
TX.screen.repeat.set(30,18);
const lid=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:TX.screen,transparent:true,opacity:0.5,depthWrite:false,roughness:0.8,side:THREE.DoubleSide}));lid.rotation.x=-Math.PI/2;lid.position.y=TOP+0.02;lid.renderOrder=8;tank.add(lid);
const lampPanels=[];(function(){for(const z of[-4,4]){const bar=new THREE.Mesh(new THREE.BoxGeometry(W*0.84,0.2,1.3),new THREE.MeshStandardMaterial({color:0x1b1e1d,metalness:0.7,roughness:0.35}));bar.position.set(0,TOP+0.4,z);tank.add(bar);
  const pm=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xfff2dd,emissiveIntensity:0});const p=new THREE.Mesh(new THREE.PlaneGeometry(W*0.8,1.05),pm);p.rotation.x=Math.PI/2;p.position.set(0,TOP+0.29,z);tank.add(p);lampPanels.push(pm);}})();
const desk=new THREE.Mesh(new THREE.PlaneGeometry(140,90),new THREE.MeshStandardMaterial({map:TX.wood,roughness:0.55}));TX.wood.repeat.set(4,3);desk.rotation.x=-Math.PI/2;desk.position.y=BOT-0.33;desk.receiveShadow=true;scene.add(desk);

/* water/ground ripples, splashes need these */
const ripples=[];for(let i=0;i<60;i++){const m=new THREE.Mesh(new THREE.RingGeometry(0.8,1,40),new THREE.MeshBasicMaterial({color:0xdff3f5,transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;m.renderOrder=3;tank.add(m);ripples.push({m,t:1,s:0.3});}
function ripple(x,z,s){const r=ripples.find(q=>q.t>=1);if(!r)return;r.t=0;r.s=s||0.35;r.m.position.set(x,waterSurf(x,z)+0.006,z);r.m.visible=true;}

/* =================== ocean volume, surface, rays, caustics =================== */
const CAUS={value:0};
/* underwater light model (after Tidewater): Beer-Lambert absorption on the light path (surface -> point) and the view path (glass -> eye),
   single-scatter in-scatter colour, caustics modulate the direct sun instead of adding light. Units: per world unit (~0.4 m). */
const UW={sigL:{value:new V3(0.075,0.032,0.016)},sigV:{value:new V3(0.07,0.028,0.02)},col:{value:new V3(0.01,0.062,0.1)},amb:{value:new V3(0.0,0.012,0.02)}};
const CAUS_GLSL=`float causticF(vec2 p,float t){p-=250.0;vec2 i=p;float c=1.0;float inten=0.005;for(int n=0;n<4;n++){float tt=t*(1.0-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));c+=1.0/length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}c/=4.0;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.0),0.0,1.6);}
float uwPath(vec3 ro,vec3 p){vec3 d=p-ro;float L=length(d);vec3 rd=d/max(L,1e-4);vec3 bmin=vec3(${(-HW).toFixed(2)},${BOT.toFixed(2)},${(-HD).toFixed(2)}),bmax=vec3(${HW.toFixed(2)},${WT.toFixed(3)},${HD.toFixed(2)});
  vec3 ir=1.0/(rd+vec3(1e-6));vec3 t0=(bmin-ro)*ir,t1=(bmax-ro)*ir;vec3 tn=min(t0,t1);float te=max(max(tn.x,tn.y),max(tn.z,0.0));return max(L-te,0.0);}
`;
function causticify(m){if(!OCEAN||!m||m.userData.caus||!m.isMeshStandardMaterial)return m;m.userData.caus=true;const prev=m.onBeforeCompile,wk2=!!m.customProgramCacheKey&&m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey;const pk=wk2?m.customProgramCacheKey():'';
  m.onBeforeCompile=(sh,r)=>{if(prev&&prev!==THREE.Material.prototype.onBeforeCompile)prev(sh,r);sh.uniforms.uCaus=CAUS;sh.uniforms.uTimeC=U.uTime;sh.uniforms.uSigL=UW.sigL;sh.uniforms.uSigV=UW.sigV;sh.uniforms.uWCol=UW.col;sh.uniforms.uWAmb=UW.amb;
    sh.vertexShader='varying vec3 vCW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 _cw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n_cw=instanceMatrix*_cw;\n#endif\nvCW=(modelMatrix*_cw).xyz;');
    sh.fragmentShader='uniform float uCaus;\nuniform float uTimeC;\nuniform vec3 uSigL;\nuniform vec3 uSigV;\nuniform vec3 uWCol;\nuniform vec3 uWAmb;\nvarying vec3 vCW;\n'+CAUS_GLSL+sh.fragmentShader
      .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
float uwIn=step(abs(vCW.x),${(HW+0.05).toFixed(2)})*step(abs(vCW.z),${(HD+0.05).toFixed(2)})*step(${(BOT-0.2).toFixed(2)},vCW.y)*smoothstep(0.0,0.15,${WT.toFixed(3)}-vCW.y);
float uwD=max(${WT.toFixed(3)}-vCW.y,0.0);vec3 uwLd=exp(-uSigL*uwD*1.15);
float uwC=causticF(vCW.xz*1.1+vec2(uTimeC*0.03,0.0),uTimeC*0.5)*0.6+causticF(vCW.zx*1.7+3.1,uTimeC*0.62+1.7)*0.4;
float uwK=mix(1.0,0.38+uwC*5.0,uCaus*exp(-uwD*0.03));
reflectedLight.directDiffuse=mix(reflectedLight.directDiffuse,reflectedLight.directDiffuse*uwLd*uwK,uwIn);
reflectedLight.directSpecular=mix(reflectedLight.directSpecular,reflectedLight.directSpecular*uwLd,uwIn);
reflectedLight.indirectDiffuse=mix(reflectedLight.indirectDiffuse,reflectedLight.indirectDiffuse*(uwLd*0.8+0.2)+uWAmb,uwIn);
reflectedLight.indirectSpecular=mix(reflectedLight.indirectSpecular,reflectedLight.indirectSpecular*uwLd*0.6,uwIn);`)
      .replace('#include <opaque_fragment>',`{float uwL=uwPath(cameraPosition,vCW)*uwIn;vec3 uwT=exp(-uSigV*uwL);outgoingLight=outgoingLight*uwT+uWCol*(1.0-uwT);}
#include <opaque_fragment>`);};
  m.customProgramCacheKey=()=>pk+'uw3';m.needsUpdate=true;return m;}
function uwSweep(root){if(!OCEAN)return;root.traverse(o=>{if(!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(causticify);});}
let oceanFX=null;
if(OCEAN){causticify(terrain.material);causticify(MATS.rock);causticify(MATS.pebble);
  const vol=new THREE.Mesh(new THREE.BoxGeometry(W-0.02,WT-BOT-0.02,D-0.02),new THREE.MeshBasicMaterial({color:0x0f5a76,transparent:true,opacity:0.0,depthWrite:false}));vol.visible=false;vol.position.set(0,(WT+BOT)/2,0);vol.renderOrder=8;tank.add(vol);
  const sn=TX.waterN.clone();sn.needsUpdate=true;sn.repeat.set(6,4);
  const surf=new THREE.Mesh(new THREE.PlaneGeometry(W-0.02,D-0.02),new THREE.MeshStandardMaterial({color:0x2a7f9c,roughness:0.04,metalness:0.1,normalMap:sn,normalScale:new V2(0.6,0.6),transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.4}));surf.rotation.x=-Math.PI/2;surf.position.y=WT;surf.renderOrder=9;tank.add(surf);
  const rays=[];for(let i=0;i<10;i++){const h=WT-rand(0.5,2);const m=new THREE.Mesh(new THREE.PlaneGeometry(rand(0.8,1.8),h),new THREE.MeshBasicMaterial({map:TX.ray,color:0xbfe8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(rand(-15,15),WT-h/2,rand(-7,8));m.renderOrder=7;tank.add(m);rays.push({m,ph:rand(0,6),tilt:rand(-0.2,0.2)});}
  oceanFX={vol,surf,sn,rays};}
