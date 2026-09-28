
/* =================== creature models =================== */
setMsg('塑造动物…');await tick();
const CM={
  chitin:new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.42,clearcoat:0.8,clearcoatRoughness:0.3}),
  soft:new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.62}),
  eye:new THREE.MeshPhysicalMaterial({color:0x080808,roughness:0.1,clearcoat:1}),
  tongue:new THREE.MeshStandardMaterial({color:0xe36a80,roughness:0.35}),
  lizard:new THREE.MeshPhysicalMaterial({map:TX.lizard,roughness:0.55,clearcoat:0.25,side:THREE.DoubleSide}),
  snake:new THREE.MeshPhysicalMaterial({map:TX.snake,roughness:0.32,clearcoat:0.7,side:THREE.DoubleSide}),
  frog:new THREE.MeshPhysicalMaterial({map:TX.frog,vertexColors:true,roughness:0.35,clearcoat:1,clearcoatRoughness:0.15}),
  frogSkin:new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.35,clearcoat:1,clearcoatRoughness:0.15}),
  frogEye:new THREE.MeshPhysicalMaterial({map:TX.frogEye,roughness:0.08,clearcoat:1}),
  cat:new THREE.MeshPhysicalMaterial({map:TX.cat,roughness:0.5,clearcoat:0.3,side:THREE.DoubleSide}),
  spider:new THREE.MeshPhysicalMaterial({map:TX.spider,roughness:0.4,clearcoat:0.5}),
  shell:new THREE.MeshPhysicalMaterial({map:TX.shell,roughness:0.32,clearcoat:0.8,side:THREE.DoubleSide}),
  slug:new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.3,clearcoat:1,side:THREE.DoubleSide}),
  wing:[0,1,2].map(i=>new THREE.MeshStandardMaterial({map:TX.wings[i],side:THREE.DoubleSide,roughness:0.5,metalness:i===1?0.35:0,alphaTest:0.5})),
  jelly:new THREE.MeshPhysicalMaterial({color:0xdfe8e0,roughness:0.08,transparent:true,opacity:0.45,clearcoat:1,depthWrite:false}),
  cocoon:new THREE.MeshStandardMaterial({color:0xf4f4ee,roughness:0.9}),
  sac:new THREE.MeshPhysicalMaterial({color:0xf0e7b8,roughness:0.2,transparent:true,opacity:0.85,clearcoat:1}),
};
TX.lizard.wrapS=TX.lizard.wrapT=THREE.RepeatWrapping;TX.snake.wrapS=TX.snake.wrapT=THREE.RepeatWrapping;
const sph=(r,col,p,s,ws,hs,fn)=>{const g=colorize(new THREE.SphereGeometry(r,ws||12,hs||9),col,0.04,fn);return xf(g,p,[0,0,0],s);};
function seg(a,b,r1,r2,col,rs){a=a instanceof V3?a:new V3(...a);b=b instanceof V3?b:new V3(...b);const dir=new V3().subVectors(b,a),len=Math.max(1e-4,dir.length());
  const g=new THREE.CylinderGeometry(r2,r1,len,rs||6,1);g.translate(0,len/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,dir.normalize()));g.translate(a.x,a.y,a.z);return colorize(g,col,0.05);}
const mm=(list,mat)=>new THREE.Mesh(mergeG(list.map(g=>({g,m:'a'}))).geo,mat);

