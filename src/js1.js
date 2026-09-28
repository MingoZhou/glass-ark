import * as THREE from 'three';
window.__arkBooted=true;
const V3=THREE.Vector3,V2=THREE.Vector2,Col=THREE.Color;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const irand=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const WHITE=new Col(1,1,1);
const UP=new V3(0,1,0);
let UID=0,LOADED=false;
const setMsg=m=>{const e=$('#loadMsg');if(e)e.textContent=m;};
const tick=()=>new Promise(r=>setTimeout(r,0));
function reportError(msg){
  if(!LOADED){const l=$('#loading');if(l){l.classList.remove('gone');$('#loadMsg').innerHTML='出错了：'+msg+'<br>请截图发给我';}return;}
  let e=$('.errbar');if(!e){e=document.createElement('div');e.className='errbar';$('#app').appendChild(e);}e.textContent='运行出错：'+msg;
}
window.addEventListener('error',e=>reportError(e.message||'未知错误'));
window.addEventListener('unhandledrejection',e=>reportError(String((e.reason&&e.reason.message)||e.reason)));

/* ---------- noise ---------- */
function hash2(x,y){const s=Math.sin(x*127.1+y*311.7)*43758.5453123;return s-Math.floor(s);}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){o=o||4;let s=0,a=0.5,f=1,n=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);n+=a;f*=2.03;a*=0.5;}return s/n;}
function pn(x,y,P){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const h=(i,j)=>hash2(((i%P)+P)%P,((j%P)+P)%P);const a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function pfbm(u,v,P,o){o=o||4;let s=0,a=0.5,f=1,n=0;for(let i=0;i<o;i++){s+=a*pn(u*P*f,v*P*f,P*f);n+=a;f*=2;a*=0.5;}return s/n;}

/* ---------- quality ---------- */
const IS_MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(('ontouchstart' in window)&&Math.min(screen.width,screen.height)<760);
const QUAL={
  high:{pr:2,shadow:2048,shadows:true,grass:1,scatter:1,bloom:true,dof:true},
  mid:{pr:1.5,shadow:2048,shadows:true,grass:0.6,scatter:0.7,bloom:true,dof:false},
  low:{pr:1,shadow:1024,shadows:false,grass:0.3,scatter:0.4,bloom:false,dof:false}};
let QK=(()=>{try{const s=localStorage.getItem('ark-quality');if(s&&QUAL[s])return s;}catch(e){}return IS_MOBILE?'low':'high';})();
let Q=QUAL[QK];

/* ---------- canvas textures ---------- */
const TX={};
function ctex(w,h,draw,srgb){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);if(srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
function nmap(N,hf,str){const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),img=g.createImageData(N,N),H=new Float32Array(N*N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)H[y*N+x]=hf(x/N,y/N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const l=H[y*N+(x-1+N)%N],r=H[y*N+(x+1)%N],u=H[((y-1+N)%N)*N+x],d=H[((y+1)%N)*N+x];const nx=(l-r)*str,ny=(d-u)*str,k=1/Math.hypot(nx,ny,1),i=(y*N+x)*4;
    img.data[i]=(nx*k*0.5+0.5)*255;img.data[i+1]=(ny*k*0.5+0.5)*255;img.data[i+2]=(k*0.5+0.5)*255;img.data[i+3]=255;}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
function speckle(g,w,h,n,dark,light){for(let i=0;i<n;i++){g.fillStyle=Math.random()<0.5?`rgba(0,0,0,${dark})`:`rgba(255,255,255,${light})`;const s=rand(0.6,2.2);g.fillRect(Math.random()*w,Math.random()*h,s,s);}}

function buildTextures(){
  // ground detail (multiplied onto vertex colours)
  TX.detail=ctex(512,512,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=pfbm(x/w,y/h,8,4)*0.5+pfbm(x/w,y/h,64,2)*0.5;const grain=hash2(x,y)*0.18;const v=clamp(0.72+n*0.3+grain-0.09,0,1)*255;const i=(y*w+x)*4;img.data[i]=v;img.data[i+1]=v*0.985;img.data[i+2]=v*0.965;img.data[i+3]=255;}g.putImageData(img,0,0);
    for(let i=0;i<900;i++){const x=Math.random()*w,y=Math.random()*h,r=rand(0.8,2.6);g.fillStyle=`rgba(${pick([40,70,200,230])},${pick([35,60,190,220])},${pick([30,50,170,200])},${rand(0.15,0.4)})`;g.beginPath();g.ellipse(x,y,r,r*rand(0.6,1),rand(0,3),0,6.28);g.fill();}});
  TX.groundN=nmap(512,(u,v)=>pfbm(u,v,16,4)*0.6+pfbm(u,v,96,2)*0.4,3.2);
  TX.rock=ctex(512,512,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=pfbm(x/w,y/h,6,5),m=pfbm(x/w+0.3,y/h,24,3);const v=clamp(0.5+(n-0.5)*0.9+(m-0.5)*0.35,0,1);const i=(y*w+x)*4;img.data[i]=90+v*120;img.data[i+1]=86+v*112;img.data[i+2]=78+v*100;img.data[i+3]=255;}g.putImageData(img,0,0);
    g.strokeStyle='rgba(30,26,22,0.45)';for(let i=0;i<40;i++){let x=Math.random()*w,y=Math.random()*h;g.lineWidth=rand(0.6,1.8);g.beginPath();g.moveTo(x,y);for(let k=0;k<8;k++){x+=rand(-14,14);y+=rand(-14,14);g.lineTo(x,y);}g.stroke();}speckle(g,w,h,6000,0.12,0.1);});
  TX.rockN=nmap(256,(u,v)=>pfbm(u,v,8,5)+Math.abs(pfbm(u,v,24,3)-0.5)*0.8,4);
  TX.bark=ctex(256,512,(g,w,h)=>{g.fillStyle='#5a4533';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=2){const d=0.5+0.5*Math.sin(x*0.19+pfbm(x/w,0.3,4,2)*6);g.fillStyle=`rgba(20,14,8,${0.45*Math.pow(d,4)})`;g.fillRect(x,0,2,h);}
    for(let i=0;i<260;i++){g.strokeStyle=`rgba(${rand(90,140)|0},${rand(75,110)|0},${rand(50,75)|0},${rand(0.2,0.5)})`;g.lineWidth=rand(1,3);const x=Math.random()*w,y=Math.random()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand(-3,3),y+rand(10,40));g.stroke();}
    for(let i=0;i<60;i++){g.fillStyle=`rgba(${rand(90,130)|0},${rand(130,160)|0},${rand(60,80)|0},${rand(0.25,0.5)})`;g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,rand(3,10),rand(2,6),0,0,6.28);g.fill();}speckle(g,w,h,4000,0.15,0.08);});
  TX.barkN=nmap(256,(u,v)=>0.5+0.5*Math.sin(u*6.283*14+pfbm(u,v,4,3)*5)*0.7+pfbm(u,v,16,3)*0.3,3);
  TX.wood=ctex(1024,512,(g,w,h)=>{g.fillStyle='#2b1c12';g.fillRect(0,0,w,h);for(let i=0;i<340;i++){const y=Math.random()*h;g.strokeStyle=`rgba(${rand(70,120)|0},${rand(44,74)|0},${rand(24,42)|0},${rand(0.12,0.45)})`;g.lineWidth=rand(0.6,3);g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=32)g.lineTo(x,y+Math.sin(x*0.008+i)*rand(1,6));g.stroke();}});
  TX.soil=ctex(256,256,(g,w,h)=>{g.fillStyle='#8a8a8a';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){g.fillStyle=`rgba(${pick([30,60,190,230])},${pick([28,55,180,215])},${pick([25,45,160,200])},${rand(0.2,0.6)})`;const r=rand(0.6,2.4);g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,6.28);g.fill();}});
  TX.moss=ctex(256,256,(g,w,h)=>{g.fillStyle='#3f6b2a';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){g.fillStyle=`hsla(${rand(80,110)},${rand(35,60)}%,${rand(18,48)}%,${rand(0.4,0.9)})`;const r=rand(0.8,2.4);g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,6.28);g.fill();}for(let i=0;i<300;i++){g.fillStyle='rgba(190,210,110,0.55)';g.fillRect(Math.random()*w,Math.random()*h,1.2,1.2);}});
  // leaves
  const leafTex=o=>ctex(o.w||128,o.h||256,(g,w,h)=>{
    const N=60,cx=w/2,L=[],R=[];
    for(let i=0;i<=N;i++){const t=i/N;let hw=o.shape(t)*w*0.47;if(o.teeth)hw*=1-o.teeth*(i%3===0?1:0);L.push([cx-hw,h*(1-t)]);R.push([cx+hw,h*(1-t)]);}
    const p=new Path2D();p.moveTo(cx,h);L.forEach(q=>p.lineTo(q[0],q[1]));for(let i=R.length-1;i>=0;i--)p.lineTo(R[i][0],R[i][1]);p.closePath();
    g.save();g.clip(p);
    const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,o.c0);gr.addColorStop(1,o.c1);g.fillStyle=gr;g.fillRect(0,0,w,h);
    const gs=g.createLinearGradient(0,0,w,0);gs.addColorStop(0,'rgba(0,0,0,0.22)');gs.addColorStop(0.5,'rgba(255,255,255,0.07)');gs.addColorStop(1,'rgba(0,0,0,0.22)');g.fillStyle=gs;g.fillRect(0,0,w,h);
    speckle(g,w,h,w*h/30,0.06,0.05);
    if(o.var){for(let i=0;i<o.var;i++){g.fillStyle=o.varC;g.beginPath();g.ellipse(rand(0,w),rand(0,h),rand(2,w*0.12),rand(2,h*0.05),rand(0,3),0,6.28);g.fill();}}
    if(o.bands){for(let y=0;y<h;y+=o.bands){g.fillStyle=o.bandC;g.fillRect(0,y+rand(-2,2),w,o.bands*0.3);}}
    if(o.baseC){const gb=g.createLinearGradient(0,h,0,h*(1-o.baseT));gb.addColorStop(0,o.baseC);gb.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gb;g.fillRect(0,0,w,h);}
    if(o.vein){g.strokeStyle=o.vein;g.lineWidth=Math.max(1.2,w*0.028);g.beginPath();g.moveTo(cx,h);g.lineTo(cx,0);g.stroke();g.lineWidth=Math.max(0.8,w*0.009);
      for(let k=1;k<o.veins;k++){const y=h*(1-k/o.veins);for(const s of[-1,1]){g.beginPath();g.moveTo(cx,y);g.quadraticCurveTo(cx+s*w*0.2,y-h*0.03,cx+s*w*0.47,y-h*0.1);g.stroke();}}}
    if(o.spots){g.fillStyle=o.spots;for(let i=0;i<o.nspots;i++){g.beginPath();g.ellipse(rand(w*0.15,w*0.85),rand(h*0.05,h*0.95),rand(1.2,2.8),rand(0.8,1.8),0,0,6.28);g.fill();}}
    if(o.holes){g.globalCompositeOperation='destination-out';
      for(let k=0;k<o.holes;k++){const y=h*rand(0.22,0.72);for(const s of[-1,1]){g.beginPath();g.ellipse(cx+s*w*rand(0.14,0.26),y,w*rand(0.025,0.05),h*rand(0.015,0.03),s*0.5,0,6.28);g.fill();}}
      for(let k=0;k<o.slits;k++){const y=h*(0.12+k/o.slits*0.72);for(const s of[-1,1]){g.beginPath();g.moveTo(cx+s*w*0.52,y-h*0.004);g.lineTo(cx+s*w*0.2,y+h*0.018);g.lineTo(cx+s*w*0.52,y+h*0.03);g.fill();}}
      g.globalCompositeOperation='source-over';}
    g.restore();g.strokeStyle=o.edge||'rgba(20,30,10,0.35)';g.lineWidth=1.4;g.stroke(p);});
  TX.leafBroad=leafTex({shape:t=>Math.pow(Math.sin(Math.PI*t),0.75)*(1.08-0.25*t),c0:'#2d5e24',c1:'#4f8c34',vein:'rgba(170,210,120,0.55)',veins:9,w:128,h:256});
  TX.leafVar=leafTex({shape:t=>Math.pow(Math.sin(Math.PI*t),0.8),c0:'#2f5a2a',c1:'#3f7a37',vein:'rgba(235,240,220,0.8)',veins:7,w:128,h:192});
  TX.litter=leafTex({shape:t=>Math.pow(Math.sin(Math.PI*t),0.75)*(1.08-0.25*t),c0:'#6b4a28',c1:'#9a7240',vein:'rgba(60,40,20,0.5)',veins:8,var:14,varC:'rgba(60,40,20,0.3)',w:96,h:160,edge:'rgba(50,30,15,0.5)'});
  TX.monstera=leafTex({shape:t=>Math.pow(Math.sin(Math.PI*(0.06+0.94*t)),0.55)*(t<0.08?0.6+t*5:1),c0:'#1f4d1c',c1:'#2f6b28',vein:'rgba(140,190,100,0.45)',veins:8,holes:4,slits:7,w:256,h:256});
  TX.aloe=leafTex({shape:t=>Math.pow(1-t,0.85),c0:'#5f8a73',c1:'#86ab8c',teeth:0.12,spots:'rgba(235,245,230,0.55)',nspots:60,edge:'rgba(210,190,150,0.8)',w:64,h:256});
  TX.brom=leafTex({shape:t=>t<0.86?1:(1-t)/0.14,c0:'#3d6b2d',c1:'#5c8f3b',bands:14,bandC:'rgba(210,220,170,0.18)',baseC:'rgba(190,40,50,0.95)',baseT:0.35,w:48,h:256});
  TX.reed=leafTex({shape:t=>1-Math.pow(t,3),c0:'#4c6b2c',c1:'#8fa656',vein:'rgba(200,215,150,0.35)',veins:1,w:32,h:512});
  TX.dand=leafTex({shape:t=>Math.pow(Math.sin(Math.PI*Math.min(1,t*1.05)),0.7)*(0.55+0.45*Math.abs(Math.sin(t*16))),c0:'#3f6b2a',c1:'#5f9a3c',vein:'rgba(210,225,170,0.6)',veins:1,w:96,h:256});
  TX.fern=ctex(128,512,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2;
    for(let y=h-14;y>4;y-=8){const t=1-y/h,len=w*0.47*Math.sin(Math.PI*Math.min(1,0.1+t*0.98))*(1-t*0.2);
      for(const s of[-1,1]){g.fillStyle=`hsl(${98+rand(-6,6)},${46+rand(-6,6)}%,${22+t*14+rand(-3,3)}%)`;g.beginPath();g.moveTo(cx,y+2);
        for(let k=0;k<=6;k++){const q=k/6;g.lineTo(cx+s*len*q,y-q*len*0.18-Math.sin(q*Math.PI)*4+(k%2?-2:1));}
        for(let k=6;k>=0;k--){const q=k/6;g.lineTo(cx+s*len*q,y-q*len*0.18+Math.sin(q*Math.PI)*3+3);}g.fill();
        g.strokeStyle='rgba(20,40,10,0.35)';g.lineWidth=0.8;g.beginPath();g.moveTo(cx,y);g.lineTo(cx+s*len,y-len*0.18);g.stroke();}}
    g.strokeStyle='#3d5a22';g.lineWidth=3;g.beginPath();g.moveTo(cx,h);g.lineTo(cx,4);g.stroke();});
  TX.clover=ctex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2,cy=h/2;for(let k=0;k<3;k++){const a=k/3*6.283-1.57;g.save();g.translate(cx,cy);g.rotate(a);
      const gr=g.createLinearGradient(0,0,48,0);gr.addColorStop(0,'#2f6326');gr.addColorStop(1,'#4d8b36');g.fillStyle=gr;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(20,-26,56,-26,52,-4);g.lineTo(46,0);g.lineTo(52,4);g.bezierCurveTo(56,26,20,26,0,0);g.fill();
      g.strokeStyle='rgba(225,235,210,0.55)';g.lineWidth=3;g.beginPath();g.moveTo(22,-12);g.lineTo(30,0);g.lineTo(22,12);g.stroke();g.restore();}});
  TX.lily=ctex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2,cy=h/2,r=w*0.48;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,r,0.12,6.283-0.12);g.closePath();const gr=g.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,'#5a9a45');gr.addColorStop(1,'#2e6628');g.fillStyle=gr;g.fill();
    g.strokeStyle='rgba(160,210,120,0.4)';g.lineWidth=1.3;for(let k=0;k<22;k++){const a=0.2+k/22*5.9;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*r*0.95,cy+Math.sin(a)*r*0.95);g.stroke();}g.strokeStyle='rgba(120,40,40,0.45)';g.lineWidth=3;g.beginPath();g.arc(cx,cy,r*0.97,0.14,6.14);g.stroke();speckle(g,w,h,1500,0.08,0.06);});
  const flowerTex=(bg,petals,pc,pc2,disk,dc,style)=>ctex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2,cy=h/2;
    for(let k=0;k<petals;k++){const a=k/petals*6.283+rand(-0.05,0.05);g.save();g.translate(cx,cy);g.rotate(a);const L=w*(style==='ray'?0.47:0.45)*rand(0.92,1.02),Wd=style==='cosmos'?w*0.12:style==='ray'?w*0.018:w*0.045;
      const gr=g.createLinearGradient(disk*w,0,L,0);gr.addColorStop(0,pc2);gr.addColorStop(1,pc);g.fillStyle=gr;g.beginPath();g.moveTo(disk*w*0.8,0);
      if(style==='cosmos'){g.bezierCurveTo(L*0.4,-Wd,L*0.95,-Wd*1.1,L,-Wd*0.5);g.lineTo(L*0.93,-Wd*0.15);g.lineTo(L,0);g.lineTo(L*0.93,Wd*0.2);g.lineTo(L,Wd*0.5);g.bezierCurveTo(L*0.95,Wd*1.1,L*0.4,Wd,disk*w*0.8,0);}
      else{g.quadraticCurveTo(L*0.5,-Wd,L,0);g.quadraticCurveTo(L*0.5,Wd,disk*w*0.8,0);}g.fill();
      if(style!=='ray'){g.strokeStyle='rgba(0,0,0,0.08)';g.lineWidth=1;g.beginPath();g.moveTo(disk*w,0);g.lineTo(L*0.9,0);g.stroke();}g.restore();}
    if(disk>0){const gr=g.createRadialGradient(cx,cy,0,cx,cy,disk*w);gr.addColorStop(0,dc[0]);gr.addColorStop(1,dc[1]);g.fillStyle=gr;g.beginPath();g.arc(cx,cy,disk*w,0,6.283);g.fill();
      for(let i=0;i<140;i++){const a=i*2.39996,rr=Math.sqrt(i/140)*disk*w*0.95;g.fillStyle='rgba(120,70,10,0.35)';g.beginPath();g.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,1.4,0,6.283);g.fill();}}});
  TX.daisy=flowerTex(0,26,'#fbfaf4','#e9e6da',0.13,['#f7c63c','#d8901c'],'daisy');
  TX.cosmos=[['#e2629c','#c2457e'],['#f6f1f3','#e8d4de'],['#b5204a','#8e1538']].map(c=>flowerTex(0,8,c[0],c[1],0.1,['#f4c542','#c78a1a'],'cosmos'));
  TX.dandF=flowerTex(0,90,'#f7cf2a','#f0b418',0.05,['#e8a818','#c78a10'],'ray');
  TX.puff=ctex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2,cy=h/2;for(let i=0;i<220;i++){const a=Math.random()*6.283,r=w*rand(0.36,0.47);g.strokeStyle=`rgba(250,250,245,${rand(0.35,0.7)})`;g.lineWidth=0.7;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);g.stroke();g.fillStyle='rgba(255,255,255,0.8)';g.beginPath();g.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.8,0,6.283);g.fill();}
    g.fillStyle='rgba(150,120,80,0.9)';g.beginPath();g.arc(cx,cy,6,0,6.283);g.fill();});
  TX.lilyPetal=leafTex({shape:t=>Math.pow(Math.sin(Math.PI*t),0.9),c0:'#f7e4ec',c1:'#ef9cbd',vein:'rgba(255,255,255,0.4)',veins:1,w:64,h:128,edge:'rgba(220,120,160,0.4)'});
  TX.foxHead=ctex(64,256,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2;for(let i=0;i<500;i++){const y=rand(h*0.04,h*0.98),t=y/h,r=w*0.2*Math.sin(Math.PI*clamp(t*1.05,0,1));const x=cx+rand(-r,r);g.strokeStyle=`rgba(${rand(150,210)|0},${rand(160,200)|0},${rand(90,120)|0},0.8)`;g.lineWidth=0.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand(-12,12),y-rand(4,12));g.stroke();}
    g.fillStyle='#8fa54a';for(let y=h*0.05;y<h*0.97;y+=3){const r=w*0.14*Math.sin(Math.PI*y/h);g.fillRect(cx-r,y,r*2,2);}});
  // cacti
  const cactusTex=(ribs,base,spine,wool)=>ctex(512,512,(g,w,h)=>{const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,base[0]);gr.addColorStop(1,base[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);
    const cw=w/ribs;for(let x=0;x<w;x++){const c=Math.cos((x/cw)*6.283);g.fillStyle=c>0?`rgba(255,255,230,${c*0.12})`:`rgba(0,20,0,${-c*0.35})`;g.fillRect(x,0,1,h);}
    speckle(g,w,h,5000,0.08,0.05);
    for(let r=0;r<ribs;r++){const x=r*cw;for(let y=6;y<h;y+=spine.step){g.fillStyle=wool;g.beginPath();g.arc(x+rand(-1,1),y,spine.wool,0,6.283);g.fill();g.strokeStyle=spine.c;g.lineWidth=spine.lw;
      for(let k=0;k<spine.n;k++){const a=rand(0,6.283),l=rand(spine.len*0.5,spine.len);g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}}}
    if(wool){const gt=g.createLinearGradient(0,0,0,h*0.08);gt.addColorStop(0,'rgba(240,215,140,0.9)');gt.addColorStop(1,'rgba(240,215,140,0)');g.fillStyle=gt;g.fillRect(0,0,w,h*0.08);}});
  TX.barrel=cactusTex(20,['#3c6e36','#5b8d45'],{step:18,wool:3,c:'rgba(245,215,110,0.95)',lw:1.4,n:7,len:16},'rgba(245,230,190,0.95)');
  TX.column=cactusTex(12,['#3f6b3c','#5e8b50'],{step:14,wool:2.2,c:'rgba(215,210,190,0.85)',lw:0.9,n:6,len:9},'rgba(230,225,210,0.9)');
  // creatures
  TX.lizard=ctex(256,1024,(g,w,h)=>{g.fillStyle='#c8a068';g.fillRect(0,0,w,h);const bel=g.createLinearGradient(w*0.52,0,w*0.98,0);bel.addColorStop(0,'rgba(236,220,178,0)');bel.addColorStop(0.3,'#ecdcb2');bel.addColorStop(0.7,'#f0e2bd');bel.addColorStop(1,'rgba(236,220,178,0)');g.fillStyle=bel;g.fillRect(0,0,w,h);
    for(let y=h*0.12;y<h*0.95;y+=rand(26,40)){for(const u of[0.17,0.33]){g.fillStyle='rgba(95,62,32,0.85)';g.beginPath();g.ellipse(u*w,y,w*0.05,h*0.012,0,0,6.28);g.fill();g.fillStyle='rgba(245,230,190,0.9)';g.beginPath();g.ellipse(u*w,y,w*0.018,h*0.005,0,0,6.28);g.fill();}}
    g.fillStyle='rgba(110,75,40,0.55)';for(let y=h*0.55;y<h;y+=30)g.fillRect(0,y,w*0.5,9);
    for(let y=0;y<h;y+=4)for(let x=(y/4%2)*2;x<w;x+=4){g.fillStyle=`rgba(255,250,230,${rand(0.05,0.14)})`;g.fillRect(x,y,2,2);}speckle(g,w,h,5000,0.12,0.06);});
  TX.snake=ctex(256,1024,(g,w,h)=>{g.fillStyle='#df8a47';g.fillRect(0,0,w,h);
    for(let y=h*0.04;y<h;y+=h/28){g.fillStyle='#16110e';g.beginPath();g.ellipse(w*0.25,y,w*0.19,h*0.017,0,0,6.28);g.fill();g.fillStyle='#bd3f24';g.beginPath();g.ellipse(w*0.25,y,w*0.165,h*0.013,0,0,6.28);g.fill();
      for(const u of[0.02,0.48]){g.fillStyle='#8e2e1c';g.beginPath();g.ellipse(u*w,y+h*0.017,w*0.05,h*0.007,0,0,6.28);g.fill();}}
    for(let y=0;y<h;y+=10)for(let x=w*0.62;x<w*0.88;x+=12){g.fillStyle=((x/12+y/10)|0)%2?'#f2ead8':'#1c1714';g.fillRect(x,y,12,10);}
    for(let y=0;y<h;y+=5)for(let x=(y/5%2)*3;x<w;x+=6){g.fillStyle=`rgba(255,240,220,${rand(0.04,0.12)})`;g.fillRect(x,y,3,3);}});
  TX.frog=ctex(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#4f9a3c');gr.addColorStop(0.42,'#6db34c');gr.addColorStop(0.52,'#9ccc6a');gr.addColorStop(0.58,'#efe9c8');gr.addColorStop(1,'#e8e0bc');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(60,45,30,0.85)';g.fillRect(0,h*0.475,w,h*0.022);for(let i=0;i<40;i++){g.fillStyle='rgba(40,80,30,0.5)';g.beginPath();g.ellipse(rand(0,w),rand(h*0.05,h*0.42),rand(2,5),rand(1.5,4),0,0,6.28);g.fill();}speckle(g,w,h,3000,0.07,0.08);});
  TX.frogEye=ctex(128,128,(g,w,h)=>{g.fillStyle='#b88a2a';g.fillRect(0,0,w,h);const gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w*0.3);gr.addColorStop(0,'#f2cf5a');gr.addColorStop(1,'#a8781e');g.fillStyle=gr;g.beginPath();g.arc(w/2,h/2,w*0.34,0,6.28);g.fill();
    for(let i=0;i<60;i++){g.strokeStyle='rgba(90,50,10,0.4)';g.beginPath();const a=Math.random()*6.28;g.moveTo(w/2,h/2);g.lineTo(w/2+Math.cos(a)*w*0.33,h/2+Math.sin(a)*w*0.33);g.stroke();}g.fillStyle='#050505';g.beginPath();g.ellipse(w/2,h/2,w*0.2,h*0.085,0,0,6.28);g.fill();});
  TX.cat=ctex(128,512,(g,w,h)=>{g.fillStyle='#8fc24a';g.fillRect(0,0,w,h);for(let y=16;y<h;y+=h/13){g.fillStyle='#141410';g.fillRect(0,y,w,10);for(let x=6;x<w;x+=22){g.fillStyle='#f5b82c';g.beginPath();g.arc(x,y+5,3.2,0,6.28);g.fill();}}g.fillStyle='rgba(240,250,210,0.5)';g.fillRect(w*0.65,0,w*0.2,h);});
  TX.spider=ctex(256,256,(g,w,h)=>{g.fillStyle='#1b1712';g.fillRect(0,0,w,h);const bands=[['#f5c93a',0.12],['#1b1712',0.05],['#f2efe6',0.05],['#1b1712',0.06],['#f5c93a',0.14],['#1b1712',0.05],['#f5c93a',0.12],['#1b1712',0.06],['#f5c93a',0.1]];let y=h*0.06;
    for(const [c,f] of bands){g.fillStyle=c;const hh=f*h;for(let x=0;x<w;x+=4){g.fillRect(x,y+Math.sin(x*0.15)*3,4,hh);}y+=hh;}g.fillStyle='rgba(20,18,14,0.9)';g.fillRect(w*0.55,0,w*0.4,h);});
  TX.shell=ctex(512,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#7a5a38');gr.addColorStop(1,'#c69a60');g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(const [y,t,c] of[[0.25,10,'#4a2e16'],[0.52,6,'#5a3a1c'],[0.72,4,'#e8d2a4']]){g.fillStyle=c;g.fillRect(0,y*h,w,t);}for(let x=0;x<w;x+=rand(2,6)){g.fillStyle=`rgba(${Math.random()<0.5?'40,25,10':'240,220,180'},${rand(0.06,0.18)})`;g.fillRect(x,0,1.2,h);}});
  // butterfly wings: forewing + hindwing drawn in one frame
  TX.FW=[[0.015,0.005],[0.06,0.08],[0.088,0.19],[0.052,0.265],[-0.012,0.245],[-0.025,0.16],[-0.01,0.05]];
  TX.HWN=[[-0.005,0.004],[-0.012,0.12],[-0.07,0.17],[-0.14,0.13],[-0.155,0.06],[-0.1,0.005]];
  const wingDraw=v=>ctex(256,256,(g,w,h)=>{const X=x=>(x+0.17)/0.27*w,Y=y=>(1-y/0.28)*h;g.clearRect(0,0,w,h);
    const clipPoly=pts=>{g.beginPath();g.moveTo(X(pts[0][0]),Y(pts[0][1]));for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];g.quadraticCurveTo(X(a[0]),Y(a[1]),X((a[0]+b[0])/2),Y((a[1]+b[1])/2));}g.lineTo(X(pts[pts.length-1][0]),Y(pts[pts.length-1][1]));g.closePath();};
    for(const poly of[TX.FW,TX.HWN]){g.save();clipPoly(poly);g.clip();
      const base=[['#d9661a','#f4a23c'],['#1c4fc0','#5fcaff'],['#f1d35f','#fae89a']][v];const gr=g.createRadialGradient(X(0),Y(0),0,X(0),Y(0),w*0.9);gr.addColorStop(0,base[0]);gr.addColorStop(1,base[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);
      if(v===1){g.globalAlpha=0.35;for(let i=0;i<30;i++){g.fillStyle=i%2?'#9ae6ff':'#123a9a';g.beginPath();g.ellipse(rand(0,w),rand(0,h),rand(10,40),rand(4,10),rand(0,3),0,6.28);g.fill();}g.globalAlpha=1;}
      g.strokeStyle=v===2?'rgba(30,25,15,0.8)':'#110c09';g.lineWidth=v===0?3.4:v===1?1.2:2.2;for(let i=0;i<10;i++){const a=poly===TX.FW?-0.1+i*0.2:1.6+i*0.17;g.beginPath();g.moveTo(X(0),Y(0.003));g.quadraticCurveTo(X(Math.cos(a)*0.06),Y(Math.max(0,Math.sin(a))*0.06+0.02),X(Math.cos(a)*0.2),Y(Math.max(0,Math.sin(a))*0.28+0.01));g.stroke();}
      if(v===2){g.fillStyle='#17130e';for(let i=0;i<5;i++){g.save();g.translate(X(-0.02+i*0.018),Y(0.1));g.rotate(-0.4);g.fillRect(-4,-60,8+i,120);g.restore();}}
      clipPoly(poly);g.lineWidth=v===1?30:22;g.strokeStyle='#120d0a';g.stroke();
      g.fillStyle=v===2?'#f3dc6e':'#fff';for(let i=0;i<22;i++){const k=1+(i%(poly.length-1)),a=poly[k],b=poly[(k+1)%poly.length],t=Math.random();g.beginPath();g.arc(lerp(X(a[0]),X(b[0]),t)*0.94+X(0)*0.06,lerp(Y(a[1]),Y(b[1]),t)*0.94+Y(0)*0.06,rand(1.6,3.2),0,6.28);g.fill();}
      if(v===2&&poly===TX.HWN){g.fillStyle='#e2582a';g.beginPath();g.arc(X(-0.13),Y(0.035),7,0,6.28);g.fill();g.fillStyle='#3a7ad8';g.beginPath();g.arc(X(-0.11),Y(0.06),5,0,6.28);g.fill();}
      g.restore();}});
  TX.wings=[0,1,2].map(wingDraw);
  // fx
  TX.glow=ctex(128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,235,1)');r.addColorStop(0.16,'rgba(220,255,140,0.8)');r.addColorStop(0.45,'rgba(160,230,90,0.18)');r.addColorStop(1,'rgba(120,200,60,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  TX.soft=ctex(128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,0.6)');r.addColorStop(0.5,'rgba(255,255,255,0.2)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  TX.drop=ctex(512,512,(g,w,h)=>{g.fillStyle='rgba(235,245,242,0.18)';g.fillRect(0,0,w,h);
    for(let i=0;i<1000;i++){const x=Math.random()*w,y=Math.random()*h,r=Math.random()<0.9?rand(1.2,4):rand(5,11);const gr=g.createRadialGradient(x-r*0.3,y-r*0.3,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,0.85)');gr.addColorStop(0.35,'rgba(240,250,255,0.15)');gr.addColorStop(0.85,'rgba(255,255,255,0.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*rand(1,1.25),0,0,6.28);g.fill();}
    for(let i=0;i<16;i++){let x=Math.random()*w,y=Math.random()*h*0.4;g.strokeStyle='rgba(255,255,255,0.28)';g.lineWidth=rand(1.5,3);g.beginPath();g.moveTo(x,y);for(let k=0;k<12;k++){x+=rand(-3,3);y+=rand(10,26);g.lineTo(x,y);}g.stroke();}});
  TX.waterN=nmap(256,(u,v)=>pfbm(u,v,6,4)+0.5*pfbm(u,v,18,3),5);
  TX.fall=ctex(128,512,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<260;i++){const x=Math.random()*w,y=Math.random()*h,l=rand(30,140);const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.5,`rgba(235,248,255,${rand(0.25,0.8)})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x,y,rand(1,4),l);g.fillRect(x,y-h,rand(1,4),l);}},true);
  TX.screen=ctex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(18,20,19,1)';for(let i=0;i<w;i+=8){g.fillRect(i,0,2,h);g.fillRect(0,i,w,2);}});
  TX.streak=ctex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.translate(w/2,h/2);g.rotate(-0.5);for(const [x,wd,a] of[[-60,38,0.5],[-10,10,0.35],[30,60,0.22]]){const gr=g.createLinearGradient(x,0,x+wd,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.5,`rgba(255,255,255,${a})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x,-300,wd,600);}});
}

