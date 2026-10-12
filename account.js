/* GoldTriEngine live account dashboard.
   Reads account.json (published by the stream bot from MetaTrader 5) and renders KPIs, charts, open trades and history.
   If the feed isn't available, it shows a short "starting soon" note with links instead. No cookies, no tracking. */
(function(){
  var d=document, sec=d.getElementById('account'); if(!sec)return;
  var root=sec.querySelector('.acct'), SRC=sec.getAttribute('data-src');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS='http://www.w3.org/2000/svg', DATA=null, range=0, filt='all', shown=10, first=true;

  function $(k){return root.querySelectorAll('[data-k="'+k+'"]');}
  function set(k,t,cls){$(k).forEach(function(e){e.textContent=t;if(cls!==undefined){e.classList.remove('up','down');if(cls)e.classList.add(cls);}});}
  var cur='USD';
  function money(v,sign){var s=Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    var p=cur==='USD'?'$':''; var t=p+s+(p?'':' '+cur); if(sign)return (v>0?'+':v<0?'−':'')+t; return (v<0?'−':'')+t;}
  function pct(v,dp,sign){var s=Math.abs(v).toFixed(dp==null?1:dp)+'%';return sign?(v>0?'+':v<0?'−':'')+s:s;}
  function px(v){return v==null||v===''?'—':Number(v).toFixed(2);}
  function ago(iso){var m=Math.round((Date.now()-Date.parse(iso))/60000);if(m<1)return 'just now';if(m<60)return m+' min ago';var h=Math.round(m/60);if(h<48)return h+' h ago';return Math.round(h/24)+' days ago';}
  function day(iso,withTime){var t=new Date(iso);var s=t.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    return withTime? s+' '+t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):s;}
  function el(tag,attrs,parent){var e=d.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function countTo(node,to,fmt){
    if(reduce||!first){node.textContent=fmt(to);return;}
    var t0=null;function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/1200),e=1-Math.pow(1-p,4);node.textContent=fmt(to*e);if(p<1)requestAnimationFrame(f);}
    requestAnimationFrame(f);
  }

  /* ---------- KPIs & meta ---------- */
  function kpis(D){
    var a=D.account||{}, s=D.summary||{}; cur=a.currency||'USD';
    set('broker',a.broker||'—'); set('type',a.type||'—'); set('leverage',a.leverage||'—');
    set('started',a.started?new Date(a.started).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—');
    set('updated',D.updated?ago(D.updated):'—');
    [['balance',s.balance,0],['equity',s.equity,0],['deposits',s.deposits,0]].forEach(function(x){$(x[0]).forEach(function(n){countTo(n,x[1]||0,function(v){return money(v);});});});
    $('net').forEach(function(n){n.classList.remove('up','down');n.classList.add((s.net_profit||0)>=0?'up':'down');countTo(n,s.net_profit||0,function(v){return money(v,true);});});
    set('gain',s.gain_pct!=null?pct(s.gain_pct,2,true)+' on deposits':'');
    set('withdrawals',s.withdrawals?('Withdrawn '+money(s.withdrawals)):'No withdrawals');
    $('winrate').forEach(function(n){countTo(n,s.win_rate||0,function(v){return v.toFixed(1)+'%';});});
    set('trades',(s.trades||0)+' closed trades');
    $('maxdd').forEach(function(n){countTo(n,s.max_drawdown_pct||0,function(v){return v.toFixed(1)+'%';});});
    set('pf',s.profit_factor!=null?('Profit factor '+Number(s.profit_factor).toFixed(2)):'');
  }

  /* ---------- Balance / equity chart (one axis, two series) ---------- */
  function eqChart(D){
    var box=d.getElementById('eqChart'); box.innerHTML='';
    var pts=(D.equity_curve||[]).map(function(p){return {t:Date.parse(p[0]),b:+p[1],e:+p[2]};});
    if(range){var cut=Date.now()-range*864e5;var f=pts.filter(function(p){return p.t>=cut;});if(f.length>1)pts=f;}
    if(pts.length<2){box.innerHTML='<div class="empty">The chart appears after the first trades.</div>';return;}
    var W=720,H=280,L=58,R=12,T=12,B=28;
    var lo=Infinity,hi=-Infinity;pts.forEach(function(p){lo=Math.min(lo,p.b,p.e);hi=Math.max(hi,p.b,p.e);});
    var pad=(hi-lo)*.12||hi*.01||1; lo-=pad; hi+=pad;
    var t0=pts[0].t,t1=pts[pts.length-1].t||t0+1;
    function X(t){return L+(t-t0)/((t1-t0)||1)*(W-L-R);} function Y(v){return T+(hi-v)/(hi-lo)*(H-T-B);}
    var svg=el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Balance and equity over time'},box);
    var defs=el('defs',{},svg),g=el('linearGradient',{id:'balFill',x1:0,x2:0,y1:0,y2:1},defs);
    el('stop',{offset:0,'stop-color':'#1FA874','stop-opacity':.22},g);el('stop',{offset:1,'stop-color':'#1FA874','stop-opacity':0},g);
    for(var i=0;i<=4;i++){var v=lo+(hi-lo)*i/4,y=Y(v);el('line',{class:'gl',x1:L,x2:W-R,y1:y,y2:y},svg);var tx=el('text',{class:'ax',x:L-8,y:y+4,'text-anchor':'end'},svg);tx.textContent=money(v).replace('.00','').replace(/\.\d\d$/,'');}
    var nt=Math.min(5,pts.length);for(var k=0;k<nt;k++){var p=pts[Math.round(k*(pts.length-1)/(nt-1||1))];var tt=el('text',{class:'ax',x:X(p.t),y:H-6,'text-anchor':k===0?'start':k===nt-1?'end':'middle'},svg);tt.textContent=day(new Date(p.t).toISOString());}
    var db='M'+pts.map(function(p){return X(p.t).toFixed(1)+' '+Y(p.b).toFixed(1);}).join(' L');
    var de='M'+pts.map(function(p){return X(p.t).toFixed(1)+' '+Y(p.e).toFixed(1);}).join(' L');
    el('path',{d:db+' L'+X(t1).toFixed(1)+' '+(H-B)+' L'+X(t0).toFixed(1)+' '+(H-B)+' Z',fill:'url(#balFill)'},svg);
    var pe=el('path',{class:'eqt',d:de},svg), pb=el('path',{class:'bal',d:db},svg);
    if(!reduce&&first){var Lb=pb.getTotalLength();pb.style.strokeDasharray=Lb;pb.style.strokeDashoffset=Lb;pb.getBoundingClientRect();pb.style.transition='stroke-dashoffset 1.6s cubic-bezier(.45,.05,.2,1)';pb.style.strokeDashoffset=0;
      setTimeout(function(){pb.style.strokeDasharray='';},1700);}
    var xh=el('line',{class:'xh',x1:0,x2:0,y1:T,y2:H-B,opacity:0},svg), cb=el('circle',{r:4.5,fill:'#1FA874',stroke:'#0A0E18','stroke-width':2,opacity:0},svg), ce=el('circle',{r:4,fill:'#5B86FF',stroke:'#0A0E18','stroke-width':2,opacity:0},svg);
    var tip=d.createElement('div');tip.className='ctip';box.appendChild(tip);
    function at(cx){var r=svg.getBoundingClientRect(),x=(cx-r.left)/r.width*W,b=0,bd=1e9;pts.forEach(function(p,i){var q=Math.abs(X(p.t)-x);if(q<bd){bd=q;b=i;}});
      var p=pts[b],px=X(p.t);[xh].forEach(function(n){n.setAttribute('x1',px);n.setAttribute('x2',px);n.setAttribute('opacity',1);});
      cb.setAttribute('cx',px);cb.setAttribute('cy',Y(p.b));cb.setAttribute('opacity',1);ce.setAttribute('cx',px);ce.setAttribute('cy',Y(p.e));ce.setAttribute('opacity',1);
      tip.innerHTML='<b>'+day(new Date(p.t).toISOString(),true)+'</b>Balance '+money(p.b)+'<br>Equity '+money(p.e);
      tip.style.left=Math.max(80,Math.min(r.width-80,px/W*r.width))+'px';box.classList.add('hover');}
    svg.addEventListener('pointermove',function(e){at(e.clientX);});svg.addEventListener('pointerdown',function(e){at(e.clientX);});
    svg.addEventListener('pointerleave',function(){box.classList.remove('hover');[xh,cb,ce].forEach(function(n){n.setAttribute('opacity',0);});});
  }

  /* ---------- Daily P&L bars (polarity: above/below zero + color) ---------- */
  function dailyChart(D){
    var box=d.getElementById('dailyChart'); box.innerHTML='';
    var rows=(D.daily||[]).slice(-30);
    if(!rows.length){box.innerHTML='<div class="empty">No closed days yet.</div>';return;}
    set('dailyrange','Last '+rows.length+' trading day'+(rows.length>1?'s':''));
    var W=720,H=220,L=58,R=8,T=10,B=26, mx=0;rows.forEach(function(r){mx=Math.max(mx,Math.abs(+r[1]));});mx=mx||1;
    var svg=el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Daily profit and loss'},box);
    function Y(v){return T+(mx-v)/(2*mx)*(H-T-B);}
    [mx,0,-mx].forEach(function(v){var y=Y(v);el('line',{class:v===0?'zero':'gl',x1:L,x2:W-R,y1:y,y2:y},svg);var t=el('text',{class:'ax',x:L-8,y:y+4,'text-anchor':'end'},svg);t.textContent=v===0?'0':money(v,true).replace(/\.\d\d$/,'');});
    var bw=(W-L-R)/rows.length, w=Math.max(3,Math.min(26,bw-4));
    var tip=d.createElement('div');tip.className='ctip';box.appendChild(tip);
    rows.forEach(function(r,i){var v=+r[1],x=L+i*bw+(bw-w)/2,y0=Y(0),y=Y(v),h=Math.max(1.5,Math.abs(y-y0));
      var rect=el('rect',{class:'bar',x:x.toFixed(1),y:(v>=0?y:y0).toFixed(1),width:w.toFixed(1),height:reduce||!first?h.toFixed(1):0,rx:Math.min(4,w/2),fill:v>=0?'#1FA874':'#E5484D'},svg);
      if(!reduce&&first){rect.setAttribute('y',y0);setTimeout(function(){rect.style.transition='height .7s cubic-bezier(.2,.7,.1,1), y .7s cubic-bezier(.2,.7,.1,1)';rect.setAttribute('height',h.toFixed(1));rect.setAttribute('y',(v>=0?y:y0).toFixed(1));},60+i*25);}
      var hit=el('rect',{x:L+i*bw,y:T,width:bw,height:H-T-B,fill:'transparent'},svg);
      function show(){tip.innerHTML='<b>'+new Date(r[0]).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+'</b>'+money(v,true);
        var rr=svg.getBoundingClientRect();tip.style.left=Math.max(60,Math.min(rr.width-60,(L+i*bw+bw/2)/W*rr.width))+'px';box.classList.add('hover');}
      hit.addEventListener('pointerenter',show);hit.addEventListener('pointerdown',show);hit.addEventListener('pointerleave',function(){box.classList.remove('hover');});
    });
    if(rows.length<=14)rows.forEach(function(r,i){if(i%Math.ceil(rows.length/7))return;var t=el('text',{class:'ax',x:L+i*bw+bw/2,y:H-6,'text-anchor':'middle'},svg);t.textContent=new Date(r[0]).toLocaleDateString('en-GB',{day:'numeric',month:'short'});});
  }

  /* ---------- Open trades ---------- */
  function openTrades(D){
    var box=d.getElementById('openList'), o=D.open||[]; box.innerHTML='';
    if(!o.length){box.innerHTML='<div class="empty">No open trades right now. The EA is watching the market.</div>';return;}
    o.forEach(function(t){var pl=+t.profit||0;var c=d.createElement('div');c.className='otrade';
      c.innerHTML='<div class="otrade-h"><span class="side '+(t.side==='sell'?'sell':'buy')+'">'+(t.side==='sell'?'Sell':'Buy')+'</span><b>'+(t.engine||'')+'</b><span class="otrade-pl '+(pl>=0?'up':'down')+'">'+money(pl,true)+'</span></div>'+
        '<dl><div><dt>Lots</dt><dd>'+(+t.lots).toFixed(2)+'</dd></div><div><dt>Open</dt><dd>'+px(t.open_price)+'</dd></div><div><dt>Stop</dt><dd>'+(t.sl?px(t.sl):'—')+'</dd></div><div><dt>Since</dt><dd>'+day(t.open_time,true).split(' ').pop()+'</dd></div></dl>';
      box.appendChild(c);});
  }

  /* ---------- By engine (single polarity bars, direct labels) ---------- */
  function engines(D){
    var box=d.getElementById('engList'), h=D.history||[], m={};
    h.forEach(function(t){var k=t.engine||'Other';m[k]=m[k]||{n:0,w:0,p:0};m[k].n++;m[k].p+=+t.profit;if(+t.profit>0)m[k].w++;});
    var ks=Object.keys(m); box.innerHTML='';
    if(!ks.length){box.innerHTML='<div class="empty">Engine results appear after the first closed trades.</div>';return;}
    var mx=0;ks.forEach(function(k){mx=Math.max(mx,Math.abs(m[k].p));});mx=mx||1;
    ks.sort().forEach(function(k){var r=m[k],w=Math.abs(r.p)/mx*100;var row=d.createElement('div');row.className='eng-row';
      row.innerHTML='<b>'+k+'</b><div class="eng-track"><div class="eng-fill" style="width:0;left:0;background:'+(r.p>=0?'#1FA874':'#E5484D')+'"></div></div><span class="eng-val '+(r.p>=0?'up':'down')+'">'+money(r.p,true)+'</span><small>'+r.n+' trades · '+Math.round(r.w/r.n*100)+'% won</small>';
      box.appendChild(row);var f=row.querySelector('.eng-fill');setTimeout(function(){f.style.width=Math.max(2,w)+'%';},reduce?0:120);});
  }

  /* ---------- History ---------- */
  function history(D){
    var body=d.getElementById('histBody'), more=d.getElementById('histMore');
    var h=(D.history||[]).slice().sort(function(a,b){return Date.parse(b.close_time)-Date.parse(a.close_time);});
    if(filt==='win')h=h.filter(function(t){return +t.profit>0;});if(filt==='loss')h=h.filter(function(t){return +t.profit<=0;});
    body.innerHTML='';
    if(!h.length){body.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">No trades to show yet.</td></tr>';more.hidden=true;return;}
    h.slice(0,shown).forEach(function(t,i){var p=+t.profit,tr=d.createElement('tr');tr.style.animationDelay=(reduce?0:Math.min(i,12)*35)+'ms';
      tr.innerHTML='<td>'+day(t.close_time,true)+'</td><td>'+(t.engine||'')+'</td><td><span class="side '+(t.side==='sell'?'sell':'buy')+'">'+(t.side==='sell'?'Sell':'Buy')+'</span></td><td class="n">'+(+t.lots).toFixed(2)+'</td><td class="n">'+px(t.open_price)+'</td><td class="n">'+px(t.close_price)+'</td><td class="n '+(p>0?'up':'down')+'">'+money(p,true)+'</td>';
      body.appendChild(tr);});
    more.hidden=h.length<=shown;
  }

  function render(){kpis(DATA);eqChart(DATA);dailyChart(DATA);openTrades(DATA);engines(DATA);history(DATA);first=false;}

  root.querySelectorAll('.p-eq .seg button').forEach(function(b){b.addEventListener('click',function(){root.querySelectorAll('.p-eq .seg button').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');range=+b.getAttribute('data-r');if(DATA)eqChart(DATA);});});
  root.querySelectorAll('.p-hist .seg button').forEach(function(b){b.addEventListener('click',function(){root.querySelectorAll('.p-hist .seg button').forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');filt=b.getAttribute('data-f');shown=10;if(DATA)history(DATA);});});
  d.getElementById('histMore').addEventListener('click',function(){shown+=15;history(DATA);});

  function load(initial){
    fetch(SRC+'?t='+Math.floor(Date.now()/60000),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){
      if(!j||!j.summary)throw 0; DATA=j; root.setAttribute('data-state','ready');
      if(initial&&!reduce&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();render();}},{threshold:.15});io.observe(root);}
      else render();
    }).catch(function(){ if(!DATA)root.setAttribute('data-state','off'); });
  }
  load(true);
  setInterval(function(){if(!d.hidden)load(false);},120000);
  setInterval(function(){if(DATA&&DATA.updated)set('updated',ago(DATA.updated));},30000);
})();
