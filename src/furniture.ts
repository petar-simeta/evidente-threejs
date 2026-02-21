import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FLOOR_Y = 0.45;

// Collision bounds (exported for controls)
export const TABLE_BOUNDS = {
  cx: 3, cz: -7,
  hw: 7.3, hd: 2.7,
};

export const PONG_BOUNDS = {
  cx: -5, cz: 7,
  hw: 2.6, hd: 4.3,
};

const PLANT_CORNERS: [number, number][] = [
  [15.5, 20],
  [-15.5, 20],
  [15.5, -20],
  [-15.5, -20],
];

export function createFurniture(scene: THREE.Scene) {
  createBarTable(scene);
  createPingPongTable(scene);
  loadPlants(scene);
  loadTrees(scene);
}

// ========================
// PLANTS — GLTF Pothos model in each corner
// ========================
function loadPlants(scene: THREE.Scene) {
  const loader = new GLTFLoader();
  loader.load("./models/plant/scene.gltf", (gltf) => {
    const original = gltf.scene;

    const box = new THREE.Box3().setFromObject(original);
    const size = box.getSize(new THREE.Vector3());
    const desiredHeight = 2.8;
    const s = desiredHeight / size.y;
    original.scale.setScalar(s);

    const scaledBox = new THREE.Box3().setFromObject(original);
    const bottomOffset = scaledBox.min.y;

    for (const [x, z] of PLANT_CORNERS) {
      const clone = original.clone();
      clone.position.set(x, FLOOR_Y - bottomOffset, z);

      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(clone);
    }
  });
}

// ========================
// BAR TABLE — white, thin wide top
// ========================
function createBarTable(scene: THREE.Scene) {
  const topW = 14;
  const topD = 4.8;
  const baseW = 8;
  const baseD = 2.4;
  const tableH = 2.8;

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.4,
    metalness: 0.05,
  });

  const cx = TABLE_BOUNDS.cx;
  const cz = TABLE_BOUNDS.cz;

  const baseH = tableH - 0.08;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(baseW, baseH, baseD),
    baseMat
  );
  base.position.set(cx, FLOOR_Y + baseH / 2, cz);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const topShape = createRoundedRectShape(topW, topD, 0.35);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  topGeo.rotateX(-Math.PI / 2);

  const topMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.05,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.set(cx, FLOOR_Y + tableH - 0.03, cz);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  scene.add(topMesh);

  // "Hello world..." text on base front face (+z, door side), bottom-right
  const textCanvas = document.createElement("canvas");
  textCanvas.width = 512;
  textCanvas.height = 128;
  const tctx = textCanvas.getContext("2d")!;
  tctx.clearRect(0, 0, 512, 128);
  tctx.fillStyle = "#222222";
  tctx.font = "300 52px DM Sans, Helvetica, Arial, sans-serif";
  tctx.textAlign = "right";
  tctx.textBaseline = "bottom";
  tctx.fillText("Hello world...", 500, 118);

  const textTex = new THREE.CanvasTexture(textCanvas);
  textTex.minFilter = THREE.LinearFilter;
  textTex.colorSpace = THREE.SRGBColorSpace;

  const textW = baseW * 0.6;
  const textH = textW * (128 / 512);
  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(textW, textH),
    new THREE.MeshStandardMaterial({
      map: textTex,
      transparent: true,
      roughness: 0.6,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  // Upright on the +z face of the base, bottom-right
  textPlane.position.set(
    cx + baseW * 0.15,
    FLOOR_Y + baseH * 0.3,
    cz + baseD / 2 + 0.01
  );
  scene.add(textPlane);
}

// ========================
// PING PONG TABLE
// ========================
function createPingPongTable(scene: THREE.Scene) {
  const tableW = 4.5;  // rotated: short side on x
  const tableD = 8;    // rotated: long side on z
  const tableH = 2.2;
  const cx = PONG_BOUNDS.cx;
  const cz = PONG_BOUNDS.cz;

  // Table top with markings (canvas long axis = z after rotation)
  const canvas = document.createElement("canvas");
  canvas.width = 288;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1a6b30";
  ctx.fillRect(0, 0, 288, 512);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 272, 496);

  // Center line (across short side)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, 256);
  ctx.lineTo(280, 256);
  ctx.stroke();

  // Center line (along long side — doubles)
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(144, 8);
  ctx.lineTo(144, 504);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.05 });
  const underMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.6 });
  const topMaterials = [underMat, underMat, topMat, underMat, underMat, underMat];

  const topGeo = new THREE.BoxGeometry(tableW, 0.08, tableD);
  const top = new THREE.Mesh(topGeo, topMaterials);
  top.position.set(cx, FLOOR_Y + tableH, cz);
  top.castShadow = true;
  top.receiveShadow = true;
  scene.add(top);

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 });
  const legGeo = new THREE.BoxGeometry(0.15, tableH - 0.08, 0.15);
  const legOffsets: [number, number][] = [
    [-tableW / 2 + 0.3, -tableD / 2 + 0.3],
    [tableW / 2 - 0.3, -tableD / 2 + 0.3],
    [-tableW / 2 + 0.3, tableD / 2 - 0.3],
    [tableW / 2 - 0.3, tableD / 2 - 0.3],
  ];
  for (const [ox, oz] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(cx + ox, FLOOR_Y + (tableH - 0.08) / 2, cz + oz);
    leg.castShadow = true;
    scene.add(leg);
  }

  // Net (now across x-axis, dividing the long z-side)
  const netMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd, roughness: 0.8, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(tableW + 0.4, 0.3), netMat);
  netMesh.position.set(cx, FLOOR_Y + tableH + 0.19, cz);
  scene.add(netMesh);

  // Net posts (on x-edges now)
  const postMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 });
  for (const xOff of [-tableW / 2 - 0.15, tableW / 2 + 0.15]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), postMat);
    post.position.set(cx + xOff, FLOOR_Y + tableH + 0.175, cz);
    scene.add(post);
  }
}

