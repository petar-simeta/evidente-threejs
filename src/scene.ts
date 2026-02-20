import * as THREE from "three";

const LIME = 0xc6fb50;

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(LIME);
  scene.fog = new THREE.Fog(LIME, 60, 180);

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(600, 600);
  const groundMat = new THREE.MeshStandardMaterial({ color: LIME });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05; // below room floor to avoid z-fighting
  ground.receiveShadow = true;
  scene.add(ground);

  return scene;
}

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  camera.position.set(0, 6, 90);
  camera.lookAt(0, 12, 0);
  return camera;
}
