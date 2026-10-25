/* Interactive 3D backtest. Built by tools/make_prod.py. Loaded only when the section is near the screen. */
window.MONTHS=[[2024,1,-54,-1.1],[2024,2,270,5.5],[2024,3,4314,82.7],[2024,4,111,1.2],[2024,5,152,1.6],[2024,6,-230,-2.3],[2024,7,-55,-0.6],[2024,8,26,0.3],[2024,9,465,4.9],[2024,10,1140,11.4],[2024,11,1689,15.2],[2024,12,1223,9.5],[2025,1,624,4.4],[2025,2,3785,25.8],[2025,3,2333,12.6],[2025,4,12142,58.4],[2025,5,6683,20.3],[2025,6,-699,-1.8],[2025,7,642,1.6],[2025,8,1451,3.7],[2025,9,5391,13.1],[2025,10,1924,4.1],[2025,11,1023,2.1],[2025,12,676,1.4],[2026,1,16474,32.9],[2026,2,4974,7.5],[2026,3,20043,28],[2026,4,27066,29.6],[2026,5,1087,0.9],[2026,6,20769,17.4],[2026,7,770,0.5],[2026,8,94590,67],[2026,9,-5395,-2.3],[2026,10,2095,0.9]];window.PTS=[[8,269.3,0,"2024.01"],[13.8,271.7,3.6,"2024.01"],[19.7,266.4,0,"2024.01"],[25.5,268.6,3.4,"2024.01"],[31.3,269.1,4.1,"2024.02"],[37.2,265.4,3.4,"2024.02"],[43,265.2,3.2,"2024.02"],[48.8,243.8,0,"2024.03"],[54.7,240.2,0.5,"2024.03"],[60.5,234.9,0.4,"2024.03"],[66.3,229.4,3.3,"2024.04"],[72.1,224.1,0.7,"2024.04"],[78,225.5,3.6,"2024.04"],[83.8,227.5,6.5,"2024.05"],[89.6,229.8,9.6,"2024.05"],[95.5,226.5,5,"2024.05"],[101.3,225.4,3.5,"2024.06"],[107.1,226.3,4.6,"2024.06"],[113,228.3,7.6,"2024.06"],[118.8,227,5.7,"2024.06"],[124.6,230.3,10.4,"2024.07"],[130.5,228.1,7.2,"2024.07"],[136.3,228.8,8.3,"2024.07"],[142.1,226.7,5.3,"2024.08"],[148,227.9,7,"2024.08"],[153.8,227.6,6.5,"2024.08"],[159.6,228.2,7.4,"2024.09"],[165.5,227.2,6,"2024.09"],[171.3,228.4,7.7,"2024.09"],[177.1,224.3,1.7,"2024.10"],[183,223.9,1.2,"2024.10"],[188.8,221.7,0.7,"2024.10"],[194.6,217,0,"2024.11"],[200.4,216.5,2.8,"2024.11"],[206.3,207.6,0,"2024.11"],[212.1,207.4,0.7,"2024.11"],[217.9,210.9,6,"2024.12"],[223.8,207.4,0.7,"2024.12"],[229.6,201.4,3.9,"2024.12"],[235.4,199,0.7,"2025.01"],[241.3,197.8,0,"2025.01"],[247.1,198.4,1.1,"2025.01"],[252.9,199,2.1,"2025.02"],[258.8,188.6,4,"2025.02"],[264.6,188.3,3.4,"2025.02"],[270.4,183.2,1,"2025.03"],[276.3,177.1,0,"2025.03"],[282.1,177.1,0.3,"2025.03"],[287.9,177.3,1.5,"2025.04"],[293.8,175.3,1,"2025.04"],[299.6,145.8,0,"2025.04"],[305.4,146.3,2.1,"2025.05"],[311.3,145.4,2,"2025.05"],[317.1,143.6,1.4,"2025.05"],[322.9,134.7,0.1,"2025.05"],[328.7,133.8,1.8,"2025.06"],[334.6,133.5,1.4,"2025.06"],[340.4,136.7,6.2,"2025.06"],[346.2,140.2,11,"2025.07"],[352.1,140.9,12,"2025.07"],[357.9,135.2,3.9,"2025.07"],[363.7,131.2,0,"2025.08"],[369.6,133.2,3.5,"2025.08"],[375.4,133.3,3.6,"2025.08"],[381.2,132,1.6,"2025.09"],[387.1,126.9,1.5,"2025.09"],[392.9,124.1,0,"2025.09"],[398.7,124.3,1.5,"2025.09"],[404.6,123.6,0.4,"2025.10"],[410.4,124.2,1.4,"2025.10"],[416.2,121.2,0,"2025.10"],[422.1,120.7,0.7,"2025.11"],[427.9,118.6,4.6,"2025.11"],[433.7,120.3,7.1,"2025.11"],[439.6,115.6,3,"2025.12"],[445.4,117.4,5.6,"2025.12"],[451.2,119.8,9.1,"2025.12"],[457,119.5,8.6,"2026.01"],[462.9,118.1,6.6,"2026.01"],[468.7,100.6,1.5,"2026.01"],[474.5,100.4,1.4,"2026.02"],[480.4,100.3,1.3,"2026.02"],[486.2,95.9,1.9,"2026.02"],[492,95.7,2.9,"2026.03"],[497.9,98.9,7.5,"2026.03"],[503.7,83,0,"2026.03"],[509.5,80.1,0,"2026.03"],[515.4,79.4,0.7,"2026.04"],[521.2,75,0.5,"2026.04"],[527,72.4,0.8,"2026.04"],[532.9,63.6,1.5,"2026.05"],[538.7,65.7,4.5,"2026.05"],[544.5,65.7,4.6,"2026.05"],[550.4,63.4,3.4,"2026.06"],[556.2,50,0.1,"2026.06"],[562,51.3,2.2,"2026.06"],[567.9,52.1,3.8,"2026.07"],[573.7,52.9,4.9,"2026.07"],[579.5,46.7,0,"2026.07"],[585.3,51.3,6.7,"2026.08"],[591.2,16.4,2.5,"2026.08"],[597,15.3,0.8,"2026.08"],[602.8,18.1,4.9,"2026.08"],[608.7,19.5,7,"2026.09"],[614.5,18.3,5.3,"2026.09"],[620.3,18.8,6,"2026.09"],[626.2,20.8,8.8,"2026.10"],[632,18.7,5.8,"2026.10"]];window.DD={"x":350.1,"y":141.6,"dd":12.9,"date":"2025.07"};window.STATS={"pf":2,"trades":1302,"win":52.2,"payoff":1.84,"dd":17.7,"hold":"4:47:22","years":[[2024,181],[2025,256],[2026,365]]};window.RUNMETA={"deposit":5000,"final":232497,"start":"2024-01-01","end":"2026-10-17","leverage":"1:100","company":"Fusion Markets Pty Ltd"};
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const GX=document.getElementById('gx'),$=id=>document.getElementById('gx-'+id),cardEl=$('screen'),screenEl=$('plot');
/* ---------- data: the report published in Admin, or the built-in numbers ---------- */
const SB='https://ekljeyquxvlfbeadgszx.supabase.co',KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGpleXF1eHZsZmJlYWRnc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyOTI5MzYsImV4cCI6MjEwNzg2ODkzNn0.SlM13aMEy-mTO_iuPTvZz5l4BO0xZnvPBJKAVnZKVx8';
function fromRun(r){let mi=0;r.pts.forEach((p,i)=>{if(p[3]>r.pts[mi][3])mi=i});const PT=r.pts.filter((_,i)=>i%3===0).map(p=>[p[0],p[1],p[3],p[2]]);PT.push([r.pts[r.pts.length-1][0],r.pts[r.pts.length-1][1],r.pts[r.pts.length-1][3],r.pts[r.pts.length-1][2]]);
  return {M:r.months.map(m=>[m[0],m[1],Math.round(m[2]),m[3]]),PT,DD:{x:r.pts[mi][0],y:r.pts[mi][1],dd:r.pts[mi][3],date:r.pts[mi][2]},ST:{pf:r.pf,trades:r.trades,win:r.win_pct1,payoff:r.payoff,dd:r.eq_dd_rel,hold:r.avg_hold,years:r.years},META:{deposit:r.deposit,final:r.final,start:r.start,end:r.end,leverage:r.leverage,company:r.company}}}
async function loadData(){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),1800),res=await fetch(SB+'/rest/v1/rpc/public_backtest',{method:'POST',signal:c.signal,headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:'{}'});clearTimeout(t);const run=res.ok?await res.json():null;if(run&&run.months&&run.pts&&run.years)return fromRun(run)}catch(e){}
  return {M:window.MONTHS,PT:window.PTS,DD:window.DD,ST:window.STATS,META:window.RUNMETA}}
