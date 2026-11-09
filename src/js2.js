
/* =================== renderer / scene =================== */
setMsg(TR`准备渲染器…`);await tick();
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=Q.shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const BG_DAY=new Col(0x18211d),BG_NIGHT=new Col(0x05080a);
scene.background=new Col(0x121914);scene.fog=new THREE.Fog(0x121914,70,160);
const camera=new THREE.PerspectiveCamera(36,1,0.02,320);
setMsg(TR`绘制纹理…`);await tick();
buildTextures();if(OCEAN)buildOceanTextures();
try{const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(renderer),0.04).texture;}catch(e){console.warn('env',e);}
scene.environmentIntensity=0.6;

/* =================== world constants =================== */
const HW=18,HD=11,W=36,D=22,TOP=12.5,BOT=-2.6,DAY=180;
const CREATE=!!MODE.create;
/* creative substrates: name, zone coordinate (desert -13 … rainforest 12.5), two colours */
const CMAT=[{k:'sand',n:TR`沙子`,u:-13,c:0xd6bb84,c2:0xead3a0},{k:'gravel',n:TR`砾石`,u:-9.6,c:0x8d8676,c2:0x5f594e},{k:'soil',n:TR`泥土`,u:-2.6,c:0x5e4631,c2:0x46331f},
  {k:'turf',n:TR`草皮`,u:-4.5,c:0x6c8a38,c2:0x50692a},{k:'mud',n:TR`湿泥`,u:3,c:0x3f3527,c2:0x2b251b},{k:'moss',n:TR`苔藓`,u:12.5,c:0x4f802b,c2:0x3a6322},{k:'leaf',n:TR`落叶`,u:9.6,c:0x7c5632,c2:0x5a3d23}];
function rleEnc(a){const o=[];let v=a[0],n=0;for(let i=0;i<a.length;i++){if(a[i]===v)n++;else{o.push(v,n);v=a[i];n=1;}}o.push(v,n);return o;}
function rleDec(r,len){const o=new Int16Array(len);let k=0;for(let i=0;i<r.length;i+=2){const v=r[i],n=r[i+1];for(let j=0;j<n&&k<len;j++)o[k++]=v;}return o;}
/* blurred zone coordinate from the material grid (separable box blur, radius ~0.6 units) */
function computeUG(){const n=GR*(GZ+1),tmp=new Float32Array(n),R=6;for(let i=0;i<n;i++)UG[i]=CMAT[MATG[i]].u;
  for(let j=0;j<=GZ;j++){let acc=0;const row=j*GR;for(let i=-R;i<=R;i++)acc+=UG[row+clamp(i,0,GX)];for(let i=0;i<=GX;i++){tmp[row+i]=acc/(2*R+1);acc+=UG[row+clamp(i+R+1,0,GX)]-UG[row+clamp(i-R,0,GX)];}}
  for(let i=0;i<=GX;i++){let acc=0;for(let j=-R;j<=R;j++)acc+=tmp[clamp(j,0,GZ)*GR+i];for(let j=0;j<=GZ;j++){UG[j*GR+i]=acc/(2*R+1);acc+=tmp[clamp(j+R+1,0,GZ)*GR+i]-tmp[clamp(j-R,0,GZ)*GR+i];}}}
function creU(x,z){const i=clamp(Math.round((x+HW)/W*GX),0,GX),j=clamp(Math.round((z+HD)/D*GZ),0,GZ);return UG[j*GR+i];}
function matAt(x,z){const i=clamp(Math.round((x+HW)/W*GX),0,GX),j=clamp(Math.round((z+HD)/D*GZ),0,GZ);return MATG[j*GR+i];}
const ZONES=OCEAN?[{key:'grass',name:TR`海草床`,color:'#a7a676',cx:-13},{key:'sand',name:TR`沙地`,color:'#dccba0',cx:-4.5},{key:'flat',name:TR`礁坪`,color:'#8fb0a8',cx:3},{key:'reef',name:TR`礁石区`,color:'#b3657f',cx:12.5}]:[{key:'desert',name:TR`沙漠`,color:'#d8b67e',cx:-13},{key:'meadow',name:TR`草甸`,color:'#9dba58',cx:-4.5},{key:'marsh',name:TR`溪沼`,color:'#76aa9c',cx:3},{key:'jungle',name:TR`雨林`,color:'#56984a',cx:12.5}];
const ZB=[-8,-1,7];
function zu(x,z){if(CREATE)return creU(x,z);if(MODE.zone!=null)return ZONES[MODE.zone].cx;return x+(fbm(z*0.11+11.3,4.7,3)-0.5)*5+(fbm(x*0.07+1.7,z*0.07+3.1,2)-0.5)*2.4;}
function zoneW(u){const s0=smooth(ZB[0]-1.1,ZB[0]+1.1,u),s1=smooth(ZB[1]-1.1,ZB[1]+1.1,u),s2=smooth(ZB[2]-1.1,ZB[2]+1.1,u);return[1-s0,s0*(1-s1),s1*(1-s2),s2];}
function zoneAt(x,z){const u=zu(x,z);return u<ZB[0]?0:u<ZB[1]?1:u<ZB[2]?2:3;}
const POND={x:2.8,z:2.4,r:4.3*(MODE.pond||1)};const WT=TOP-0.7;
function pondR(a){return POND.r*(1+0.36*(fbm(Math.cos(a)*1.4+5,Math.sin(a)*1.4+5,3)-0.5));}
function pondD(x,z){if(CREATE)return creWD(x,z);if(!MODE.pond)return 99;const dx=x-POND.x,dz=z-POND.z;return Math.hypot(dx,dz)/pondR(Math.atan2(dz,dx));}
const POOL={x:10.8,z:-9.55,r:1.25};
const STREAM=[[10.8,-9.4],[10.3,-7.8],[9.2,-6],[7.9,-4.3],[6.6,-2.6],[5.6,-1.0]].map(p=>new V2(p[0],p[1]));
const SY0=3.4,POND_BASE=0.35;
const segL=[];let streamLen=0;for(let i=0;i<STREAM.length-1;i++){const l=STREAM[i].distanceTo(STREAM[i+1]);segL.push(l);streamLen+=l;}
function streamQ(x,z){if(!MODE.stream)return{d:99,s:0};let best=1e9,bs=0,acc=0;for(let i=0;i<STREAM.length-1;i++){const a=STREAM[i],b=STREAM[i+1],abx=b.x-a.x,abz=b.y-a.y;const t=clamp(((x-a.x)*abx+(z-a.y)*abz)/(abx*abx+abz*abz),0,1);const d=Math.hypot(x-(a.x+abx*t),z-(a.y+abz*t));if(d<best){best=d;bs=(acc+segL[i]*t)/streamLen;}acc+=segL[i];}return{d:best,s:bs};}
const streamY=s=>lerp(SY0,POND_BASE+0.06,Math.pow(s,0.75));
function reefAt(x,z){return smooth(2,9,x-z*0.4+(fbm(z*0.2,1.7,3)-0.5)*5);}
function rawHOcean(x,z){const n=fbm(x*0.1+3,z*0.1+8,4);let h=0.45+n*0.9+0.05*Math.sin(x*2.3+z*0.8+n*6)*(1-reefAt(x,z));h+=reefAt(x,z)*(0.6+1.8*fbm(x*0.25+9,z*0.25,4));h+=Math.pow(smooth(-3,-HD,z),1.5)*2.6;h-=smooth(-2,-14,x)*smooth(-3,6,z)*0.4;return h;}
function rawH(x,z){if(OCEAN)return rawHOcean(x,z);
  if(CREATE){const n=fbm(x*0.12+5.1,z*0.12+7.3,4);let h=0.8+n*0.3;h+=Math.pow(smooth(-2.5,-HD,z),1.6)*(1.5+1.1*fbm(x*0.09+4,2.2,3));h-=smooth(6,HD,z)*0.3;return h;}
  const u=zu(x,z),w=zoneW(u),n=fbm(x*0.12+5.1,z*0.12+7.3,4);
  const dv=Math.sin(x*0.42+z*0.28+fbm(x*0.16,z*0.16,3)*5);
  const desert=1.25+0.55*Math.pow(1-Math.abs(dv),1.6)+n*1.1+0.035*Math.sin(x*5.5+z*1.8+n*6);
  const meadow=0.95+n*1.15,marsh=0.6+n*0.55,jungle=1.2+fbm(x*0.17+2,z*0.17+9,4)*2.6;
  let h=w[0]*desert+w[1]*meadow+w[2]*marsh+w[3]*jungle;
  h+=Math.pow(smooth(-2.5,-HD,z),1.6)*(2.2+2.2*fbm(x*0.09+4,2.2,3));
  h-=smooth(6,HD,z)*0.35;
  const dp=pondD(x,z);if(dp<1.5)h=lerp(-0.85,h,smooth(0.45,1.5,dp));
  const dq=MODE.stream?Math.hypot(x-POOL.x,z-POOL.z)/POOL.r:9;if(dq<1.7)h=Math.min(h,lerp(SY0-0.8,Math.max(h,SY0+0.35),smooth(0.55,1.4,dq)));
  const q=streamQ(x,z);
  if(q.d<2.4){const ys=streamY(q.s),bed=ys-0.32;const bank=Math.max(h,ys+0.3*(1-smooth(0.9,2.4,q.d)));const ch=lerp(bed,bank,smooth(0.3,0.72,q.d));h=(dp<1.3||dq<1.2)?Math.min(h,ch):ch;}
  return Math.max(h,-1);
}
setMsg(TR`生成地形…`);await tick();
const GX=360,GZ=220,GR=GX+1,HG=new Float32Array(GR*(GZ+1));
for(let j=0;j<=GZ;j++)for(let i=0;i<=GX;i++)HG[j*GR+i]=rawH(-HW+i*W/GX,-HD+j*D/GZ);
/* ---- creative mode: a painted material per height-grid vertex. Each material maps to a climate (zone
   coordinate u), so plants, humidity and habitats all follow whatever the player paints. ---- */
const HG0=CREATE?HG.slice():null,MATG=CREATE?new Uint8Array(GR*(GZ+1)).fill(2):null,UG=CREATE?new Float32Array(GR*(GZ+1)):null;
/* saved terrain: half-resolution height offsets (0.02 steps) and materials, run-length encoded */
const TSW=GX/2+1,TSH=GZ/2+1;
function terrEnc(){const d=new Int16Array(TSW*TSH),m=new Uint8Array(TSW*TSH);for(let j=0;j<TSH;j++)for(let i=0;i<TSW;i++){const g=(j*2)*GR+i*2;d[j*TSW+i]=Math.round((HG[g]-HG0[g])*50);m[j*TSW+i]=MATG[g];}return{d:rleEnc(d),m:rleEnc(m),w:CPONDS.map(p=>[+p.x.toFixed(2),+p.z.toFixed(2)])};}
function terrDec(T){const d=rleDec(T.d,TSW*TSH),m=rleDec(T.m,TSW*TSH);
  for(let j=0;j<=GZ;j++)for(let i=0;i<=GX;i++){const fi=i/2,fj=j/2,i0=Math.floor(fi),j0=Math.floor(fj),i1=Math.min(TSW-1,i0+1),j1=Math.min(TSH-1,j0+1),tx=fi-i0,tz=fj-j0;
    const v=(d[j0*TSW+i0]*(1-tx)+d[j0*TSW+i1]*tx)*(1-tz)+(d[j1*TSW+i0]*(1-tx)+d[j1*TSW+i1]*tx)*tz,g=j*GR+i;HG[g]=HG0[g]+v/50;MATG[g]=m[Math.round(fj)*TSW+Math.round(fi)]||0;}}
