/* ============================================================
   Shared site behaviour: nav, reveal, count-up, charts,
   literature filters, and the interactive neuron animation.
   ============================================================ */
(function(){
'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,e)=>(e||document).querySelector(s);
const $$=(s,e)=>Array.from((e||document).querySelectorAll(s));
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>v<a?a:v>b?b:v, rand=(a,b)=>a+Math.random()*(b-a), TAU=Math.PI*2;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const sprites={};
function glow(k,r,g,b){if(sprites[k])return sprites[k];const s=128,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');const gr=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,'rgba('+r+','+g+','+b+',1)');gr.addColorStop(.2,'rgba('+r+','+g+','+b+',.72)');gr.addColorStop(.45,'rgba('+r+','+g+','+b+',.26)');gr.addColorStop(1,'rgba('+r+','+g+','+b+',0)');x.fillStyle=gr;x.fillRect(0,0,s,s);sprites[k]=c;return c;}
const gCy=()=>glow('cy',90,210,255),gWh=()=>glow('wh',230,248,255),gHot=()=>glow('ht',255,140,80),gVio=()=>glow('vi',155,115,255);
function blob(ctx,sp,x,y,r,a){ctx.globalAlpha=a;ctx.drawImage(sp,x-r,y-r,r*2,r*2);ctx.globalAlpha=1;}
function roundRect(ctx,x,y,w,h,r){r=Math.min(r,h/2,w/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function fitCanvas(c){const dpr=Math.min(window.devicePixelRatio||1,2),r=c.getBoundingClientRect();c.width=Math.max(1,r.width*dpr|0);c.height=Math.max(1,r.height*dpr|0);const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return{w:r.width,h:r.height};}

/* ---------- NAV ---------- */
const nav=$('#nav');
const onScroll=()=>{if(nav)window.scrollY>40?nav.classList.add('scrolled'):nav.classList.remove('scrolled');};
onScroll();window.addEventListener('scroll',onScroll,{passive:true});
const burger=$('#burger'),mm=$('#mobileMenu');
if(burger&&mm)burger.addEventListener('click',()=>mm.classList.toggle('open'));
$$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>mm&&mm.classList.remove('open')));

/* ---------- VIDEO autoplay safety ---------- */
$$('video[autoplay]').forEach(v=>{v.muted=true;const p=v.play&&v.play();if(p&&p.catch)p.catch(()=>{});});

/* ---------- REVEAL + count-up + charts ---------- */
function countUp(el){const to=parseFloat(el.dataset.to||'0'),dec=(el.dataset.dec|0),dur=1100,t0=performance.now();
  function step(t){const k=clamp((t-t0)/dur,0,1),e=1-Math.pow(1-k,3),val=to*e;el.textContent=dec?val.toFixed(dec):Math.round(val).toLocaleString();if(k<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function drawBars(canvas){
  const data=(canvas.dataset.vals||'').split(',').filter(Boolean).map(s=>{const[k,v]=s.split(':');return{k,v:+v};});
  if(!data.length)return;const s=fitCanvas(canvas),W=s.w,H=s.h,ctx=canvas.getContext('2d');
  const max=Math.max(...data.map(d=>d.v)),padB=26,padT=14,n=data.length,gap=10,bw=(W-gap*(n-1))/n;
  const accent=canvas.dataset.color||'#34d2ff';
  let t0=performance.now();
  function frame(t){const k=clamp((t-t0)/900,0,1),e=1-Math.pow(1-k,3);ctx.clearRect(0,0,W,H);ctx.font='10px Inter,sans-serif';ctx.textAlign='center';
    data.forEach((d,i)=>{const h=(H-padB-padT)*(d.v/max)*e,x=i*(bw+gap),y=H-padB-h;
      const g=ctx.createLinearGradient(0,y,0,H-padB);g.addColorStop(0,accent);g.addColorStop(1,'rgba(52,210,255,.12)');ctx.fillStyle=g;roundRect(ctx,x,y,bw,h,3);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillText(Math.round(d.v*e),x+bw/2,y-5);
      ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillText(d.k,x+bw/2,H-9);});
    if(k<1)requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
}
if('IntersectionObserver' in window){
  const ro=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');
    $$('.count',e.target).forEach(countUp);
    if(e.target.matches('canvas[data-vals]'))drawBars(e.target);
    ro.unobserve(e.target);}});},{threshold:.18});
  $$('.reveal').forEach(el=>ro.observe(el));
  $$('canvas[data-vals]').forEach(el=>ro.observe(el));
}else{$$('.reveal').forEach(el=>el.classList.add('in'));$$('.count').forEach(countUp);$$('canvas[data-vals]').forEach(drawBars);}

/* ---------- LITERATURE FILTERS ---------- */
const chips=$$('.chip');
if(chips.length){chips.forEach(c=>c.addEventListener('click',()=>{chips.forEach(x=>x.classList.remove('on'));c.classList.add('on');const f=c.dataset.filter;
  $$('.paper').forEach(p=>{p.style.display=(f==='all'||p.dataset.domain===f)?'':'none';});}));}

/* ============ INTERACTIVE NEURON (membrane potential) ============ */
(function neuron(){
  const canvas=$('#neuronCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');
  const VW=1000,VH=560;
  const vVal=$('#vVal'),vPhase=$('#vPhase'),stimBtn=$('#stimBtn'),autoBtn=$('#autoBtn'),speedEl=$('#speed');
  const RNG=mulberry32(11);
  const soma={x:345,y:280,r:60};const nodesX=[490,610,720];
  function measure(pts){let L=0;const cum=[0];for(let i=1;i<pts.length;i++){L+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);cum.push(L);}return{L,cum};}
  function at(pts,cum,L,t){const d=clamp(t,0,1)*L;let i=1;while(i<cum.length&&cum[i]<d)i++;if(i>=pts.length)return pts[pts.length-1];const a=pts[i-1],b=pts[i],sg=cum[i]-cum[i-1],f=sg?(d-cum[i-1])/sg:0;return{x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f)};}
  const dendSegs=[],dendPaths=[];
  function branch(x,y,ang,len,width,depth){const steps=5,seg=len/steps;let cx=x,cy=y,ca=ang;const line=[{x,y}];for(let s=0;s<steps;s++){ca+=(RNG()-.5)*.5;cx+=Math.cos(ca)*seg;cy+=Math.sin(ca)*seg;line.push({x:cx,y:cy});}dendSegs.push({pts:line,w:width});let tail=[{x:cx,y:cy}];if(depth>0){let chosen=null;for(let b=0;b<2;b++){const na=ca+(b===0?-1:1)*(.35+RNG()*.5);const ch=branch(cx,cy,na,len*.7,width*.6,depth-1);if(b===0)chosen=ch;}tail=chosen;}return line.concat(tail.slice(1));}
  [Math.PI*.86,Math.PI*1.02,Math.PI*1.16,Math.PI*.72,Math.PI*1.30,Math.PI*.97].forEach(a=>{const sx=soma.x+Math.cos(a)*soma.r*.9,sy=soma.y+Math.sin(a)*soma.r*.9;const path=branch(sx,sy,a,rand(120,165),7,3),pts=path.slice().reverse(),m=measure(pts);dendPaths.push({pts,cum:m.cum,L:m.L});});
  const axonPts=[];{const x0=soma.x+soma.r*.95,x1=860,n=30;for(let i=0;i<=n;i++){const t=i/n;axonPts.push({x:lerp(x0,x1,t),y:280+Math.sin(t*TAU)*4});}}
  const axonM=measure(axonPts);
  const myelin=[];{const stops=[soma.x+soma.r*.95,...nodesX,860];for(let i=0;i<stops.length-1;i++){const a=stops[i]+(i===0?4:9),b=stops[i+1]-9;if(b-a>10)myelin.push({a,b,y:280});}}
  const termSegs=[],boutons=[];{const bx0=860,by0=280,ends=[[946,232],[968,280],[946,328],[922,256],[922,304]];ends.forEach((e,i)=>{const pts=[{x:bx0,y:by0}];let cx=bx0,cy=by0;for(let s=0;s<3;s++){cx+=(e[0]-bx0)/3;cy+=(e[1]-by0)/3+(RNG()-.5)*4;pts.push({x:cx,y:cy});}termSegs.push(pts);if(i<3)boutons.push({x:e[0],y:e[1],fl:0});});}
  const REST=-70,THRESH=-55,PEAK=40,HYPER=-80;
  let V=REST,phase='Resting',auto=!reduce,speed=1;
  let epsps=[],ap=null,parts=[],stimT=0,nextIn=rand(280,520),spikeClock=0,inSpike=false,launched=false,refractory=0,somaRipple=0;
  const nodeFlash=[0,0,0];
  if(speedEl)speedEl.addEventListener('input',()=>speed=parseFloat(speedEl.value));
  if(autoBtn)autoBtn.addEventListener('click',()=>{auto=!auto;autoBtn.textContent=auto?'Pause auto-fire':'Resume auto-fire';});
  if(reduce&&autoBtn)autoBtn.textContent='Resume auto-fire';
  function spawnEpsp(i,bump){epsps.push({d:dendPaths[i%dendPaths.length],t:0,bump,trail:[],arr:false});}
  function stimulate(){if(inSpike||refractory>0)return;for(let k=0;k<3;k++)spawnEpsp(RNG()*dendPaths.length|0,rand(10,13));}
  if(stimBtn)stimBtn.addEventListener('click',stimulate);
  function triggerSpike(){inSpike=true;spikeClock=0;launched=false;V=THRESH;}
  function release(){for(const b of boutons){b.fl=1;for(let i=0;i<6;i++){const a=rand(-.7,.7);parts.push({x:b.x,y:b.y,vx:Math.cos(a)*rand(20,55)+30,vy:Math.sin(a)*rand(20,55),life:0,max:rand(.5,.9)});}}}
  function fit(){const dpr=Math.min(window.devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,r.width*dpr|0);canvas.height=Math.max(1,r.height*dpr|0);const sc=r.width/VW;ctx.setTransform(dpr*sc,0,0,dpr*sc,0,0);}
  fit();window.addEventListener('resize',()=>{clearTimeout(neuron._t);neuron._t=setTimeout(fit,150);});
  function poly(pts){ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();}
  const vCanvas=$('#vGraph');let gctx=null,gW=0,gH=0;const samples=[],MAXS=240;
  function fitGraph(){if(!vCanvas)return;const dpr=Math.min(window.devicePixelRatio||1,2),r=vCanvas.getBoundingClientRect();vCanvas.width=r.width*dpr|0;vCanvas.height=r.height*dpr|0;gctx=vCanvas.getContext('2d');gctx.setTransform(dpr,0,0,dpr,0,0);gW=r.width;gH=r.height;}
  function vy(v){return lerp(gH-10,12,(v-(-92))/(52-(-92)));}
  function drawGraph(){if(!gctx)return;gctx.clearRect(0,0,gW,gH);const refs=[[PEAK,'rgba(255,106,61,.55)','+40'],[0,'rgba(255,255,255,.12)','0'],[THRESH,'rgba(52,210,255,.5)','‒55'],[REST,'rgba(255,255,255,.24)','‒70']];gctx.font='9px Inter,sans-serif';gctx.textBaseline='middle';refs.forEach(r=>{const y=vy(r[0]);gctx.strokeStyle=r[1];gctx.setLineDash([3,4]);gctx.beginPath();gctx.moveTo(30,y);gctx.lineTo(gW-4,y);gctx.stroke();gctx.setLineDash([]);gctx.fillStyle=r[1];gctx.fillText(r[2],2,y);});if(samples.length>1){gctx.lineWidth=2;gctx.strokeStyle='#34d2ff';gctx.lineJoin='round';gctx.beginPath();for(let i=0;i<samples.length;i++){const x=lerp(30,gW-4,i/(MAXS-1)),y=vy(samples[i]);i?gctx.lineTo(x,y):gctx.moveTo(x,y);}gctx.stroke();const i=samples.length-1,x=lerp(30,gW-4,i/(MAXS-1)),y=vy(samples[i]);gctx.fillStyle=samples[i]>0?'#ff6a3d':'#34d2ff';gctx.beginPath();gctx.arc(x,y,3,0,TAU);gctx.fill();}}
  fitGraph();window.addEventListener('resize',()=>{clearTimeout(neuron._g);neuron._g=setTimeout(fitGraph,150);});
  let last=0;
  function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;const sp=speed;
    if(inSpike){spikeClock+=dt*1000*sp;const t=spikeClock;if(t<120){V=lerp(THRESH,PEAK,t/120);phase='Action potential';}else if(t<360){V=lerp(PEAK,HYPER,(t-120)/240);phase='Repolarising';}else if(t<760){V=lerp(HYPER,REST,(t-360)/400);phase='Hyperpolarised';}else{inSpike=false;refractory=240;V=REST;}if(!launched&&t>=90){launched=true;ap={t:0,trail:[]};}}
    else{V+=(REST-V)*clamp(dt*2.2,0,1);if(refractory>0){refractory-=dt*1000*sp;phase='Refractory';}else{phase=V>REST+1?'Integrating':'Resting';if(auto){stimT+=dt*1000*sp;if(stimT>nextIn){stimT=0;nextIn=rand(300,560);spawnEpsp(RNG()*dendPaths.length|0,rand(6,10));}}}}
    somaRipple*=.92;const inten=clamp((V-REST)/(PEAK-REST),0,1);
    ctx.clearRect(0,0,VW,VH);ctx.globalCompositeOperation='source-over';
    const bg=ctx.createRadialGradient(soma.x,soma.y,40,VW*.5,VH*.5,VW*.62);bg.addColorStop(0,'rgba(10,26,40,0.5)');bg.addColorStop(1,'rgba(1,3,10,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,VW,VH);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='lighter';
    for(const s of dendSegs){ctx.strokeStyle='rgba(46,150,190,0.16)';ctx.lineWidth=s.w*2.4;poly(s.pts);ctx.strokeStyle='rgba(120,215,250,'+(.35+.25*inten)+')';ctx.lineWidth=s.w*.9;poly(s.pts);}
    ctx.strokeStyle='rgba(40,150,190,0.18)';ctx.lineWidth=12;poly(axonPts);ctx.globalCompositeOperation='source-over';
    for(const m of myelin){const h=22,g=ctx.createLinearGradient(0,m.y-h/2,0,m.y+h/2);g.addColorStop(0,'#1d4a5e');g.addColorStop(.35,'#2b6e88');g.addColorStop(.5,'#4297b4');g.addColorStop(.65,'#235870');g.addColorStop(1,'#143246');ctx.fillStyle=g;roundRect(ctx,m.a,m.y-h/2,m.b-m.a,h,h/2);ctx.fill();ctx.strokeStyle='rgba(150,225,255,0.22)';ctx.lineWidth=1;ctx.stroke();}
    nodesX.forEach((nx,i)=>{nodeFlash[i]*=.9;ctx.globalCompositeOperation='lighter';blob(ctx,gHot(),nx,280,8+18*nodeFlash[i],.18+.7*nodeFlash[i]);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#0a1a26';ctx.beginPath();ctx.arc(nx,280,4,0,TAU);ctx.fill();});
    ctx.globalCompositeOperation='lighter';for(const pts of termSegs){ctx.strokeStyle='rgba(90,170,210,0.3)';ctx.lineWidth=3;poly(pts);}
    for(const b of boutons){b.fl*=.92;blob(ctx,gVio(),b.x,b.y,10+22*b.fl,.25+.7*b.fl);}
    ctx.globalCompositeOperation='source-over';
    for(const b of boutons){ctx.fillStyle='#1a1340';ctx.strokeStyle='rgba(150,110,255,'+(.6+.4*b.fl)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,8,0,TAU);ctx.fill();ctx.stroke();}
    ctx.globalCompositeOperation='lighter';
    blob(ctx,inSpike?gWh():gCy(),soma.x,soma.y,soma.r*(2.4+inten*1.6),.25+.6*inten);
    if(somaRipple>.01){ctx.strokeStyle='rgba(120,215,250,'+somaRipple+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(soma.x,soma.y,soma.r*(1+(1-somaRipple)*.6),0,TAU);ctx.stroke();}
    ctx.globalCompositeOperation='source-over';
    const sg=ctx.createRadialGradient(soma.x-12,soma.y-14,6,soma.x,soma.y,soma.r);sg.addColorStop(0,'rgba('+(lerp(20,210,inten)|0)+','+(lerp(120,240,inten)|0)+','+(lerp(160,255,inten)|0)+',0.95)');sg.addColorStop(.7,'rgba('+(lerp(12,90,inten)|0)+','+(lerp(60,170,inten)|0)+','+(lerp(95,210,inten)|0)+',0.9)');sg.addColorStop(1,'rgba(8,28,42,0.85)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(soma.x,soma.y,soma.r,soma.r*.92,0,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(150,230,255,'+(.5+.5*inten)+')';ctx.lineWidth=2.2;ctx.stroke();
    const ng=ctx.createRadialGradient(soma.x-6,soma.y-6,2,soma.x,soma.y,26);ng.addColorStop(0,'rgba('+(lerp(40,255,inten)|0)+','+(lerp(150,230,inten)|0)+',255,0.9)');ng.addColorStop(1,'rgba(8,24,40,0.6)');ctx.fillStyle=ng;ctx.beginPath();ctx.arc(soma.x,soma.y,24,0,TAU);ctx.fill();ctx.fillStyle='#0a1a2a';ctx.beginPath();ctx.arc(soma.x+4,soma.y+3,8,0,TAU);ctx.fill();
    ctx.globalCompositeOperation='lighter';
    for(let k=epsps.length-1;k>=0;k--){const e=epsps[k];e.t+=dt*sp*.9;const p=at(e.d.pts,e.d.cum,e.d.L,e.t);e.trail.push(p);if(e.trail.length>7)e.trail.shift();for(let j=0;j<e.trail.length;j++){const a=j/e.trail.length;blob(ctx,gCy(),e.trail[j].x,e.trail[j].y,2+4*a,.1+.3*a);}blob(ctx,gWh(),p.x,p.y,5,.9);blob(ctx,gCy(),p.x,p.y,11,.55);if(e.t>=1&&!e.arr){e.arr=true;if(!inSpike&&refractory<=0){V=clamp(V+e.bump,HYPER,THRESH+3);somaRipple=1;}epsps.splice(k,1);if(!inSpike&&refractory<=0&&V>=THRESH)triggerSpike();}}
    if(ap){ap.t+=dt*sp*1.4;const p=at(axonPts,axonM.cum,axonM.L,ap.t);ap.trail.push(p);if(ap.trail.length>16)ap.trail.shift();for(let j=0;j<ap.trail.length;j++){const a=j/ap.trail.length;blob(ctx,gHot(),ap.trail[j].x,ap.trail[j].y,3+7*a,.12+.4*a);}blob(ctx,gWh(),p.x,p.y,9,1);blob(ctx,gHot(),p.x,p.y,20,.6);nodesX.forEach((nx,i)=>{if(Math.abs(p.x-nx)<12)nodeFlash[i]=1;});if(RNG()<.5)parts.push({x:p.x,y:p.y,vx:rand(-30,30),vy:rand(-40,40),life:0,max:rand(.2,.45),hot:true});if(ap.t>=1){ap=null;release();}}
    for(let k=parts.length-1;k>=0;k--){const pt=parts[k];pt.life+=dt*sp;const f=pt.life/pt.max;if(f>=1){parts.splice(k,1);continue;}pt.x+=pt.vx*dt*sp;pt.y+=pt.vy*dt*sp;pt.vy+=20*dt*sp;blob(ctx,pt.hot?gHot():gVio(),pt.x,pt.y,2+3*(1-f),(1-f)*.8);}
    ctx.globalCompositeOperation='source-over';
    if(vVal)vVal.textContent=(V<0?'−':'+')+Math.abs(Math.round(V))+' mV';
    if(vPhase)vPhase.textContent=phase;
    samples.push(V);if(samples.length>MAXS)samples.shift();drawGraph();
    requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();

})();
