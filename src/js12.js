/* ---------- 桌面版 / desktop build ----------
   window.arkDesktop is injected by the Electron preload (desktop/preload.js). In a browser it is absent and nothing here shows.
   桌面模式 (widget): a small frameless window that sits on the desktop; the page hides every panel, lets the director drive
   the camera and caps the frame rate. The full window and the widget are never open together, so they share one save. */
var FPSCAP=0;
const DESK=window.arkDesktop||null;
let WIDGET=false,deskSt={pin:true,opacity:1,size:'m'};
function deskEnter(){if(!DESK)return;try{saveNow();}catch(e){}DESK.enterWidget(MK);}
function deskExit(){if(!DESK)return;try{saveNow();}catch(e){}DESK.exitWidget(MK);}
function deskBar(){const b=$('#wbar');if(!b)return;
  b.querySelector('[data-w=pin]').setAttribute('aria-pressed',!!deskSt.pin);
  b.querySelector('[data-w=size] span').textContent=(LANG==='en'?{s:'S',m:'M',l:'L'}:{s:'小',m:'中',l:'大'})[deskSt.size]||'';
  b.querySelector('[data-w=opacity] span').textContent=Math.round(deskSt.opacity*100)+'%';}
function deskWidgetUI(){WIDGET=true;FPSCAP=30;document.body.classList.add('widget');
  if(typeof INTRO!=='undefined'&&INTRO)introEnd(true);
  try{closeOverlays();}catch(e){}
  if(typeof deselect==='function')deselect();
  if(env.cphase!=='build'){director.on=true;$('#dirBtn').setAttribute('aria-pressed','true');director.lockUntil=0;director.next=0;}
  if(glassHidden)setGlass(false);
  const b=$('#wbar');b.hidden=false;
  b.addEventListener('click',async e=>{const t=e.target.closest('[data-w]');if(!t)return;const k=t.dataset.w;
    if(k==='exit')return deskExit();
    if(k==='close'){try{saveNow();}catch(e){}return DESK.quit();}
    if(k==='pin')deskSt.pin=!deskSt.pin;
    if(k==='size')deskSt.size={s:'m',m:'l',l:'s'}[deskSt.size]||'m';
    if(k==='opacity')deskSt.opacity={1:0.85,0.85:0.7,0.7:1}[deskSt.opacity]||1;
    deskSt=await DESK.setWidget(k==='size'?{size:deskSt.size}:k==='pin'?{pin:deskSt.pin}:{opacity:deskSt.opacity})||deskSt;deskBar();});
  DESK.getWidget().then(s=>{if(s)deskSt=s;deskBar();});}
function deskInit(){if(!DESK)return;document.body.classList.add('desktop');
  const btn=$('#deskBtn');if(btn){btn.hidden=false;btn.addEventListener('click',deskEnter);}
  try{DESK.setMode(MK);}catch(e){}
  let w=false;try{w=new URLSearchParams(location.search).get('widget')==='1';}catch(e){}
  if(w)deskWidgetUI();
  addEventListener('keydown',e=>{if(e.key==='F11'){e.preventDefault();DESK.toggleFullscreen();}});}
deskInit();