const DATA=await loadData(),M=DATA.M,PT=DATA.PT,DD=DATA.DD,ST=DATA.ST,META=DATA.META,n=M.length,DEP=META.deposit;
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],money=v=>'$'+Math.round(v).toLocaleString('en-US'),kfmt=v=>v>=1e6?'$'+(v/1e6).toFixed(v%1e6?1:0)+'M':v>=1e3?'$'+Math.round(v/1e3)+'k':'$'+Math.round(v);
const mIdx=(y,mo)=>M.findIndex(x=>x[0]===y&&x[1]===mo);
const cum=[];{let c=DEP;M.forEach(m=>{c*=1+m[3]/100;cum.push(c)})}
const MEM=(()=>{try{return JSON.parse(localStorage.getItem('gte_mem')||'{}')}catch(e){return {}}})(),RETURNING=(MEM.visits||0)>0,PREVLAST=MEM.last||0;MEM.visits=(MEM.visits||0)+1;let bal0=Math.min(1e6,Math.max(100,+MEM.bal||DEP)),v=0,playing=true;
const balAt=f=>{const i=Math.min(n-1,Math.floor(f)),a=i?cum[i-1]:DEP,b=cum[i],k=f>=n?1:f-i;return (a+(b-a)*k)*bal0/DEP};
const rawAt=f=>balAt(f)*DEP/bal0;
const YS=ST.years.map(([y,r])=>{const s=M.findIndex(x=>x[0]===y),e=M.length-[...M].reverse().findIndex(x=>x[0]===y);return {y,r,s,e}});
const endD=META.end.split('-').map(Number),partial=endD[1]<12||endD[2]<20,maxYr=Math.max(...ST.years.map(y=>y[1]),1),finalMult=META.final/DEP;
const MULTS=[1,2,5,10,20,40,80,160,320].filter(m=>m<=finalMult*1.15),MS=MULTS.filter(m=>m>1);
/* ---------- device level: full, light or minimal ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,narrowMQ=matchMedia('(max-width:1000px)'),mobile=narrowMQ.matches||/Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);
const inScene=()=>Q>0;
let Q=mobile?1:2;if((navigator.deviceMemory&&navigator.deviceMemory<=3)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)||(navigator.connection&&navigator.connection.saveData))Q=0;
const QS0=Q;
if(reduce){v=n;playing=false}
/* ---------- themes ---------- */
const TH={
  day:{glowC:0x1ff0a0,orb:0xFFE9A8,orbEm:0xFFC83D,halo:0xFFC83D,hx:0x3B6BFF,floor:.2,grid:0xbccbe4,wall:0xffffff,wallOp:.55,top:[.06,.72,.46],topA:1,wallTop:[.2,.8,.58],wallBot:[.88,.97,.93],wallA:[.93,.93],ghost:0x93a6c6,colUp:0x17A86B,colDn:0xE5484D,night:false,expo:1,edge:0x0EAD74,edgeEm:0x0a7a52,edgeI:.3,glow:0},
  night:{glowC:0x4F8CFF,orb:0xFFD25A,orbEm:0xFFB000,halo:0xFFC83D,hx:0xFFFFFF,floor:.5,grid:0x222d3d,wall:0x0b1020,wallOp:.35,top:[.28,.52,1],topA:.95,wallTop:[.16,.38,.9],wallBot:[.16,.38,.9],wallA:[.5,0],ghost:0x3b4a63,colUp:0x26A69A,colDn:0xEF5350,night:true,expo:1,edge:0x4F8CFF,edgeEm:0x4F8CFF,edgeI:.9,glow:.05}};
