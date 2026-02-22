import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { ROOM_W, ROOM_D } from "./room";
import { TABLE_BOUNDS, PONG_BOUNDS } from "./furniture";

const MOVE_SPEED = 1.1;
const PLAYER_HEIGHT = 5;
const MARGIN = 0.5;

const X_MIN = -ROOM_W / 2 + MARGIN;
const X_MAX = ROOM_W / 2 - MARGIN;
const Z_MIN = -ROOM_D / 2 + MARGIN;
const Z_MAX = ROOM_D / 2 - MARGIN;

interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

const DOOR_HALF_W = 3;

export interface Controls {
  pointerLock: PointerLockControls;
  update: (delta: number) => void;
  enable: () => void;
}

export function createControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement
): Controls {
  const controls = new PointerLockControls(camera, domElement);
  controls.pointerSpeed = 0.4;

  const keys: Keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  function onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case "KeyW": case "ArrowUp":    keys.forward = true; break;
      case "KeyS": case "ArrowDown":  keys.backward = true; break;
      case "KeyA": case "ArrowLeft":  keys.left = true; break;
      case "KeyD": case "ArrowRight": keys.right = true; break;
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case "KeyW": case "ArrowUp":    keys.forward = false; break;
      case "KeyS": case "ArrowDown":  keys.backward = false; break;
      case "KeyA": case "ArrowLeft":  keys.left = false; break;
      case "KeyD": case "ArrowRight": keys.right = false; break;
    }
  }

  function update(delta: number) {
    if (!controls.isLocked) return;

    velocity.x *= 0.88;
    velocity.z *= 0.88;

    direction.z = Number(keys.forward) - Number(keys.backward);
    direction.x = Number(keys.right) - Number(keys.left);
    direction.normalize();

    if (keys.forward || keys.backward) velocity.z -= direction.z * MOVE_SPEED * delta;
    if (keys.left || keys.right) velocity.x -= direction.x * MOVE_SPEED * delta;

    controls.moveRight(-velocity.x);
    controls.moveForward(-velocity.z);

    // Clamp to room bounds
    camera.position.x = Math.max(X_MIN, Math.min(X_MAX, camera.position.x));
    camera.position.z = Math.max(Z_MIN, Math.min(Z_MAX, camera.position.z));

    // Furniture collision — push player out of table areas
    for (const bounds of [TABLE_BOUNDS, PONG_BOUNDS]) {
      const dx = camera.position.x - bounds.cx;
      const dz = camera.position.z - bounds.cz;
      if (Math.abs(dx) < bounds.hw && Math.abs(dz) < bounds.hd) {
        const pushX = bounds.hw - Math.abs(dx);
        const pushZ = bounds.hd - Math.abs(dz);
        if (pushX < pushZ) {
          camera.position.x = bounds.cx + Math.sign(dx) * bounds.hw;
        } else {
          camera.position.z = bounds.cz + Math.sign(dz) * bounds.hd;
        }
      }
    }

    // Exit through door: if player reaches front wall in door opening, unlock
    if (camera.position.z >= Z_MAX && Math.abs(camera.position.x) < DOOR_HALF_W) {
      controls.unlock();
    }

    camera.position.y = PLAYER_HEIGHT;
  }

  function enable() {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }

  return { pointerLock: controls, update, enable };
}
