import * as THREE from 'three';
import { seatGrandmother } from './grandmother.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const shots = [
  { aim: [0, .40, -.1], yaw: .70, elevation: .68, zoom: 1.03, sun: '#ffe8be', sky: '#fff4dd', power: 2.25 },
  { aim: [-2.84, 1.26, -.96], yaw: .23, elevation: .32, zoom: 2.53, sun: '#ffd18c', sky: '#fff0cc', power: 2.55 },
  { aim: [-2.82, 1.34, -1.13], yaw: .10, elevation: .22, zoom: 2.92, sun: '#ffdaaa', sky: '#fff1d4', power: 2.38 },
  { aim: [-2.51, 1.10, -.73], yaw: .41, elevation: .37, zoom: 2.47, sun: '#ffe1bd', sky: '#d6dfd4', power: 1.95 },
  { aim: [-2.95, 1.42, -1.45], yaw: .16, elevation: .23, zoom: 3.08, sun: '#ffdbad', sky: '#f2e6d0', power: 2.18 },
  { aim: [2.60, 1.37, -2.02], yaw: -.40, elevation: .36, zoom: 2.60, sun: '#c4e7ed', sky: '#d0e4e3', power: 1.85 },
  { aim: [1.47, 1.40, -2.05], yaw: -.13, elevation: .28, zoom: 2.81, sun: '#f2ddbf', sky: '#e0e4cf', power: 1.92 },
  { aim: [.86, 1.10, .70], yaw: -.23, elevation: .36, zoom: 2.53, sun: '#ffb78c', sky: '#ded0d0', power: 1.48 },
  { aim: [.90, 1.24, .58], yaw: .25, elevation: .27, zoom: 2.85, sun: '#ffa478', sky: '#cebdd5', power: 1.18 },
].map(shot => ({ ...shot, aim: new THREE.Vector3(...shot.aim), sun: new THREE.Color(shot.sun), sky: new THREE.Color(shot.sky) }));