let theme='day',th=TH.day;
const bgTex=c=>{const k=document.createElement('canvas');k.width=2;k.height=256;const x=k.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,c[0]);g.addColorStop(1,c[1]);x.fillStyle=g;x.fillRect(0,0,2,256);const t=new THREE.CanvasTexture(k);t.colorSpace=THREE.SRGBColorSpace;return t};
/* ---------- scene ---------- */
const renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:Q>0,alpha:true,powerPreference:'high-performance'});renderer.setClearColor(0x000000,0);$('gl').addEventListener('webglcontextlost',e=>{e.preventDefault();setTimeout(()=>{try{if(renderer.getContext().isContextLost())window.gxFallback&&window.gxFallback()}catch(x){}},4000)});renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.setPixelRatio(Math.min(devicePixelRatio,Q===2?2:Q===1?1.5:1));renderer.shadowMap.enabled=Q>0;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.8;
const cam=new THREE.PerspectiveCamera(30,1,.1,300);
scene.add(new THREE.HemisphereLight(0xffffff,0x9fb2d6,.9));const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(-8,16,12);sun.castShadow=Q>0;sun.shadow.mapSize.set(Q===2?2048:1024,Q===2?2048:1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:14,bottom:-8,near:1,far:60});sun.shadow.radius=Q===2?7:4;sun.shadow.bias=-.0004;scene.add(sun);
const asp0=screenEl.clientWidth/Math.max(1,screenEl.clientHeight),W=22,H=Math.round(Math.min(14,Math.max(9,9+(1.25-asp0)*9))),D=.75,gx=p=>(p[0]-8)/624*W-W/2,gy=p=>(272-p[1])/258*H+.2;
const cp=PT.map(p=>new THREE.Vector3(gx(p),gy(p),0)),curve=new THREE.CatmullRomCurve3(cp);
const y0=PT[0][1],yN=PT[PT.length-1][1],yOfBal=b=>gy([0,y0-(y0-yN)*Math.log(b/DEP)/Math.log(META.final/DEP)]);
const S=Q===2?360:Q===1?260:180,cpts=[];for(let i=0;i<=S;i++)cpts.push(curve.getPointAt(i/S));
function posAtF(f){const x=Math.min(cp.length-1.0001,Math.max(0,f*(cp.length-1))),i=Math.floor(x);return cp[i].clone().lerp(cp[i+1],x-i).setZ(D)}
const arc=[0];for(let i=1;i<cp.length;i++)arc.push(arc[i-1]+cp[i].distanceTo(cp[i-1]));const AL=arc[arc.length-1];arc.forEach((a,i)=>arc[i]=a/AL);
const arcAt=f=>{const x=Math.min(cp.length-1.0001,Math.max(0,f*(cp.length-1))),i=Math.floor(x);return arc[i]+(arc[i+1]-arc[i])*(x-i)};
const floor=new THREE.Mesh(new THREE.PlaneGeometry(70,9),new THREE.ShadowMaterial({opacity:.2}));floor.rotation.x=-Math.PI/2;floor.position.set(0,0,1.2);floor.receiveShadow=true;scene.add(floor);
const floorSheet=new THREE.Mesh(new THREE.PlaneGeometry(W+3,8),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6,transparent:true,opacity:.35}));floorSheet.rotation.x=-Math.PI/2;floorSheet.position.set(0,-.01,1.4);scene.add(floorSheet);
const wallBack=new THREE.Mesh(new THREE.PlaneGeometry(W+3,H+3),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}));wallBack.position.set(0,(H+3)/2-.4,-2.4);scene.add(wallBack);
const gridMat=new THREE.LineBasicMaterial({color:0xbccbe4,transparent:true,opacity:.9}),gridPts=[];
for(let z=-2.4;z<=5.4;z+=1)gridPts.push(new THREE.Vector3(-W/2-1.5,0,z),new THREE.Vector3(W/2+1.5,0,z));
for(let x=-W/2-1.5;x<=W/2+1.6;x+=1)gridPts.push(new THREE.Vector3(x,0,-2.4),new THREE.Vector3(x,0,5.4));
MULTS.forEach(m=>{const y=yOfBal(DEP*m);gridPts.push(new THREE.Vector3(-W/2-1.5,y,-2.38),new THREE.Vector3(W/2+1.5,y,-2.38))});
YS.forEach(o=>{const x=posAtF(Math.max(.0005,o.s/n)).x;gridPts.push(new THREE.Vector3(x,0,-2.38),new THREE.Vector3(x,H+2.4,-2.38))});
scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPts),gridMat));
function strip(kind){const pos=[],idx=[],col=new Float32Array((S+1)*8);for(let i=0;i<=S;i++){const p=cpts[i];
    if(kind==='top')pos.push(p.x,p.y,-D,p.x,p.y,D);else if(kind==='front')pos.push(p.x,p.y,D,p.x,0,D);else pos.push(p.x,p.y,-D,p.x,0,-D);
    if(i<S){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();g.userData.kind=kind;return g}
const gTop=strip('top'),gFront=strip('front'),gBack=strip('back');
const wallMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.15,side:THREE.DoubleSide,transparent:true,opacity:.93}),topMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,metalness:.2,side:THREE.DoubleSide,transparent:true});
const mTop=new THREE.Mesh(gTop,topMat),mFront=new THREE.Mesh(gFront,wallMat),mBack=new THREE.Mesh(gBack,wallMat);mFront.castShadow=mTop.castShadow=true;[mTop,mFront,mBack].forEach(m=>{m.frustumCulled=false;scene.add(m)});
function paint(){[gTop,gFront,gBack].forEach(g=>{const c=g.attributes.color,k=g.userData.kind;for(let i=0;i<=S;i++){for(let j=0;j<2;j++){const a=k==='top'?th.top:(j===0?th.wallTop:th.wallBot),al=k==='top'?th.topA:th.wallA[j],o=(i*2+j)*4;c.array[o]=a[0];c.array[o+1]=a[1];c.array[o+2]=a[2];c.array[o+3]=al}}c.needsUpdate=true})}
const curveF=new THREE.CatmullRomCurve3(cp.map(p=>p.clone().setZ(D))),SEG=Q===2?520:Q===1?340:220,RAD=Q===2?14:10;
const ahead=new THREE.Mesh(new THREE.TubeGeometry(curveF,SEG,.05,6),new THREE.MeshBasicMaterial({color:0x93a6c6,transparent:true,opacity:.8}));scene.add(ahead);
const lit=new THREE.Mesh(new THREE.TubeGeometry(curveF,SEG,.12,RAD),new THREE.MeshStandardMaterial({color:0x0EAD74,emissive:0x0a7a52,emissiveIntensity:.3,roughness:.3,metalness:.1}));lit.castShadow=true;scene.add(lit);
const glow=new THREE.Mesh(new THREE.TubeGeometry(curveF,SEG,.3,8),new THREE.MeshBasicMaterial({color:0x1ff0a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));glow.visible=Q>=2;scene.add(glow);
const spr=(txt,col,sz)=>{const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');x.fillStyle=col;x.font=`700 ${sz}px Geist, system-ui, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,64,32);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));return s};
const maxAbs=Math.max(...M.map(m=>Math.abs(m[2]))),colMeshes=[],colGeo=new RoundedBoxGeometry(.5,1,.5,Q>0?4:2,.09);
M.forEach((m,i)=>{const x=posAtF((i+.5)/n).x,h=.2+Math.sqrt(Math.abs(m[2])/maxAbs)*2.6;
  const mesh=new THREE.Mesh(colGeo,new THREE.MeshPhysicalMaterial({color:0x17A86B,roughness:.25,clearcoat:Q>0?.8:0,transparent:true,opacity:.25}));mesh.scale.y=h;mesh.position.set(x,h/2,2.9);mesh.castShadow=true;mesh.userData={h,i,up:m[2]>0};scene.add(mesh);
  colMeshes.push(mesh)});
const sprTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const orb=new THREE.Mesh(new THREE.SphereGeometry(.3,24,24),new THREE.MeshStandardMaterial({color:0xFFE9A8,emissive:0xFFC83D,emissiveIntensity:1.2,roughness:.2}));orb.castShadow=true;scene.add(orb);
const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:sprTex,color:0xFFC83D,blending:THREE.AdditiveBlending,transparent:true,opacity:.7,depthWrite:false}));scene.add(halo);
const stem=new THREE.Mesh(new THREE.BoxGeometry(.03,1,.03),new THREE.MeshBasicMaterial({color:0xE0A63C,transparent:true,opacity:.5}));scene.add(stem);
const ring=new THREE.Mesh(new THREE.RingGeometry(.34,.4,40),new THREE.MeshBasicMaterial({color:0xE0A63C,transparent:true,opacity:.6,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;scene.add(ring);
const hx=new THREE.Mesh(new THREE.BoxGeometry(.04,1,5.8),new THREE.MeshBasicMaterial({color:0x3B6BFF,transparent:true,opacity:.28}));hx.visible=false;scene.add(hx);
const hOrb=new THREE.Mesh(new THREE.SphereGeometry(.22,20,20),new THREE.MeshBasicMaterial({color:0x3B6BFF}));hOrb.visible=false;scene.add(hOrb);
const bestI=M.reduce((b,m,i)=>m[3]>M[b][3]?i:b,0),ddI=Math.max(0,mIdx(+DD.date.slice(0,4),+DD.date.slice(5)));
const fOfX=x=>{let bi=0,bd=1e9;PT.forEach((p,i)=>{const d=Math.abs(gx(p)-x);if(d<bd){bd=d;bi=i}});return bi/(PT.length-1)};
const ddPos=posAtF(fOfX(gx([DD.x]))),bestPos=posAtF((bestI+.5)/n);
function mkPin(pos,col){const s=new THREE.Mesh(new THREE.SphereGeometry(.2,20,20),new THREE.MeshBasicMaterial({color:col}));s.position.copy(pos);scene.add(s);const h=new THREE.Sprite(new THREE.SpriteMaterial({map:sprTex,color:col,blending:THREE.AdditiveBlending,transparent:true,opacity:.8,depthWrite:false}));h.scale.setScalar(1.7);h.position.copy(pos);scene.add(h);return [s,h]}
const pinB=mkPin(bestPos,0xF0B429),pinD=mkPin(ddPos,0xE5484D);
$('lgBestT').textContent=`${MN[M[bestI][1]-1]} ${M[bestI][0]} +${M[bestI][3].toFixed(1)}%`;
$('lgDDT').textContent=`-${DD.dd.toFixed(1)}%, ${MN[+DD.date.slice(5)-1]} ${DD.date.slice(0,4)}`;
/* the host, standing in the scene behind the chart */
const rc=document.createElement('canvas');rc.width=320;rc.height=360;const rctx=rc.getContext('2d'),rtex=new THREE.CanvasTexture(rc);rtex.colorSpace=THREE.SRGBColorSpace;rtex.minFilter=THREE.LinearFilter;rtex.generateMipmaps=false;let robotOn=false,rcrop=null,rfr=0;
const tc=document.createElement('canvas');tc.width=200;tc.height=216;const tctx=tc.getContext('2d',{willReadFrequently:true});
const robotSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:rtex,transparent:true,depthWrite:false}));robotSprite.visible=false;robotSprite.renderOrder=5;robotSprite.position.set(W/2+1.9,4.1,.3);scene.add(robotSprite);
const rShadow=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({map:sprTex,color:0x1b2740,transparent:true,opacity:.4,depthWrite:false}));rShadow.rotation.x=-Math.PI/2;rShadow.scale.set(2.4,1.1,1);rShadow.position.set(robotSprite.position.x,.03,robotSprite.position.z);scene.add(rShadow);
const robotHit=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({visible:false}));scene.add(robotHit);
const RH={x:W/2+1.9,z:.3};let fxStopped=false,lastFx=0,pendingPose=null,robotFlying=false,hgt=0,flyH=0,rBaseY=4,route=[],robotWalking=false,homeSide='R',autoAt=0,tour=null,clicks=[];let rT={x:RH.x,z:RH.z},rFig=.3,robotDrag=null,lastHoverI=-1,lastPointAt=0,YAWSIGN=1;const hitG=new THREE.Vector3(),gPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function robotCopy(cvr){
  if(!rcrop){rfr++;if(!window.__rt0)window.__rt0=performance.now();if(rfr<48||performance.now()-window.__rt0<900||robotFlying)return;tctx.clearRect(0,0,tc.width,tc.height);tctx.drawImage(cvr,0,0,tc.width,tc.height);const d=tctx.getImageData(0,0,tc.width,tc.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;for(let y=0;y<tc.height;y++)for(let x=0;x<tc.width;x++){if(d[(y*tc.width+x)*4+3]>30){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
    if(x1<0)return;let y1f=y1;for(let yy=tc.height-1;yy>=0;yy--){let hit=false;for(let xx=0;xx<tc.width;xx++){if(d[(yy*tc.width+xx)*4+3]>200){hit=true;break}}if(hit){y1f=yy;break}}const fx=tc.width,fy=tc.height,padX=(x1-x0)*.9,padT=(y1-y0)*.3;
    const cx0=Math.max(0,x0-padX)/fx,cx1=Math.min(fx,x1+padX)/fx,cy0=Math.max(0,y0-padT)/fy,cy1=1;
    rFig=(x1-x0)/((cx1-cx0)*fx);rcrop={sx:cx0*cvr.width,sy:cy0*cvr.height,sw:(cx1-cx0)*cvr.width,sh:(cy1-cy0)*cvr.height};
    rc.width=Math.round(rcrop.sw);rc.height=Math.round(rcrop.sh);rtex.dispose();
    const Hf=(narrowMQ.matches?4.8:7.0),figH=(y1f-y0+1),cropH=(cy1-cy0)*fy,padB=cy1*fy-(y1f+1),sh=Hf*cropH/figH;robotSprite.scale.set(sh*rc.width/rc.height,sh,1);rBaseY=-Hf*padB/figH+sh/2;robotSprite.position.y=rBaseY;rShadow.scale.set(Hf*.62,1.1,1);return}
  rctx.clearRect(0,0,rc.width,rc.height);rctx.drawImage(cvr,rcrop.sx,rcrop.sy,rcrop.sw,rcrop.sh,0,0,rc.width,rc.height);rtex.needsUpdate=true;robotOn=true}
/* sparks */
const PN=Q>=2?320:Q===1?140:0,pPos=new Float32Array(PN*3+3).fill(-50),pCol=new Float32Array(PN*3+3),pBase=new Float32Array(PN*3+3),pVel=new Float32Array(PN*3+3),pLife=new Float32Array(PN+1);
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pMat=new THREE.PointsMaterial({size:.4,map:sprTex,vertexColors:true,transparent:true,depthWrite:false});const pPts=new THREE.Points(pGeo,pMat);pPts.frustumCulled=false;pPts.visible=PN>0;scene.add(pPts);
let pHead=0;const GOLDS=[new THREE.Color(0xF0B429),new THREE.Color(0xFFD66B),new THREE.Color(0xE39A12)],GREENS=[new THREE.Color(0x17C97F),new THREE.Color(0x7CE7B6)];
function emit(p,n2,spread,up,cols2){if(!PN||reduce)return;for(let k=0;k<n2;k++){const i=pHead++%PN,L=cols2||GOLDS,c=L[Math.floor(Math.random()*L.length)];pPos[i*3]=p.x;pPos[i*3+1]=p.y;pPos[i*3+2]=p.z+.2;pVel[i*3]=(Math.random()-.5)*spread;pVel[i*3+1]=Math.random()*up+up*.25;pVel[i*3+2]=(Math.random()-.5)*spread*.6;pLife[i]=1;pBase[i*3]=c.r;pBase[i*3+1]=c.g;pBase[i*3+2]=c.b}}
function stepP(dt){if(!PN)return;const bg=th.night?[0,0,0]:[.93,.95,.98];for(let i=0;i<PN;i++){if(pLife[i]<=0){pPos[i*3+1]=-50;continue}pLife[i]-=dt*.85;pVel[i*3+1]-=dt*2.6;pPos[i*3]+=pVel[i*3]*dt;pPos[i*3+1]+=pVel[i*3+1]*dt;pPos[i*3+2]+=pVel[i*3+2]*dt;const k=Math.max(0,pLife[i]);for(let j=0;j<3;j++)pCol[i*3+j]=pBase[i*3+j]*k+bg[j]*(1-k)}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
/* labels */
const axes=$('axes'),yl=MULTS.map((m,i)=>{const e=document.createElement('div');e.className='ax y'+(i===1||i===4?' mh':'');axes.appendChild(e);return e}),xl=YS.map(o=>{const e=document.createElement('div');e.className='ax x';e.textContent=o.y;axes.appendChild(e);return e});
const setYLabels=()=>yl.forEach((e,i)=>e.textContent=kfmt(bal0*MULTS[i])+(MULTS[i]>1?'  '+MULTS[i]+'×':'  start'));setYLabels();
/* ---------- theme ---------- */
function applyTheme(name){theme=name;th=TH[name];scene.background=null;cardEl.classList.toggle('night',th.night);
  renderer.toneMappingExposure=th.expo;wallMat.depthWrite=!th.night;wallMat.opacity=th.night?1:.93;hx.material.color.setHex(th.hx);hOrb.material.color.setHex(th.hx);gridMat.color.setHex(th.grid);floor.material.opacity=th.floor;wallBack.material.color.setHex(th.wall);wallBack.material.opacity=th.wallOp;floorSheet.material.color.setHex(th.night?0x0d1730:0xffffff);floorSheet.material.opacity=th.night?.5:.35;
  ahead.material.color.setHex(th.ghost);lit.material.color.setHex(th.edge);lit.material.emissive.setHex(th.edgeEm);glow.material.opacity=th.glow;glow.material.color.setHex(th.glowC);orb.material.color.setHex(th.orb);orb.material.emissive.setHex(th.orbEm);halo.material.color.setHex(th.halo);pMat.blending=th.night?THREE.AdditiveBlending:THREE.NormalBlending;pMat.needsUpdate=true;
  colMeshes.forEach(c=>{const u=c.userData,cc=u.up?th.colUp:th.colDn;c.material.color.setHex(cc);c.material.emissive.setHex(cc);c.material.emissiveIntensity=th.night?.28:0});
  paint()}
const siteTheme=()=>document.documentElement.getAttribute('data-theme')==='dark'?'night':'day';
applyTheme(siteTheme());
new MutationObserver(()=>applyTheme(siteTheme())).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
/* ---------- host ---------- */
const bub=$('bub'),bt=$('bt'),rbw=$('rbw');let swT,voice=false,talkUntil=0,moveT=0;
const rbF=()=>$('rb'),post=m=>{if(m&&m.pose&&(robotWalking||robotFlying)&&!/^(side|side2|front|rest)$/.test(m.pose)){pendingPose=m.pose;m=Object.assign({},m);delete m.pose}try{rbF()&&rbF().contentWindow.postMessage(m,'*')}catch(e){}};
function staticHost(){rbw.innerHTML='<img class="st" src="icon-192.png" alt="Host">'}
function loadRobot(){if(rbw.dataset.l)return;rbw.dataset.l=1;if(Q===0){staticHost();return}const f=document.createElement('iframe');f.id='gx-rb';f.title='Host robot';f.setAttribute('loading','lazy');if(inScene()){rbw.style.width=(narrowMQ.matches?'420px':Q>=2?'800px':'560px');rbw.style.height=(narrowMQ.matches?'450px':Q>=2?'860px':'600px')}
  f.src='robot3d.html?scene=happy&full=1';
  window.__robotFrame=cv=>{if(inScene())robotCopy(cv)};
  rbw.appendChild(f)}
let speaking=false;
const say4tts=t=>t.replace(/\$([\d,.]+)/g,'$1 dollars').replace(/×/g,' times').replace(/(^|[\s(])-(\d)/g,'$1minus $2').replace(/(^|[\s(])\+(\d)/g,'$1plus $2').replace(/%/g,' percent').replace(/\.\.\./g,'.').replace(/\bPF\b/g,'profit factor');
function speak(t){if(!voice||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(say4tts(t)),vs=speechSynthesis.getVoices().filter(x=>/^en/i.test(x.lang));u.voice=vs.find(x=>/male|david|guy|daniel/i.test(x.name))||vs[0]||null;u.rate=1;u.onstart=()=>{speaking=true};u.onend=u.onerror=()=>{speaking=false;talkUntil=performance.now()+600};speaking=true;speechSynthesis.speak(u)}
setInterval(()=>{if(speaking&&window.speechSynthesis&&!speechSynthesis.speaking&&!speechSynthesis.pending)speaking=false},1500);
let twT;function tw(x){clearInterval(twT);if(reduce){bt.textContent=x;return}let i=0;bt.textContent='';twT=setInterval(()=>{i+=3;bt.textContent=x.slice(0,i);if(i>=x.length)clearInterval(twT)},16)}
function say(t,p,force){const now=performance.now();if(!force&&(tour||now<talkUntil||speaking))return;talkUntil=now+Math.min(7000,2200+t.length*45)+(voice?4000:0);clearTimeout(swT);bub.classList.add('sw');swT=setTimeout(()=>{tw(t);bub.classList.remove('sw')},220);post({pose:p||'talk'});post({scene:'happy'});post({talk:Math.min(7000,1800+t.length*55)});try{const hl=$('hostline');$('hlTxt').textContent=t.length>150?t.slice(0,147)+'...':t;hl.hidden=false}catch(e){}speak(t)}
$('vt').onclick=()=>{voice=!voice;$('vt').textContent=voice?'🔊 voice on':'🔇 voice off';if(!voice&&window.speechSynthesis){speechSynthesis.cancel();speaking=false}else say('Voice is on. I will read my answers out loud.','wave',true)};
function robotXY(){if(inScene()&&robotOn){const q=proj(robotSprite.position.clone().setY(robotSprite.position.y+robotSprite.scale.y*.22)),sr=screenEl.getBoundingClientRect();return {cx:sr.left+q[0],cy:sr.top+q[1]}}const r=rbw.getBoundingClientRect();return {cx:r.left+r.width/2,cy:r.top+r.height*.2}}
setInterval(()=>{if(document.hidden||!inScene()||!robotOn||robotDrag)return;const sr=screenEl.getBoundingClientRect(),{cx}=robotXY(),tp=hoverF!==null?posAtF(hoverF):orb.position,q=proj(tp);post({yaw:Math.max(-.42,Math.min(.42,((sr.left+q[0]-cx)/(sr.width*.5))*.55))*YAWSIGN})},160);
const clamp1=x=>Math.max(-1,Math.min(1,x));
addEventListener('pointermove',e=>{const now=performance.now();if(now-moveT<90)return;moveT=now;const {cx,cy}=robotXY();post({look:[clamp1((e.clientX-cx)/(innerWidth*.45)),clamp1((e.clientY-cy)/(innerHeight*.5))]})});
rbw.onclick=()=>{if(partyCheck())return;const L=['Hi! You found me. I read every trade out on the live stream.','Drag the chart to rotate it, hover to preview a month, tap a month to travel there.','Fun fact: I never hide a losing month. Try "Worst case?".'];say(L[Math.floor(Math.random()*L.length)],'wave',true)};
/* the host looks at the traveller when you are not moving the mouse */
setInterval(()=>{if(document.hidden||performance.now()-moveT<2500||!rbF())return;const {cx,cy}=robotXY(),sr=screenEl.getBoundingClientRect(),q=proj(orb.position);post({look:[clamp1((sr.left+q[0]-cx)/(innerWidth*.45)),clamp1((sr.top+q[1]-cy)/(innerHeight*.5))]})},700);
const sayEls=[];
function bindSay(){GX.querySelectorAll('[data-say]').forEach(el=>{if(el._b)return;el._b=1;el.addEventListener('mouseenter',()=>{const [t,p]=el.dataset.say.split('|');say(t,p)})})}
const jump=i=>{v=i+.98;sl.value=v;pause()};
$('lgBest').onclick=()=>{jump(bestI);say(`${MN[M[bestI][1]-1]} ${M[bestI][0]} gained ${M[bestI][3].toFixed(1)}%. That was the best month by far, so do not expect that every month.`,'cheer',true)};
$('lgDD').onclick=()=>{jump(ddI);say(`Here is the biggest dip on the balance curve: -${DD.dd.toFixed(1)}% from the peak in ${MN[+DD.date.slice(5)-1]} ${DD.date.slice(0,4)}. Live results can be worse.`,'concerned',true)};
const Q_=[['Is this real?',()=>say('The backtest is a simulation on real gold prices, and I label it that way everywhere. The proof that matters is live: every trade runs on YouTube in real time.','point',true)],
 ['How am I protected?',()=>say('Every trade has a stop loss from the moment it opens. No martingale and no grid: the lot size never doubles after a loss.','stop',true)],
 ['Worst case?',()=>{jump(ddI);say(`Here is the biggest dip on the balance curve: -${DD.dd.toFixed(1)}% from the peak in ${MN[+DD.date.slice(5)-1]} ${DD.date.slice(0,4)}. The report's largest equity drawdown, with open trades, was ${ST.dd}%. Live results can be worse.`,'concerned',true)}],
 ['Best month?',()=>{jump(bestI);say(`${MN[M[bestI][1]-1]} ${M[bestI][0]} gained ${M[bestI][3].toFixed(1)}%. That was the best month by far, so do not expect that every month.`,'cheer',true)}],
 ['Who are you?',()=>say('I am the AI host of the GoldTriEngine live stream. I explain each trade as it happens, including the ones that lose.','wave',true)]];
Q_.forEach(([t,f])=>{const b=document.createElement('button');b.textContent=t;b.onclick=f;$('qs').appendChild(b)});
/* ---------- controls ---------- */
let sfx=false,AC=null;
function beep(fr,dur,vol){if(!sfx)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();let t=AC.currentTime;fr.forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain(),s=t+i*dur*.75;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(vol,s+.01);g.gain.exponentialRampToValueAtTime(.0001,s+dur);o.connect(g);g.connect(AC.destination);o.start(s);o.stop(s+dur+.03)})}catch(e){}}

let speed=1,lastAct=performance.now(),nudged=0,seen={},lastI=-1;const crossed=new Set();
const act0=()=>{lastAct=performance.now();GX.querySelectorAll('#gx-qs .nudge').forEach(x=>x.classList.remove('nudge'));$('play').classList.remove('pulse')};
addEventListener('pointerdown',act0);addEventListener('keydown',act0);
const chips=$('chips');[5000,10000,20000].forEach(a=>{const b=document.createElement('button');b.className='chip'+(a===DEP?' on':'');b.textContent=money(a);b.onclick=()=>setBal(a,true);b.dataset.a=a;b.addEventListener('mouseenter',()=>say('Pick an amount and I will show what the same run would do with it.','point'));chips.appendChild(b)});
function setBal(a,fromChip,silent){bal0=Math.max(100,Math.min(1e6,a));const wn=$('warn');if(bal0<1000){wn.style.display='';wn.textContent='Under $1,000 an account can only trade the smallest lot size, so real results can be very different from this simulation.'}else if(bal0>100000){wn.style.display='';wn.textContent='Very large accounts can get worse fills than a simulation assumes, so real results can be lower.'}else wn.style.display='none';beep([440],.1,.04);GX.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',+c.dataset.a===bal0));setYLabels();crossed.clear();MEMSAVE();if(!silent)say(`With ${money(bal0)} the same run would have ended near ${money(balAt(n))}. A simulation: real results will differ.`,'point',true)}
if(![5000,10000,20000].includes(bal0))bal0=DEP;setBal(bal0,false,true);
const sl=$('sl');sl.max=n;sl.oninput=()=>{stopTour(true);v=+sl.value;pause()};const pb=$('play');if(playing)pb.classList.add('pulse');else pb.textContent='▶';function pause(){playing=false;pb.textContent='▶'}pb.onclick=()=>{stopTour(true);if(playing)pause();else{if(v>=n-.01)v=0;playing=true;pb.textContent='❚❚'}};
$('spd').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('spd').textContent=speed+'×'};
$('rst').onclick=()=>{v=0;playing=true;pb.textContent='❚❚';crossed.clear();seen={};lastI=-1;say('Starting over. Watch the chart grow.','wave',true)};
addEventListener('keydown',e=>{if(/input|textarea/i.test(e.target.tagName))return;if(!(GX.matches(':hover')||GX.contains(document.activeElement)))return;if(e.key==='ArrowRight'){e.preventDefault();v=Math.min(n,Math.floor(v)+1);sl.value=v;pause()}else if(e.key==='ArrowLeft'){e.preventDefault();v=Math.max(0,Math.ceil(v)-1);sl.value=v;pause()}else if(e.key===' '){e.preventDefault();pb.click()}});
setInterval(()=>{if(performance.now()-lastAct>15000&&!nudged&&!playing){nudged=1;say('Psst. Try asking me "Worst case?" and I will take you to the biggest dip.','point',true);[...GX.querySelectorAll('#gx-qs button')].find(b=>/Worst/.test(b.textContent)).classList.add('nudge')}},3000);
/* numbers from the report fill the page */
const sd=(id,t,p,val)=>{const el=$(id);el.querySelector('b').textContent=val;el.dataset.say=t+'|'+p};
sd('sPF',`Profit factor ${ST.pf.toFixed(2)}: in this test the money won was ${ST.pf.toFixed(1)} times the money lost.`,'point',ST.pf.toFixed(2));
sd('sTR',`${ST.trades.toLocaleString('en-US')} trades in the test, so it is a big sample, not a lucky handful.`,'point',ST.trades.toLocaleString('en-US'));
sd('sWN',`Only ${ST.win.toFixed(1)}% of trades win, but the average win is ${ST.payoff.toFixed(2)} times the average loss. That is how it makes money.`,'point',ST.win.toFixed(1)+'%');
sd('sDD',`Largest equity drawdown ${ST.dd.toFixed(1)}%, including open trades. Press Worst case to see where the balance dipped.`,'concerned',ST.dd.toFixed(1)+'%');
const fd=s=>{const a=s.split('-').map(Number);return a[2]+' '+MN[a[1]-1]+' '+a[0]},co=(META.company||'Fusion Markets').replace(/\s+(Pty|Ltd|LLC|Limited|Inc)\b.*$/i,'').trim()||'Fusion Markets';
$('fine').textContent=`Simulated on gold, ${fd(META.start)} to ${fd(META.end)}, ${money(DEP)} start, scaled to the amount you pick, ${co} data. Lot size grows with the balance.`;
const yrs=$('yrs');yrs.innerHTML=YS.map((o,i)=>`<div data-say="${o.y}: the balance grew ${o.r}% over ${partial&&i===YS.length-1?'the year so far':'that year'} in the simulation, compounded.|point"><span>${partial&&i===YS.length-1?o.y+' YTD':o.y} RETURN</span><b id="gx-y${o.y}">+0%</b><i id="gx-yb${o.y}"></i></div>`).join('');
bindSay();
setTimeout(()=>{if(RETURNING){const days=PREVLAST?Math.floor((Date.now()-PREVLAST)/864e5):0;say(`Welcome back${days>0?', it has been '+days+' day'+(days>1?'s':''):''}. I kept your amount, ${money(bal0)}. ${MEM.toured?'Press Replay tour if you want the walk-through again.':'Want the quick tour? Press Tour.'}`,'wave',true)}else say('Hi, I am the GoldTriEngine host. New here? Press Tour for a one-minute walk through the test, or just drag the chart.','wave',true)},1600);
/* ---------- the robot walks to the side the traveller is not on ---------- */
const lane=4.4,SPOT=side=>side==='L'?{x:-W/2-1.7,z:.3}:{x:W/2+1.9,z:.3};
function follow(force){if(!inScene()||!robotOn||robotDrag||reduce)return;if(!force&&performance.now()<autoAt)return;const tx=Math.max(-W/2-1.2,Math.min(W/2+1.9,orb.position.x+(3.1)));
  if(force||Math.abs(tx-rT.x)>1.4){route.length=0;rT={x:tx,z:1.6}}}
function ensureSide(force){if(narrowMQ.matches){follow(force);return}if(!inScene()||!robotOn||robotDrag||reduce)return;if(!force&&performance.now()<autoAt)return;const mxp=orb.position.x,want=mxp>(force?0:1.5)?'L':mxp<(force?0:-1.5)?'R':homeSide;if(want===homeSide&&!force)return;homeSide=want;const sp=SPOT(want);route.length=0;
  if(Math.abs(robotSprite.position.x-sp.x)<1.5){rT=sp;return}route.push({x:robotSprite.position.x,z:lane},{x:sp.x,z:lane},sp);rT=route.shift()}
setInterval(()=>{if(!document.hidden)ensureSide(false)},700);
/* ---------- remembers the visitor, only in this browser ---------- */
function MEMSAVE(){try{MEM.bal=bal0;MEM.last=Date.now();localStorage.setItem('gte_mem',JSON.stringify(MEM))}catch(e){}}
$('fine').insertAdjacentHTML('afterend','<p class="fine" style="margin-top:2px">This page remembers your amount and whether you took the tour, only in this browser. <a class="forget" id="gx-forget">Forget me</a></p>');
$('forget').onclick=()=>{try{localStorage.removeItem('gte_mem');localStorage.removeItem('gte_chart_theme')}catch(e){}MEM.toured=0;MEM.visits=1;say('Done. I forgot everything about you. Nice to meet you again.','wave',true)};
/* ---------- guided tour ---------- */
const tl=$('tourline'),tlStep=$('tlStep'),tlTxt=$('tlTxt'),tourBtn=$('tourBtn');
function tourSteps(){const y0=YS[0],bi=M[bestI];return [
  {s:'Where it starts',v:0,az:-.5,pose:'wave',text:`This is day one of the test, ${fd(META.start)}. ${money(bal0)} in the account, and the gold price starts to move.`},
  {s:'The best month',v:bestI+.98,az:-.25,pose:'cheer',text:`${MN[bi[1]-1]} ${bi[0]} was the best month: ${bi[3]>=0?'+':''}${bi[3].toFixed(1)}%. Good, but it is the exception, not the rule.`},
  {s:'The biggest dip',v:ddI+.98,az:-.6,pose:'concerned',text:`Here the balance fell ${DD.dd.toFixed(1)}% from its peak, in ${MN[+DD.date.slice(5)-1]} ${DD.date.slice(0,4)}. Every system has a dip like this, and live it can be worse.`},
  {s:`End of ${y0.y}`,v:Math.max(.5,y0.e-.02),az:-.4,pose:'point',text:`After the first year the simulation shows +${y0.r}%. ${money(bal0)} became about ${money(balAt(y0.e-.02))}.`},
  {s:'Where it ended',v:n,az:-.5,pose:'thumbs',text:`The test ended at about ${money(balAt(n))}. It is a simulation, not a promise. The real proof is the live stream.`}]}
function startTour(){stopTour(true);pause();tour={i:-1,steps:tourSteps(),timer:0,tv:null};tourBtn.textContent='■ Stop tour';if(narrowMQ.matches)try{cardEl.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}nextStep()}
function nextStep(){if(!tour)return;clearTimeout(tour.timer);tour.i++;if(tour.i>=tour.steps.length){finishTour();return}const st=tour.steps[tour.i];tour.tv=st.v;azT=st.az;elT=.3+(tour.i%2)*.1;radT=Math.max(fitR*.5,fitR*.86);lastTouch=performance.now();hop();tl.hidden=false;tlStep.textContent=`TOUR ${tour.i+1}/${tour.steps.length}`;tlTxt.textContent=st.s;
  say(st.text,st.pose,true);const xm=posAtF(Math.min(1,st.v/n)).x;autoAt=0;{const wantL=xm>0;if(!narrowMQ.matches&&(wantL?'L':'R')!==homeSide){homeSide=wantL?'L':'R';const sp=SPOT(homeSide);if(inScene()&&robotOn&&!robotDrag){route.length=0;route.push({x:robotSprite.position.x,z:lane},{x:sp.x,z:lane},sp);rT=route.shift()}}}
  tour.timer=setTimeout(nextStep,Math.max(6000,st.text.length*80))}
function finishTour(){clearTimeout(tour&&tour.timer);tour=null;tl.hidden=true;tourBtn.textContent='▶ Replay tour';MEM.toured=1;MEMSAVE();radT=fitR;azT=AZ0;elT=EL0;say('That is the tour. Try your own amount, or ask me anything below. Ready to test it yourself?','wave',true);setTimeout(()=>{bt.innerHTML+='<div class="cta"><a href="free-backtest.html">Backtest it free</a><a href="https://www.youtube.com/@GoldTriEngine/live" target="_blank" rel="noopener">Watch live</a></div>'},500)}
function stopTour(silent){if(!tour)return;clearTimeout(tour.timer);tour=null;tl.hidden=true;tourBtn.textContent=MEM.toured?'▶ Replay tour':'▶ Tour';radT=fitR;if(!silent)say('Tour stopped. Explore on your own, or ask me a question.','wave',true)}
tourBtn.textContent=MEM.toured?'▶ Replay tour':'▶ Tour';
tourBtn.onclick=()=>tour?stopTour(false):startTour();$('tNext').onclick=()=>nextStep();$('tStop').onclick=()=>stopTour(false);
/* ---------- small details: idle moves and party mode ---------- */
setInterval(()=>{if(document.hidden||tour||speaking||reduce||!robotOn||robotDrag||robotWalking||robotFlying)return;if(performance.now()-lastAct>22000&&Math.random()<.5){post({pose:['think','watching','idea'][Math.floor(Math.random()*3)]});lastAct=performance.now()-12000}},5000);
function partyCheck(){const now=performance.now();clicks=clicks.filter(c=>now-c<4500);clicks.push(now);if(clicks.length<5)return false;clicks=[];const seq=['cheer','clap','laugh','thumbs'];seq.forEach((p,i)=>setTimeout(()=>post({pose:p}),i*1300));emit(robotSprite.position.clone().setY(5),120,8,6);beep([523,659,784,1046,784,1046],.12,.05);say('Okay, okay, you found party mode!','cheer',true);return true}
function hop(){if(inScene()||reduce)return;post({pose:'front',fx:'fly'});setTimeout(()=>post({pose:'rest'}),3600)}
setInterval(()=>{const rr=rbw.getBoundingClientRect(),see=inScene()?visR>.02:(rr.bottom>0&&rr.top<innerHeight);post({paused:document.hidden||!see})},800);
/* ---------- camera ---------- */
const tgt=new THREE.Vector3(0,H*.36,.6);let az=-1.5,el=.95,rad=60,fitR=40,narrow=false,lastTouch=-1e9;const AZ0=-.5,EL0=.36;let azT=AZ0,elT=EL0,radT=40;
function fit(){const w=screenEl.clientWidth,h=screenEl.clientHeight;cam.aspect=w/h;cam.fov=w/h<1.1?38:30;cam.updateProjectionMatrix();narrow=cam.aspect<.95;const tf=2*Math.tan(cam.fov*Math.PI/360)*cam.aspect;fitR=narrow?(W*.5+4)/tf:(W+(inScene()?13:9))/tf*.92}
function resize(){const w=screenEl.clientWidth,h=screenEl.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);fit();radT=Math.max(fitR*.45,Math.min(fitR*1.3,radT||fitR))}
addEventListener('resize',resize);new ResizeObserver(resize).observe(screenEl);resize();radT=fitR;az=-1.5;rad=fitR*1.5;
$('zin').onclick=()=>{radT=Math.max(fitR*.45,radT*.82);lastTouch=performance.now()};$('zout').onclick=()=>{radT=Math.min(fitR*1.3,radT*1.2);lastTouch=performance.now()};
$('rv').onclick=()=>{route.length=0;autoAt=0;ensureSide(true);azT=AZ0;elT=EL0;radT=fitR;lastTouch=performance.now()};
const cv=$('gl'),ray=new THREE.Raycaster(),m2=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-D),hitP=new THREE.Vector3();let drag=null,hoverF=null,hoverCol=null;
function pick(e){const r=cv.getBoundingClientRect();m2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(m2,cam);if(robotOn&&robotSprite.visible&&ray.intersectObject(robotHit)[0]){hoverCol=null;return 'robot'}const ch=ray.intersectObjects(colMeshes)[0];hoverCol=ch?ch.object.userData.i:null;
  if(ray.ray.intersectPlane(plane,hitP)&&hitP.x>-W/2-.3&&hitP.x<W/2+.3)return hoverCol!==null?(hoverCol+.5)/n:fOfX(hitP.x);return null}
cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(x){}if(robotOn&&robotSprite.visible&&pick(e)==='robot'){robotDrag={moved:0,x:e.clientX,y:e.clientY};cv.style.cursor='grabbing';return}drag={x:e.clientX,y:e.clientY,az:azT,el:elT,moved:0};lastTouch=performance.now();cv.style.cursor='grabbing'});
cv.addEventListener('pointermove',e=>{lastTouch=performance.now();
  if(robotDrag){robotDrag.moved=Math.max(robotDrag.moved,Math.abs(e.clientX-robotDrag.x)+Math.abs(e.clientY-robotDrag.y));if(robotDrag.moved>=6){const r=cv.getBoundingClientRect();m2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(m2,cam);if(ray.ray.intersectPlane(gPlane,hitG)){rT.x=Math.max(-W/2-3.4,Math.min(W/2+3.4,hitG.x));rT.z=Math.max(-1.4,Math.min(4.6,hitG.z))}if(!robotDrag.rec){robotDrag.rec=1;post({pose:'surprised'})}}return}
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.abs(dx)+Math.abs(dy));if(drag.moved>=6){azT=Math.max(-1.35,Math.min(1.1,drag.az-dx*.006));elT=Math.max(.06,Math.min(1.25,drag.el+dy*.004));hoverF=null}}
  else if(e.pointerType!=='touch'){const f=pick(e);hoverF=f==='robot'?null:f;cv.style.cursor=f==='robot'?'pointer':'grab'}});
