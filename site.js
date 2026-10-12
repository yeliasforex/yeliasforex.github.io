/* GoldTriEngine site script: header, menu, reveals, counters, card light, stream console. No tracking, no cookies. */
(function(){
  var d=document, root=d.documentElement;
  root.classList.add('js');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header state */
  var top=d.querySelector('.top');
  function onScroll(){ if(top) top.classList.toggle('scrolled', window.scrollY>8); }
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});

  /* mobile menu */
  var mb=d.querySelector('.menu-btn'), nav=d.getElementById('nav');
  if(mb&&nav){
    mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o?'true':'false');});
    nav.addEventListener('click',function(e){if(e.target.tagName==='A'){nav.classList.remove('open');mb.setAttribute('aria-expanded','false');}});
  }

  /* reveal on scroll + counters */
  function count(el){
    var to=parseFloat(el.getAttribute('data-count')), dec=(el.getAttribute('data-count').split('.')[1]||'').length;
    var pre=el.getAttribute('data-pre')||'', suf=el.getAttribute('data-suf')||'';
    function fmt(v){var s=v.toFixed(dec);if(!dec)s=Number(s).toLocaleString('en-US');return pre+s+suf;}
    if(reduce){el.textContent=fmt(to);return;}
    var t0=null,dur=1400;
    function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=fmt(to*e);if(p<1)requestAnimationFrame(f);}
    requestAnimationFrame(f);
  }
  var targets=d.querySelectorAll('.rv,[data-count],.months,.eq');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;var el=e.target;el.classList.add('in');
      if(el.hasAttribute('data-count'))count(el);
      if(el.classList.contains('eq'))drawEq(el);
      io.unobserve(el);
    });},{rootMargin:'0px 0px -8% 0px',threshold:.12});
    targets.forEach(function(el){io.observe(el);});
  } else { targets.forEach(function(el){el.classList.add('in');if(el.hasAttribute('data-count'))count(el);}); }

  /* equity line draw */
  function drawEq(svg){
    var p=svg.querySelector('.line'), tip=svg.querySelector('.tip'); if(!p)return;
    if(reduce)return;
    var L=p.getTotalLength(); p.style.strokeDasharray=L; p.style.strokeDashoffset=L;
    if(tip)tip.style.opacity=0;
    p.getBoundingClientRect();
    p.style.transition='stroke-dashoffset 2.2s cubic-bezier(.45,.05,.2,1)'; p.style.strokeDashoffset=0;
    if(tip)setTimeout(function(){tip.style.transition='opacity .4s';tip.style.opacity=1;},2100);
  }

  /* month cells stagger */
  d.querySelectorAll('.months .m').forEach(function(m,i){m.style.transitionDelay=(reduce?0:i*18)+'ms';});

  /* card spotlight (fine pointers only) */
  if(window.matchMedia&&window.matchMedia('(pointer:fine)').matches){
    d.addEventListener('pointermove',function(e){
      var c=e.target.closest&&e.target.closest('.card'); if(!c)return;
      var r=c.getBoundingClientRect(); c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px');
    },{passive:true});
  }

  /* ---------- Stream console ---------- */
  var cv=d.getElementById('tape'); if(!cv)return;
  var ctx=cv.getContext('2d'), W=0,H=0,dpr=1;
  var lines=[
    ['Hello','Welcome to the stream. Every trade here is live and explained.','wave'],
    ['Trade update','Engine Alpha opened a trade. The stop loss is already on the chart.','point'],
    ['News','US CPI is in 30 minutes. Gold can move fast, so spreads may widen.','surprised'],
    ['Trade closed','Stopped out for a small loss. Losses are part of the plan, and you see them too.','concerned'],
    ['Education','Gold is most active when London and New York overlap.','tablet'],
    ['Trade closed','Engine Gamma closed in profit. Here is what happened on the chart.','thumbs'],
    ['Chat','Good question from the chat. Let me explain what a drawdown is.','think']
  ];
  function pose(fig,name){ if(!fig)return; fig.querySelectorAll('img').forEach(function(im){im.classList.toggle('on',im.getAttribute('data-pose')===name);}); }
  var heroFig=d.querySelector('.hostfig');
  var sayT=d.getElementById('say-t'), sayB=d.getElementById('say-b');
  var li=0, ci=0, typing=null;
  function nextLine(){
    var L=lines[li%lines.length]; li++; sayT.textContent=L[0]; pose(heroFig,L[2]);
    if(reduce){sayB.textContent=L[1];return;}
    ci=0; sayB.textContent='';
    clearInterval(typing);
    typing=setInterval(function(){ci++;sayB.textContent=L[1].slice(0,ci);if(ci>=L[1].length){clearInterval(typing);}},26);
  }

  /* candles: seeded random walk (decorative illustration, not market data) */
  var seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
  var candles=[], N=46, price=100, drift=0;
  function mk(){
    drift=drift*.7+(rnd()-.5)*.8+(100-price)*.035; var o=price, c=o+drift+(rnd()-.5)*2.2;
    var h=Math.max(o,c)+rnd()*1.2, l=Math.min(o,c)-rnd()*1.2; price=c; return {o:o,c:c,h:h,l:l};
  }
  for(var i=0;i<N;i++)candles.push(mk());
  var trade=null, last=performance.now(), period=1100, running=true;

  function size(){
    var r=cv.getBoundingClientRect(); dpr=Math.min(2,window.devicePixelRatio||1);
    W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function draw(){
    if(!W)return; ctx.clearRect(0,0,W,H);
    var padT=44,padB=96,padR=18,padL=14, ch=H-padT-padB, cw=(W-padL-padR)/N;
    var lo=Infinity,hi=-Infinity; candles.forEach(function(k){lo=Math.min(lo,k.l);hi=Math.max(hi,k.h);});
    if(trade){lo=Math.min(lo,trade.sl);hi=Math.max(hi,trade.sl);}
    var m=(hi-lo)*.08; lo-=m; hi+=m;
    function y(v){return padT+(hi-v)/(hi-lo)*ch;}
    /* grid */
    ctx.strokeStyle='rgba(170,190,230,.07)';ctx.lineWidth=1;
    for(var g=0;g<=4;g++){var gy=Math.round(padT+g*ch/4)+.5;ctx.beginPath();ctx.moveTo(padL,gy);ctx.lineTo(W-padR,gy);ctx.stroke();}
    /* candles */
    for(var j=0;j<candles.length;j++){
      var k=candles[j], x=padL+j*cw+cw/2;
      var up=k.c>=k.o, col=up?'#3EE09A':'#FF6B78';
      ctx.strokeStyle=col;ctx.globalAlpha=.85;ctx.beginPath();ctx.moveTo(x,y(k.h));ctx.lineTo(x,y(k.l));ctx.stroke();
      var bt=y(Math.max(k.o,k.c)), bb=y(Math.min(k.o,k.c)), bw=Math.max(2,cw*.56);
      ctx.fillStyle=col;ctx.globalAlpha=up?.95:.85;ctx.fillRect(x-bw/2,bt,bw,Math.max(1.5,bb-bt));
    }
    ctx.globalAlpha=1;
    /* last price line */
    var lp=candles[candles.length-1].c, ly=Math.round(y(lp))+.5;
    ctx.setLineDash([2,4]);ctx.strokeStyle='rgba(227,185,95,.55)';ctx.beginPath();ctx.moveTo(padL,ly);ctx.lineTo(W-padR,ly);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#E3B95F';ctx.beginPath();ctx.arc(W-padR,ly,3,0,Math.PI*2);ctx.fill();
    /* trade: entry marker + stop loss */
    if(trade){
      var ex=padL+trade.idx*cw+cw/2;
      if(ex>padL){
        var ey=y(trade.e), sy=Math.round(y(trade.sl))+.5;
        ctx.strokeStyle='rgba(255,107,120,.8)';ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(ex,sy);ctx.lineTo(W-padR,sy);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='rgba(255,107,120,.9)';ctx.font='500 10px "Geist Mono",monospace';ctx.fillText('STOP LOSS',ex+6,sy-6);
        ctx.fillStyle=trade.buy?'#3EE09A':'#FF6B78';ctx.beginPath();
        if(trade.buy){ctx.moveTo(ex,ey+16);ctx.lineTo(ex-6,ey+26);ctx.lineTo(ex+6,ey+26);}else{ctx.moveTo(ex,ey-16);ctx.lineTo(ex-6,ey-26);ctx.lineTo(ex+6,ey-26);}
        ctx.fill();
        ctx.strokeStyle='rgba(91,134,255,.7)';ctx.beginPath();ctx.moveTo(ex,y(trade.e)+.5);ctx.lineTo(W-padR,y(trade.e)+.5);ctx.stroke();
      }
    }
  }
  function step(now){
    if(!running)return;
    var dt=now-last;
    if(dt>=period){
      last=now; candles.shift(); candles.push(mk());
      if(trade){trade.idx--; if(trade.idx<0)trade=null;}
      if(!trade&&rnd()<.16){var k=candles[candles.length-1],buy=k.c>=k.o;trade={idx:N-1,e:k.c,buy:buy,sl:buy?k.c-3.2:k.c+3.2};}
    } else {
      var k2=candles[candles.length-1]; var t=(rnd()-.5)*.12; k2.c+=t; k2.h=Math.max(k2.h,k2.c); k2.l=Math.min(k2.l,k2.c);
    }
    draw(); requestAnimationFrame(step);
  }
  size(); window.addEventListener('resize',size);
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(draw);
  nextLine();
  if(!reduce){
    setInterval(function(){if(running)nextLine();},5200);
    var vis=new IntersectionObserver(function(es){es.forEach(function(e){var was=running;running=e.isIntersecting&&!d.hidden;if(running&&!was){last=performance.now();requestAnimationFrame(step);}});});
    vis.observe(cv);
    d.addEventListener('visibilitychange',function(){if(d.hidden)running=false;});
    requestAnimationFrame(step);
  }

  /* play → load the real live stream */
  var play=d.getElementById('play-live');
  if(play)play.addEventListener('click',function(){
    var st=d.getElementById('stage'); running=false;
    var f=d.createElement('iframe'); f.className='c-frame';
    f.src='https://www.youtube-nocookie.com/embed/live_stream?channel=UCGur-G-_e6s0myqLyLloxsA&autoplay=1&mute=1';
    f.title='GoldTriEngine live stream on YouTube';
    f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen=true;
    st.innerHTML=''; st.appendChild(f);
  });
})();