function surface(color, roughness = .82) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function getTabletTexture(brand) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 460;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fcf8ed';
  ctx.fillRect(0, 0, 320, 460);
  ctx.fillStyle = '#30382c';
  ctx.font = 'bold 45px sans-serif';
  ctx.fillText(brand, 28, 80);
  ctx.fillStyle = '#e6ead8';
  ctx.fillRect(28, 109, 264, 121);
  ctx.fillStyle = '#60745b';
  ctx.fillRect(48, 146, 103, 9);
  ctx.fillRect(48, 179, 185, 8);
  ctx.fillStyle = '#ccb39a';
  ctx.fillRect(28, 254, 264, 99);
  ctx.fillStyle = '#f9f5e6';
  ctx.fillRect(48, 286, 122, 8);
  ctx.fillRect(48, 313, 178, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildRoom(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const mat = {
    wall: surface('#f3e7ce'), base: surface('#9e7654'), walnut: surface('#9b6845'),
    wood: surface('#d3a77d'), cushion: surface('#d98d72'), cream: surface('#f7efdb'),
    sage: surface('#839671'), dark: surface('#3d493a'), stone: surface('#ebe2cd'),
    metal: surface('#6b675e', .38), green: surface('#4f6c48'), leaf: surface('#7c9858'),
    glass: surface('#b4c1aa'), book: surface('#b16d49'), rug: surface('#d9c6a3'),
    burner: surface('#55534d'), line: surface('#95806a'),
  };
  const mesh = (geometry, material, x, y, z, parent = group) => {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  };
  const box = (x, y, z, w, h, d, material, rounding = 0, parent = group) => {
    const geo = rounding ? new RoundedBoxGeometry(w, h, d, 2, rounding) : new THREE.BoxGeometry(w, h, d);
    return mesh(geo, material, x, y, z, parent);
  };
  const cylinder = (x, y, z, top, bottom, height, material, parent = group) =>
    mesh(new THREE.CylinderGeometry(top, bottom, height, 32), material, x, y, z, parent);

  box(0, -.32, 0, 10.2, .55, 7.7, mat.base, .14);
  box(0, .005, 0, 9.97, .12, 7.45, mat.wood, .05);
  const boards = ['#d2a981', '#cd9f77', '#dbb48d', '#d5ad86', '#dbb38c'].map(color => surface(color));
  for (let i = 0; i < 13; i++) {
    box(-4.6 + i * .765, .071, 0, .744, .025, 7.35, boards[i % boards.length]);
  }

  // Partial walls let the camera keep both the living room and the kitchen in view.
  box(0, .26, -3.67, 10, .42, .18, mat.wall);
  box(-4.93, .83, -.93, .17, 1.59, 5.44, mat.wall);
  box(-3.87, 1.2, -3.67, 2.24, 2.25, .16, mat.wall);
  box(-.43, 1.2, -3.67, 1.64, 2.25, .16, mat.wall);
  box(-2.16, 2.24, -3.67, 1.47, .17, .16, mat.wall);
  box(-2.16, 1.28, -3.67, 1.53, 1.55, .08, mat.glass);
  for (const x of [-2.94, -2.16, -1.38]) box(x, 1.3, -3.6, .067, 1.66, .08, mat.cream);
  for (const y of [.5, 1.32, 2.11]) box(-2.16, y, -3.6, 1.58, .061, .08, mat.cream);
  box(2.55, .77, -3.66, 4.86, 1.4, .17, mat.wall);

  box(-2.15, .102, .66, 4.47, .047, 3.57, mat.rug, .03);
  const stripe = surface('#c5a783');
  for (const x of [-4.13, -.17]) box(x, .129, .66, .045, .01, 3.29, stripe);
  for (const z of [-.93, 2.24]) box(-2.15, .129, z, 4.04, .01, .044, stripe);
  box(-2.79, .39, -1.68, 3.57, .47, 1.34, mat.cushion, .12);
  box(-2.79, .99, -2.2, 3.53, .84, .39, mat.cushion, .14);
  for (const x of [-4.42, -1.16]) box(x, .78, -1.66, .33, .68, 1.25, mat.cushion, .12);
  for (const x of [-3.53, -2.03]) box(x, .69, -1.62, 1.45, .21, .83, mat.cushion, .08);
  const pillow = box(-3.92, .95, -1.92, .52, .49, .22, mat.cream, .09);
  pillow.rotation.z = -.25;
  const pillow2 = box(-1.6, .94, -1.94, .54, .47, .24, mat.sage, .1);
  pillow2.rotation.z = .25;
  box(-2.56, .55, .7, 1.77, .15, 1.06, mat.walnut, .08);
  for (const x of [-3.21, -1.94]) for (const z of [.34, 1.06]) box(x, .31, z, .115, .45, .11, mat.walnut, .023);
  box(-2.92, .655, .57, .44, .06, .32, mat.book, .019);
  cylinder(-2.13, .72, .71, .075, .065, .197, mat.cream);
  const saucer = cylinder(-2.13, .633, .71, .137, .11, .039, mat.cream);
  saucer.castShadow = false;

  const speaker = cylinder(-2.44, .809, 1.02, .21, .21, .35, mat.dark);
  speaker.rotation.y = .2;
  const speakerGlow = new THREE.MeshStandardMaterial({ color: '#dec398', emissive: '#dca57a', emissiveIntensity: .65 });
  cylinder(-2.44, .992, 1.02, .205, .205, .037, speakerGlow);

  // Kitchen cabinets and the kettle are separate landmarks for the sound scene.
  for (const x of [.71, 1.72, 2.73, 3.74, 4.65]) {
    box(x, .52, -2.82, .96, .87, 1.39, mat.sage, .039);
    box(x, .51, -2.104, .88, .72, .045, mat.sage, .028);
    box(x, .735, -2.059, .25, .045, .072, mat.dark, .019);
  }
  box(2.63, 1.015, -2.82, 4.93, .14, 1.48, mat.stone, .059);
  box(2.28, 1.102, -2.76, 1.05, .037, .98, mat.burner, .035);
  for (const x of [2.05, 2.52]) for (const z of [-3, -2.58]) cylinder(x, 1.133, z, .163, .18, .026, mat.metal);
  const kettleBody = mesh(new THREE.SphereGeometry(.29, 32, 20), mat.cream, 2.52, 1.36, -2.58);
  kettleBody.scale.set(1.08, .95, 1.03);
  cylinder(2.52, 1.62, -2.58, .225, .234, .055, mat.metal);
  cylinder(2.52, 1.684, -2.58, .066, .066, .074, mat.dark);
  const spout = cylinder(2.83, 1.45, -2.56, .048, .089, .35, mat.cream);
  spout.rotation.z = -.71;
  const handle = mesh(new THREE.TorusGeometry(.235, .046, 9, 24, Math.PI), mat.dark, 2.52, 1.62, -2.58);
  handle.rotation.y = .48;
  box(4.12, 1.097, -2.78, .94, .033, .81, mat.metal, .071);
  box(4.12, 1.12, -2.78, .646, .021, .57, mat.burner, .055);
  cylinder(4.12, 1.31, -3.16, .044, .052, .41, mat.metal);
  const faucet = cylinder(4.12, 1.5, -3.003, .038, .039, .33, mat.metal);
  faucet.rotation.x = Math.PI / 2;
  box(2.52, .106, -1.45, 3.19, .033, .71, mat.stone, .03);

  // Table shared with the family view. The screen artwork is generated locally.
  box(.77, .865, 1.06, 2.42, .16, 1.42, mat.wood, .055);
  for (const x of [-.18, 1.7]) for (const z of [.53, 1.58]) box(x, .46, z, .116, .77, .113, mat.walnut, .028);
  const phone = new THREE.Group();
  group.add(phone);
  phone.position.set(.37, .955, 1.29);
  phone.rotation.y = .28;
  box(0, .323, 0, .53, .65, .105, mat.dark, .047, phone);
  const phoneDisplay = new THREE.MeshBasicMaterial({ map: getTabletTexture('마실') });
  mesh(new THREE.PlaneGeometry(.445, .55), phoneDisplay, 0, .322, .057, phone);
  for (const z of [2.02, .03]) {
    box(1.34, .476, z, .58, .12, .56, mat.cream, .055);
    for (const x of [1.11, 1.57]) for (const zz of [z - .19, z + .19]) box(x, .278, zz, .064, .37, .065, mat.walnut, .017);
  }

  const pot = surface('#b56c4d');
  cylinder(4.13, .278, 2.59, .37, .28, .42, pot);
  cylinder(4.13, .505, 2.59, .347, .347, .035, mat.base);
  for (let i = 0; i < 9; i++) {
    const theta = i * 2.4;
    const stem = cylinder(4.13 + Math.cos(theta) * .12, .83, 2.59 + Math.sin(theta) * .13, .02, .024, .65, mat.green);
    stem.rotation.z = Math.sin(theta) * .28;
    const leaf = mesh(new THREE.SphereGeometry(.19, 13, 10), i % 2 ? mat.leaf : mat.green,
      4.13 + Math.cos(theta) * (.19 + i % 3 * .06), 1.1 + i % 3 * .12, 2.59 + Math.sin(theta) * .21);
    leaf.scale.set(.65, 1.72, .33);
    leaf.rotation.set(.45, theta, -.63);
  }
  const pulses = [0, 1, 2].map(() => {
    const material = new THREE.MeshBasicMaterial({ color: '#f4d398', transparent: true, opacity: .4, depthWrite: false });
    const ring = mesh(new THREE.RingGeometry(.37, .386, 44), material, -2.44, 1.02, 1.02);
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = false;
    return ring;
  });
  const steam = [0, 1, 2].map((i) => {
    const material = new THREE.MeshBasicMaterial({ color: '#fff8e9', transparent: true, opacity: .6, depthWrite: false });
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(.066, .18, -.03),
      new THREE.Vector3(-.045, .39, .055), new THREE.Vector3(.07, .62, 0),
    ]);
    const p = mesh(new THREE.TubeGeometry(curve, 18, .016 + i * .002, 6, false), material, 2.95, 1.59, -2.57);
    p.castShadow = false;
    return p;
  });
  const lampShade = new THREE.MeshStandardMaterial({ color: '#ebd5a5', emissive: '#ffaa51', emissiveIntensity: .1, roughness: .8 });
  cylinder(1.65, .98, .68, .19, .22, .055, mat.walnut);
  cylinder(1.65, 1.23, .68, .033, .044, .50, mat.metal);
  cylinder(1.65, 1.51, .68, .14, .28, .30, lampShade);
  const lampLight = new THREE.PointLight('#ffc07e', 0, 6, 2);
  lampLight.position.set(1.65, 1.46, .72);
  scene.add(lampLight);

  box(-3.9, 1.68, -3.54, .72, .79, .08, mat.walnut, .025);
  box(-3.9, 1.68, -3.485, .61, .68, .03, mat.cream);
  const print = mesh(new THREE.CircleGeometry(.145, 28), mat.book, -3.94, 1.77, -3.46);
  print.castShadow = false;
  box(-3.89, 1.51, -3.457, .43, .05, .024, mat.sage);
  box(1.03, 1.49, -3.49, 1.48, .095, .37, mat.walnut, .02);
  for (const [x, height, material] of [[.55,.20,mat.cream],[.82,.27,mat.book],[1.17,.21,mat.cream],[1.44,.3,mat.sage]]) {
    cylinder(x, 1.56 + height / 2, -3.44, .09, .10, height, material);
    cylinder(x, 1.56 + height, -3.44, .10, .10, .036, mat.walnut);
  }
  cylinder(.48,1.165,-2.32,.154,.164,.16,mat.dark);
  cylinder(.48,1.253,-2.32,.151,.151,.021,speakerGlow);
  const riceBag = new THREE.Group();
  group.add(riceBag);
  riceBag.position.set(1.05, 1.09, -2.64);
  riceBag.rotation.y = .16;
  box(0,.30,0,.57,.60,.37,mat.cream,.075,riceBag);
  box(0,.62,-.01,.57,.09,.20,mat.walnut,.025,riceBag);
  const riceLabel = document.createElement('canvas');
  riceLabel.width = 192; riceLabel.height = 128;
  const labelContext = riceLabel.getContext('2d');
  labelContext.fillStyle = '#46634c'; labelContext.fillRect(0,0,192,128);
  labelContext.fillStyle = '#fff3d5'; labelContext.font = 'bold 72px sans-serif'; labelContext.textAlign = 'center';
  labelContext.fillText('쌀',96,89);
  const labelTexture = new THREE.CanvasTexture(riceLabel);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(.37,.24),new THREE.MeshBasicMaterial({map:labelTexture}),0,.33,.193,riceBag);
  const sunshine = new THREE.Group();
  group.add(sunshine);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: '#ffe39b', transparent: true, opacity: .10, depthWrite: false });
  for (const x of [-2.5,-1.78]) {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(.64, 2.40), sunMaterial);
    patch.rotation.set(-Math.PI/2, 0, -.35);
    patch.position.set(x, .135, -.05);
    sunshine.add(patch);
  }
  const path = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-2.44, 1.02, 1.02), new THREE.Vector3(-1.46, 2.56, 1.34), new THREE.Vector3(.37, 1.54, 1.3),
  );
  const trailMat = new THREE.LineDashedMaterial({ color: '#ffdc9e', dashSize: .09, gapSize: .075, transparent: true, depthWrite: false });
  const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.getPoints(48)), trailMat);
  trail.computeLineDistances();
  group.add(trail);
  const packet = mesh(new THREE.SphereGeometry(.047, 12, 8), new THREE.MeshBasicMaterial({color:'#fff1bd'}), 0,0,0);
  packet.castShadow = false;
  const soundRings = [0,1].map(() => {
    const material = new THREE.MeshBasicMaterial({color:'#ffc378',transparent:true,depthWrite:false});
    const ring = mesh(new THREE.RingGeometry(.45,.48,48),material,-1.85,.147,.1);
    ring.rotation.x = -Math.PI/2; ring.castShadow=false;
    return ring;
  });
  const grandma = seatGrandmother(group);
  return { grandma, pulses, steam, speakerGlow, lampShade, lampLight, sunshine, sunMaterial, trail, packet, path, soundRings };
}

