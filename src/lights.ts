import * as THREE from "three";
import { ROOM_H } from "./room";

const CEIL_Y = ROOM_H; // 10

// All lamp positions — every position gets both a fixture AND a light.
// 4×4 grid covering the 34×34 room evenly.
const LAMP_GRID: [number, number][] = [
  [-12, -12], [-4, -12], [4, -12], [12, -12],
  [-12,  -4], [-4,  -4], [4,  -4], [12,  -4],
  [-12,   4], [-4,   4], [4,   4], [12,   4],
  [-12,  12], [-4,  12], [4,  12], [12,  12],
];

// Inner 4 positions also get shadow-casting SpotLights
const SHADOW_SET = new Set(["[-4,-4]", "[4,-4]", "[-4,4]", "[4,4]"]);

export function createLights(scene: THREE.Scene) {
  // Warm ambient fill
  const ambient = new THREE.AmbientLight(0xfff8f0, 0.5);
  scene.add(ambient);

  // Hemisphere — sky/ground bounce
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x8a7a60, 0.6);
  scene.add(hemi);

  // Sun — exterior only
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.4);
  sun.position.set(30, 50, 35);
  sun.castShadow = false;
  scene.add(sun);

  // Shared materials for lamp fixtures
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.6,
    metalness: 0.2,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff8ee,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.0,
  });

  for (const [x, z] of LAMP_GRID) {
    // PointLight at every lamp position
    const pl = new THREE.PointLight(0xfff5e8, 12, 24, 1.2);
    pl.position.set(x, CEIL_Y - 0.12, z);
    scene.add(pl);

    // Shadow-casting SpotLight at the 4 inner positions
    const key = `[${x},${z}]`;
    if (SHADOW_SET.has(key)) {
      const sl = new THREE.SpotLight(0xfff5e8, 18, 24, Math.PI / 3, 0.5, 1.0);
      sl.position.set(x, CEIL_Y - 0.12, z);
      sl.target.position.set(x, 0, z);
      sl.castShadow = true;
      sl.shadow.mapSize.set(512, 512);
      sl.shadow.bias = -0.002;
      scene.add(sl);
      scene.add(sl.target);
    }

    // Lamp fixture
    createLampFixture(scene, x, z, housingMat, glowMat);
  }
}

/** Rectangular LED panel light fixture flush with ceiling */
function createLampFixture(
  scene: THREE.Scene,
  x: number, z: number,
  housingMat: THREE.Material,
  glowMat: THREE.Material,
) {
  const panelW = 2.4;
  const panelD = 1.2;
  const panelH = 0.06;

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, panelH, panelD),
    housingMat
  );
  housing.position.set(x, CEIL_Y - panelH / 2, z);
  scene.add(housing);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW - 0.1, panelD - 0.1),
    glowMat
  );
  glow.rotation.x = Math.PI / 2;
  glow.position.set(x, CEIL_Y - panelH - 0.002, z);
  scene.add(glow);
}