/* ---- spine-skinned bodies (lizard, snake, caterpillar, tadpole, snail foot) ---- */
class SpineBody{
  constructor(N,M,prof,mat,colFn,vRep){this.N=N;this.M=M;this.prof=prof;const nv=N*(M+1);
    const g=new THREE.BufferGeometry();this.pos=new THREE.BufferAttribute(new Float32Array(nv*3),3);this.nor=new THREE.BufferAttribute(new Float32Array(nv*3),3);this.pos.setUsage(THREE.DynamicDrawUsage);this.nor.setUsage(THREE.DynamicDrawUsage);
    const uv=new Float32Array(nv*2),col=new Float32Array(nv*3),idx=[];
    for(let i=0;i<N;i++)for(let j=0;j<=M;j++){const k=i*(M+1)+j;uv[k*2]=j/M;uv[k*2+1]=(1-i/(N-1))*(vRep||1);const c=colFn?colFn(i/(N-1),j/M*6.2832):WHITE;col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
    for(let i=0;i<N-1;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;idx.push(a,a+1,b,a+1,b+1,b);}
    g.setAttribute('position',this.pos);g.setAttribute('normal',this.nor);g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(idx);
    this.mesh=new THREE.Mesh(g,mat);this.mesh.frustumCulled=false;this.mesh.castShadow=true;this.mesh.receiveShadow=true;
    this.C=[];this.T=[];this.Uv=[];this.S=[];this.R=new Float32Array(N);for(let i=0;i<N;i++){this.C.push(new V3());this.T.push(new V3());this.Uv.push(new V3());this.S.push(new V3());}this.o={r:0,fy:1,fz:1};}
  update(pts,param){const N=this.N,M=this.M,P=this.pos.array,Nn=this.nor.array,o=this.o;
    for(let i=0;i<N;i++){const p=pts[i],a=pts[Math.max(0,i-1)],b=pts[Math.min(N-1,i+1)];const T=this.T[i].subVectors(a,b);if(T.lengthSq()<1e-10)T.set(1,0,0);T.normalize();
      const Uu=this.Uv[i].copy(UP).addScaledVector(T,-T.y).normalize();const S=this.S[i].crossVectors(T,Uu);this.C[i].copy(p);
      this.prof(i/(N-1),param,o);this.R[i]=o.r;
      for(let j=0;j<=M;j++){const an=j/M*6.2832,ca=Math.cos(an),sa=Math.sin(an),k=(i*(M+1)+j)*3;
        P[k]=p.x+S.x*ca*o.r*o.fz+Uu.x*sa*o.r*o.fy;P[k+1]=p.y+S.y*ca*o.r*o.fz+Uu.y*sa*o.r*o.fy;P[k+2]=p.z+S.z*ca*o.r*o.fz+Uu.z*sa*o.r*o.fy;
        let nx=S.x*ca*o.fy+Uu.x*sa*o.fz,ny=S.y*ca*o.fy+Uu.y*sa*o.fz,nz=S.z*ca*o.fy+Uu.z*sa*o.fz;const l=1/(Math.hypot(nx,ny,nz)||1);Nn[k]=nx*l;Nn[k+1]=ny*l;Nn[k+2]=nz*l;}}
    this.pos.needsUpdate=true;this.nor.needsUpdate=true;}}
class Trail{constructor(len,x,z,h){this.len=len;this.p=[];const n=Math.ceil(len/0.02)+4;for(let i=n;i>=0;i--)this.p.push(x-Math.cos(h)*i*0.02,z-Math.sin(h)*i*0.02);}
  push(x,z){const n=this.p.length,lx=this.p[n-2],lz=this.p[n-1];if((x-lx)**2+(z-lz)**2>=0.0004){this.p.push(x,z);const mx=2*(Math.ceil(this.len/0.02)+30);if(this.p.length>mx)this.p.splice(0,this.p.length-mx);}}
  reset(x,z,h){this.p.length=0;const n=Math.ceil(this.len/0.02)+4;for(let i=n;i>=0;i--)this.p.push(x-Math.cos(h)*i*0.02,z-Math.sin(h)*i*0.02);}
  sample(hx,hz,N,L,out){const step=L/(N-1);let ax=hx,az=hz,s=0,i=1,k=this.p.length-2,ldx=-1,ldz=0;out[0].x=hx;out[0].z=hz;
    while(i<N){let bx,bz;if(k>=0){bx=this.p[k];bz=this.p[k+1];k-=2;}else{bx=ax+ldx*step;bz=az+ldz*step;}
      const l=Math.hypot(bx-ax,bz-az);if(l<1e-6)continue;ldx=(bx-ax)/l;ldz=(bz-az)/l;
      while(i<N&&i*step<=s+l){const f=(i*step-s)/l;out[i].x=ax+(bx-ax)*f;out[i].z=az+(bz-az)*f;i++;}s+=l;ax=bx;az=bz;}}}

/* ---- ant (instanced, legs animated in the vertex shader) ---- */
const ANT_MAX=320;
const ant=(function(){const parts=[];const add=(g,leg,hip)=>parts.push({g:g.index?g.toNonIndexed():g,leg,hip});
  const hc=0x3b1a0e,mc=0x5a2413,gc=0x3a1a0f,lc=0x4a2212;
  add(sph(0.026,hc,[0.066,0.03,0],[1.05,0.9,1.1]),-1);add(sph(0.004,0x050505,[0.074,0.038,0.022]),-1);add(sph(0.004,0x050505,[0.074,0.038,-0.022]),-1);
  add(seg([0.085,0.022,0.01],[0.1,0.02,0.002],0.004,0.002,0x2a1208,4),-1);add(seg([0.085,0.022,-0.01],[0.1,0.02,-0.002],0.004,0.002,0x2a1208,4),-1);
  add(sph(0.026,mc,[0.02,0.032,0],[1.6,0.8,0.75]),-1);add(sph(0.01,mc,[-0.018,0.03,0]),-1);add(sph(0.012,mc,[-0.03,0.033,0]),-1);add(sph(0.036,gc,[-0.07,0.036,0],[1.35,1,1.05],14,10),-1);
  const hips=[0.035,0.02,0.005],dxs=[0.05,0,-0.06];
  for(let s=0;s<2;s++){const sz=s?-1:1;for(let k=0;k<3;k++){const hip=new V3(hips[k],0.024,sz*0.012),kn=new V3(hips[k]+dxs[k]*0.4,0.05,sz*0.055),ft=new V3(hips[k]+dxs[k],0.0,sz*0.085);
    add(seg(hip,kn,0.0045,0.0038,lc,4),s*3+k,hip);add(seg(kn,ft,0.0036,0.0025,lc,4),s*3+k,hip);}}
  for(let s=0;s<2;s++){const sz=s?-1:1,hp=new V3(0.08,0.045,sz*0.01);add(seg(hp,[0.1,0.08,sz*0.025],0.003,0.003,lc,3),6+s,hp);add(seg([0.1,0.08,sz*0.025],[0.14,0.07,sz*0.05],0.0028,0.002,lc,3),6+s,hp);}
  let n=0;for(const p of parts)n+=p.g.attributes.position.count;
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3),leg=new Float32Array(n),hip=new Float32Array(n*3);let o=0;
  for(const p of parts){const A=p.g.attributes,c=A.position.count;pos.set(A.position.array,o*3);nor.set(A.normal.array,o*3);col.set(A.color.array,o*3);for(let i=0;i<c;i++){leg[o+i]=p.leg;if(p.hip){hip[(o+i)*3]=p.hip.x;hip[(o+i)*3+1]=p.hip.y;hip[(o+i)*3+2]=p.hip.z;}}o+=c;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('aLeg',new THREE.BufferAttribute(leg,1));g.setAttribute('aHip',new THREE.BufferAttribute(hip,3));
  const walk=new THREE.InstancedBufferAttribute(new Float32Array(ANT_MAX*2),2);walk.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aWalk',walk);
  const mat=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:0.38,clearcoat:0.8,clearcoatRoughness:0.3});
  mat.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;sh.vertexShader='attribute float aLeg;\nattribute vec3 aHip;\nattribute vec2 aWalk;\nuniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
if(aLeg>-0.5){vec3 p=transformed-aHip;
 if(aLeg<5.5){float side=aLeg<2.5?0.0:1.0;float k=aLeg-side*3.0;float grp=mod(k+side,2.0);float ph=aWalk.x+grp*3.14159;float ang=sin(ph)*0.5*aWalk.y;float c=cos(ang),s=sin(ang);
  p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);p.y+=max(0.0,cos(ph))*0.3*aWalk.y*length(p.xz);}
 else{p.y+=sin(uTime*7.0+aLeg*3.1+aWalk.x*0.5)*0.12*length(p);}
 transformed=aHip+p;}`);};
  mat.customProgramCacheKey=()=>'ant2';
  const mesh=new THREE.InstancedMesh(g,mat,ANT_MAX);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;tank.add(mesh);
  const lg=new Mesher();addLeaf(lg,new V3(0,0,0),Math.PI/2,{len:0.09,wid:0.07,lift:1.3,droop:0,segs:2,flat:true});
  const leafMesh=new THREE.InstancedMesh(lg.geo(),new THREE.MeshStandardMaterial({map:TX.leafBroad,alphaTest:0.4,side:THREE.DoubleSide,roughness:0.6}),ANT_MAX);leafMesh.count=0;leafMesh.frustumCulled=false;tank.add(leafMesh);
  return{mesh,walk,leafMesh};})();

/* ---- builders; each returns {root,...} with root added to agentGroup ---- */
const agentGroup=new THREE.Group();tank.add(agentGroup);
function buildCricket(){const g=new THREE.Group(),dk=0x2a1d12,br=0x5a4028;
  const body=mm([sph(0.034,dk,[0.105,0.05,0],[1,1.05,1]),sph(0.006,0x050505,[0.118,0.062,0.024]),sph(0.006,0x050505,[0.118,0.062,-0.024]),sph(0.038,br,[0.06,0.052,0],[1.15,0.8,1]),sph(0.05,br,[-0.03,0.045,0],[2.0,0.72,0.86],14,10),
    sph(0.046,0x3a2816,[-0.03,0.074,0],[1.9,0.22,0.82]),seg([-0.12,0.05,0.015],[-0.18,0.06,0.045],0.003,0.002,dk,3),seg([-0.12,0.05,-0.015],[-0.18,0.06,-0.045],0.003,0.002,dk,3),
    ...[1,-1].flatMap(s=>[seg([0.13,0.065,s*0.012],[0.2,0.13,s*0.05],0.002,0.0018,dk,3),seg([0.2,0.13,s*0.05],[0.26,0.11,s*0.13],0.0018,0.0015,dk,3),seg([0.26,0.11,s*0.13],[0.24,0.07,s*0.22],0.0015,0.001,dk,3),
      seg([0.07,0.035,s*0.02],[0.09,0.05,s*0.06],0.005,0.004,br,4),seg([0.09,0.05,s*0.06],[0.12,0.0,s*0.08],0.004,0.003,br,4),seg([0.03,0.035,s*0.02],[0.03,0.05,s*0.07],0.005,0.004,br,4),seg([0.03,0.05,s*0.07],[0.02,0.0,s*0.1],0.004,0.003,br,4)])],CM.chitin);
  body.castShadow=true;g.add(body);const hind=[];
  for(const s of[1,-1]){const piv=new THREE.Group();piv.position.set(-0.005,0.05,s*0.03);const leg=mm([seg([0,0,0],[-0.12,0.065,s*0.045],0.013,0.007,br,6),seg([-0.12,0.065,s*0.045],[-0.03,0.0,s*0.06],0.004,0.003,dk,4)],CM.chitin);leg.castShadow=true;piv.add(leg);g.add(piv);hind.push(piv);}
  const wings=mm([sph(0.044,0x4a3420,[-0.03,0.08,0],[1.85,0.12,0.8])],CM.chitin);g.add(wings);return{root:g,hind,wings};}
function buildSnail(a){const root=new THREE.Group();const M=new Mesher();const pts=[],rad=[];const turns=3.1,te=turns*6.2832;
  for(let i=0;i<=70;i++){const t=i/70,th=t*te,R=0.052*Math.exp(0.15*(th-te));pts.push(new V3(R*Math.cos(th),R*Math.sin(th),(1-t)*0.045));rad.push(Math.max(0.002,R*0.86));}
  const curve=new THREE.CatmullRomCurve3(pts);const n=140,rs=16,fr=curve.computeFrenetFrames(n,false);const s0=M.n;
  for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),N=fr.normals[i],B=fr.binormals[i],fi=t*(rad.length-1),r=lerp(rad[Math.floor(fi)],rad[Math.min(rad.length-1,Math.floor(fi)+1)],fi-Math.floor(fi));
    for(let j=0;j<=rs;j++){const an=j/rs*6.2832;M.v(p.x+(N.x*Math.cos(an)+B.x*Math.sin(an))*r,p.y+(N.y*Math.cos(an)+B.y*Math.sin(an))*r,p.z+(N.z*Math.cos(an)+B.z*Math.sin(an))*r,t*5,j/rs,WHITE);}}
  for(let i=0;i<n;i++)for(let j=0;j<rs;j++){const q=s0+i*(rs+1)+j;M.q(q,q+rs+1,q+rs+2,q+1);}
  const shell=new THREE.Mesh(M.geo(),CM.shell);shell.castShadow=true;root.add(shell);
  const body=new SpineBody(14,10,(t,p,o)=>{o.r=0.03*(t<0.15?0.65+t/0.15*0.35:1-(t-0.15)/0.85*0.8)*(p?p.ext:1);o.fy=0.55;o.fz=1.05;},CM.slug,(t,an)=>new Col(0xa89478).multiplyScalar(Math.sin(an)>0.2?0.8+0.2*hash2(t*40,an*9):1.1));
  root.add(body.mesh);
  const tent=mm([seg([0,0,0.012],[0.055,0.06,0.03],0.004,0.003,0x7a6a54,4),seg([0,0,-0.012],[0.055,0.06,-0.03],0.004,0.003,0x7a6a54,4),sph(0.006,0x202020,[0.056,0.062,0.031]),sph(0.006,0x202020,[0.056,0.062,-0.031]),seg([0.01,-0.01,0.01],[0.035,-0.012,0.025],0.003,0.002,0x7a6a54,3),seg([0.01,-0.01,-0.01],[0.035,-0.012,-0.025],0.003,0.002,0x7a6a54,3)],CM.slug);
  root.add(tent);return{root,shell,body,tent,pts:Array.from({length:14},()=>new V3())};}
function buildCaterpillar(){const root=new THREE.Group();const body=new SpineBody(26,10,(t,p,o)=>{o.r=(t<0.06?0.026:0.033*(1+0.1*Math.abs(Math.sin(t*Math.PI*11))))*(t>0.9?1-(t-0.9)*5:1);o.fy=0.95;o.fz=1;},CM.cat,null,1);
  root.add(body.mesh);const head=new THREE.Mesh(new THREE.SphereGeometry(0.028,14,10),CM.eye);root.add(head);return{root,body,head,pts:Array.from({length:26},()=>new V3())};}
function buildChrysalis(){const root=new THREE.Group();const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new V2(Math.max(0.002,0.034*Math.pow(Math.sin(Math.PI*t),0.7)*(t>0.55&&t<0.65?1.15:1)),t*0.15));}
  const g=new THREE.LatheGeometry(pts,14);colorize(g,0x93b35c,0.05,(x,y,z,c)=>{if(y>0.07&&y<0.09&&hash2(x*90,z*90)>0.6)c.set(0xe6c24a);});root.add(new THREE.Mesh(g,CM.soft));
  const silk=new THREE.Mesh(seg([0,0.15,0],[0,0.2,0],0.003,0.003,0xeeeeee,3),CM.soft);root.add(silk);return{root};}
function buildEgg(col){const root=new THREE.Group();root.add(mm([sph(0.012,col,[0,0.012,0]),sph(0.011,col,[0.018,0.011,0.006]),sph(0.011,col,[-0.012,0.011,0.015])],CM.soft));return{root};}
const WING_GEO=(()=>{const mk=poly=>{const s=new THREE.Shape();s.moveTo(poly[0][0],poly[0][1]);s.splineThru(poly.slice(1).map(p=>new V2(p[0],p[1])));s.closePath();const g=new THREE.ShapeGeometry(s,14);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+0.17)/0.27,p.getY(i)/0.28);g.rotateX(Math.PI/2);return g;};return{fore:mk(TX.FW),hind:mk(TX.HWN)};})();
function buildButterfly(v){const root=new THREE.Group();const dk=0x1a1510;
  const body=mm([seg([-0.1,0,0],[0.02,0,0],0.009,0.013,dk,8),sph(0.02,0x2a2218,[0.035,0.004,0],[1.25,1,1]),sph(0.014,0x111111,[0.062,0.008,0]),seg([0.07,0.015,0.006],[0.14,0.07,0.035],0.0016,0.0016,dk,3),seg([0.07,0.015,-0.006],[0.14,0.07,-0.035],0.0016,0.0016,dk,3),sph(0.005,dk,[0.14,0.07,0.035],[1.6,1,1]),sph(0.005,dk,[0.14,0.07,-0.035],[1.6,1,1])],CM.soft);
  root.add(body);const mk=side=>{const pv=new THREE.Group();const f=new THREE.Mesh(WING_GEO.fore,CM.wing[v]),h=new THREE.Mesh(WING_GEO.hind,CM.wing[v]);if(side<0){f.scale.z=-1;h.scale.z=-1;}f.castShadow=h.castShadow=true;const hp=new THREE.Group();hp.add(h);pv.add(f,hp);pv.position.set(0.02,0.006,side*0.008);root.add(pv);return{pv,hp};};
  const R=mk(1),L=mk(-1);root.scale.setScalar(1.15);return{root,R,L};}
function buildIsopod(){const root=new THREE.Group();const P=[];for(let k=0;k<8;k++){const r=0.048*(k===0?0.7:k>5?0.8-(k-6)*0.14:1);const g=new THREE.SphereGeometry(r,14,6,0,6.2832,0,Math.PI/2);g.scale(0.42,0.62,1.2);g.translate(0.1-k*0.026,0,0);
    colorize(g,k%2?0x5b6168:0x676e76,0.05,(x,y,z,c)=>{if(Math.abs(z)>r*1.0)c.set(0x8d949b);});P.push(g);}
  P.push(sph(0.018,0x4a4f55,[0.12,0.008,0],[1,0.6,1.3]));for(const s of[1,-1]){P.push(seg([0.13,0.012,s*0.012],[0.16,0.03,s*0.04],0.003,0.0025,0x3a3e42,3),seg([0.16,0.03,s*0.04],[0.19,0.02,s*0.06],0.0025,0.002,0x3a3e42,3),seg([-0.1,0.005,s*0.015],[-0.125,0.004,s*0.03],0.004,0.002,0x3a3e42,3));}
  const flat=mm(P,CM.chitin);flat.castShadow=true;root.add(flat);
  const ball=mm([sph(0.052,0x5e646b,[0,0.052,0],[1,1,1],18,14,(x,y,z,c)=>{const b=Math.floor((Math.atan2(y-0.052,x)+3.2)*2.4)%2;c.set(b?0x5b6168:0x70777f);})],CM.chitin);ball.visible=false;ball.castShadow=true;root.add(ball);return{root,flat,ball};}
function buildSpider(){const root=new THREE.Group();
  const ceph=mm([sph(0.045,0xd9d5c8,[0.045,0.035,0],[1.25,0.7,1.05]),sph(0.006,0x050505,[0.09,0.045,0.01]),sph(0.006,0x050505,[0.09,0.045,-0.01]),seg([0.095,0.025,0.008],[0.11,0.005,0.01],0.005,0.003,0x3a2a1a,4),seg([0.095,0.025,-0.008],[0.11,0.005,-0.01],0.005,0.003,0x3a2a1a,4)],CM.chitin);
  const ag=new THREE.SphereGeometry(0.08,24,16);ag.rotateZ(Math.PI/2);ag.scale(1.45,1,1.15);ag.translate(-0.085,0.06,0);const abd=new THREE.Mesh(ag,CM.spider);abd.castShadow=ceph.castShadow=true;root.add(ceph,abd);
  const legs=[];const ang=[0.5,0.85,1.95,2.45],len=[1.3,1.2,0.75,1.15];
  for(const s of[1,-1])for(let k=0;k<4;k++){const piv=new THREE.Group();piv.position.set(0.06-k*0.012,0.035,s*0.02);const dir=new V3(Math.cos(ang[k]),0,s*Math.sin(ang[k])),L=len[k];
    const K=dir.clone().multiplyScalar(0.12*L).add(new V3(0,0.075*L,0)),F=K.clone().addScaledVector(dir,0.16*L).add(new V3(0,-0.115*L,0));
    const leg=mm([seg([0,0,0],K,0.008,0.007,0x2e2418,5),seg(K,K.clone().lerp(F,0.5),0.006,0.005,0xc9a050,5),seg(K.clone().lerp(F,0.5),F,0.005,0.003,0x2e2418,5)],CM.chitin);leg.castShadow=true;piv.add(leg);root.add(piv);legs.push({piv,k,s});}
  return{root,legs};}
function buildMantis(){const root=new THREE.Group(),G=0x78b046,G2=0x9ed066;
  const body=mm([sph(0.05,G,[-0.13,0.1,0],[3.3,0.75,0.95],16,10),seg([-0.02,0.11,0],[0.13,0.22,0],0.019,0.013,G,8),sph(0.022,G2,[0.0,0.115,0],[1.3,1,1]),
    ...[1,-1].flatMap(s=>[seg([0.0,0.11,s*0.018],[0.03,0.17,s*0.12],0.005,0.004,G,4),seg([0.03,0.17,s*0.12],[0.07,0.0,s*0.17],0.004,0.003,G,4),seg([-0.05,0.1,s*0.02],[-0.07,0.16,s*0.14],0.005,0.004,G,4),seg([-0.07,0.16,s*0.14],[-0.16,0.0,s*0.2],0.004,0.003,G,4)])],CM.soft);
  const wings=mm([sph(0.045,0x9fd070,[-0.12,0.135,0.012],[3.2,0.16,0.9]),sph(0.045,0x9fd070,[-0.12,0.135,-0.012],[3.2,0.16,0.9])],CM.soft);body.castShadow=true;root.add(body,wings);
  const head=new THREE.Group();head.position.set(0.14,0.235,0);head.add(mm([sph(0.03,G2,[0,0,0],[0.75,0.85,1.5]),seg([0.02,0.01,0.01],[0.06,0.06,0.05],0.0015,0.0012,G,3),seg([0.02,0.01,-0.01],[0.06,0.06,-0.05],0.0015,0.0012,G,3),seg([0.015,-0.02,0],[0.03,-0.035,0],0.006,0.003,G,4)],CM.soft));
  const ey=mm([sph(0.017,0xb9d88a,[0.005,0.012,0.032]),sph(0.017,0xb9d88a,[0.005,0.012,-0.032])],CM.chitin);head.add(ey);root.add(head);
  const fore=[];for(const s of[1,-1]){const piv=new THREE.Group();piv.position.set(0.1,0.19,s*0.018);const P=[seg([0,0,0],[0.055,-0.045,s*0.015],0.008,0.007,G,5),seg([0.055,-0.045,s*0.015],[0.13,0.03,s*0.02],0.011,0.007,G2,6)];for(let k=0;k<5;k++){const t=0.2+k*0.15;const b=new V3(0.055,-0.045,s*0.015).lerp(new V3(0.13,0.03,s*0.02),t);P.push(seg(b,b.clone().add(new V3(-0.006,-0.012,0)),0.002,0.0005,0x3a5a20,3));}
    const tib=new THREE.Group();tib.position.set(0.13,0.03,s*0.02);tib.add(mm([seg([0,0,0],[-0.07,-0.045,0],0.006,0.004,G2,5)],CM.soft));piv.add(mm(P,CM.soft),tib);root.add(piv);fore.push({piv,tib});}
  return{root,head,fore};}
const FROG_GEO=(()=>{const g=new THREE.SphereGeometry(1,48,32);const p=g.attributes.position,n=p.count,col=new Float32Array(n*3);
  for(let i=0;i<n;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let X=x*0.19,Y=y*0.088,Z=z*0.12;if(y<0)Y*=0.62;const f=smooth(0.15,1,x);Z*=1-0.3*f*f;Y*=1-0.16*f;if(x<-0.3&&y>0)Y+=0.024*smooth(-0.3,-0.9,x);if(x>0.55)X-=0.02*(x-0.55);
    p.setXYZ(i,X,Y+0.095,Z);const mouth=x>0.35&&Math.abs(y-0.02)<0.06?0.35:1;col[i*3]=col[i*3+1]=col[i*3+2]=mouth;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g;})();
function buildFrog(){const root=new THREE.Group();const body=new THREE.Mesh(FROG_GEO,CM.frog);body.castShadow=true;root.add(body);const skin=0x5fa048,light=0x9ccc6a;
  const eyes=[];for(const s of[1,-1]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.034,20,14),CM.frogEye);e.rotation.y=-s*0.9;e.position.set(0.12,0.165,s*0.052);root.add(e);eyes.push(e);}
  const hind=[];for(const s of[1,-1]){const hip=new THREE.Group();hip.position.set(-0.13,0.09,s*0.07);const knee=new THREE.Group();knee.position.set(0.085,-0.025,s*0.08);const ankle=new THREE.Group();ankle.position.set(-0.11,-0.02,s*0.03);
    hip.add(mm([seg([0,0,0],[0.085,-0.025,s*0.08],0.03,0.021,skin,8)],CM.frogSkin));knee.add(mm([seg([0,0,0],[-0.11,-0.02,s*0.03],0.019,0.012,skin,7)],CM.frogSkin));
    ankle.add(mm([seg([0,0,0],[0.05,-0.035,s*0.03],0.011,0.008,skin,6),...[-0.35,-0.1,0.15,0.4].map(a=>seg([0.05,-0.035,s*0.03],[0.05+Math.cos(a)*0.045,-0.042,s*(0.03+Math.sin(a+0.3)*0.04)],0.004,0.003,light,4))],CM.frogSkin));
    knee.add(ankle);hip.add(knee);root.add(hip);hind.push({hip,knee,ankle});}
  const fl=mm([1,-1].flatMap(s=>[seg([0.08,0.07,s*0.055],[0.12,0.02,s*0.08],0.012,0.009,skin,6),seg([0.12,0.02,s*0.08],[0.14,0.0,s*0.085],0.008,0.006,skin,5),...[-0.4,0,0.4].map(a=>sph(0.007,light,[0.14+Math.cos(a)*0.02,0.0,s*(0.085+Math.sin(a)*0.02)]))]),CM.frogSkin);root.add(fl);
  const sac=new THREE.Mesh(new THREE.SphereGeometry(0.052,16,12),CM.sac);sac.position.set(0.145,0.06,0);sac.scale.setScalar(0.15);root.add(sac);
  const tg=new THREE.CylinderGeometry(0.008,0.007,1,6);tg.rotateZ(-Math.PI/2);tg.translate(0.5,0,0);const tongue=new THREE.Mesh(tg,CM.tongue);tongue.position.set(0.18,0.085,0);tongue.visible=false;root.add(tongue);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(0.014,8,6),CM.tongue);tip.visible=false;agentGroup.add(tip);
  return{root,eyes,hind,sac,tongue,tip};}
function buildSpawn(){const root=new THREE.Group();const J=[],Dd=[];for(let i=0;i<46;i++){const a=rand(0,6.28),r=Math.sqrt(Math.random())*0.16,x=Math.cos(a)*r,z=Math.sin(a)*r,y=rand(-0.03,0.01);J.push(xf(colorize(new THREE.SphereGeometry(0.022,8,6),0xffffff,0),[x,y,z]));Dd.push(sph(0.006,0x0a0a0a,[x,y,z]));}
  root.add(mm(J,CM.jelly),mm(Dd,CM.eye));return{root};}
function buildTadpole(){const root=new THREE.Group();const body=new SpineBody(14,8,(t,p,o)=>{if(t<0.3){o.r=0.034*Math.pow(Math.sin(Math.PI*(0.12+t/0.3*0.88)),0.6)+0.004;o.fy=0.8;o.fz=1;}else{o.r=0.022*(1-(t-0.3)/0.7)+0.002;o.fy=2.3;o.fz=0.22;}},CM.slug,(t)=>new Col(t<0.3?0x2f3322:0x3d4430),1);root.add(body.mesh);return{root,body,pts:Array.from({length:14},()=>new V3())};}
const LIZ_PROF=(t,p,o)=>{let r;if(t<0.1)r=lerp(0.014,0.058,Math.sqrt(t/0.1));else if(t<0.16)r=lerp(0.058,0.05,(t-0.1)/0.06);else if(t<0.3)r=lerp(0.05,0.085,(t-0.16)/0.14);else if(t<0.48)r=lerp(0.085,0.07,(t-0.3)/0.18);else r=lerp(0.07,0.004,Math.pow((t-0.48)/0.52,0.8));o.r=r;o.fy=t<0.1?0.6:t<0.5?0.62:0.85;o.fz=1;};
function buildLizard(){const root=new THREE.Group();const body=new SpineBody(40,14,LIZ_PROF,CM.lizard,null,1);root.add(body.mesh);
  const eyes=mm([sph(0.011,0x050505,[0,0,0.042]),sph(0.011,0x050505,[0,0,-0.042])],CM.eye);root.add(eyes);
  const legs=[];for(const [ri,kind] of[[9,1],[20,-1]])for(const s of[1,-1]){const piv=new THREE.Group();const toes=[-0.5,-0.2,0.1,0.4,0.75].map(a=>seg([0.05,-0.078,s*0.11],[0.05+Math.cos(a)*0.04,-0.082,s*(0.11+Math.sin(a+0.6)*0.035)],0.004,0.002,0xb8915a,3));
    const leg=mm([seg([0,0,0],[0.022,-0.012,s*0.088],0.02,0.014,0xc49a62,6),seg([0.022,-0.012,s*0.088],[0.05,-0.076,s*0.11],0.013,0.009,0xc49a62,5),...toes],CM.soft);leg.castShadow=true;piv.add(leg);root.add(piv);legs.push({piv,ri,s,kind});}
  const tg=new THREE.CylinderGeometry(0.005,0.004,1,5);tg.rotateZ(-Math.PI/2);tg.translate(0.5,0,0);const tongue=new THREE.Mesh(tg,CM.tongue);tongue.visible=false;root.add(tongue);
  return{root,body,eyes,legs,tongue,pts:Array.from({length:40},()=>new V3())};}
const SNAKE_PROF=(t,p,o)=>{let r;if(t<0.012)r=0.022;else if(t<0.03)r=lerp(0.022,0.04,(t-0.012)/0.018);else if(t<0.05)r=lerp(0.04,0.033,(t-0.03)/0.02);else if(t<0.25)r=lerp(0.033,0.05,(t-0.05)/0.2);else if(t<0.8)r=0.05;else r=lerp(0.05,0.004,(t-0.8)/0.2);
  if(p&&p.bulge>0)r+=0.045*p.bulge*Math.exp(-Math.pow((t-p.bt)/0.05,2));o.r=r;o.fy=t<0.04?0.62:0.82;o.fz=1;};
function buildSnake(){const root=new THREE.Group();const body=new SpineBody(100,12,SNAKE_PROF,CM.snake,null,1);root.add(body.mesh);
  const eyes=mm([sph(0.009,0x050505,[0,0,0.03]),sph(0.009,0x050505,[0,0,-0.03])],CM.eye);root.add(eyes);
  const tongue=mm([seg([0,0,0],[0.05,0,0],0.003,0.002,0x2a1a1a,3),seg([0.05,0,0],[0.07,0.004,0.01],0.0018,0.001,0x2a1a1a,3),seg([0.05,0,0],[0.07,0.004,-0.01],0.0018,0.001,0x2a1a1a,3)],CM.tongue);tongue.visible=false;root.add(tongue);
  return{root,body,eyes,tongue,pts:Array.from({length:100},()=>new V3())};}
function buildFirefly(){const root=new THREE.Group();const body=mm([sph(0.012,0x1b1612,[0,0,0],[2.2,0.8,1]),sph(0.009,0xe07030,[0.022,0.004,0],[1.1,0.8,1.2]),sph(0.009,0xdfe8a0,[-0.02,-0.002,0],[1.3,0.8,1])],CM.soft);root.add(body);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:TX.glow,color:0xdfff8a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));sp.position.set(-0.025,0,0);sp.scale.setScalar(0.3);sp.renderOrder=12;root.add(sp);return{root,sp};}
function buildCocoon(){return mm([sph(0.03,0xf4f4ee,[0,0,0],[1.6,1,1])],CM.soft);}