export function mountRoom(host, options = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.36;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const sky = new THREE.HemisphereLight('#fff3d8', '#81725f', 1.95);
  scene.add(sky);
  const light = new THREE.DirectionalLight('#fff1d0', 2.4);
  light.position.set(-3.5, 8.5, 4.1);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7, near: .6, far: 25 });
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.normalBias = .026;
  scene.add(light);
  const fill = new THREE.DirectionalLight('#dfedfc', .7);
  fill.position.set(8, 2.5, -5);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .23 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.605;
  floor.receiveShadow = true;
  scene.add(floor);
  const props = buildRoom(scene);

  const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, .1, 100);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const look = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  const aimPointer = new THREE.Vector2();
  const pinPositions = [new THREE.Vector3(-2.44,1.04,1.02), new THREE.Vector3(2.55,1.80,-2.58), new THREE.Vector3(.37,1.68,1.29)];
  const projected = new THREE.Vector3();
  const face = new THREE.Vector3();
  const kitchenSpeaker = new THREE.Vector3(.48,1.28,-2.32);
  const impactSpot = new THREE.Vector3(-1.85,.19,.10);
  let goal = options.initialProgress ?? 0;
  let progress = goal;
  let listening = false;
  let impact = false;
  let visible = true;
  let lost = false;
  let frame = 0;
  let time = 0;
  let last = 0;
  let shadowPhase = -1;
  renderer.shadowMap.autoUpdate = false;
  const clamp = THREE.MathUtils.clamp;
  const mix = THREE.MathUtils.lerp;

  function draw(now) {
    frame = 0;
    if (!visible || lost || document.hidden) return;
    if (!motion.matches && last && now - last < 1000/32 - 1) { wake(); return; }
    const dt = last ? Math.min((now - last) / 1000, .075) : .03;
    last = now;
    const ease = motion.matches ? 1 : 1 - Math.exp(-10 * dt);
    progress += (goal - progress) * ease;
    const phase = motion.matches ? Math.round(progress) : progress;
    const index = Math.min(shots.length - 2, Math.floor(phase));
    const a = shots[index], b = shots[index + 1];
    const blend = THREE.MathUtils.smoothstep(phase - index, .08, .96);
    if (motion.matches) pointer.set(0,0);
    else pointer.lerp(aimPointer, ease);
    look.lerpVectors(a.aim, b.aim, blend);
    const arc = Math.sin(Math.PI * blend);
    const yaw = mix(a.yaw,b.yaw,blend) + arc * .17 + pointer.x * .105;
    const angle = mix(a.elevation,b.elevation,blend) + arc * .055 - pointer.y * .046;
    const flat = 15 * Math.cos(angle);
    camera.position.set(look.x + Math.sin(yaw)*flat, look.y + 15*Math.sin(angle), look.z+Math.cos(yaw)*flat);
    camera.lookAt(look);
    const portraitZoom = host.clientWidth < 520 ? 1 + .18 * Math.min(1,phase) : 1;
    camera.zoom = (mix(a.zoom,b.zoom,blend) - arc * .15) * portraitZoom;
    camera.updateProjectionMatrix();
    sky.color.lerpColors(a.sky,b.sky,blend);
    light.color.lerpColors(a.sun,b.sun,blend);
    light.intensity = mix(a.power,b.power,blend);
    const evening = THREE.MathUtils.smoothstep(phase,6.15,7.7);
    sky.intensity = 1.95 - evening*.59;
    light.position.set(-4.2+phase*.68,8.6-evening*4.1,4.4-phase*.3);
    props.lampShade.emissiveIntensity = .12 + evening * 1.85;
    props.lampLight.intensity = evening * 4.1;
    props.sunshine.position.x = phase * .085;
    props.sunMaterial.opacity = .16*(1-evening);
    if (Math.abs(shadowPhase-phase) > .015) { shadowPhase=phase; renderer.shadowMap.needsUpdate=true; }
    time += dt;
    props.speakerGlow.emissiveIntensity = listening ? 1.25 + Math.sin(time*8)*.32 : .55;
    props.pulses.forEach((ring, i) => {
      const cycle = motion.matches ? .24 + i * .23 : (time * (listening ? .88 : .40) + i / 3) % 1;
      ring.visible = phase < 4.55;
      ring.scale.setScalar(.71 + cycle * (listening ? 2.5 : 1.67));
      ring.material.opacity = (listening ? .85 : .49) * (1 - cycle);
    });
    props.steam.forEach((p, i) => {
      const v = motion.matches ? .23 * i : (time * (listening ? .48 : .29) + i / 3) % 1;
      p.visible = phase > 4.30 && phase < 6.05;
      p.position.set(2.94+Math.sin(i+v*3)*.085,1.53+v*.38,-2.56+v*.095);
      p.scale.setScalar(.60+v*.72);
      p.material.opacity = Math.sin(v*Math.PI)*.61;
    });
    props.soundRings.forEach((ring,i) => {
      const cycle = motion.matches ? .30 + i*.25 : (time*.8 + i*.5)%1;
      ring.visible = impact && phase > 2.5 && phase < 3.65;
      ring.scale.setScalar(1 + cycle*3);
      ring.material.opacity = .75*(1-cycle);
    });
    props.trail.visible = props.packet.visible = evening > .17;
    props.trail.material.opacity = .61*evening;
    if (props.packet.visible) props.path.getPoint(motion.matches ? .72 : (time*.48)%1, props.packet.position);
    const actor = options.actor.current;
    props.grandma.update(phase,time,motion.matches,actor);
    renderer.render(scene, camera);
    const bubble = options.bubble.current;
    if (bubble && !bubble.hidden) {
      if (actor.speaker === '할머니') props.grandma.head.localToWorld(projected.set(0,.08,.23));
      else if (actor.speaker === '생활 소리') projected.copy(actor.place === 2 ? pinPositions[1] : impactSpot);
      else projected.copy(actor.place === 3 ? pinPositions[2] : actor.place === 2 ? kitchenSpeaker : pinPositions[0]);
      projected.project(camera);
      const width = host.clientWidth, height = host.clientHeight;
      const x = (.5 + projected.x*.5)*width, y = (.5-projected.y*.5)*height;
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
      const left = clamp(x - bw * (actor.speaker === '할머니' ? .75 : .27),7,Math.max(7,width-bw-7));
      props.grandma.head.localToWorld(face.set(0,.08,.18)).project(camera);
      const faceX = (.5+face.x*.5)*width, faceY = (.5-face.y*.5)*height;
      const radius = height*.32*camera.zoom/(camera.top-camera.bottom);
      const maxTop = Math.max(4,height-bh-10);
      let top = clamp(y-bh-Math.max(22,radius+7),4,maxTop);
      const coversFace = left<faceX+radius && left+bw>faceX-radius && top<faceY+radius && top+bh>faceY-radius;
      const below = actor.speaker!=='할머니' && coversFace && y+bh+13 <= height;
      if (below) top=clamp(y+13,4,maxTop);
      else if (coversFace) top=clamp(faceY-radius-bh-8,4,maxTop);
      bubble.dataset.tail = below ? 'top' : 'bottom';
      bubble.style.transform = 'translate('+Math.round(left)+'px,'+Math.round(top)+'px)';
      bubble.style.setProperty('--beak',clamp(x-left,18,bw-18).toFixed(1)+'px');
    }
    if (phase < .9 && options.pins) {
      pinPositions.forEach((world, i) => {
        const el = options.pins[i];
        if (!el || el.hidden) return;
        projected.copy(world).project(camera);
        el.style.left = (projected.x*.5 + .5)*100+'%';
        el.style.top = (.5 - projected.y*.5)*100+'%';
      });
    }
    if (!motion.matches) wake();
  }

  function wake() {
    if (!frame && visible && !lost && !document.hidden) frame = requestAnimationFrame(draw);
  }

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    const ratio = width / height;
    const extent = Math.max(4.45, 6.98 / ratio);
    camera.left = -extent * ratio;
    camera.right = extent * ratio;
    camera.top = extent;
    camera.bottom = -extent;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    wake();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    last = 0;
    if (visible) wake();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { rootMargin: '120px' });
  visibility.observe(host);
  motion.addEventListener('change', wake);
  const onPointer = event => {
    if (motion.matches || !finePointer.matches) return;
    const rect = host.getBoundingClientRect();
    aimPointer.set(clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),clamp((event.clientY-rect.top)/rect.height*2-1,-1,1));
    wake();
  };
  const onLeave = () => { aimPointer.set(0,0); wake(); };
  const onPage = () => { last=0; if (!document.hidden) wake(); };
  const contextLost = event => { event.preventDefault(); lost=true; options.onLost?.(); };
  const contextRestored = () => { lost=false; shadowPhase=-1; options.onRestored?.(); resize(); };
  host.addEventListener('pointermove',onPointer,{passive:true});
  host.addEventListener('pointerleave',onLeave);
  document.addEventListener('visibilitychange',onPage);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  resize();

  return {
    setProgress(value) {
      goal = clamp(value, 0, shots.length - 1);
      wake();
    },
    refresh() { wake(); },
    listening(value) { listening = value; wake(); },
    impact(value) { impact = value; wake(); },
    dispose() {
      visible = false;
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resizeObserver.disconnect();
      motion.removeEventListener('change', wake);
      host.removeEventListener('pointermove',onPointer);
      host.removeEventListener('pointerleave',onLeave);
      document.removeEventListener('visibilitychange',onPage);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) {
          object.material.map?.dispose();
          object.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
