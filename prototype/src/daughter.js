import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { figureParts } from './figureParts.js';

// A separate view of the daughter's home. The face, phone and both arms are meshes.
export function createDaughterFigure(scene) {
  const { piece, oval, seam, between, tube } = figureParts();
  const clay = color => new THREE.MeshStandardMaterial({ color, roughness:.86 });
  const skin=clay('#ce9577'), blush=clay('#c38b71'), lips=clay('#995940'), pupils=clay('#392c26');
  const hair=clay('#51382f'), strand=clay('#674637'), jacket=clay('#b67154'), hem=clay('#92563f');
  const linen=clay('#f1dfc0'), gold=clay('#d4ad71'), phoneCase=clay('#416653');
  const figure=new THREE.Group();
  scene.add(figure);
  const torso=piece(figure,new THREE.LatheGeometry(
    [[.22,-.06],[.33,.02],[.345,.31],[.337,.52],[.30,.625],[.18,.70],[.115,.71]]
      .map(([x,y])=>new THREE.Vector2(x,y)),28),jacket);
  torso.scale.z=.72;
  oval(figure,skin,0,.736,.018,.11,.145,.10);
  oval(figure,linen,0,.51,.192,.145,.202,.054);
  for(const k of [-1,1]) {
    seam(figure,hem,[[k*.145,.68,.125],[k*.14,.55,.21],[k*.086,.37,.237],[k*.06,.08,.237]],.019);
  }
  for(const y of [.36,.24,.13]) oval(figure,linen,.051,y,.245,.017,.017,.012);

  const head=new THREE.Group();
  head.position.set(0,1.048,.018);
  figure.add(head);
  oval(head,skin,0,0,0,.276,.33,.245);
  oval(head,hair,0,.025,-.145,.31,.337,.191);
  const cap=piece(head,new THREE.SphereGeometry(1,30,16,0,Math.PI*2,0,1.36),hair,0,.046,-.025);
  cap.scale.set(.301,.317,.26);
  const eyes=[],brows=[];
  for(const k of [-1,1]) {
    const bob=oval(head,hair,k*.242,-.021,-.074,.082,.218,.149);
    bob.rotation.z=k*.16;
    const fringe=oval(head,hair,k*(k===1?.137:.098),k===1?.219:.211,.145,k===1?.133:.173,.053,.071);
    fringe.rotation.z=k*(k===1?.38:.32);
    seam(head,strand,[[k*.07,.332,.072],[k*.195,.252,.15],[k*.258,.117,.113],[k*.28,-.042,.061]],.01);
    oval(head,blush,k*.261,-.034,.008,.042,.067,.036);
    oval(head,gold,k*.273,-.082,.033,.018,.020,.014);
    oval(head,skin,k*.134,-.06,.17,.081,.061,.034);
    const eye=new THREE.Group();
    eye.position.set(k*.103,.042,.222); head.add(eye);
    oval(eye,linen,0,0,0,.041,.021,.017);
    const iris=oval(eye,pupils,-.002,0,.014,.020,.019,.011);
    oval(iris,linen,-.29,.34,.86,.21,.21,.21);
    seam(eye,hair,[[-.040,0,.007],[-.009,.018,.013],[.023,.014,.012],[.042,.004,.006]],.004);
    eyes.push({eye,iris});
    const brow=seam(head,hair,[[k*.056,.105,.221],[k*.099,.121,.214],[k*.146,.109,.198]],.009);
    brows.push(brow);
  }
  oval(head,skin,0,-.007,.24,.04,.062,.048);
  const mouth=oval(head,lips,0,-.119,.224,.050,.006,.012);
  seam(head,lips,[[-.058,-.103,.216],[-.025,-.119,.231],[.019,-.121,.231],[.059,-.103,.216]],.005);

  const phone=new THREE.Group();
  phone.name='daughter-handset';
  figure.add(phone);
  piece(phone,new RoundedBoxGeometry(.154,.284,.035,2,.018),phoneCase);
  piece(phone,new RoundedBoxGeometry(.133,.25,.004,2,.012),
    new THREE.MeshBasicMaterial({color:'#d3e0c5'}),0,0,-.019);
  oval(phone,pupils,-.045,.107,.020,.016,.016,.006);
  const arms=[-1,1].map(side=>{
    const shoulder=new THREE.Vector3(side*.275,.568,.04);
    oval(figure,jacket,shoulder.x,shoulder.y,shoulder.z,.115,.114,.108);
    return {side,shoulder,elbow:new THREE.Vector3(),wrist:new THREE.Vector3(),
      upper:piece(figure,tube,jacket),lower:piece(figure,tube,jacket),
      joint:oval(figure,jacket,0,0,0,.089,.092,.089),
      hand:oval(figure,skin,0,0,0,.060,.052,.064),
      finger:oval(figure,skin,0,0,0,.023,.024,.060)};
  });
  const mix=THREE.MathUtils.lerp;
  let lastStage='',since=0,lift=0,nod=0;
  return function pose(state,time,delta,reduced) {
    const stage=state.stage;
    const atEar=['ringing','answered','talking','listening'].includes(stage);
    const down=stage==='delivered'||stage==='dialing';
    const tilt=down?.26:stage==='noticed'?.07:.015;
    const newPose=lastStage!==stage;
    if(newPose) since=time;
    const smooth=!lastStage||reduced?1:1-Math.exp(-delta*8.5);
    lastStage=stage;
    lift=mix(lift,atEar?1:0,smooth);
    nod=mix(nod,tilt,smooth);
    const t=time-since;
    const action=reduced?0:Math.sin(Math.PI*Math.min(1,t/.7));
    const blink=reduced?1:Math.min(1,Math.abs((time+.7)%4.5-.14)/.085);
    const speech=state.speaking&&!reduced
      ? (state.audible?state.level():(t<1.3?.24+.17*Math.sin(13*time):0)):0;
    const breath=reduced?0:Math.sin(time*1.45)*.01;
    figure.rotation.y=-.10+.12*lift;
    head.rotation.set(nod+breath-speech*.045,-.11+.20*lift,stage==='noticed'?-.075:-.025);
    for(const {eye,iris} of eyes) {
      eye.scale.y=.12+.88*blink;
      iris.position.y=down?-.008:0;
    }
    for(const brow of brows) brow.position.y=stage==='noticed'?.034:atEar?.005:0;
    mouth.scale.y=.006+speech*.036+(stage==='noticed'?.007:0);
    phone.position.set(mix(.073,.286,lift),mix(.596,1.045,lift),mix(.36,.087,lift));
    phone.rotation.set(mix(-.22,.06,lift),mix(.18,1.34,lift),mix(-.025,.18,lift));
    for(const arm of arms) {
      const k=arm.side;
      arm.elbow.set(k*.366,.326,.148);
      if(k===1) {
        arm.elbow.x+=lift*.051;arm.elbow.y+=lift*.116;
        arm.wrist.copy(phone.position);arm.wrist.x+=.061;arm.wrist.y-=.08;
      } else {
        const tap=stage==='dialing'?(reduced?1:action):0;
        arm.wrist.set(mix(-.137,-.19,lift)+tap*.12,mix(.491,.26,lift)+tap*.09,mix(.331,.19,lift)+tap*.030);
      }
      between(arm.upper,arm.shoulder,arm.elbow,.098,.10);
      between(arm.lower,arm.elbow,arm.wrist,.080,.083);
      arm.joint.position.copy(arm.elbow);
      arm.hand.position.copy(arm.wrist); arm.hand.position.z+=.018;
      arm.finger.position.copy(arm.wrist);
      arm.finger.position.x-=k*.033; arm.finger.position.y+=.018;
      arm.finger.rotation.y=k*-.94;
    }
  };
}

