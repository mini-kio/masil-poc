import * as THREE from 'three';

// Each figure shares a sphere and cylinder across its own moving parts.
export function figureParts() {
  const sphere = new THREE.SphereGeometry(1,24,16);
  const tube = new THREE.CylinderGeometry(1,1,1,14);
  const up = new THREE.Vector3(0,1,0), direction = new THREE.Vector3();
  function piece(container, geo, material, x=0,y=0,z=0) {
    const object = new THREE.Mesh(geo, material);
    object.position.set(x,y,z); object.castShadow = object.receiveShadow = true;
    container.add(object);
    return object;
  }
  function oval(container, material, x,y,z, w,h,d) {
    const m = piece(container,sphere,material,x,y,z);
    m.scale.set(w,h,d); return m;
  }
  function seam(container, material, points, radius) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return piece(container,new THREE.TubeGeometry(curve,12,radius,6,false),material);
  }
  function between(mesh, a, b, rx, rz=rx) {
    direction.subVectors(b,a);
    mesh.position.addVectors(a,b).multiplyScalar(.5);
    mesh.scale.set(rx,direction.length(),rz);
    mesh.quaternion.setFromUnitVectors(up,direction.normalize());
  }
  return { piece, oval, seam, between, tube };
}