/* ---------- ocean + extra textures ---------- */
function buildOceanTextures(){
  TX.kelp=ctex(96,512,(g,w,h)=>{g.clearRect(0,0,w,h);const cx=w/2;const p=new Path2D();p.moveTo(cx,h);for(let y=h;y>=0;y-=4){const t=1-y/h,hw=w*0.46*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.1+0.04)),0.6)*(0.85+0.15*Math.sin(y*0.35));p.lineTo(cx-hw,y);}for(let y=0;y<=h;y+=4){const t=1-y/h,hw=w*0.46*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.1+0.04)),0.6)*(0.85+0.15*Math.sin(y*0.35+1));p.lineTo(cx+hw,y);}p.closePath();
    g.save();g.clip(p);const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'#5a4a1c');gr.addColorStop(1,'#a8913a');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let y=0;y<h;y+=6){g.strokeStyle=`rgba(40,30,10,${rand(0.08,0.2)})`;g.beginPath();g.moveTo(0,y);g.quadraticCurveTo(cx,y+rand(-4,4),w,y);g.stroke();}
    g.strokeStyle='rgba(230,210,120,0.35)';g.lineWidth=2;g.beginPath();g.moveTo(cx,h);g.lineTo(cx,0);g.stroke();speckle(g,w,h,1500,0.08,0.08);g.restore();});
  TX.fan=ctex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const br=(x,y,a,l,wd,d)=>{if(d>7||l<3)return;const x2=x+Math.cos(a)*l,y2=y-Math.sin(a)*l;g.strokeStyle=`rgba(${200+d*6},${60+d*8},${90+d*6},1)`;g.lineWidth=wd;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();br(x2,y2,a+rand(0.2,0.5),l*rand(0.72,0.85),wd*0.78,d+1);br(x2,y2,a-rand(0.2,0.5),l*rand(0.72,0.85),wd*0.78,d+1);};
    br(w/2,h,Math.PI/2,50,7,0);g.strokeStyle='rgba(220,90,120,0.55)';g.lineWidth=1;for(let i=0;i<260;i++){const a=rand(0.25,2.9),r=rand(30,120);const x=w/2+Math.cos(a)*r,y=h-Math.sin(a)*r;g.beginPath();g.moveTo(x,y);g.lineTo(x+rand(-10,10),y+rand(-10,10));g.stroke();}});
  TX.fin=ctex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(255,255,255,0.55)';g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,0.95)';g.lineWidth=1.4;for(let i=0;i<14;i++){g.beginPath();g.moveTo(0,h/2);g.lineTo(w,i/13*h);g.stroke();}});
  const fishTex=(fn)=>ctex(256,512,(g,w,h)=>{fn(g,w,h);for(let y=0;y<h;y+=5)for(let x=(y/5%2)*3;x<w;x+=6){g.fillStyle=`rgba(255,255,255,${rand(0.03,0.09)})`;g.beginPath();g.arc(x,y,2,0,6.28);g.fill();}});
  TX.damsel=fishTex((g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#1a4fd8');gr.addColorStop(0.25,'#123fb0');gr.addColorStop(0.55,'#3aa8f0');gr.addColorStop(0.8,'#9ad8ff');gr.addColorStop(1,'#1a4fd8');g.fillStyle=gr;g.fillRect(0,0,w,h);const t=g.createLinearGradient(0,h*0.6,0,h);t.addColorStop(0,'rgba(255,214,40,0)');t.addColorStop(0.35,'rgba(255,214,40,1)');g.fillStyle=t;g.fillRect(0,h*0.6,w,h*0.4);});
  TX.clown=fishTex((g,w,h)=>{g.fillStyle='#f07a1c';g.fillRect(0,0,w,h);for(const y of[0.2,0.5,0.8]){g.fillStyle='#141010';g.fillRect(0,h*y-26,w,52);g.fillStyle='#fbfbf6';g.fillRect(0,h*y-20,w,40);}const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(0,0,0,0.1)');gr.addColorStop(0.25,'rgba(0,0,0,0)');gr.addColorStop(0.75,'rgba(255,255,255,0.12)');gr.addColorStop(1,'rgba(0,0,0,0.1)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  TX.grouper=fishTex((g,w,h)=>{g.fillStyle='#c43a2a';g.fillRect(0,0,w,h);const b=g.createLinearGradient(w*0.55,0,w*0.95,0);b.addColorStop(0,'rgba(240,160,130,0)');b.addColorStop(0.5,'rgba(240,170,140,0.7)');b.addColorStop(1,'rgba(240,160,130,0)');g.fillStyle=b;g.fillRect(0,0,w,h);for(let i=0;i<520;i++){g.fillStyle=`rgba(${rand(60,120)|0},${rand(170,220)|0},255,0.9)`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,rand(1.5,3),0,6.28);g.fill();}});
  TX.moray=ctex(256,1024,(g,w,h)=>{g.fillStyle='#6f7d2a';g.fillRect(0,0,w,h);g.strokeStyle='rgba(30,35,10,0.8)';g.lineWidth=3;for(let i=0;i<700;i++){const x=Math.random()*w,y=Math.random()*h;g.beginPath();g.ellipse(x,y,rand(6,12),rand(6,12),0,0,6.28);g.stroke();}g.fillStyle='rgba(220,210,120,0.35)';g.fillRect(w*0.6,0,w*0.3,h);});
  TX.ray=ctex(64,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,0.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);const gs=g.createLinearGradient(0,0,w,0);gs.addColorStop(0,'rgba(0,0,0,1)');gs.addColorStop(0.5,'rgba(0,0,0,0)');gs.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=gs;g.fillRect(0,0,w,h);});
  TX.bubble=ctex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(235,250,255,0.9)';g.lineWidth=3;g.beginPath();g.arc(32,32,26,0,6.28);g.stroke();g.fillStyle='rgba(255,255,255,0.5)';g.beginPath();g.arc(24,22,6,0,6.28);g.fill();});
}