cv.addEventListener('pointerup',e=>{if(robotDrag){const click=robotDrag.moved<6;robotDrag=null;route.length=0;autoAt=performance.now()+15000;cv.style.cursor='grab';if(click)rbw.onclick();else say('Nice spot. I can see the whole chart from here.','thumbs',true);return}
  const was=drag&&drag.moved<6;drag=null;cv.style.cursor='grab';if(was){const f=pick(e);if(f==='robot'){rbw.onclick()}else if(f!==null){v=Math.min(n,f*n);sl.value=v;pause();const i=Math.min(n-1,Math.floor(v)),m=M[i];say(`${MN[m[1]-1]} ${m[0]}: ${m[3]>=0?'+':''}${m[3].toFixed(1)}%. Your balance in that month would be about ${money(balAt(v))}.`,'point',true)}}if(e.pointerType==='touch'){hoverF=null;hoverCol=null}});
cv.addEventListener('pointercancel',()=>{drag=null;hoverF=null});
cv.addEventListener('pointerleave',()=>{hoverF=null;hoverCol=null;if(!drag)cv.style.cursor='grab'});
cv.addEventListener('dblclick',()=>$('rv').click());
cv.addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();radT=Math.max(fitR*.45,Math.min(fitR*1.3,radT*(1+e.deltaY*.001)));lastTouch=performance.now()},{passive:false});
/* ---------- performance: pause off-screen, drop quality if slow ---------- */
let visR=1;new IntersectionObserver(es=>{visR=es[0].intersectionRatio},{threshold:[0,.1,.25,.4,.6,1]}).observe(screenEl);
function setQ(q){if(q>=Q)return;Q=q;renderer.setPixelRatio(Math.min(devicePixelRatio,q===1?1.5:1));renderer.shadowMap.enabled=q>0;sun.castShadow=q>0;glow.visible=q>=2;scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}});resize();}
/* ---------- loop ---------- */
const rd={box:$('readout'),lab:$('rdLab'),m:$('rdM'),b:$('rdB'),c:$('rdC'),h:$('rdH')},setT=(el,x)=>{if(el&&el._t!==x){el._t=x;el.textContent=x}},sm=$('sm'),sv=$('sv'),sb=$('sb'),sbest=$('sbest'),sworst=$('sworst'),ssav=$('ssav'),toast=$('toast'),t0=performance.now();
let bI=0,wI=0,shown=DEP,last=performance.now(),ema=.016,frames=0,slow=0,ready=false;
function proj(p){const q=p.clone().project(cam);return[(q.x+1)/2*screenEl.clientWidth,(1-q.y)/2*screenEl.clientHeight]}
function place(el,pos,on,dy){let [x,y]=proj(pos.clone().setY(pos.y+(dy||.3)));const w=el.offsetWidth/2+8,sw=screenEl.clientWidth;x=Math.max(w,Math.min(sw-w,x));y=Math.max(el.offsetHeight*1.4+54,y);el.style.left=x+'px';el.style.top=y+'px';el.classList.toggle('on',on)}
function frame(now){requestAnimationFrame(frame);if(document.hidden||visR<.02){last=now;return}const dt=Math.min(.05,(now-last)/1000);last=now;frames++;ema=ema*.95+dt*.05;
  if(frames>300&&ema>.045&&Q>1){slow++;if(slow>120){setQ(Q-1);slow=0;ema=.02}}else slow=Math.max(0,slow-1);
  if(playing&&visR>.35){v+=.022*speed;if(v>=n){v=n;pause();say(`That was the whole run: ${money(bal0)} became about ${money(balAt(n))} in the simulation. Not a promise. Now watch how it trades live.`,'thumbs',true);setTimeout(()=>{bt.innerHTML+='<div class="cta"><a href="free-backtest.html">Backtest it free</a><a href="https://www.youtube.com/@GoldTriEngine/live" target="_blank" rel="noopener">Watch live</a></div>'},2400);emit(posAtF(1),90,5,5)}}
  if(tour&&tour.tv!=null){v+=(tour.tv-v)*Math.min(1,dt*2.4);if(Math.abs(tour.tv-v)<.02){v=tour.tv;tour.tv=null}}  sl.value=v;const f=Math.min(1,v/n),ai=Math.min(n-1,Math.floor(v)),m=M[ai],pos=posAtF(f),ar=arcAt(f);
  [gTop,gFront,gBack].forEach(g=>g.setDrawRange(0,Math.floor(ar*S)*6));lit.geometry.setDrawRange(0,Math.floor(ar*SEG)*RAD*6);if(glow.visible)glow.geometry.setDrawRange(0,Math.floor(ar*SEG)*8*6);
  colMeshes.forEach((c,i)=>{const on=i<ai||(i===ai&&v>=n-.001),act=i===ai&&v<n,u=c.userData,hv=hoverCol===i;c.material.opacity+=((on||act||hv?1:.25)-c.material.opacity)*.15;const tg=(on||act?u.h*(act?1.12:1):u.h*.35)*(hv?1.08:1);u.vy=(u.vy||0)+(tg-c.scale.y)*.16;u.vy*=.7;c.scale.y=Math.max(.02,c.scale.y+u.vy);c.position.y=c.scale.y/2});
  orb.position.copy(pos);halo.position.copy(pos);halo.scale.setScalar(2.4+Math.sin(now*.006)*.35);stem.scale.y=Math.max(.01,pos.y);stem.position.set(pos.x,pos.y/2,pos.z);ring.position.set(pos.x,.03,pos.z);const rp=(now*.001)%1;ring.scale.setScalar(1+rp*1.6);ring.material.opacity=.6*(1-rp);
  const b=balAt(v),mo=m[1]-1,pnl=m[2]*bal0/DEP,showB=v>bestI+1,showD=v>ddI+.6;pinB.forEach(o=>o.visible=showB);pinD.forEach(o=>o.visible=showD);
  if(ai!==lastI){const fwd=ai>lastI;lastI=ai;const sl2=M.slice(0,ai+1);bI=sl2.reduce((a,x,i)=>x[3]>sl2[a][3]?i:a,0);wI=sl2.reduce((a,x,i)=>x[3]<sl2[a][3]?i:a,0);
    if(fwd&&playing){emit(pos,m[2]>=0?12:4,2.4,3.2,m[2]>=0?GREENS:undefined);beep(m[2]>=0?[740]:[196],.1,.02)}
    if(playing){if(ai===bestI)say(`${MN[mo]} ${m[0]}: the best month, +${m[3].toFixed(1)}%. Great, but don't expect every month to look like this.`,'cheer');
      else if(ai===ddI&&!seen.dd){seen.dd=1;say(`Here comes the biggest dip on the balance curve: -${DD.dd.toFixed(1)}% from the peak. Every system has one. Watch how it recovers.`,'concerned')}
      else if(m[3]<-2&&!seen.loss){seen.loss=1;say(`${MN[mo]} ${m[0]} lost ${Math.abs(m[3]).toFixed(1)}%. Every trade has a stop loss, so losing months stay small, and I never hide them.`,'concerned')}
      else if(YS.length>1&&YS.some(o=>o.e===ai+1&&o.e<n)&&!seen['y'+ai]){seen['y'+ai]=1;const o=YS.find(o=>o.e===ai+1);say(`End of ${o.y}: the simulation grew ${o.r}% that year. Notice how the curve keeps climbing, with dips along the way.`,'point')}}}
  
  shown+=(b-shown)*.16;sb.textContent=money(shown);
  const tile=i=>{const x=M[i],p=x[2]*bal0/DEP;return `${MN[x[1]-1]} ${String(x[0]).slice(2)} <small>${x[3]>=0?'+':''}${x[3].toFixed(1)}% · ${x[2]>=0?'+':'-'}${money(Math.abs(p))}</small>`};
  sbest.innerHTML=tile(bI);sworst.innerHTML=M[wI][3]<0?tile(wI):'none yet';
  const mult=b/bal0;MS.forEach(k=>{if(mult>=k&&!crossed.has(k)){crossed.add(k);hop();beep([523,659,784,1046],.16,.05);toast.innerHTML=`<b>${k}× your money</b><span>${money(bal0)} → ${money(bal0*k)}</span>`;toast.classList.add('on');setTimeout(()=>toast.classList.remove('on'),2800);emit(pos,80,7,6);if(playing)say(`${k} times your starting money, in the simulation. Remember: it is a backtest, not a promise.`,'cheer')}else if(mult<k*.97)crossed.delete(k)});
  if(playing&&!reduce&&Math.random()<.5)emit(pos,1,.5,.9);stepP(dt);
  YS.forEach(o=>{const a=o.s?cum[o.s-1]:DEP,vv=Math.min(v,o.e),r0=v<=o.s?0:(rawAt(vv)/a-1)*100,el2=$('y'+o.y);if(el2){el2.textContent='+'+Math.round(r0)+'%';$('yb'+o.y).style.width=Math.min(100,r0/maxYr*100)+'%'}});
  /* camera */
  const idle=now-lastTouch>3500&&!reduce,intro=Math.min(1,(now-t0)/2400),ie=1-Math.pow(1-intro,3);
  if(idle&&!tour)azT=AZ0+Math.sin(now*.00033)*.2;
  az+=((azT-az)*(intro<1?.05:.12));el+=((elT-el)*.12);rad+=((radT-rad)*.1);
  tgt.x+=((narrow?Math.max(-W/2+3,Math.min(W/2-3,pos.x*.85)):(inScene()?-2.6:0))-tgt.x)*.06;const rOn=inScene()&&robotOn;robotSprite.visible=rShadow.visible=rOn;
  {const dx=rT.x-robotSprite.position.x,dz=rT.z-robotSprite.position.z,d=Math.hypot(dx,dz);
    if(robotDrag){robotSprite.position.x+=dx*.4;robotSprite.position.z+=dz*.4;flyH=.9}
    else if(d>.03){if(!robotFlying&&(d>3.5||route.length>0)){robotFlying=true;robotWalking=false;fxStopped=false;lastFx=now;post({pose:'front',fx:'fly'})}
      else if(!robotFlying&&!robotWalking&&d>.4&&Math.abs(dx)>.05){robotWalking=true;post({pose:dx>=0?'side':'side2'})}
      if(robotFlying&&now-lastFx>4200){lastFx=now;post({fx:'fly'})}
      if(robotFlying){flyH=2.7;if(hgt>1.7){const stp=Math.min(d,6.4*dt);robotSprite.position.x+=dx/d*stp;robotSprite.position.z+=dz/d*stp}}
      else{const stp=Math.min(d,3*dt);robotSprite.position.x+=dx/d*stp;robotSprite.position.z+=dz/d*stp}}
    else{if(route.length)rT=route.shift();else{flyH=0;if(robotWalking){robotWalking=false;const pp=pendingPose;pendingPose=null;post({pose:pp||'rest'})}if(robotFlying&&hgt<.7&&!fxStopped){fxStopped=true;post({fxStop:true})}if(robotFlying&&hgt<.06){robotFlying=false;const pp=pendingPose;pendingPose=null;post({pose:pp||'rest'})}}}
    hgt+=(flyH-hgt)*Math.min(1,dt*(flyH===0?6.5:3.2));robotSprite.position.y=rBaseY+hgt;rShadow.material.opacity=.4*Math.max(0,1-hgt/4.2)}rShadow.position.set(robotSprite.position.x,.03,robotSprite.position.z);
  robotHit.position.copy(robotSprite.position);robotHit.quaternion.copy(cam.quaternion);robotHit.scale.set(robotSprite.scale.y*rc.width/rc.height*rFig*1.1,robotSprite.scale.y*.98,1);robotHit.updateMatrixWorld();
  const az2=az*ie+(-1.5)*(1-ie),el2b=el*ie+.95*(1-ie),rad2=rad*ie+rad*1.5*(1-ie);
  cam.position.set(tgt.x+rad2*Math.sin(az2)*Math.cos(el2b),tgt.y+rad2*Math.sin(el2b),tgt.z+rad2*Math.cos(az2)*Math.cos(el2b));cam.lookAt(tgt);cam.updateMatrixWorld();
  /* hover preview and readout bar */
  if(hoverF!==null){const hp=posAtF(hoverF),hi=Math.min(n-1,Math.floor(hoverF*n)),hm=M[hi];hx.visible=hOrb.visible=true;hx.scale.y=Math.max(.01,hp.y);hx.position.set(hp.x,hp.y/2,-.3);hOrb.position.copy(hp);
    if(hi!==lastHoverI&&now-lastPointAt>3500&&robotOn){lastHoverI=hi;lastPointAt=now;post({pose:'point'})}rd.box.classList.add('pv');setT(rd.lab,'PREVIEW');setT(rd.m,`${MN[hm[1]-1]} ${hm[0]}`);setT(rd.b,money(balAt(hoverF*n)));setT(rd.c,`${hm[3]>=0?'+':''}${hm[3].toFixed(1)}% in ${MN[hm[1]-1]} ${hm[0]}`);rd.c.className='chg '+(hm[2]<0?'dn':'up');setT(rd.h,'Click to travel here')}
  else{hx.visible=hOrb.visible=false;rd.box.classList.remove('pv');setT(rd.lab,v<n?'NOW':'FINAL');setT(rd.m,`${MN[mo]} ${m[0]}`);setT(rd.b,money(shown));setT(rd.c,`${m[3]>=0?'+':''}${m[3].toFixed(1)}% in ${MN[mo]} ${m[0]}`);rd.c.className='chg '+(m[2]<0?'dn':'up');setT(rd.h,'Hover the chart to preview a month')}
  yl.forEach((e,i)=>{const [x,y]=proj(new THREE.Vector3(-W/2-.2,yOfBal(DEP*MULTS[i]),-2.38));e.style.left=Math.max(4,x-4)+'px';e.style.top=(y-9)+'px'});
  xl.forEach((e,i)=>{const [x,y]=proj(new THREE.Vector3(posAtF(Math.max(.001,YS[i].s/n)).x+.4,0,4.4));e.style.left=x+'px';e.style.top=y+'px';e.style.display=x<-10||x>screenEl.clientWidth+10?'none':''});
  lit.material.emissiveIntensity=th.edgeI+(th.night?Math.sin(now*.004)*.35:0);
  renderer.render(scene,cam);
  if(!ready&&frames>3){ready=true;cardEl.classList.add('ready');setTimeout(loadRobot,mobile?2200:700)}}