if(CREATE){const CS=readSave();if(CS&&CS.terr){try{terrDec(CS.terr);}catch(e){HG.set(HG0);MATG.fill(2);}}computeUG();}
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
/* creative ponds: each pond is a seed point; filling floods the hollow up to just below its lowest rim.
   CWL = water surface height per height-grid vertex (-50 where dry), CWD = distance to water (half grid). */
const CWL=CREATE?new Float32Array(GR*(GZ+1)).fill(-50):null,CWD=CREATE?new Float32Array((GX/2+1)*(GZ/2+1)).fill(99):null,CPONDS=[];let creWaterVer=0;
function gIdx(x,z){return clamp(Math.round((z+HD)/D*GZ),0,GZ)*GR+clamp(Math.round((x+HW)/W*GX),0,GX);}
/* flood one hollow from (x,z). Returns a pond {x,z,level,cells,cx,cz} or {err} */
function creFloodAt(x,z){const N=GR*(GZ+1),s0=gIdx(x,z),h0=HG[s0];const seen=new Uint8Array(N),hk=[],hv=[];
  const push=(c,k)=>{let i=hk.length;hk.push(k);hv.push(c);while(i>0){const p=(i-1)>>1;if(hk[p]<=hk[i])break;[hk[p],hk[i]]=[hk[i],hk[p]];[hv[p],hv[i]]=[hv[i],hv[p]];i=p;}};
  const pop=()=>{const k=hk[0],c=hv[0],lk=hk.pop(),lc=hv.pop();if(hk.length){hk[0]=lk;hv[0]=lc;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<hk.length&&hk[l]<hk[m])m=l;if(r<hk.length&&hk[r]<hk[m])m=r;if(m===i)break;[hk[m],hk[i]]=[hk[i],hk[m]];[hv[m],hv[i]]=[hv[i],hv[m]];i=m;}}return[c,k];};
  seen[s0]=1;push(s0,h0);let spill=null,n=0;
  while(hk.length){const [c,k]=pop();const i=c%GR,j=(c/GR)|0;if(i<=3||i>=GX-3||j<=3||j>=GZ-3){spill=k;break;}if(++n>60000){spill=k;break;}
    for(const nb of[c-1,c+1,c-GR,c+GR])if(!seen[nb]){seen[nb]=1;push(nb,Math.max(k,HG[nb]));}}
  if(spill==null)return{err:'shallow'};const level=Math.min(spill-0.035,h0+2.2);if(level-h0<0.09)return{err:'shallow'};
  const cells=[];const q=[s0];const vis=new Uint8Array(N);vis[s0]=1;let sx=0,sz=0;
  while(q.length){const c=q.pop();cells.push(c);sx+=c%GR;sz+=(c/GR)|0;for(const nb of[c-1,c+1,c-GR,c+GR]){if(vis[nb])continue;const i=nb%GR,j=(nb/GR)|0;if(i<1||i>=GX||j<1||j>=GZ)continue;vis[nb]=1;if(HG[nb]<level)q.push(nb);}}
  if(cells.length<10)return{err:'small'};
  return{x,z,level,cells:Int32Array.from(cells),cx:-HW+sx/cells.length*W/GX,cz:-HD+sz/cells.length*D/GZ};}
/* rebuild every pond from its seed (after sculpting, undo or loading). Returns how many ponds disappeared. */
function creWaterRebuild(){if(!CREATE)return 0;CWL.fill(-50);let lost=0;const keep=[];
  for(const p of CPONDS){if(keep.some(o=>o.cells.includes(gIdx(p.x,p.z)))){continue;}const r=creFloodAt(p.x,p.z);if(r.err){lost++;continue;}keep.push(r);}
  CPONDS.length=0;CPONDS.push(...keep);
  for(const p of CPONDS)for(const c of p.cells){const i=c%GR,j=(c/GR)|0;for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++){const ii=i+di,jj=j+dj;if(ii<0||ii>GX||jj<0||jj>GZ)continue;const k=jj*GR+ii;if(CWL[k]<p.level)CWL[k]=p.level;}}
  /* distance to open water on the half grid (two-pass chamfer), used for pondD: moisture, frogs, grass */
  const w2=GX/2+1,h2=GZ/2+1;CWD.fill(99);for(let j=0;j<h2;j++)for(let i=0;i<w2;i++){const g=(j*2)*GR+i*2;if(CWL[g]>HG[g])CWD[j*w2+i]=0;}
  const st=0.2,dg=0.283;for(let j=0;j<h2;j++)for(let i=0;i<w2;i++){const k=j*w2+i;let v=CWD[k];if(i>0)v=Math.min(v,CWD[k-1]+st);if(j>0){v=Math.min(v,CWD[k-w2]+st);if(i>0)v=Math.min(v,CWD[k-w2-1]+dg);if(i<w2-1)v=Math.min(v,CWD[k-w2+1]+dg);}CWD[k]=v;}
  for(let j=h2-1;j>=0;j--)for(let i=w2-1;i>=0;i--){const k=j*w2+i;let v=CWD[k];if(i<w2-1)v=Math.min(v,CWD[k+1]+st);if(j<h2-1){v=Math.min(v,CWD[k+w2]+st);if(i<w2-1)v=Math.min(v,CWD[k+w2+1]+dg);if(i>0)v=Math.min(v,CWD[k+w2-1]+dg);}CWD[k]=v;}
  creWaterVer++;return lost;}
function creWD(x,z){const w2=GX/2+1,i=clamp(Math.round((x+HW)/W*GX/2),0,GX/2),j=clamp(Math.round((z+HD)/D*GZ/2),0,GZ/2),d=CWD[j*w2+i];return d<=0?0.5:1+d/2.6;}
/* nearest pond centre (frogs head there) and a random spot in open water (eggs) */
function pondCtr(x,z){if(!CREATE)return POND;let b=null,bd=1e9;for(const p of CPONDS){const d=Math.hypot(p.cx-x,p.cz-z);if(d<bd){bd=d;b=p;}}return b?{x:b.cx,z:b.cz}:{x,z};}
function pondSpot(m){if(!CREATE){const an=rand(0,6.28),r=pondR(an)*0.85;return{x:POND.x+Math.cos(an)*r,z:POND.z+Math.sin(an)*r};}
  if(!CPONDS.length)return{x:0,z:0};const p=CPONDS[Math.floor(Math.random()*CPONDS.length)],c=p.cells[Math.floor(Math.random()*p.cells.length)];return{x:-HW+(c%GR)*W/GX,z:-HD+((c/GR)|0)*D/GZ};}
function inPond(x,z,m){m=m||0;if(CREATE){const l=CWL[gIdx(x,z)];return l>-49&&heightAt(x,z)<l-m;}return pondD(x,z)<1.5&&heightAt(x,z)<env.waterY-m;}
if(CREATE){const CS=readSave();if(CS&&CS.terr&&Array.isArray(CS.terr.w))for(const [x,z] of CS.terr.w)CPONDS.push({x,z,cells:[]});creWaterRebuild();}
function inStream(x,z,m){if(!env.pump)return false;const q=streamQ(x,z);if(q.d>0.6)return false;return heightAt(x,z)<streamY(q.s)-(m||0);}
function inPool(x,z,m){if(!MODE.stream)return false;return Math.hypot(x-POOL.x,z-POOL.z)<POOL.r*1.3&&heightAt(x,z)<SY0-(m||0);}
function inWater(x,z,m){return inPond(x,z,m)||inPool(x,z,m)||inStream(x,z,m);}
function waterSurf(x,z){if(CREATE){const l=CWL[gIdx(x,z)];if(l>-49)return l;}if(inPond(x,z))return env.waterY;if(inPool(x,z))return SY0;const q=streamQ(x,z);return streamY(q.s);}
function surfaceY(x,z){const h=heightAt(x,z);return inWater(x,z)?Math.max(h,waterSurf(x,z)):h;}
function localMoist(x,z,zi){let m=env.zones[zi].m;const dp=pondD(x,z);if(dp<2&&(CREATE||env.pond>0.08))m+=0.32*(1-smooth(1,2,dp));if(env.pump){const q=streamQ(x,z);if(q.d<2)m+=0.3*(1-smooth(0.6,2,q.d));}return Math.min(1,m);}

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
/* Nothing may poke through the glass when the tank is orbited: every plant/rock/decor vertex is softly pressed
   against the inside of the panes and under the lid (done in the vertex shader, so it also holds for wind sway,
   growth and instancing). Inside a 0.3 band next to the glass the shape is untouched. */
const GLASS_FIT={value:new THREE.Vector4(18+0.015,11+0.015,12.5-0.06,0.3)};
const GLASS_FIT_GLSL=`uniform vec4 uGlassFit;
float gfSoft(float v,float L,float k){float a=abs(v);if(a<=L-k)return v;return sign(v)*(L-k+k*(1.0-exp(-(a-(L-k))/k)));}
vec3 glassFit(vec3 p){p.x=gfSoft(p.x,uGlassFit.x,uGlassFit.w);p.z=gfSoft(p.z,uGlassFit.y,uGlassFit.w);float t=uGlassFit.z-uGlassFit.w;if(p.y>t)p.y=t+uGlassFit.w*(1.0-exp(-(p.y-t)/uGlassFit.w));return p;}
`;
function glassFit(m){if(!m||m.userData.gf||!m.isMaterial)return m;m.userData.gf=true;const prev=m.onBeforeCompile,hasKey=m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey,pk=hasKey?m.customProgramCacheKey():'';
  m.onBeforeCompile=(sh,r)=>{if(prev&&prev!==THREE.Material.prototype.onBeforeCompile)prev.call(m,sh,r);if(!sh.vertexShader.includes('#include <project_vertex>'))return;sh.uniforms.uGlassFit=GLASS_FIT;
    sh.vertexShader=GLASS_FIT_GLSL+sh.vertexShader.replace('#include <project_vertex>',`vec4 _gp=vec4(transformed,1.0);
#ifdef USE_INSTANCING
_gp=instanceMatrix*_gp;
#endif
_gp=modelMatrix*_gp;_gp.xyz=glassFit(_gp.xyz);vec4 mvPosition=viewMatrix*_gp;gl_Position=projectionMatrix*mvPosition;`);};
  m.customProgramCacheKey=()=>pk+'|gf';m.needsUpdate=true;return m;}