/* ---------- progress, host moods, equity crosshair (independent of the console) ---------- */
(function(){
  var d=document, reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pb=d.querySelector('.progress');
  if(pb){var raf=0;function up(){raf=0;var h=d.documentElement.scrollHeight-innerHeight;pb.style.setProperty('--p',h>0?Math.min(1,scrollY/h):0);}
    addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(up);},{passive:true});up();}

  /* Meet the host */
  var stage=d.querySelector('.host-stage'), moods=d.querySelectorAll('.mood');
  if(stage&&moods.length){
    var pic=stage.querySelector('.host-pic'), ht=d.getElementById('hb-t'), hb=d.getElementById('hb-b'), cur=0, timer=null, typing=null, user=false;
    function show(i){
      cur=i; var b=moods[i];
      moods.forEach(function(m,j){m.setAttribute('aria-selected',j===i?'true':'false');});
      pic.querySelectorAll('img').forEach(function(im){im.classList.toggle('on',im.getAttribute('data-pose')===b.getAttribute('data-pose'));});
      stage.style.setProperty('--hc',b.getAttribute('data-c')); ht.textContent=b.textContent;
      var t=b.getAttribute('data-say'); clearInterval(typing);
      if(reduce){hb.textContent=t;return;}
      var k=0; hb.textContent=''; typing=setInterval(function(){k++;hb.textContent=t.slice(0,k);if(k>=t.length)clearInterval(typing);},22);
    }
    moods.forEach(function(m,i){m.setAttribute('role','tab');m.addEventListener('click',function(){user=true;clearInterval(timer);show(i);});});
    show(0);
    if(!reduce&&'IntersectionObserver' in window){
      new IntersectionObserver(function(es){es.forEach(function(e){
        clearInterval(timer); if(e.isIntersecting&&!user)timer=setInterval(function(){show((cur+1)%moods.length);},4200);
      });},{threshold:.35}).observe(stage);
    }
  }

  /* Equity crosshair */
  var wrap=d.querySelector('.eq-wrap');
  if(wrap){
    var svg=wrap.querySelector('svg'), pts=JSON.parse(wrap.getAttribute('data-pts')), xh=svg.querySelector('.xh'), xd=svg.querySelector('.xd'), tip=wrap.querySelector('.eq-tip');
    var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function at(clientX){
      var r=svg.getBoundingClientRect(), vb=svg.viewBox.baseVal, x=(clientX-r.left)/r.width*vb.width;
      var best=0,bd=1e9; for(var i=0;i<pts.length;i++){var dd=Math.abs(pts[i][0]-x);if(dd<bd){bd=dd;best=i;}}
      var p=pts[best]; xh.setAttribute('x1',p[0]);xh.setAttribute('x2',p[0]);xd.setAttribute('cx',p[0]);xd.setAttribute('cy',p[1]);
      var dt=p[2].split('.'), lab=M[+dt[1]-1]+' '+dt[0];
      tip.innerHTML='<b>'+lab+'</b>'+(p[3]<0.05?'At a new high':(p[3].toFixed(1)+'% below peak'));
      var px=p[0]/vb.width*r.width; tip.style.left=Math.max(70,Math.min(r.width-70,px))+'px';
      wrap.classList.add('hover');
    }
    wrap.addEventListener('pointermove',function(e){at(e.clientX);});
    wrap.addEventListener('pointerdown',function(e){at(e.clientX);});
    wrap.addEventListener('pointerleave',function(){wrap.classList.remove('hover');});
  }
})();

/* ---------- Telegram feed: messages arrive one by one ---------- */
(function(){
  var feed=document.querySelector('.tg-feed'); if(!feed)return;
  var items=feed.querySelectorAll('.tg-msg');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(){items.forEach(function(m,i){setTimeout(function(){m.classList.add('in');},reduce?0:300+i*650);});}
  if(!('IntersectionObserver' in window)){play();return;}
  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){play();io.disconnect();}},{threshold:.3});
  io.observe(feed);
})();
