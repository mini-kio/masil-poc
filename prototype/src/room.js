import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const views = {
  home: { eye: [9.6, 9.2, 10.9], look: [0, .2, -.2], zoom: 1 },
  morning: { eye: [6.5, 6.2, 8.1], look: [-2.1, .48, .55], zoom: 1.45 },
  kitchen: { eye: [8.8, 6.8, 6.1], look: [2.4, .55, -.7], zoom: 1.48 },
  family: { eye: [5.6, 5.8, 8.8], look: [-.5, .4, 1.7], zoom: 1.46 },
};

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
  phone.rotation.y = -.32;
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
  const steam = [0, 1, 2, 3].map(() => {
    const material = new THREE.MeshBasicMaterial({ color: '#f6f3e4', transparent: true, opacity: .6, depthWrite: false });
    const p = mesh(new THREE.SphereGeometry(.038, 12, 8), material, 2.95, 1.59, -2.57);
    p.castShadow = false;
    return p;
  });
  return { pulses, steam };
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
  scene.add(new THREE.HemisphereLight('#fff3d8', '#85765d', 2.1));
  const light = new THREE.DirectionalLight('#fff1d0', 2.4);
  light.position.set(-3.5, 8.5, 4.1);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7, near: .6, far: 25 });
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
  const { pulses, steam } = buildRoom(scene);

  const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, .1, 100);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const look = new THREE.Vector3(...views.home.look);
  const eyeGoal = new THREE.Vector3(...views.home.eye);
  const lookGoal = new THREE.Vector3(...views.home.look);
  let activeView = 'home';
  let visible = true;
  let frame = 0;
  let time = 0;
  let last = 0;
  camera.position.copy(eyeGoal);

  function draw(now) {
    frame = 0;
    if (!visible) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : .016;
    last = now;
    const ease = motion.matches ? 1 : 1 - Math.exp(-4.3 * dt);
    camera.position.lerp(eyeGoal, ease);
    look.lerp(lookGoal, ease);
    camera.lookAt(look);
    camera.zoom += (views[activeView].zoom - camera.zoom) * ease;
    camera.updateProjectionMatrix();
    time += dt;
    pulses.forEach((ring, i) => {
      const cycle = motion.matches ? .3 + i * .22 : (time * .62 + i / 3) % 1;
      ring.visible = activeView === 'morning' || activeView === 'home';
      ring.scale.setScalar(.72 + cycle * 1.6);
      ring.material.opacity = .57 * (1 - cycle);
    });
    steam.forEach((p, i) => {
      const v = motion.matches ? .18 * (i + 1) : (time * .55 + i / 4) % 1;
      p.visible = activeView === 'kitchen';
      p.position.set(2.96 + Math.sin(i + v * 3) * .11, 1.61 + v * .69, -2.55 + v * .13);
      p.scale.setScalar(1 + v);
      p.material.opacity = .65 * (1 - v);
    });
    renderer.render(scene, camera);
    if (!motion.matches) wake();
  }

  function wake() {
    if (!frame && visible) frame = requestAnimationFrame(draw);
  }

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    const ratio = width / height;
    const extent = Math.max(5.05, 6.25 / ratio);
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
  const contextLost = (event) => { event.preventDefault(); options.onLost?.(); };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  resize();

  return {
    view(key) {
      const preset = views[key];
      if (!preset || key === activeView) return;
      activeView = key;
      eyeGoal.set(...preset.eye);
      lookGoal.set(...preset.look);
      wake();
    },
    dispose() {
      visible = false;
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resizeObserver.disconnect();
      motion.removeEventListener('change', wake);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
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