function mkMats(){
  const leaf=(tex,o)=>{tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;return wind(new THREE.MeshStandardMaterial(Object.assign({map:tex,alphaTest:0.42,side:THREE.DoubleSide,vertexColors:true,roughness:0.62,metalness:0},o||{})));};
  for(const k of['leafBroad','leafVar','litter','monstera','aloe','brom','reed','dand','fern','clover','lily','daisy','dandF','lilyPetal','foxHead'])MATS[k]=leaf(TX[k]);
  MATS.puff=leaf(TX.puff,{alphaTest:0.25,roughness:0.9});
  /* cosmos discs face the sun almost flat: matte and a touch darker, so the white and pink ones don't blow out at noon */
  TX.cosmos.forEach((t,i)=>MATS['cosmos'+i]=leaf(t,{roughness:0.92,color:new Col(i===1?0xbdb7ba:0xd6d2d4)}));
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
  for(const k in MATS)glassFit(MATS[k]);
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
const _cw=new Float32Array(7),_ca=new Col(),_cb=new Col(),_cr=new Col(0x7a6a58),_cm2=new Col(0x6a9a3a),_cl2=new Col(0xa3602c);
(function(){const n=TW*TH,pos=new Float32Array(n*3),col=new Float32Array(n*3),uv=new Float32Array(n*2);tBase=new Float32Array(n*3);tZW=new Float32Array(n*4);
  const Z=[new Col(0xcfae7c),new Col(0x6b7a3a),new Col(0x55602f),new Col(0x3b2d1f)];const c=new Col(),t=new Col();
  const sand2=new Col(0xe6cd9e),red=new Col(0xb0744c),grassy=new Col(0x71883a),dirt=new Col(0x7c6446),mud=new Col(0x3a3222),moss=new Col(0x4c7a2c),soil2=new Col(0x4a3726),peb=new Col(0x6c6352),rockc=new Col(0x7a6a58);
  for(let j=0;j<TH;j++)for(let i=0;i<TW;i++){const gi=i*ST,gj=j*ST,k=j*TW+i,x=-HW+gi*W/GX,z=-HD+gj*D/GZ,y=HG[gj*GR+gi];
    pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;uv[k*2]=x/3;uv[k*2+1]=z/3;
    if(CREATE){creVertex(k,pos,col);continue;}
    const w=zoneW(zu(x,z));tZW.set(w,k*4);
    c.setRGB(0,0,0);for(let q=0;q<4;q++){t.copy(Z[q]).multiplyScalar(w[q]);c.add(t);}
    const n1=fbm(x*0.6+1,z*0.6+2,3),n2=fbm(x*0.25+7,z*0.25+3,3);
    if(w[0]>0.05){const dv=Math.sin(x*0.42+z*0.28+fbm(x*0.16,z*0.16,3)*5);c.lerp(sand2,w[0]*0.55*Math.pow(1-Math.abs(dv),2));if(n2>0.6)c.lerp(red,w[0]*smooth(0.6,0.72,n2)*0.7);}
    if(w[1]>0.05){c.lerp(grassy,w[1]*smooth(0.35,0.6,n1)*0.8);if(n2<0.36)c.lerp(dirt,w[1]*0.6);}
    if(w[3]>0.05){if(n1>0.42)c.lerp(moss,w[3]*smooth(0.42,0.6,n1)*0.95);else if(n2<0.4)c.lerp(soil2,w[3]*0.5);}
    const dp=pondD(x,z);if(dp<1.7)c.lerp(mud,smooth(1.7,1.0,dp)*0.85);if(dp<1.05)c.lerp(peb,0.5);
    const q=streamQ(x,z);if(q.d<1.2){c.lerp(peb,smooth(1.2,0.45,q.d)*0.8);}if(MODE.stream&&Math.hypot(x-POOL.x,z-POOL.z)<POOL.r*1.4)c.lerp(peb,0.6);
    const sl=Math.hypot(HG[gj*GR+Math.min(GX,gi+1)]-HG[gj*GR+Math.max(0,gi-1)],HG[Math.min(GZ,gj+1)*GR+gi]-HG[Math.max(0,gj-1)*GR+gi])/0.2;c.lerp(rockc,smooth(0.9,1.8,sl)*0.6);
    if(OCEAN)oceanColor(c,x,z,y,n1,n2);
    let avg=0;for(const [di,dj] of[[4,0],[-4,0],[0,4],[0,-4]])avg+=HG[clamp(gj+dj,0,GZ)*GR+clamp(gi+di,0,GX)];avg/=4;const ao=1-clamp((avg-y)*1.4,-0.1,0.35);c.multiplyScalar(ao*(0.92+hash2(i,j)*0.12));
    tBase[k*3]=c.r;tBase[k*3+1]=c.g;tBase[k*3+2]=c.b;col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  const idx=new Uint32Array((TW-1)*(TH-1)*6);let o=0;for(let j=0;j<TH-1;j++)for(let i=0;i<TW-1;i++){const a=j*TW+i,b=a+1,c2=a+TW,d=c2+1;idx[o++]=a;idx[o++]=c2;idx[o++]=b;idx[o++]=b;idx[o++]=c2;idx[o++]=d;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
  terrain=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:TX.detail,normalMap:TX.groundN,normalScale:new V2(0.9,0.9),roughness:0.96}));terrain.receiveShadow=true;tank.add(terrain);})();
/* creative: one terrain vertex from the material grid — colour blend, texture, slope rock, AO */
function creVertex(k,pos,col){const i=k%TW,j=(k/TW)|0,gi=Math.min(GX,i*ST),gj=Math.min(GZ,j*ST),x=-HW+gi*W/GX,z=-HD+gj*D/GZ,y=HG[gj*GR+gi];
  if(pos)pos[k*3+1]=y;_cw.fill(0);let tot=0;
  for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const w=(3-Math.abs(di))*(3-Math.abs(dj));_cw[MATG[clamp(gj+dj,0,GZ)*GR+clamp(gi+di,0,GX)]]+=w;tot+=w;}
  const n1=fbm(x*0.6+1,z*0.6+2,3),n2=fbm(x*0.25+7,z*0.25+3,3),h=hash2(gi*7+1,gj*13+5);_ca.setRGB(0,0,0);
  for(let m=0;m<7;m++){const w=_cw[m]/tot;if(w<=0)continue;const M=CMAT[m];_cb.set(M.c).lerp(_cr.set(M.c2),n1);
    if(m===0)_cb.multiplyScalar(0.95+0.07*Math.sin(x*3.1+z*1.2+n2*6));
    else if(m===1)_cb.multiplyScalar(0.7+0.6*h);
    else if(m===5)_cb.lerp(_cm2,smooth(0.5,0.7,n2)*0.5).multiplyScalar(0.9+0.2*h);
    else if(m===6){if(h>0.72)_cb.lerp(_cl2,0.55);_cb.multiplyScalar(0.85+0.3*h);}
    else if(m===3)_cb.multiplyScalar(0.9+0.2*h);
    _ca.r+=_cb.r*w;_ca.g+=_cb.g*w;_ca.b+=_cb.b*w;}
  const sl=Math.hypot(HG[gj*GR+Math.min(GX,gi+1)]-HG[gj*GR+Math.max(0,gi-1)],HG[Math.min(GZ,gj+1)*GR+gi]-HG[Math.max(0,gj-1)*GR+gi])/0.2;_ca.lerp(_cr.set(0x7a6a58),smooth(1.1,2.2,sl)*0.55);
  let avg=0;for(const [di,dj] of[[4,0],[-4,0],[0,4],[0,-4]])avg+=HG[clamp(gj+dj,0,GZ)*GR+clamp(gi+di,0,GX)];avg/=4;const ao=1-clamp((avg-y)*1.4,-0.1,0.35);_ca.multiplyScalar(ao*(0.92+hash2(i,j)*0.12));
  tBase[k*3]=_ca.r;tBase[k*3+1]=_ca.g;tBase[k*3+2]=_ca.b;const w=zoneW(zu(x,z));tZW.set(w,k*4);
  if(col){const m=env.zones.map(z=>z.m),o=k*4,wet=tZW[o]*m[0]*1.3+tZW[o+1]*m[1]+tZW[o+2]*m[2]*0.75+tZW[o+3]*m[3]*0.7,f=1-0.32*clamp(wet,0,1);col[k*3]=_ca.r*f;col[k*3+1]=_ca.g*f;col[k*3+2]=_ca.b*(f+0.025*wet);}}
/* creative: refresh the terrain mesh inside a world-space rectangle (positions, colours, normals) */
function terrUpdate(x0,z0,x1,z1){const g=terrain.geometry,P=g.attributes.position,C=g.attributes.color,N=g.attributes.normal;
  const i0=clamp(Math.floor((x0+HW)/W*GX/ST)-2,0,TW-1),i1=clamp(Math.ceil((x1+HW)/W*GX/ST)+2,0,TW-1),j0=clamp(Math.floor((z0+HD)/D*GZ/ST)-2,0,TH-1),j1=clamp(Math.ceil((z1+HD)/D*GZ/ST)+2,0,TH-1);
  const pa=P.array,ca=C.array,na=N.array,dx=2*ST*W/GX,dz=2*ST*D/GZ;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*TW+i;creVertex(k,pa,ca);}
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*TW+i,l=j*TW+Math.max(0,i-1),r=j*TW+Math.min(TW-1,i+1),u=Math.max(0,j-1)*TW+i,d=Math.min(TH-1,j+1)*TW+i;
    let nx=-(pa[r*3+1]-pa[l*3+1])/dx,nz=-(pa[d*3+1]-pa[u*3+1])/dz,ny=1;const L=Math.hypot(nx,ny,nz);na[k*3]=nx/L;na[k*3+1]=ny/L;na[k*3+2]=nz/L;}
  const a=j0*TW*3,b=(j1+1)*TW*3;for(const A of[P,C,N]){A.clearUpdateRanges&&A.clearUpdateRanges();A.addUpdateRange?A.addUpdateRange(a,b-a):0;A.needsUpdate=true;}}
function oceanColor(c,x,z,y,n1,n2){const rf=reefAt(x,z);c.set(0xe9e1cc).multiplyScalar(0.8+0.2*n1);const rip=Math.sin(x*2.3+z*0.8+n2*6);c.multiplyScalar(0.94+0.06*rip);
  if(rf>0.05){_c.set(0x5e4a68).lerp(new Col(0xa04a78),smooth(0.5,0.65,n2)*0.75).lerp(new Col(0x4e3a78),smooth(0.62,0.7,n1)*0.6);c.lerp(_c,smooth(0.05,0.5,rf));}
  const w=zoneW(zu(x,z));if(w[0]>0.1)c.lerp(new Col(0x8a9a62),w[0]*0.45*smooth(0.45,0.6,n1));c.lerp(new Col(0xd2c6a8),smooth(0.5,-0.2,y)*0.35);}
function stampAO(x,z,r,k,undo){const i0=Math.max(0,Math.floor((x-r+HW)/W*GX/ST)),i1=Math.min(TW-1,Math.ceil((x+r+HW)/W*GX/ST)),j0=Math.max(0,Math.floor((z-r+HD)/D*GZ/ST)),j1=Math.min(TH-1,Math.ceil((z+r+HD)/D*GZ/ST));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const px=-HW+i*ST*W/GX,pz=-HD+j*ST*D/GZ,d=Math.hypot(px-x,pz-z)/r;if(d>=1)continue;let f=1-k*(1-d*d);if(undo)f=1/f;const kk=(j*TW+i)*3;tBase[kk]*=f;tBase[kk+1]*=f;tBase[kk+2]*=f;}}
function refreshTerrainWet(){const a=terrain.geometry.attributes.color.array,m=env.zones.map(z=>z.m),n=a.length/3;
  for(let k=0;k<n;k++){const o=k*4,wet=tZW[o]*m[0]*1.3+tZW[o+1]*m[1]+tZW[o+2]*m[2]*0.75+tZW[o+3]*m[3]*0.7,f=1-0.32*clamp(wet,0,1);a[k*3]=tBase[k*3]*f;a[k*3+1]=tBase[k*3+1]*f;a[k*3+2]=tBase[k*3+2]*(f+0.025*wet);}
  terrain.geometry.attributes.color.needsUpdate=true;}