// ========================
// TREES — Low-poly trees around the building
// ========================
function loadTrees(scene: THREE.Scene) {
  const GROUND_Y = -0.05;

  // Trees scattered around buildings
  // Main building: ±23 on x/z. Second building: x 30–70, z -57 to -33.
  // Keep 8+ units clearance from walls.
  const spots: { x: number; z: number; height: number; rot: number }[] = [
    // Left cluster
    { x: -55, z:  15, height: 20, rot: 0.4 },
    { x: -42, z:   5, height: 24, rot: 1.2 },
    { x: -65, z:  -5, height: 18, rot: 3.8 },
    { x: -48, z: -20, height: 22, rot: 5.5 },
    { x: -38, z:  38, height: 16, rot: 2.3 },
    { x: -70, z: -25, height: 20, rot: 4.1 },
    { x: -50, z: -40, height: 17, rot: 0.9 },
    { x: -35, z: -35, height: 21, rot: 3.2 },

    // Right side
    { x:  55, z:   8, height: 20, rot: 2.6 },
    { x:  38, z:  35, height: 16, rot: 0.8 },
    { x:  45, z: -15, height: 18, rot: 1.7 },
    { x:  80, z: -10, height: 22, rot: 4.5 },
    { x:  78, z: -45, height: 17, rot: 1.1 },
    { x:  80, z: -55, height: 20, rot: 3.3 },

    // Front-left (between building and road)
    { x: -35, z:  34, height: 19, rot: 1.4 },
    { x: -55, z:  38, height: 22, rot: 3.5 },

    // Far back-left
    { x: -60, z: -55, height: 18, rot: 2.0 },
  ];

  const loader = new GLTFLoader();
  loader.load("./models/trees/scene.gltf", (gltf) => {
    const root = gltf.scene;

    // Measure the whole scene (includes all parent transforms like 0.1 scale)
    const box = new THREE.Box3().setFromObject(root);
    const modelH = box.max.y - box.min.y;
    const modelMinY = box.min.y;

    for (let i = 0; i < spots.length; i++) {
      const spot = spots[i]!;
      const clone = root.clone();

      // Scale to desired height
      const s = spot.height / modelH;
      clone.scale.multiplyScalar(s);
      clone.rotation.y = spot.rot;

      // Place on ground
      clone.position.set(spot.x, GROUND_Y - modelMinY * s, spot.z);

      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(clone);
    }
  });
}

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}