requestAnimationFrame(frame);

/* ---- special pass ---- */
(function(){
  const big=$('sb').parentElement,W=120,Hh=34,mx=Math.max.apply(null,cum.concat([DEP])),mn=Math.min.apply(null,cum.concat([DEP]));
  const px=i=>(i/n*W).toFixed(1),py=a=>(Hh-3-(a-mn)/(mx-mn||1)*(Hh-6)).toFixed(1);
  const pts=[[0,DEP]].concat(cum.map((c,i)=>[i+1,c])),d=pts.map((p,i)=>(i?'L':'M')+px(p[0])+' '+py(p[1])).join('');
  big.insertAdjacentHTML('beforeend',`<div class="sparkw"><svg class="spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" class="sp0" pathLength="1"/><path d="${d}" class="sp1" pathLength="1"/></svg><i class="spdot"></i></div>`);
  const p1=big.querySelector('.sp1'),dot=big.querySelector('.spdot');p1.style.strokeDasharray='1 1';p1.style.strokeDashoffset='1';
  const ps=big.querySelector('.sp1');
  const upd=()=>{const f=Math.min(1,v/n);p1.style.strokeDashoffset=String(1-f);const a=rawAt(v),x=f*100,y=(1-((a-mn)/(mx-mn||1))*(Hh-6)/Hh-3/Hh)*100;dot.style.left=x+'%';dot.style.top=y+'%'};
  (function loop(){upd();requestAnimationFrame(loop)})();
  /* gauges */
  const g=(id,html)=>{const el=$(id);if(el)el.insertAdjacentHTML('beforeend',html)};
  g('sWN',`<i class="gz ring" style="--p:${ST.win.toFixed(1)}"></i>`);
  g('sPF',`<i class="gz bar"><u style="width:${Math.min(100,ST.pf/4*100)}%"></u></i>`);
  g('sDD',`<i class="gz bar red"><u style="width:${Math.min(100,ST.dd/40*100)}%"></u></i>`);
  g('sTR',`<i class="gz dots"></i>`);
  /* plain-text summary of the chart (readable, screen-reader friendly) */
  const fine=$('fine');fine.insertAdjacentHTML('beforebegin','<p class="sumline" aria-live="off"></p>');const sum=fine.previousElementSibling;let sl0='';
  setInterval(()=>{const k=Math.max(1,Math.min(n,Math.round(v))),b=balAt(v),x=`After ${k} of ${n} months: ${money(bal0)} became ${money(b)} (${b>=bal0?'+':''}${Math.round((b/bal0-1)*100)}%). Simulated, not a promise.`;if(x!==sl0){sl0=x;sum.textContent=x}},400);
  /* talking host: voice bars wake up while the host speaks */
  const sm2=bub.querySelector('small');sm2.firstElementChild.insertAdjacentHTML('beforeend','<span class="av"><i></i><i></i><i></i><i></i><i></i></span>');
  const av=sm2.querySelector('.av');setInterval(()=>av.classList.toggle('on',performance.now()<talkUntil||speaking),200);
  /* chips with an icon */
  const ic={'Is this real?':'◉','How am I protected?':'⛨','Worst case?':'↘','Best month?':'★','Who are you?':'☺'};
  GX.querySelectorAll('#gx-qs button').forEach(b=>{b.innerHTML=`<em>${ic[b.textContent]||''}</em>${b.textContent}`});
})();