/* substrate layers seen through the glass */
let SUBMESH=null;
function buildSubstrate(){if(SUBMESH){tank.remove(SUBMESH);SUBMESH.geometry.dispose();}const M=new Mesher(),N=180,clay=new Col(0xa65a32),mesh=new Col(0x222624),deep=new Col(0x2f2118),soil=new Col(0x4a3423),t=new Col();
  const edges=[s=>[-HW+s*W,HD-0.002],s=>[-HW+0.002,HD-s*D],s=>[HW-0.002,-HD+s*D]];
  for(const E of edges){for(let i=0;i<N;i++){const [x0,z0]=E(i/N),[x1,z1]=E((i+1)/N),t0=heightAt(x0,z0),t1=heightAt(x1,z1);const zc0=OCEAN?new Col(0xe4dbc2):CREATE?new Col(CMAT[matAt(x0,z0)].c):new Col(0xcfae7c).lerp(new Col(0x3b2d1f),clamp((zu(x0,z0)+8)/16,0,1));const u0=(x0+z0)/2,u1=(x1+z1)/2;
      const band=(ya0,ya1,yb0,yb1,cA,cB)=>{const s=M.n;M.v(x0,ya0,z0,u0,ya0/2,cA);M.v(x1,yb0,z1,u1,yb0/2,cA);M.v(x1,yb1,z1,u1,yb1/2,cB);M.v(x0,ya1,z0,u0,ya1/2,cB);M.q(s,s+1,s+2,s+3);};
      band(BOT,-1.9,BOT,-1.9,clay,clay);band(-1.9,-1.8,-1.9,-1.8,mesh,mesh);band(-1.8,t0-0.35,-1.8,t1-0.35,deep,soil);band(t0-0.35,t0,t1-0.35,t1,t.copy(zc0).multiplyScalar(0.6).clone(),zc0);}}
  const m=new THREE.Mesh(M.geo(),SUBMESH?SUBMESH.material:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.soil,roughness:1,side:THREE.DoubleSide}));tank.add(m);SUBMESH=m;}
buildSubstrate();
(function(){
  const cnt=Math.floor(3200*Q.scatter),ball=new THREE.IcosahedronGeometry(0.1,1),inst=new THREE.InstancedMesh(ball,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.85}),cnt),d=new THREE.Object3D(),cc=new Col();
  for(let i=0;i<cnt;i++){const s=Math.random()*(W+2*D);let x,z;if(s<W){x=-HW+s;z=HD-0.07;}else if(s<W+D){x=-HW+0.07;z=-HD+(s-W);}else{x=HW-0.07;z=-HD+(s-W-D);}
    d.position.set(x,rand(BOT+0.08,-1.97),z);d.scale.setScalar(rand(0.65,1.2));d.rotation.set(rand(0,3),rand(0,3),0);d.updateMatrix();inst.setMatrixAt(i,d.matrix);inst.setColorAt(i,cc.setHSL(rand(0.04,0.07),rand(0.45,0.6),rand(0.28,0.42)));}
  tank.add(inst);})();

/* back cliff */
setMsg(TR`堆砌岩壁…`);await tick();
function cliffRel(x,y){const w=zoneW(zu(x,-HD));const n=fbm(x*0.28,y*0.28,4),m=fbm(x*1.1+3,y*1.1,3);const strata=y*1.5+fbm(x*0.12,y*0.1,2)*3;const fr=strata-Math.floor(strata);
  let rel=0.35+n*1.1+m*0.25+(1-fr)*0.22*(w[0]+w[1]*0.6+0.4);if(Math.abs(x-POOL.x)<0.7&&y>SY0-0.5&&y<LIP_Y+0.2)rel-=0.4*(1-Math.abs(x-POOL.x)/0.7);return rel*(smooth(-0.8,1.2,y)*0.8+0.2);}
const LIP_Y=7.4;
const topY=x=>OCEAN?9.6+fbm(x*0.35+7,1.3,3)*1.6:MODE.zone!=null?[8.2,9,9.6,10.6][MODE.zone]+fbm(x*0.35+7,1.3,3)*1.2:lerp(8.2,10.8,smooth(-12,4,x))+fbm(x*0.35+7,1.3,3)*1.2;
/* The rock wall now only stays where it carries something: the waterfall and the hanging vines on the right.
   Everywhere else the tank shows the climate backdrop behind it. CLIFF_X = where the wall starts (it ramps up
   out of the ground over ~3 units, so there is no cut edge). */
const CLIFF_X=MK==='mixed'?4.5:(MK==='marsh'||MK==='jungle')?6:HW+1;
if(CLIFF_X<HW)(function(){const x0=CLIFF_X,x1=HW+0.15,gw=x1-x0,g=new THREE.PlaneGeometry(gw,12,Math.max(16,Math.round(240*gw/(W+0.3))),80);g.translate((x0+x1)/2,5,0);const p=g.attributes.position,uv=g.attributes.uv,cols=new Float32Array(p.count*3);const c=new Col(),t=new Col();
  const sand=new Col(0xc7a070),sand2=new Col(0x9a6a45),bas=new Col(0x5a5048),cork=new Col(0x5b4231),mossC=new Col(0x4a7a2a);
  for(let i=0;i<p.count;i++){const x=p.getX(i);let y=p.getY(i);const ramp=smooth(x0,x0+3.2,x),gb=heightAt(clamp(x,-HW,HW),-HD+0.25)-0.35,ty=lerp(gb,topY(x),ramp);if(y>ty)y=ty;
    const w=zoneW(zu(x,-HD));const m=fbm(x*1.1+3,y*1.1,3);
    const strata=y*1.5+fbm(x*0.12,y*0.1,2)*3;const fr=strata-Math.floor(strata);
    const rel=cliffRel(x,y)*(0.2+0.8*smooth(x0,x0+1.6,x));
    p.setY(i,y);p.setZ(i,rel);uv.setXY(i,x/3,y/3);
    c.copy(cork).lerp(bas,w[2]+w[3]*0.7).multiplyScalar(0.75+0.5*m);
    t.copy(sand).lerp(sand2,0.5+0.5*Math.sin(strata*6.283*0.5));c.lerp(t,w[0]+w[1]*0.4);
    if(fr<0.18&&w[3]+w[2]>0.3&&m>0.4)c.lerp(mossC,(w[3]+w[2]*0.5)*0.9);
    if(w[3]>0.4&&fbm(x*0.7+9,y*0.7,3)>0.55)c.lerp(mossC,0.7*w[3]);
    if(OCEAN){c.set(0x463a56).multiplyScalar(0.7+0.6*m);if(fbm(x*0.5+3,y*0.5,3)>0.55)c.lerp(new Col(0xb05282),0.75);if(fbm(x*0.9,y*0.9+5,2)>0.62)c.lerp(new Col(0x7a4a8a),0.7);if(fbm(x*1.4+8,y*1.4,2)>0.64)c.lerp(new Col(0x4f7a40),0.6);}
    cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;}
  g.setAttribute('color',new THREE.BufferAttribute(cols,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,MATS.rock);m.position.z=-HD+0.02;m.receiveShadow=true;m.castShadow=false;tank.add(m);})();
/* the back of the background panel: seen only when the camera orbits behind the tank (faces outward, so it
   never shows from the front). Like a real terrarium's foam backdrop it closes the tank off from behind. */
(function(){const H=TOP-BOT,c=ctex(256,256,(g,w,h)=>{g.fillStyle='#2c2f2b';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=30+Math.random()*26|0;g.fillStyle=`rgb(${v},${v+2},${v+1})`;g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2+Math.random()*3);}});
  c.wrapS=c.wrapT=THREE.RepeatWrapping;c.repeat.set(W/4,H/4);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(W+0.07,H),new THREE.MeshStandardMaterial({map:c,roughness:0.95,metalness:0}));m.rotation.y=Math.PI;m.position.set(0,(TOP+BOT)/2,-HD-0.015);m.userData.noFit=true;tank.add(m);})();
/* ---- climate backdrop: a window onto the world behind the tank ----
   The back panel is not a picture: every pixel traces the line of sight from the camera through the glass into a
   3D world outside — a sky dome, two layers of drifting clouds on high planes, distant hills at two depths and the
   plain they stand on. So the horizon sits at eye level and everything shifts with parallax as you orbit, like a
   real window. The sun follows the same path as the light in the tank (rising on the right, setting on the left),
   kept low enough to stay in view; dusk reddens the horizon, then the moon and twinkling stars come out. Each
   climate has its own sky, ground and hills (desert mesas and heat haze, meadow clouds and hills, marsh mist and
   reeds, rainforest trunks and light shafts); the ocean is an underwater view with light shafts, a shimmering
   surface and drifting particles at several depths. The same colours drive the light inside the tank (see
   skyLight): the sky's ambient light, its reflections and a rim light shining through from behind. */
