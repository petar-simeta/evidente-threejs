import * as THREE from "three";
import gsap from "gsap";

const DOOR_W = 3;
const DOOR_H = 8;
const DOOR_DEPTH = 0.08;
const FRONT_Z = 23; // building halfD (46/2)

export interface Doors {
  left: THREE.Group;
  right: THREE.Group;
  open: () => gsap.core.Timeline;
  close: () => gsap.core.Timeline;
}

export function createDoors(scene: THREE.Scene): Doors {
  // Semi-transparent glass door
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x99a0a8,
    roughness: 0.05,
    metalness: 0.3,
    transparent: true,
    opacity: 0.3,
  });

  // Thin metal frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.3,
    metalness: 0.7,
  });

  // Handle
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    roughness: 0.2,
    metalness: 0.85,
  });

  const leftGroup = new THREE.Group();
  leftGroup.position.set(-DOOR_W, 0, FRONT_Z);

  // Glass panel
  const leftGlass = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W, DOOR_H, DOOR_DEPTH),
    glassMat
  );
  leftGlass.position.set(DOOR_W / 2, DOOR_H / 2, 0);
  leftGroup.add(leftGlass);

  // Frame edges
  addDoorFrame(leftGroup, frameMat, DOOR_W, DOOR_H, DOOR_DEPTH);

  // Handle
  const leftHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
    handleMat
  );
  leftHandle.position.set(DOOR_W * 0.8, DOOR_H * 0.45, DOOR_DEPTH / 2 + 0.03);
  leftGroup.add(leftHandle);

  scene.add(leftGroup);

  const rightGroup = new THREE.Group();
  rightGroup.position.set(DOOR_W, 0, FRONT_Z);

  const rightGlass = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W, DOOR_H, DOOR_DEPTH),
    glassMat
  );
  rightGlass.position.set(-DOOR_W / 2, DOOR_H / 2, 0);
  rightGroup.add(rightGlass);

  addDoorFrame(rightGroup, frameMat, -DOOR_W, DOOR_H, DOOR_DEPTH);

  const rightHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
    handleMat
  );
  rightHandle.position.set(-DOOR_W * 0.8, DOOR_H * 0.45, DOOR_DEPTH / 2 + 0.03);
  rightGroup.add(rightHandle);

  scene.add(rightGroup);

  function open() {
    const tl = gsap.timeline();
    tl.to(leftGroup.rotation, { y: Math.PI / 2, duration: 1.5, ease: "power2.inOut" }, 0);
    tl.to(rightGroup.rotation, { y: -Math.PI / 2, duration: 1.5, ease: "power2.inOut" }, 0);
    return tl;
  }

  function close() {
    const tl = gsap.timeline();
    tl.to(leftGroup.rotation, { y: 0, duration: 1.2, ease: "power2.inOut" }, 0);
    tl.to(rightGroup.rotation, { y: 0, duration: 1.2, ease: "power2.inOut" }, 0);
    return tl;
  }

  return { left: leftGroup, right: rightGroup, open, close };
}

function addDoorFrame(
  group: THREE.Group,
  mat: THREE.Material,
  doorW: number,
  doorH: number,
  depth: number
) {
  const t = 0.04;
  const absW = Math.abs(doorW);
  const sign = Math.sign(doorW);
  const cx = sign * absW / 2;

  // Bottom rail
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(absW, t, depth + 0.01), mat);
  bottom.position.set(cx, t / 2, 0);
  group.add(bottom);

  // Top rail
  const top = new THREE.Mesh(new THREE.BoxGeometry(absW, t, depth + 0.01), mat);
  top.position.set(cx, doorH - t / 2, 0);
  group.add(top);

  // Hinge side
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(t, doorH, depth + 0.01), mat);
  hinge.position.set(sign * t / 2, doorH / 2, 0);
  group.add(hinge);

  // Handle side
  const handle = new THREE.Mesh(new THREE.BoxGeometry(t, doorH, depth + 0.01), mat);
  handle.position.set(sign * (absW - t / 2), doorH / 2, 0);
  group.add(handle);
}
