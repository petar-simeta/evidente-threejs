import * as THREE from "three";
import { createScene, createRenderer, createCamera } from "./scene";
import { createLights } from "./lights";
import { createBuilding } from "./building";
import { createDoors } from "./doors";
import { createRoom } from "./room";
import { createLogos } from "./logos";
import { createInfoWall } from "./info-wall";
import { createFurniture } from "./furniture";
import { playIntro } from "./intro-animation";
import { createControls, type Controls } from "./controls";
import "./style.css";

async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const overlay = document.getElementById("overlay")!;
  const welcome = document.getElementById("welcome")!;
  const escHint = document.getElementById("esc-hint")!;
  const loader = document.getElementById("loader")!;

  // Core setup
  const scene = createScene();
  const renderer = createRenderer(canvas);
  const camera = createCamera();

  // Populate scene
  createLights(scene);
  createBuilding(scene);
  const doors = createDoors(scene);
  createRoom(scene);
  createLogos(scene);
  createInfoWall(scene);
  createFurniture(scene);

  // Controls created after intro animation
  let controls: Controls | null = null;

  // Resize handler
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Render loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    controls?.update(delta);
    renderer.render(scene, camera);
  }
  animate();

  // Hide loader, play intro
  loader.classList.add("hidden");

  // Show "Welcome" when doors open (7s into animation), hide after 3s
  setTimeout(() => {
    welcome.classList.remove("hidden");
    setTimeout(() => welcome.classList.add("hidden"), 3000);
  }, 7000);

  await playIntro(camera, doors);

  // Create controls now (reads final camera orientation)
  controls = createControls(camera, document.body);

  // Show instructions overlay
  overlay.classList.remove("hidden");

  // Click anywhere to lock pointer
  const startExploring = () => {
    controls!.pointerLock.lock();
  };
  overlay.addEventListener("click", startExploring);

  controls.pointerLock.addEventListener("lock", () => {
    overlay.classList.add("hidden");
    escHint.classList.remove("hidden");
    controls!.enable();
  });

  controls.pointerLock.addEventListener("unlock", () => {
    // Reset camera to room center
    camera.position.set(0, 5, 0);
    camera.lookAt(0, 5, -1);
    overlay.classList.remove("hidden");
    escHint.classList.add("hidden");
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  const loader = document.getElementById("loader");
  if (loader) {
    loader.querySelector("span")!.textContent = "Error — check console";
  }
});