export function mountDaughter(host, state) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#c9c4aa');
  scene.add(new THREE.HemisphereLight('#fff1dc','#c6a180',2.15));
  const light=new THREE.DirectionalLight('#ffdfb4',2.2);
  light.position.set(-2,3.5,3);scene.add(light);
  const rim=new THREE.DirectionalLight('#fff4db',.85);
  rim.position.set(2,1.9,-2);scene.add(rim);
  const camera=new THREE.OrthographicCamera(-.715,.715,.715,-.715,.1,9);
  camera.position.set(.12,.96,3.4);camera.lookAt(0,.89,.045);
  const pose=createDaughterFigure(scene);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,visible=true,lost=false,last=0,time=0,dirty=true;
  function wake() {
    if(!frame && visible && !lost && !document.hidden) frame=requestAnimationFrame(draw);
  }
  function draw(now) {
    frame=0;
    if(!visible || lost || document.hidden) return;
    if(!dirty && last && now-last<31) {wake();return;}
    const delta=last?Math.min((now-last)/1000,.08):.03;
    last=now;time+=delta;dirty=false;
    pose(state.current,time,delta,motion.matches);
    renderer.render(scene,camera);
    host.dataset.render='ready';
    if(!motion.matches) wake();
  }
  function refresh(){dirty=true;wake();}
  function resize() {
    const side=host.clientWidth;
    if(side) renderer.setSize(side,side,false);
    refresh();
  }
  function onLost(event){event.preventDefault();lost=true;host.dataset.render='fallback';}
  function onRestored(){lost=false;last=0;resize();}
  host.append(renderer.domElement);
  const size=new ResizeObserver(resize);size.observe(host);
  motion.addEventListener('change',refresh);
  document.addEventListener('visibilitychange',refresh);
  renderer.domElement.addEventListener('webglcontextlost',onLost);
  renderer.domElement.addEventListener('webglcontextrestored',onRestored);
  resize();
  return {
    refresh,
    show(on) {visible=on;if(on){last=0;refresh();}else {cancelAnimationFrame(frame);frame=0;}},
    dispose() {
      visible=false;cancelAnimationFrame(frame);size.disconnect();
      motion.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh);
      renderer.domElement.removeEventListener('webglcontextlost',onLost);
      renderer.domElement.removeEventListener('webglcontextrestored',onRestored);
      const geometry=new Set(),materials=new Set();
      scene.traverse(part=>{if(part.geometry) geometry.add(part.geometry);if(part.material) materials.add(part.material);});
      for(const g of geometry) g.dispose();for(const m of materials) m.dispose();
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    },
  };
}
