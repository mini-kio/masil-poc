import * as THREE from 'three';
import { figureParts } from './figureParts.js';

// An original articulated character, in the same scale as the furniture. Local +Z faces forwards.
export function seatGrandmother(parent) {
  const root = new THREE.Group();
  parent.add(root);
  const cloth = color => new THREE.MeshStandardMaterial({ color, roughness: .88 });
  const skin = cloth('#c99575'), warmSkin = cloth('#c48970'), hair = cloth('#aaa99d'), silver = cloth('#d4d2c5');
  const knit = cloth('#87988e'), knitEdge = cloth('#657c72'), blouse = cloth('#f5e7cc');
  const skirt = cloth('#56576a'), shoes = cloth('#9c6358'), sole = cloth('#594741');
  const dark = cloth('#362b2a'), ruby = cloth('#a46759');
  const frame = new THREE.MeshStandardMaterial({color:'#705440',metalness:.38,roughness:.4});
  const { piece, oval, seam, between, tube } = figureParts();

  const trunk=new THREE.Group(); root.add(trunk);
  oval(trunk,skirt,0,.095,.02,.31,.17,.258);
  const sweaterProfile = [[.235,.13],[.295,.18],[.294,.32],[.278,.59],[.25,.70],[.17,.77],[.116,.79]];
  const sweater=piece(trunk,new THREE.LatheGeometry(sweaterProfile.map(p=>new THREE.Vector2(...p)),32),knit);
  sweater.scale.z=.77;
  oval(trunk,skin,0,.81,0,.103,.133,.095);
  oval(trunk,blouse,0,.671,.137,.129,.138,.056);
  for(const sign of [-1,1]){
    seam(trunk,knitEdge,[[sign*.12,.77,.105],[sign*.092,.65,.191],[sign*.018,.52,.22],[sign*.013,.20,.20]],.014);
    seam(trunk,knitEdge,[[sign*.245,.34,.105],[sign*.199,.315,.16],[sign*.134,.317,.193]],.01);
  }
  for(const y of [.49,.39,.29]) oval(trunk,blouse,.018,y,.218,.017,.017,.008);

  const head=new THREE.Group(); head.position.set(0,1.045,.023); trunk.add(head);
  oval(head,skin,0,0,0,.247,.279,.221);
  for(const sign of [-1,1]){
    oval(head,warmSkin,sign*.234,-.014,0,.040,.060,.028);
    oval(head,blouse,sign*.251,-.058,.014,.014,.017,.013);
    oval(head,skin,sign*.116,-.051,.170,.093,.078,.041);
  }
  oval(head,hair,0,.044,-.090,.254,.261,.175);
  const cap=piece(head,new THREE.SphereGeometry(1,32,18,0,Math.PI*2,0,1.38),silver,0,.037,-.018);
  cap.scale.set(.259,.265,.224);
  oval(head,hair,-.016,.103,-.249,.128,.114,.133);
  for(const side of [-1,1]){
    const fringe=oval(head,silver,side*.104,.175,.126,.151,.057,.083);
    fringe.rotation.z=side*.35;
    const temple=oval(head,hair,side*.222,.077,.049,.055,.112,.087);
    temple.rotation.z=side*.10;
    for(let i=0;i<3;i++){
      seam(head,i%2 ? silver : hair,[[side*(.018+i*.019),.268,.064],[side*(.105+i*.018),.228,.132],[side*(.19+i*.012),.142,.14]],.004);
    }
  }
  const eyes=[];
  for(const side of [-1,1]){
    const eye=oval(head,dark,side*.092,.033,.203,.025,.014,.016);
    eyes.push(eye);
    seam(head,hair,[[side*.048,.085,.195],[side*.091,.097,.191],[side*.137,.086,.172]],.009);
    const rim=piece(head,new THREE.TorusGeometry(.068,.008,7,32),frame,side*.096,.036,.226);
    rim.scale.set(1.12,.83,1);
    seam(head,frame,[[side*.168,.045,.212],[side*.205,.055,.143],[side*.244,.048,.012]],.0065);
    seam(head,warmSkin,[[side*.139,-.003,.181],[side*.165,-.01,.165],[side*.184,-.004,.148]],.0033);
    seam(head,warmSkin,[[side*.055,-.050,.208],[side*.077,-.076,.203],[side*.081,-.099,.187]],.0035);
  }
  seam(head,frame,[[-.025,.046,.228],[0,.055,.244],[.025,.046,.228]],.0068);
  oval(head,skin,0,-.008,.224,.040,.052,.049);
  const mouth=oval(head,dark,0,-.101,.206,.044,.005,.008);
  seam(head,ruby,[[-.047,-.092,.202],[0,-.107,.211],[.047,-.092,.202]],.0045);

  const handset=piece(trunk,new THREE.BoxGeometry(.083,.152,.031),dark);
  const handsetBack=piece(handset,new THREE.BoxGeometry(.061,.123,.004),knitEdge,0,0,-.017);
  handsetBack.castShadow=false;
  const callLight=piece(handset,new THREE.CircleGeometry(.02,14),new THREE.MeshBasicMaterial({color:'#f4d583'}),0,.035,.017);
  callLight.visible=false;
  const arms=[];
  for(const side of [-1,1]){
    const shoulder = new THREE.Vector3(side*.242,.646,.014);
    const upper=piece(trunk,tube,knit), lower=piece(trunk,tube,knit);
    oval(trunk,knit,shoulder.x,shoulder.y,shoulder.z,.097,.10,.091);
    const elbowCap=oval(trunk,knit,0,0,0,.086,.089,.083);
    const hand=oval(trunk,skin,0,0,0,.071,.050,.087);
    const thumb=oval(trunk,skin,0,0,0,.029,.034,.047);
    const cuff=piece(trunk,tube,knitEdge);
    arms.push({side,shoulder,upper,lower,elbowCap,hand,thumb,cuff,
      elbow:new THREE.Vector3(),wrist:new THREE.Vector3(),cuffEnd:new THREE.Vector3()});
  }
  const legs=[];
  for(const side of [-1,1]){
    const hip=new THREE.Vector3(side*.142,.10,.024);
    const thigh=piece(root,tube,skirt),shin=piece(root,tube,skirt);
    const kneecap=oval(root,skirt,0,0,0,.105,.103,.11);
    const foot=oval(root,shoes,0,0,0,.11,.061,.174);
    const outsole=oval(root,sole,0,0,0,.109,.024,.17);
    legs.push({side,hip,thigh,shin,kneecap,foot,outsole,knee:new THREE.Vector3(),ankle:new THREE.Vector3()});
  }

  const route=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.05,0,-1.59),new THREE.Vector3(-2.96,0,-.83),
    new THREE.Vector3(-.75,0,-.72),new THREE.Vector3(1.5,0,-1.03),new THREE.Vector3(3.10,0,-1.48),
  ]);
  const returnRoute=new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.88,0,-1.42),new THREE.Vector3(2.33,0,-.75),
    new THREE.Vector3(1.83,0,-.48),new THREE.Vector3(1.34,0,.035),
  ]);
  const position=new THREE.Vector3();
  const s=THREE.MathUtils.smoothstep, mix=THREE.MathUtils.lerp;
  let previousLine='', since=0, lifted=0;
  return {
    head, handset,
    update(phase, time, quiet, performance) {
      const walk=s(phase,4.32,5.02), toRice=s(phase,5.38,6.0), homeward=s(phase,6.38,7.05);
      const stand=s(phase,4.18,4.50)*(1-s(phase,6.88,7.19));
      route.getPoint(walk,position);
      position.x -= toRice*1.22;
      position.z += toRice*.06;
      if(homeward>0) returnRoute.getPoint(homeward,position);
      const moving=Math.sin(Math.PI*walk) + Math.sin(Math.PI*homeward)+Math.sin(Math.PI*toRice)*.45;
      const stride=quiet?0:Math.sin((walk*4.6+homeward*2.1+toRice*1.1)*Math.PI*2)*moving;
      const base=mix(.797,.55,s(phase,6.89,7.18));
      const pelvis=mix(base,.90,stand)+Math.abs(stride)*.024;
      root.position.set(position.x,pelvis,position.z);
      root.rotation.y=.27-1.48*walk+1.57*homeward;
      if(performance.line!==previousLine){previousLine=performance.line;since=time;}
      const speaking=performance.speaker==='할머니';
      const vocal=performance.audio ? performance.level() : (time-since<1.35 ? .28+.15*Math.sin(time*14) : 0);
      const talk=quiet||!speaking?0:vocal;
      const nod=quiet?0:Math.sin(time*2.3)*.023;
      trunk.rotation.x=.035+nod*.40+stand*.035;
      head.rotation.set(.042+nod-talk*.045, .06+.13*Math.sin(phase*1.2)+(quiet?0:Math.sin(time*.61)*.027),-.016+nod*.33);
      mouth.scale.y=.004+talk*.035;
      const blink=quiet?1:Math.min(1,Math.abs((time+.8)%4.6-.13)/.075);
      for(const eye of eyes)eye.scale.y=.014*(.08+.92*blink);
      for(const leg of legs){
        const k=leg.side;
        leg.knee.set(k*.144,mix(-.021,-.307,stand),mix(.44,.067,stand)+stride*k*.12);
        leg.ankle.set(k*.151,.163-pelvis+Math.max(0,stride*k)*.065,mix(.41,.025,stand)+stride*k*.18);
        between(leg.thigh,leg.hip,leg.knee,.118,.122);
        between(leg.shin,leg.knee,leg.ankle,.089,.095);
        leg.kneecap.position.copy(leg.knee);
        leg.foot.position.copy(leg.ankle); leg.foot.position.z+=.059;
        leg.outsole.position.copy(leg.foot.position); leg.outsole.position.y-=.043;
      }
      const calling=performance.onCall ? 1 : performance.ringing ? .26 : 0;
      callLight.visible=Boolean(performance.ringing);
      lifted += (calling-lifted)*(quiet ? 1 : .19);
      handset.visible=lifted>.03;
      for(const arm of arms){
        const k=arm.side, gesture=k===1&&!quiet ? talk*.20 : 0;
        arm.elbow.set(k*mix(.28,.29,stand),mix(.39,.38,stand)+gesture*.24,.10+stand*.025);
        arm.wrist.set(k*mix(.14,.26,stand),mix(.29,.18,stand)+gesture,mix(.36,.14,stand)+gesture*.35-stride*k*.06);
        if(k===1 && lifted>.001){
          arm.elbow.x+=lifted*.135;
          arm.elbow.y+=lifted*.105;
          arm.wrist.x=mix(arm.wrist.x,.249,lifted);
          arm.wrist.y=mix(arm.wrist.y,1.016,lifted);
          arm.wrist.z=mix(arm.wrist.z,.072,lifted);
          handset.position.copy(arm.wrist);
          handset.position.y+=.038;
          const buzz=performance.ringing && !quiet ? .035*Math.sin(time*37) : 0;
          handset.rotation.set(-.11,mix(.14,1.22,lifted),.22+buzz);
        }
        between(arm.upper,arm.shoulder,arm.elbow,.088,.087);
        between(arm.lower,arm.elbow,arm.wrist,.072,.079);
        arm.elbowCap.position.copy(arm.elbow);
        arm.cuffEnd.copy(arm.wrist).lerp(arm.elbow,.16);
        between(arm.cuff,arm.cuffEnd,arm.wrist,.076,.080);
        arm.hand.position.copy(arm.wrist);arm.hand.position.z+=.045;
        arm.thumb.position.copy(arm.hand.position);arm.thumb.position.x-=k*.053;arm.thumb.position.z+=.020;
      }
    }
  };
}