/* ---------- modes + home screen ---------- */
const MODES={
  mixed:{name:'混合生态缸',zone:null,pond:1,stream:true,vines:[6.5,17.4],heat:true},
  desert:{name:'沙漠缸',zone:0,pond:0,stream:false,vines:null,heat:true},
  meadow:{name:'草甸缸',zone:1,pond:0.75,stream:false,vines:null,heat:false},
  marsh:{name:'溪沼缸',zone:2,pond:1.35,stream:true,vines:[-17.4,17.4],heat:false},
  jungle:{name:'雨林缸',zone:3,pond:0.7,stream:true,vines:[-17.4,17.4],heat:false},
  ocean:{name:'海洋缸',ocean:true,zone:null,pond:0,stream:false,vines:null,heat:false},
};
let MK='mixed',MODE=MODES.mixed,OCEAN=false;
function runHome(){return new Promise(resolve=>{
  const home=$('#home'),cv=$('#homeBg'),g=cv.getContext('2d');let W2=1,H2=1;const dpr=Math.min(2,window.devicePixelRatio||1);
  const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const PAL={mixed:['#10201a','#04070a','#0b1710',[255,236,190],[210,255,140],0],desert:['#3c2616','#0c0705','#1d1209',[255,210,150],[255,222,170],0],meadow:['#1f2c13','#070a05','#0f190a',[255,242,190],[255,250,210],0],
    marsh:['#10261f','#040a0a','#0a1814',[200,240,230],[210,255,150],0],jungle:['#0d2412','#030805','#06130a',[220,255,200],[200,255,160],0],ocean:['#0c4a6a','#02111e','#042232',[170,230,255],[220,245,255],1]};
  const conv=p=>({top:hx(p[0]),bot:hx(p[1]),fg:hx(p[2]),ray:p[3],part:p[4],oc:p[5]});
  let cur=conv(PAL.mixed),tgt=conv(PAL.mixed);
  const parts=Array.from({length:110},()=>({x:Math.random(),y:Math.random(),s:rand(0.6,1.8),ph:rand(0,6.28),v:rand(0.3,1)}));
  const blades=Array.from({length:120},(_,i)=>({x:i/120+rand(-0.006,0.006),h:rand(0.06,0.24),ph:rand(0,6.28),w:rand(1.5,4)}));
  const kelp=Array.from({length:18},()=>({x:rand(0,1),h:rand(0.3,0.78),ph:rand(0,6.28),w:rand(8,16)}));
  const rs=()=>{W2=innerWidth;H2=innerHeight;cv.width=W2*dpr;cv.height=H2*dpr;g.setTransform(dpr,0,0,dpr,0,0);};rs();addEventListener('resize',rs);
  let alive=true;const t0=performance.now();const rgb=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
  function draw(now){if(!alive)return;requestAnimationFrame(draw);const t=(now-t0)/1000;
    for(const k of['top','bot','fg','ray','part'])cur[k]=cur[k].map((v,i)=>v+(tgt[k][i]-v)*0.05);cur.oc+=(tgt.oc-cur.oc)*0.04;const oc=cur.oc,W=W2,H=H2;
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,rgb(cur.top,1));bg.addColorStop(1,rgb(cur.bot,1));g.globalCompositeOperation='source-over';g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.globalCompositeOperation='lighter';
    for(let k=0;k<6;k++){const x=W*(0.08+k*0.17)+Math.sin(t*0.18+k*1.7)*50,w0=40+k%3*30,w1=W*0.22,a=0.05+0.03*Math.sin(t*0.3+k);const gr=g.createLinearGradient(0,0,0,H*0.95);gr.addColorStop(0,rgb(cur.ray,a));gr.addColorStop(1,rgb(cur.ray,0));g.fillStyle=gr;g.beginPath();g.moveTo(x-w0/2,0);g.lineTo(x+w0/2,0);g.lineTo(x+w1/2+H*0.25,H);g.lineTo(x-w1/2+H*0.25,H);g.closePath();g.fill();}
    if(oc>0.02){g.strokeStyle=rgb([200,240,255],0.05*oc);g.lineWidth=2;for(let i=0;i<26;i++){g.beginPath();const y0=H*0.02+i*9;for(let x=0;x<=W;x+=24){const y=y0+Math.sin(x*0.012+t*1.3+i)*6+Math.sin(x*0.031-t*0.9)*4;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}}
    g.globalCompositeOperation='source-over';
    g.fillStyle=rgb(cur.fg.map(v=>v*1.6),0.7);g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=20)g.lineTo(x,H*0.82+Math.sin(x*0.004+1)*H*0.04+Math.sin(x*0.013)*H*0.015);g.lineTo(W,H);g.fill();
    if(oc<0.98){g.strokeStyle=rgb(cur.fg,1-oc);g.lineCap='round';for(const b of blades){const bx=b.x*W,bh=b.h*H*(H>W?0.7:1),sw=Math.sin(t*1.1+b.ph+b.x*6)*16;g.lineWidth=b.w;g.beginPath();g.moveTo(bx,H+2);g.quadraticCurveTo(bx+sw*0.3,H-bh*0.5,bx+sw,H-bh);g.stroke();}}
    if(oc>0.02){g.lineCap='round';for(const k of kelp){const kx=k.x*W,kh=k.h*H;g.strokeStyle=rgb([30,70,50],oc*0.9);g.lineWidth=k.w;g.beginPath();g.moveTo(kx,H+4);for(let s=1;s<=14;s++){const f=s/14;g.lineTo(kx+Math.sin(t*0.8+f*3+k.ph)*38*f,H-kh*f);}g.stroke();}
      g.fillStyle=rgb([200,90,110],oc*0.6);for(let i=0;i<9;i++){g.beginPath();g.arc(W*(0.05+i*0.12),H+10,40+i%3*18,Math.PI,0);g.fill();}}
    for(const p of parts){if(oc>0.5){p.y-=0.0012*p.v;p.x+=Math.sin(t*2+p.ph)*0.0006;if(p.y<-0.02){p.y=1.02;p.x=Math.random();}g.strokeStyle=rgb(cur.part,0.5*oc);g.lineWidth=1.2;g.beginPath();g.arc(p.x*W,p.y*H,p.s*2.2,0,6.28);g.stroke();}
      else{p.x+=Math.sin(t*0.3+p.ph)*0.0004;p.y+=Math.cos(t*0.25+p.ph)*0.0003;const bl=Math.pow(Math.max(0,Math.sin(t*p.v*1.6+p.ph)),4);const r=p.s*(3+bl*5);const gr=g.createRadialGradient(p.x*W,p.y*H,0,p.x*W,p.y*H,r*3);gr.addColorStop(0,rgb(cur.part,0.2+0.7*bl));gr.addColorStop(1,rgb(cur.part,0));g.fillStyle=gr;g.fillRect(p.x*W-r*3,p.y*H-r*3,r*6,r*6);}}
    const vg=g.createRadialGradient(W/2,H*0.45,Math.min(W,H)*0.3,W/2,H*0.45,Math.max(W,H)*0.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.55)');g.fillStyle=vg;g.fillRect(0,0,W,H);}
  requestAnimationFrame(draw);
  const rq=()=>$$('#homeQual button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.q===QK));rq();
  $$('#homeQual button').forEach(b=>b.addEventListener('click',()=>{QK=b.dataset.q;Q=QUAL[QK];try{localStorage.setItem('ark-quality',QK);}catch(e){}rq();}));
  $$('.mode').forEach(b=>{const k=b.dataset.mode;const hov=()=>{tgt=conv(PAL[k]);};b.addEventListener('pointerenter',hov);b.addEventListener('focus',hov);b.addEventListener('pointerleave',()=>{tgt=conv(PAL.mixed);});
    b.addEventListener('click',()=>{MK=k;MODE=MODES[k];OCEAN=!!MODE.ocean;$('#loading').classList.remove('gone');home.classList.add('gone');setTimeout(()=>{alive=false;home.remove();},900);resolve(k);});});
});}
await runHome();
setMsg(`正在布置${MODE.name}…`);await tick();