const BD_FS=`varying vec2 vUv;varying vec3 vWP;
uniform float uT,uGain,uOcean,uOver,uDay,uDusk,uHD,uGY,uLift;uniform vec3 uSun;uniform sampler2D uZW;
float h21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float fbm3(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*vn(p);p=p*2.07+vec2(5.1,1.3);a*=.5;}return v;}
vec3 lin(vec3 c){return pow(c,vec3(2.2));}
/* hit a vertical plane z=zp behind the tank; returns hit point (w = distance) */
vec4 hitZ(vec3 ro,vec3 rd,float zp){float t=(zp-ro.z)/min(rd.z,-1e-4);return vec4(ro+rd*t,t);}
void main(){vec3 ro=cameraPosition,rd=normalize(vWP-cameraPosition);vec2 uv=vUv;vec3 col;
 if(!gl_FrontFacing||rd.z>-0.02){gl_FragColor=vec4(lin(vec3(.03,.035,.04))*uGain,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  return;}
 float day=uDay,night=1.-day,sd=max(dot(rd,uSun),0.);
 if(uOcean>.5){
  float up=rd.y;vec3 deep=lin(vec3(.03,.26,.52)),mid=lin(vec3(.10,.58,.86)),top=lin(vec3(.42,.88,.97));
  col=mix(deep,mid,smoothstep(-.45,.15,up));col=mix(col,top,smoothstep(.1,.7,up));
  col=mix(mix(lin(vec3(.0,.02,.06)),lin(vec3(.02,.10,.22)),smoothstep(-.4,.6,up)),col,day);
  if(rd.y>.02){vec3 s=ro+rd*((24.-ro.y)/rd.y);float c=fbm3(s.xz*.18+vec2(uT*.06,uT*.04))*fbm3(s.xz*.31-vec2(uT*.05,-uT*.03));col+=smoothstep(.12,.32,c)*lin(vec3(.85,1.,1.))*(.35*day+.04)*smoothstep(.02,.5,rd.y);}
  for(int i=0;i<3;i++){float D=float(i)==0.?6.:float(i)==1.?16.:38.;vec4 h=hitZ(ro,rd,-uHD-D);float s=h.x+h.y*.38+sin(uT*.14+float(i))*.6;
   float r=fbm3(vec2(s*(.55-float(i)*.12),uT*.04+float(i)*3.))*fbm3(vec2(s*1.1+3.,uT*.06+float(i)));float fog=exp(-h.w*.02);
   col+=smoothstep(.16,.38,r)*smoothstep(-2.,22.,h.y)*lin(vec3(.85,1.,1.))*(.22*day+.03)*fog;
   vec2 q=vec2(h.x*2.2,h.y*2.2-uT*(.25-float(i)*.06)+float(i)*7.),c=floor(q),o=fract(q)-vec2(h21(c+1.7+float(i)),h21(c+5.3));
   col+=step(.9,h21(c+float(i)*13.))*smoothstep(.09,0.,length(o*vec2(1.,1.6)))*lin(vec3(.85,.95,1.))*(.35*day+.08)*fog;}
  vec4 rf=hitZ(ro,rd,-uHD-30.);float rr=-1.+3.2*fbm3(vec2(rf.x*.07,4.));col=mix(col,col*.45+lin(vec3(.02,.08,.16))*.2,smoothstep(rr+.4,rr-.4,rf.y)*.75);
  col=mix(col,mix(lin(vec3(.0,.03,.07)),lin(vec3(.05,.32,.58)),day),1.-exp(-max(0.,-rd.y)*1.5));
 }else{
  vec4 zw=texture2D(uZW,vec2(uv.x,.5));zw/=max(1e-3,zw.x+zw.y+zw.z+zw.w);
  rd=normalize(rd+vec3(0.,uLift,0.));sd=max(dot(rd,uSun),0.);
  float e=max(rd.y,0.);
  vec3 zen=lin(zw.x*vec3(.12,.37,.80)+zw.y*vec3(.17,.44,.86)+zw.z*vec3(.37,.53,.67)+zw.w*vec3(.34,.52,.40));
  vec3 hor=lin(zw.x*vec3(.80,.84,.88)+zw.y*vec3(.68,.83,.95)+zw.z*vec3(.76,.83,.82)+zw.w*vec3(.66,.78,.60));vec3 haze=lin(zw.x*vec3(.96,.84,.66)+zw.y*vec3(.85,.9,.9)+zw.z*vec3(.84,.87,.84)+zw.w*vec3(.72,.8,.64));
  vec3 sky=mix(hor,zen,pow(smoothstep(0.,.32,e),.55));
  sky=mix(haze,sky,smoothstep(0.,.07,e));
  sky=mix(mix(lin(vec3(.06,.08,.16)),lin(vec3(.012,.02,.06)),smoothstep(0.,.5,e)),sky,day);
  vec3 sunC=mix(lin(vec3(1.,.5,.24)),lin(vec3(1.,.95,.85)),smoothstep(.02,.4,uSun.y));
  sky=mix(sky,sky*lin(vec3(1.,.62,.45))*1.5,uDusk*(1.-smoothstep(0.,.3,e)));
  sky+=sunC*(pow(sd,8.)*.22+pow(sd,60.)*.4)*(.4+.6*day+uDusk)*(1.-uOver*.8);
  sky=mix(sky,lin(vec3(.56,.6,.64))*(.18+.8*day),uOver*.6);
  if(night>.01){vec3 md=normalize(vec3(-uSun.x,max(-uSun.y,.05),uSun.z));float mdd=max(dot(rd,md),0.);
   sky+=night*(1.-uOver)*(lin(vec3(.9,.93,1.))*smoothstep(.99955,.9997,mdd)*1.2+lin(vec3(.3,.4,.7))*pow(mdd,40.)*.3);
   vec2 g=vec2(atan(rd.x,-rd.z),asin(rd.y))*180.,c=floor(g),o=fract(g)-.5;float h=h21(c);
   sky+=night*(1.-uOver)*step(.93,h)*smoothstep(.16,0.,length(o-(vec2(h21(c+3.1),h21(c+7.3))-.5)*.6))*(.55+.45*sin(uT*(1.2+h*3.)+h*40.))*smoothstep(0.,.08,e);}
  if(uSun.y>-.04)sky+=sunC*smoothstep(.99965,.99985,sd)*6.*(1.-uOver*.9);
  float cAmt=clamp(zw.x*.12+zw.y*.6+zw.z*.5+zw.w*.3+uOver*.75,0.,1.);
  if(rd.y>.003){
   vec3 p1=ro+rd*((70.-ro.y)/rd.y);vec2 cp=p1.xz*.016+vec2(uT*.006,uT*.002);float cn=fbm(cp+vec2(fbm(cp*.5+uT*.003)*.8,0.));
   float cl=smoothstep(.62-cAmt*.22,.88-cAmt*.18,cn)*min(1.,cAmt*2.2)*smoothstep(.003,.1,rd.y);
   float sh=smoothstep(.35,.8,fbm(cp*1.4+vec2(.25,.1)));vec3 cc=mix(lin(vec3(.05,.06,.09)),mix(lin(vec3(.6,.64,.7)),lin(vec3(1.,.99,.97)),sh)+sunC*pow(sd,6.)*.5,day)+uDusk*lin(vec3(1.,.48,.32))*.5*(1.-uOver);
   sky=mix(sky,mix(cc,lin(vec3(.5,.54,.58))*(.2+.75*day),uOver*.5),cl*.9);
   vec3 p2=ro+rd*((160.-ro.y)/rd.y);float ci=fbm3(p2.xz*vec2(.004,.012)+vec2(uT*.002,0.));sky=mix(sky,mix(lin(vec3(.12,.14,.2)),lin(vec3(1.,.98,.95)),day)+uDusk*lin(vec3(1.,.5,.4))*.4,smoothstep(.55,.85,ci)*.35*(zw.y+zw.x*.6+zw.z*.5)*smoothstep(.02,.2,rd.y));}
  vec3 hz=mix(lin(vec3(.05,.06,.1)),hor,day);col=sky;
  if(rd.y<0.){vec3 pg=ro+rd*((uGY-ro.y)/rd.y);float dg=length(pg.xz-ro.xz);
   vec3 gc=lin(zw.x*vec3(.86,.70,.50)+zw.y*vec3(.42,.58,.30)+zw.z*vec3(.40,.50,.38)+zw.w*vec3(.18,.30,.16));float gn=fbm3(pg.xz*.05),gr=fbm3(pg.xz*.4);
   gc*=.72+.4*gn+.12*gr;gc*=1.+zw.x*.12*sin(pg.x*.35+gn*6.+pg.z*.1);gc=mix(gc,gc*vec3(.75,.9,.7),zw.y*smoothstep(.55,.7,fbm3(pg.xz*.15))*.6);
   col=mix(mix(lin(vec3(.02,.025,.03)),gc,day),hz,1.-exp(-dg*.011));}
  float hdesert=zw.x,hjung=zw.w;
  vec4 f=hitZ(ro,rd,-uHD-120.);float fh=uGY+(10.+16.*fbm3(vec2(f.x*.01,1.3)))*(zw.y*.8+zw.z*.5+hjung*1.3+hdesert*.45)+smoothstep(.5,.56,fbm3(vec2(f.x*.006,7.)))*18.*hdesert;
  vec3 fc=mix(lin(vec3(.03,.04,.07)),mix(lin(zw.x*vec3(.8,.58,.42)+zw.y*vec3(.48,.6,.6)+zw.z*vec3(.46,.55,.52)+zw.w*vec3(.26,.38,.28)),hor,.5),day);
  col=mix(col,fc,smoothstep(fh+.6,fh-.6,f.y)*step(0.,-rd.z));
  vec4 n=hitZ(ro,rd,-uHD-40.);float nh=uGY+(2.+6.*fbm3(vec2(n.x*.035,2.)))*(zw.x*.7+zw.y+zw.z*.6+hjung*1.2);
  float trees=(zw.y*.6+zw.z*.8)*smoothstep(.55,.62,fbm3(vec2(n.x*.3,9.)))*1.6;nh+=trees;
  vec3 nc=mix(lin(vec3(.02,.03,.05)),mix(lin(zw.x*vec3(.88,.7,.5)+zw.y*vec3(.36,.55,.28)+zw.z*vec3(.32,.44,.33)+zw.w*vec3(.16,.28,.15)),hor,.25),day);
  col=mix(col,nc,smoothstep(nh+.25,nh-.25,n.y));
  if(hdesert>.05&&day>.1){float wob=sin(n.x*2.+uT*4.)*.04*hdesert*day;col=mix(col,hor,smoothstep(nh+.5,nh-.5,n.y+wob)*.06);}
  if(hjung>.01){for(int i=0;i<3;i++){float D=float(i)==0.?5.:float(i)==1.?13.:28.;vec4 h=hitZ(ro,rd,-uHD-D);
    float tr=smoothstep(.62,.66,fbm3(vec2(h.x*(.45-float(i)*.1),float(i)*5.)));float leaf=smoothstep(.48,.7,fbm3(vec2(h.x,h.y)*(.35-float(i)*.08)+vec2(uT*.01,float(i))))*smoothstep(uGY+4.,uGY+14.,h.y);
    vec3 lc=mix(lin(vec3(.01,.025,.02)),mix(lin(vec3(.12-float(i)*.02,.24,.12)),hor,.15+float(i)*.22),day);float a=clamp(tr+leaf,0.,1.)*hjung*step(uGY-1.,h.y);col=mix(col,lc,a*(.9-float(i)*.15));}
   float s=rd.x/-rd.z+rd.y*.6,shf=fbm3(vec2(s*3.,uT*.03))*fbm3(vec2(s*6.5+1.,uT*.05+5.));col+=hjung*day*smoothstep(.16,.34,shf)*smoothstep(-.05,.5,rd.y)*lin(vec3(1.,.97,.8))*.22;
   col=mix(col,hor*.9,hjung*.18*day);}
 }
 float fr=smoothstep(0.,.025,uv.x)*smoothstep(1.,.975,uv.x)*smoothstep(1.,.97,uv.y);col*=mix(.72,1.,fr);
 gl_FragColor=vec4(col*uGain,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const BD={mesh:null,mat:null,zt:null,gain:1,over:0,zavg:[0,1,0,0],u:{uT:{value:0},uSun:{value:new THREE.Vector3(0,0.3,-1)},uDay:{value:1},uDusk:{value:0},uGain:{value:1},uOcean:{value:OCEAN?1:0},uZW:{value:null},uHD:{value:HD},uGY:{value:2.2},uOver:{value:0},uLift:{value:0.24}}};
const BD_W=x=>{if(CREATE){let a=[0,0,0,0];for(const z of[-HD+0.6,-HD+2,-HD+4]){const w=zoneW(creU(x,z));for(let i=0;i<4;i++)a[i]+=w[i]/3;}return a;}
  if(MODE.zone!=null){const a=[0,0,0,0];a[MODE.zone]=1;return a;}let a=[0,0,0,0];for(const z of[-HD+0.5,-HD+2.5]){const w=zoneW(zu(x,z));for(let i=0;i<4;i++)a[i]+=w[i]/2;}return a;};
/* (re)compute which climate sits behind each column; cheap, so the creative tank can call it after painting */
function bdBuild(){const N=128,raw=[];for(let i=0;i<N;i++)raw.push(OCEAN?[0,1,0,0]:BD_W(-HW+(i+0.5)/N*W));
  const d=BD.zt?BD.zt.image.data:new Uint8Array(N*4);BD.zavg=[0,0,0,0];for(let i=0;i<N;i++){const a=[0,0,0,0];let n=0;for(let k=-4;k<=4;k++){const r=raw[clamp(i+k,0,N-1)];for(let c=0;c<4;c++)a[c]+=r[c];n++;}for(let c=0;c<4;c++){d[i*4+c]=Math.round(255*a[c]/n);BD.zavg[c]+=a[c]/n/N;}}
  let gy=0;for(let i=0;i<=GX;i+=6)gy+=HG[2*GR+i];BD.u.uGY.value=OCEAN?-2:gy/(GX/6+1)+0.4;
  if(!BD.zt){BD.zt=new THREE.DataTexture(d,N,1,THREE.RGBAFormat);BD.zt.magFilter=BD.zt.minFilter=THREE.LinearFilter;BD.u.uZW.value=BD.zt;}BD.zt.needsUpdate=true;
  if(!BD.mat){BD.mat=new THREE.ShaderMaterial({uniforms:BD.u,vertexShader:'varying vec2 vUv;varying vec3 vWP;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:BD_FS,fog:false,side:THREE.DoubleSide});
    BD.mesh=new THREE.Mesh(new THREE.PlaneGeometry(W,TOP-BOT),BD.mat);BD.mesh.position.set(0,(TOP+BOT)/2,-HD+0.012);BD.mesh.userData.noFit=true;tank.add(BD.mesh);}
  skyLightDirty=true;}
/* sun on the backdrop: same east-to-west path as the light in the tank, but behind it and at most ~32° high */
function bdSunDir(t){const f=(t-0.25)/0.5,az=lerp(1.15,-1.15,f),el=Math.sin(Math.PI*f)*0.56-0.06+(f<0||f>1?-0.3:0);return new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),-Math.cos(az)*Math.cos(el)).normalize();}
var skyLightDirty=true;
bdBuild();
/* every frame: sun / moon from the clock, clouds from the weather; the light fades in and out when switched */
function bdUpdate(dl,rdt){rdt=rdt==null?0.016:Math.min(rdt,0.1);const u=BD.u;u.uT.value=performance.now()/1000%10000;
  const s=bdSunDir(env.time);u.uSun.value.copy(s);u.uDay.value=smooth(-0.12,0.18,s.y);u.uDusk.value=Math.exp(-Math.pow((s.y-0.04)/0.13,2))*(1-0.5*BD.over);
  const on=env.bgOn!==false,tg=on?0.92:0.11;BD.gain+=(tg-BD.gain)*(1-Math.exp(-rdt*2.2));if(Math.abs(tg-BD.gain)<0.002)BD.gain=tg;u.uGain.value=BD.gain;
  const ov=typeof rain!=='undefined'&&rain.global>0?clamp(rain.intensity,0.3,1):0;BD.over+=(ov-BD.over)*(1-Math.exp(-rdt*0.8));u.uOver.value=BD.over;
  skyLight(rdt);}
/* ---- light from the sky: the same colours light the tank ----
   hemisphere light (sky above, ground below), a rim light shining in through the back glass, and an image-based
   environment (ambient + reflections) rendered from a simple version of the sky and re-made every couple of
   seconds as the day moves on. */
const skyRim=new THREE.DirectionalLight(0xffffff,0);skyRim.position.set(0,32,-22);scene.add(skyRim,skyRim.target);
const SKYC={zen:new Col(),hor:new Col(),gnd:new Col(),sun:new Col(),t:new Col()};
function skyColors(){const z=BD.zavg,u=BD.u,day=u.uDay.value,dusk=u.uDusk.value,ov=BD.over,mixc=(cs)=>{SKYC.t.setRGB(0,0,0);for(let i=0;i<4;i++){SKYC.t.r+=cs[i][0]*z[i];SKYC.t.g+=cs[i][1]*z[i];SKYC.t.b+=cs[i][2]*z[i];}return SKYC.t;};
  if(OCEAN){SKYC.zen.setRGB(0.42,0.88,0.97);SKYC.hor.setRGB(0.10,0.58,0.86);SKYC.gnd.setRGB(0.03,0.26,0.52);}
  else{SKYC.zen.copy(mixc([[.12,.37,.80],[.17,.44,.86],[.37,.53,.67],[.34,.52,.40]]));SKYC.hor.copy(mixc([[.85,.84,.8],[.72,.86,.95],[.78,.84,.82],[.66,.78,.60]]));SKYC.gnd.copy(mixc([[.86,.70,.50],[.42,.58,.30],[.40,.50,.38],[.18,.30,.16]]));}
  for(const k of['zen','hor','gnd'])SKYC[k].convertSRGBToLinear();
  const nz=new Col(0.012,0.02,0.06).convertSRGBToLinear(),nh=new Col(0.06,0.08,0.16).convertSRGBToLinear(),grey=new Col(0.56,0.6,0.64).convertSRGBToLinear();
  SKYC.zen.lerp(grey,ov*0.6).lerp(nz,1-day);SKYC.hor.lerp(grey,ov*0.6).lerp(nh,1-day);SKYC.gnd.multiplyScalar(0.25+0.75*day);
  SKYC.hor.lerp(SKYC.t.setRGB(1,0.48,0.25),dusk*0.55);SKYC.sun.setRGB(1,0.55,0.3).lerp(SKYC.t.setRGB(1,0.95,0.85),smooth(0.02,0.4,u.uSun.value.y));}
let skyEnvT=1e9,skyEnvKey='',skyEnvPM=null,skyEnvRT=null,skyEnvScene=null,skyEnvMat=null;
function skyLight(rdt){skyColors();const day=BD.u.uDay.value,g=BD.gain;
  hemi.color.copy(SKYC.zen).lerp(SKYC.hor,0.35).lerp(SKYC.t.set(0x5a6f9e),1-day);hemi.groundColor.copy(SKYC.gnd).multiplyScalar(0.6).lerp(SKYC.t.set(0x2a2620),1-day);
  skyRim.color.copy(SKYC.hor).lerp(SKYC.sun,BD.u.uDusk.value*0.6);skyRim.intensity=(OCEAN?0.35:0.5)*g*(0.15+0.85*day);
  skyEnvT+=rdt;const key=Math.round(env.time*120)+'|'+Math.round(g*10)+'|'+Math.round(BD.over*5);
  if((key!==skyEnvKey||skyLightDirty)&&skyEnvT>(QK==='low'?4:1.5)){skyEnvT=0;skyEnvKey=key;skyLightDirty=false;skyEnvBuild();}}
function skyEnvBuild(){try{if(!skyEnvPM){skyEnvPM=new THREE.PMREMGenerator(renderer);skyEnvScene=new THREE.Scene();
    skyEnvMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uZen:{value:new Col()},uHor:{value:new Col()},uGnd:{value:new Col()},uSunC:{value:new Col()},uSun:{value:new THREE.Vector3()},uG:{value:1}},
      vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec3 vD;uniform vec3 uZen,uHor,uGnd,uSunC,uSun;uniform float uG;void main(){vec3 d=normalize(vD);float e=d.y;vec3 c=e>0.?mix(uHor,uZen,pow(smoothstep(0.,.6,e),.6)):mix(uHor,uGnd,smoothstep(0.,.25,-e));c+=uSunC*pow(max(dot(d,uSun),0.),24.)*1.5;c=mix(c,c*.7+vec3(.03),smoothstep(.3,-.3,d.z)*.0);gl_FragColor=vec4(c*uG,1.);}'});
    skyEnvScene.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),skyEnvMat));}
  const u=skyEnvMat.uniforms,lum=0.6;u.uZen.value.copy(SKYC.zen);u.uHor.value.copy(SKYC.hor);u.uGnd.value.copy(SKYC.gnd);u.uSunC.value.copy(SKYC.sun).multiplyScalar(BD.u.uDay.value*(1-BD.over*0.8));u.uSun.value.copy(BD.u.uSun.value);
  /* keep the overall brightness of the old studio light; only the colour and direction come from the sky */
  const m=Math.max(0.05,(SKYC.zen.r+SKYC.zen.g+SKYC.zen.b+SKYC.hor.r+SKYC.hor.g+SKYC.hor.b)/6);u.uG.value=lum/Math.max(m,0.004)*(0.55+0.45*BD.u.uDay.value);
  const old=skyEnvRT;skyEnvRT=skyEnvPM.fromScene(skyEnvScene,0.02);scene.environment=skyEnvRT.texture;if(old)old.dispose();}catch(e){console.warn('sky env',e);}}

/* hanging vines */
if(MODE.vines&&CLIFF_X<HW)(function(){const M=new Mesher(),MS=new Mesher(),stemC=new Col(0x4a5a2a);const vr=[Math.max(MODE.vines[0],CLIFF_X+2.6),MODE.vines[1]],nv=Math.round((18*Q.scatter+4)*(vr[1]-vr[0])/11*(MK==='marsh'?0.35:MK==='jungle'?1.15:0.8));
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
].forEach(r=>{if(OCEAN||CREATE)return;let col=r[3],moss=!!r[5];if(MODE.zone!=null){const zc=[[0xb07a58,false],[0x857563,false],[0x77756c,true],[0x6a6c66,true]][MODE.zone];col=zc[0];moss=zc[1];}addRock(r[0],r[1],r[2],col,moss,r[4]);});
const LIVE_ROCK=[0x5e4466,0x543e62,0x6a4660,0x4a3e5e],LIVEROCKS=[];function liveRockGeo(r,seed){const g=rockGeo(r,pick(LIVE_ROCK),false,seed);const nr=g.attributes.normal,cl=g.attributes.color,p=g.attributes.position;for(let i=0;i<cl.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);const f=fbm(x*2+seed,z*2+y,2);if(f>0.58)cl.setXYZ(i,0.78,0.26,0.46);else if(f>0.5&&nr.getY(i)>0.2)cl.setXYZ(i,0.42,0.24,0.6);else if(f<0.32&&nr.getY(i)>0.3)cl.setXYZ(i,0.24,0.42,0.26);}return g;}
function addLiveRock(x,z,r,sy){const m=new THREE.Mesh(liveRockGeo(r,rand(0,90)),MATS.rock);m.scale.set(1,sy||0.8,1);m.position.set(x,heightAt(x,z)-r*0.15,z);m.rotation.y=rand(0,6);m.castShadow=m.receiveShadow=true;tank.add(m);stampAO(x,z,r*1.5,0.3);const ob={x,z,r:r*0.85,top:m.position.y+r*(sy||0.8),g:heightAt(x,z),rock:true};OBST.push(ob);LIVEROCKS.push(ob);return m;}
if(OCEAN){[[12,-6,2.4,1],[15.5,1,1.8,0.9],[9,3.5,1.3,0.8],[14,6.5,1.1,0.8],[5,-4,1,0.7],[-2,-7,1.2,0.8],[-9,5,0.7,0.7],[-13,-5,0.9,0.7],[2,6,0.6,0.7],[7.5,-8.5,1.4,0.9]].forEach(r=>addLiveRock(...r));
  const M=new Mesher();const ap=[new V3(3.2,0,-1.5),new V3(4.2,2.2,-1.2),new V3(6.2,2.6,-0.8),new V3(7.4,0,-0.4)];ap[0].y=heightAt(3.2,-1.5)-0.2;ap[3].y=heightAt(7.4,-0.4)-0.2;addTubeR(M,ap,[0.75,0.5,0.45,0.7],WHITE,16,1,0,3);const ag=M.geo();colorize(ag,0x7a6a78,0.25,(x,y,z,c)=>{const f=fbm(x*1.5,z*1.5+y,2);if(f>0.55)c.set(0xb86a86);else if(f<0.35)c.set(0x5a7a4a);});const arch=new THREE.Mesh(ag,MATS.rock);arch.castShadow=arch.receiveShadow=true;tank.add(arch);OBST.push({x:3.3,z:-1.5,r:0.6,top:1.5},{x:7.3,z:-0.4,r:0.6,top:1.5});stampAO(3.3,-1.5,1.2,0.3);stampAO(7.3,-0.4,1.2,0.3);}
const HEATROCKS=[];const heatRock={x:-12.3,z:3.2,bulb:{material:{}},mesh:null};
const heatMat=new THREE.MeshStandardMaterial({map:TX.rock,normalMap:TX.rockN,vertexColors:true,roughness:0.85,emissive:0xff5a1c,emissiveIntensity:0.05});
function addHeatRock(hr,withLight){const heatRock=hr;const m=new THREE.Mesh(rockGeo(1.05,0x8d5b3d,false,7),heatMat);m.scale.set(1.2,0.3,0.95);m.position.set(heatRock.x,heightAt(heatRock.x,heatRock.z)-0.05,heatRock.z);m.castShadow=m.receiveShadow=true;tank.add(m);heatRock.y=m.position.y+0.3;heatRock.mesh=m;stampAO(heatRock.x,heatRock.z,1.6,0.3);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(0.45,24,12,0,6.283,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x202422,metalness:0.8,roughness:0.35,side:THREE.DoubleSide}));dome.position.set(heatRock.x,TOP-0.2,heatRock.z);tank.add(dome);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.16,16,10),new THREE.MeshStandardMaterial({color:0x221100,emissive:0xff9a40,emissiveIntensity:2}));bulb.position.set(heatRock.x,TOP-0.3,heatRock.z);tank.add(bulb);heatRock.bulb=bulb;
  if(withLight){heatLight.position.set(heatRock.x,TOP-0.4,heatRock.z);heatLight.target.position.set(heatRock.x,heatRock.y,heatRock.z);}HEATROCKS.push(heatRock);OBST.push(heatRock.obst={x:heatRock.x,z:heatRock.z,r:0.7,top:heatRock.y});heatRock.parts=[m,dome,bulb];return heatRock;}
if(MODE.heat&&!CREATE)addHeatRock(heatRock,true);
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
setMsg(TR`注水…`);await tick();
/* Water is drawn with depth: a half-float texture on the height grid holds the ground height (R) and the
   water surface height (G). The water shader looks up how deep it is under every pixel — clear and pale at
   the shore, fading softly into the bank, darker and greener where deep — with two layers of moving
   ripples, rain rings, Fresnel reflections and a thin bright contact line. The ground shader uses the same
   texture for caustics on the bed and a dark wet band just above the waterline. */
const WTEX_DATA=new Uint16Array(GR*(GZ+1)*2),WTEX=new THREE.DataTexture(WTEX_DATA,GR,GZ+1,THREE.RGFormat,THREE.HalfFloatType);
WTEX.minFilter=WTEX.magFilter=THREE.LinearFilter;WTEX.generateMipmaps=false;
const _hf=THREE.DataUtils.toHalfFloat,WPM=MODE.pond?new Uint8Array(GR*(GZ+1)):null,WSL=MODE.stream?new Float32Array(GR*(GZ+1)).fill(-50):null,WSP=MODE.stream?new Uint8Array(GR*(GZ+1)):null;
if(WPM){const R=POND.r*2.2;for(let j=0;j<=GZ;j++){const z=-HD+j*D/GZ;if(Math.abs(z-POND.z)>R)continue;for(let i=0;i<=GX;i++){const x=-HW+i*W/GX;if(Math.abs(x-POND.x)<R&&pondD(x,z)<1.5)WPM[j*GR+i]=1;}}}
if(WSL){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of STREAM){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.y);z1=Math.max(z1,p.y);}
  for(let j=0;j<=GZ;j++){const z=-HD+j*D/GZ;if(z<z0-1.5||z>z1+1.5)continue;for(let i=0;i<=GX;i++){const x=-HW+i*W/GX;if(x<x0-1.5||x>x1+1.5)continue;const g=j*GR+i,q=streamQ(x,z);if(q.d<0.75)WSL[g]=streamY(q.s)+0.015;if(Math.hypot(x-POOL.x,z-POOL.z)<POOL.r*1.5){WSL[g]=Math.max(WSL[g],SY0);WSP[g]=1;}}}}
function wtexHeights(){for(let i=0;i<HG.length;i++)WTEX_DATA[i*2]=_hf(HG[i]);WTEX.needsUpdate=true;}
let _wtKey='';
function wtexLevels(force){const pondOn=MODE.pond&&env.pond>0.02,key=(pondOn?env.waterY.toFixed(2):'-')+'|'+(env.pump?1:0)+'|'+creWaterVer;if(!force&&key===_wtKey)return;_wtKey=key;
  const py=pondOn?env.waterY:-50;for(let i=0;i<HG.length;i++){let l=-50;if(WPM&&WPM[i])l=py;if(WSL&&WSL[i]>-49&&(env.pump||WSP[i]))l=Math.max(l,WSL[i]);if(CWL&&CWL[i]>l)l=CWL[i];WTEX_DATA[i*2+1]=_hf(l);}WTEX.needsUpdate=true;}
wtexHeights();
const WRAIN={value:new THREE.Vector4(0,0,0,0)},WTS={value:new THREE.Vector4(HW,HD,GX/W,GZ/D)};
const WATER_GLSL=`uniform sampler2D uWTex;uniform vec4 uWTs;uniform vec4 uWRain;uniform float uWT;
vec2 wtUV(vec2 xz){return((xz+uWTs.xy)*uWTs.zw+0.5)/vec2(${GR}.0,${GZ+1}.0);}
float wHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec2 wRipples(vec2 p,float t){vec2 g=vec2(0.0);vec2 c=floor(p);for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 cc=c+vec2(float(i),float(j));float h=wHash(cc);vec2 o=cc+vec2(wHash(cc+3.1),wHash(cc+7.7));float ph=fract(t*0.8+h);vec2 d=p-o;float L=length(d),r=ph*0.95;float w=sin((L-r)*30.0)*exp(-pow((L-r)*8.0,2.0))*(1.0-ph)*(1.0-ph);g+=d/max(L,1e-3)*w;}return g;}
`;
/* o: shal/deep colours, abs (absorption per unit depth), ns (ripple strength), flow (stream: ripples follow the uv),
   clear (ocean surface: always see-through), fixed (constant depth, for a basin that is not on the terrain) */
function makeWaterMat(o){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:o.rough||0.035,metalness:0,transparent:true,normalMap:o.flow?o.flow:TX.waterN,normalScale:new V2(o.ns||0.4,o.ns||0.4),envMapIntensity:o.env||1.3,depthWrite:false,side:o.side||THREE.FrontSide});
  const u={uWTex:{value:WTEX},uWTs:WTS,uWRain:WRAIN,uWT:U.uTime,uWShal:{value:new Col(o.shal)},uWDeep:{value:new Col(o.deep)},uWAbs:{value:o.abs||1.6},uWNS:{value:o.ns||0.4},uWFix:{value:o.fixed||0},uWClear:{value:o.clear?1:0},uWFlow:{value:o.flow?1:0}};
  m.userData.wu=u;m.userData.water=true;
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
    sh.vertexShader='varying vec3 vWW;\nvarying vec2 vWUv;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWUv=uv;vWW=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying vec3 vWW;\nvarying vec2 vWUv;\nuniform vec3 uWShal;uniform vec3 uWDeep;uniform float uWAbs;uniform float uWNS;uniform float uWFix;uniform float uWClear;uniform float uWFlow;\n'+WATER_GLSL+sh.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
float wD=uWFix>0.0?uWFix:vWW.y-texture2D(uWTex,wtUV(vWW.xz)).r;
if(wD<=0.0&&uWClear<0.5)discard;
float wShore=uWClear>0.5?1.0:smoothstep(0.0,0.08,wD);
float wT=uWClear>0.5?1.0:1.0-exp(-wD*uWAbs);
diffuseColor.rgb=mix(uWShal,uWDeep,wT);
diffuseColor.a=(uWClear>0.5?0.05:mix(0.05,0.82,wT))*wShore;
vec2 wg=vec2(0.0);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
if(uWFlow<0.5){vec3 wn1=texture2D(normalMap,vWW.xz*0.17+uWT*vec2(0.016,0.010)).xyz*2.0-1.0;vec3 wn2=texture2D(normalMap,vWW.xz*0.43+uWT*vec2(-0.024,0.019)).xyz*2.0-1.0;
  wg=(wn1.xy*0.55+wn2.xy*0.45)*uWNS;float wr=uWRain.w*(1.0-smoothstep(uWRain.z*0.8,uWRain.z,length(vWW.xz-uWRain.xy)));if(wr>0.01)wg+=wRipples(vWW.xz*1.8,uWT)*0.55*wr;
  vec3 wnw=normalize(vec3(-wg.x,1.0,-wg.y));if(!gl_FrontFacing)wnw=-wnw;normal=normalize((viewMatrix*vec4(wnw,0.0)).xyz);}`)
      .replace('#include <opaque_fragment>',`float wFr=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),5.0);
float wSp=dot(reflectedLight.directSpecular+reflectedLight.indirectSpecular,vec3(0.3,0.59,0.11));
if(gl_FrontFacing){outgoingLight-=(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse)*wFr*0.85;diffuseColor.a=clamp(max(diffuseColor.a,(0.04+0.96*wFr)*0.85*wShore)+wSp*0.9*wShore,0.0,1.0);
  if(uWClear<0.5&&uWFix<=0.0)outgoingLight+=vec3(0.75,0.85,0.82)*(1.0-smoothstep(0.0,0.025,wD))*0.22*wShore;}
else diffuseColor.a=0.16+0.55*smoothstep(0.02,0.3,length(wg))+0.3*wFr;
#include <opaque_fragment>`);};
  m.customProgramCacheKey=()=>'water3'+(o.flow?'f':'');return m;}
/* ground under water: caustics, depth tint; ground just above it: darker because it is wet */
function wetBed(m){if(OCEAN||!m||m.userData.wet||!m.isMeshStandardMaterial)return m;m.userData.wet=true;const prev=m.onBeforeCompile,hk=m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey,pk=hk?m.customProgramCacheKey():'';
  m.onBeforeCompile=(sh,r)=>{if(prev&&prev!==THREE.Material.prototype.onBeforeCompile)prev.call(m,sh,r);sh.uniforms.uWTex={value:WTEX};sh.uniforms.uWTs=WTS;sh.uniforms.uWRain=WRAIN;sh.uniforms.uWT=U.uTime;
    if(!sh.vertexShader.includes('vBW'))sh.vertexShader='varying vec3 vBW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 _bw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n_bw=instanceMatrix*_bw;\n#endif\nvBW=(modelMatrix*_bw).xyz;');
    sh.fragmentShader='varying vec3 vBW;\n'+WATER_GLSL+CAUS_GLSL+sh.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
{float bL=texture2D(uWTex,wtUV(vBW.xz)).g,bD=bL-vBW.y;
 if(bL>-40.0&&bD>-0.14){float wetK=smoothstep(-0.14,0.0,bD);reflectedLight.directDiffuse*=mix(1.0,0.58,wetK);reflectedLight.indirectDiffuse*=mix(1.0,0.62,wetK);
  if(bD>0.0){float k=1.0-exp(-bD*1.3);float cz=causticF(vBW.xz*1.7+vec2(uWT*0.04,0.0),uWT*0.55)*0.6+causticF(vBW.zx*2.4+3.1,uWT*0.68+1.7)*0.4;
   reflectedLight.directDiffuse*=(0.55+cz*4.0*(1.0-k*0.7))*mix(vec3(1.0),vec3(0.5,0.72,0.68),k);reflectedLight.indirectDiffuse*=mix(vec3(1.0),vec3(0.45,0.63,0.6),k);reflectedLight.directSpecular*=1.0-k*0.8;}}}`);};
  m.customProgramCacheKey=()=>pk+'|wet';m.needsUpdate=true;return m;}
const WCOL={pond:[0x6a9a8c,0x174a44],algae:[0x7a944a,0x29461a]};
const waterMat=makeWaterMat({shal:WCOL.pond[0],deep:WCOL.pond[1],abs:1.5,ns:0.38});
TX.waterN.repeat.set(4,4);
const water=new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.5,POND.r)*1.6,96),waterMat);water.rotation.x=-Math.PI/2;water.position.set(POND.x,env.waterY,POND.z);water.renderOrder=2;tank.add(water);
const flowTex=TX.waterN.clone();flowTex.needsUpdate=true;flowTex.repeat.set(1,1);
const streamMat=makeWaterMat({shal:0x6a978b,deep:0x123a35,abs:2.6,ns:0.55,flow:flowTex,rough:0.05});
const poolMat=makeWaterMat({shal:0x6a978b,deep:0x0f3532,abs:1.8,ns:0.5});
/* creative ponds: one flat sheet per pond, a coarse grid over the flooded cells (the shader draws the shore) */
var creWaterMat=CREATE?makeWaterMat({shal:WCOL.pond[0],deep:WCOL.pond[1],abs:1.5,ns:0.38}):null;const creWaterObjs=[];
function creWaterMeshes(){for(const o of creWaterObjs){tank.remove(o);o.geometry.dispose();}creWaterObjs.length=0;if(!CREATE)return;
  for(const p of CPONDS){let i0=GX,i1=0,j0=GZ,j1=0;for(const c of p.cells){const i=c%GR,j=(c/GR)|0;if(i<i0)i0=i;if(i>i1)i1=i;if(j<j0)j0=j;if(j>j1)j1=j;}
    i0=Math.max(0,i0-4);j0=Math.max(0,j0-4);i1=Math.min(GX,i1+4);j1=Math.min(GZ,j1+4);const lw=i1-i0+1,lh=j1-j0+1,mask=new Uint8Array(lw*lh);
    for(const c of p.cells){const i=c%GR-i0,j=((c/GR)|0)-j0;for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++){const a=i+di,b=j+dj;if(a>=0&&a<lw&&b>=0&&b<lh)mask[b*lw+a]=1;}}
    const cw=Math.ceil((lw-1)/2),ch=Math.ceil((lh-1)/2),vid=new Int32Array((cw+1)*(ch+1)).fill(-1),pos=[],uv=[],nor=[],idx=[];
    const V=(I,J)=>{const k=J*(cw+1)+I;if(vid[k]<0){const x=-HW+Math.min(GX,i0+I*2)*W/GX,z=-HD+Math.min(GZ,j0+J*2)*D/GZ;vid[k]=pos.length/3;pos.push(x,p.level,z);uv.push(x/3,z/3);nor.push(0,1,0);}return vid[k];};
    const on=(I,J)=>{const a=Math.min(lw-1,I*2),b=Math.min(lh-1,J*2);return mask[b*lw+a];};
    for(let J=0;J<ch;J++)for(let I=0;I<cw;I++){if(!(on(I,J)||on(I+1,J)||on(I,J+1)||on(I+1,J+1)))continue;const a=V(I,J),b=V(I,J+1),c=V(I+1,J),d=V(I+1,J+1);idx.push(a,b,c,c,b,d);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);
    const m=new THREE.Mesh(g,creWaterMat);m.renderOrder=2;m.userData.noFit=true;tank.add(m);creWaterObjs.push(m);}}
if(CREATE){wtexLevels(true);creWaterMeshes();}
/* reflections: a small cube map captured from just above the water, so ponds and streams mirror the plants,
   stones and cliff around them. Re-captured every few seconds (so it follows day and night) and after edits. */
const WCUBE=OCEAN?null:(function(){const rt=new THREE.WebGLCubeRenderTarget(QK==='high'?256:QK==='mid'?128:64,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  const cc=new THREE.CubeCamera(0.05,90,rt);scene.add(cc);for(const m of[waterMat,streamMat,poolMat,creWaterMat])if(m){m.envMap=rt.texture;m.needsUpdate=true;}return{rt,cc,t:1e9,dirty:true};})();
function waterCubeUpdate(dt,force){const C=WCUBE;if(!C)return;C.t+=dt;if(!force&&!C.dirty&&C.t<10)return;let p=null;
  if(CREATE){let b=null;for(const q of CPONDS)if(!b||q.cells.length>b.cells.length)b=q;if(b)p=[b.cx,b.level,b.cz];}
  else if(MODE.pond&&env.pond>0.02)p=[POND.x,env.waterY,POND.z];else if(MODE.stream)p=[POOL.x,SY0,POOL.z+1];
  if(!p)return;C.t=0;C.dirty=false;const hid=[water,pool,streamMesh,...creWaterObjs].filter(o=>o&&o.visible);hid.forEach(o=>o.visible=false);
  const au=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;C.cc.position.set(p[0],p[1]+0.35,p[2]);C.cc.update(renderer,scene);renderer.shadowMap.autoUpdate=au;
  hid.forEach(o=>o.visible=true);C.rt.texture.needsPMREMUpdate=true;}
const NOOP=()=>{const o=new THREE.Object3D();return o;};
const pool=!MODE.stream?NOOP():new THREE.Mesh(new THREE.CircleGeometry(POOL.r*1.45,48),poolMat);pool.rotation.x=-Math.PI/2;pool.position.set(POOL.x,SY0,POOL.z);pool.renderOrder=2;tank.add(pool);
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
/* With post-processing on, transparent layers blend in linear HDR *before* tone mapping, unlike rendering
   straight to screen (tone-map + sRGB per fragment, then blend). Two consequences for the thin glass layers:
   a near-mirror highlight (20x white) at 5% opacity turns the tank milky, and even in-range colours add about
   twice as much light when blended in linear space. While the composer is active, clamp them to display range
   and scale their alpha so the tank looks the same as without post (values set per frame in renderFrame, js8). */
const HDR_CLAMP={value:65504},HDR_ALPHA={value:1};
function clampHDR(m){m.onBeforeCompile=s=>{s.uniforms.uHdrClamp=HDR_CLAMP;s.uniforms.uHdrAlpha=HDR_ALPHA;s.fragmentShader='uniform float uHdrClamp;\nuniform float uHdrAlpha;\n'+s.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n\tgl_FragColor.rgb=min(gl_FragColor.rgb,vec3(uHdrClamp));gl_FragColor.a*=uHdrAlpha;');};m.customProgramCacheKey=()=>'hdrclamp';return m;}
clampHDR(glassMat);clampHDR(sheenMat);
const condPanes=[];
(function(){const H=TOP-BOT,yc=(TOP+BOT)/2;
  const defs=[{w:W,p:[0,yc,HD+0.04],r:0,side:'front'},{w:W,p:[0,yc,-HD-0.04],r:Math.PI,side:'back'},{w:D,p:[-HW-0.04,yc,0],r:-Math.PI/2,side:'left'},{w:D,p:[HW+0.04,yc,0],r:Math.PI/2,side:'right'}];
  for(const d of defs){const g=new THREE.PlaneGeometry(d.w,H);for(const mt of[glassMat,sheenMat]){const m=new THREE.Mesh(g,mt);m.position.set(...d.p);m.rotation.y=d.r;m.renderOrder=9;tank.add(m);}
    if(d.side==='back'||OCEAN)continue;
    const cg=new THREE.PlaneGeometry(d.w,H,40,12);const n=cg.attributes.position.count;cg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*4).fill(1),4));const uv=cg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*d.w/4,uv.getY(i)*H/4);
    const cm=clampHDR(new THREE.MeshStandardMaterial({map:TX.drop,vertexColors:true,transparent:true,depthWrite:false,roughness:0.2,side:THREE.DoubleSide}));const mesh=new THREE.Mesh(cg,cm);mesh.position.set(...d.p);mesh.rotation.y=d.r;
    if(d.side==='front')mesh.position.z-=0.015;if(d.side==='left')mesh.position.x+=0.015;if(d.side==='right')mesh.position.x-=0.015;mesh.renderOrder=10;tank.add(mesh);condPanes.push({mesh,d,H});}
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(W,H),clampHDR(new THREE.MeshBasicMaterial({map:TX.streak,transparent:true,opacity:0.045,blending:THREE.AdditiveBlending,depthWrite:false})));sm.position.set(0,yc,HD+0.05);sm.renderOrder=11;tank.add(sm);
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
const UW={sigL:{value:new V3(0.048,0.02,0.011)},sigV:{value:new V3(0.062,0.025,0.012)},col:{value:new V3(0.006,0.062,0.165)},amb:{value:new V3(0.0,0.012,0.02)}};
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
/* rainforest light shafts: soft warm beams slanting down through the canopy, strongest on humid mornings */
let jungleRays=null;
if(!OCEAN&&(MK==='jungle'||MK==='mixed')){jungleRays=[];
  const shaft=ctex(64,256,(g,w,h)=>{const id=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=(x+0.5)/w*2-1,v=y/h,a=Math.exp(-u*u*5)*Math.pow(1-v,1.3)*Math.min(1,v*8+0.15);const i=(y*w+x)*4;id.data[i]=id.data[i+1]=id.data[i+2]=255;id.data[i+3]=a*255;}g.putImageData(id,0,0);});const xr=MK==='jungle'?[-15,15]:[7.5,16],n=MK==='jungle'?9:4;
  for(let i=0;i<n;i++){const x=rand(xr[0],xr[1]),z=rand(-5,5),g=heightAt(x,z),h=TOP-0.3-g;const m=new THREE.Mesh(new THREE.PlaneGeometry(rand(1.4,2.6),h),new THREE.MeshBasicMaterial({map:shaft,color:0xffe9b8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    m.position.set(x,g+h/2,z);m.renderOrder=7;tank.add(m);jungleRays.push({m,ph:rand(0,6),tilt:rand(0.12,0.3)});}}
if(!OCEAN){wetBed(terrain.material);wetBed(MATS.pebble);wetBed(MATS.rock);}
if(OCEAN){causticify(terrain.material);causticify(MATS.rock);causticify(MATS.pebble);
  const vol=new THREE.Mesh(new THREE.BoxGeometry(W-0.02,WT-BOT-0.02,D-0.02),new THREE.MeshBasicMaterial({color:0x0f5a76,transparent:true,opacity:0.0,depthWrite:false}));vol.visible=false;vol.position.set(0,(WT+BOT)/2,0);vol.renderOrder=8;tank.add(vol);
  const sn=TX.waterN.clone();sn.needsUpdate=true;sn.repeat.set(6,4);
  const surf=new THREE.Mesh(new THREE.PlaneGeometry(W-0.02,D-0.02,1,1),makeWaterMat({shal:0x2a7f9c,deep:0x2a7f9c,clear:true,ns:0.5,side:THREE.DoubleSide,env:1.5}));surf.rotation.x=-Math.PI/2;surf.position.y=WT;surf.renderOrder=9;tank.add(surf);
  const rays=[];for(let i=0;i<10;i++){const h=WT-rand(0.5,2);const m=new THREE.Mesh(new THREE.PlaneGeometry(rand(0.8,1.8),h),new THREE.MeshBasicMaterial({map:TX.ray,color:0xbfe8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(rand(-15,15),WT-h/2,rand(-7,8));m.renderOrder=7;tank.add(m);rays.push({m,ph:rand(0,6),tilt:rand(-0.2,0.2)});}
  oceanFX={vol,surf,sn,rays};}
