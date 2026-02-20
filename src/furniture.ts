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
  hw: 4.3, hd: 2.6,
};

const PLANT_CORNERS: [number, number][] = [
  [15.5, 15.5],
  [-15.5, 15.5],
  [15.5, -15.5],
  [-15.5, -15.5],
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

  // "Hello world..." text on table surface, door side (+z), bottom-right
  const textCanvas = document.createElement("canvas");
  textCanvas.width = 512;
  textCanvas.height = 128;
  const tctx = textCanvas.getContext("2d")!;
  tctx.clearRect(0, 0, 512, 128);
  tctx.fillStyle = "#222222";
  tctx.font = "300 52px DM Sans, Helvetica, Arial, sans-serif";
  tctx.textAlign = "left";
  tctx.textBaseline = "middle";
  tctx.fillText("Hello world...", 20, 64);

  const textTex = new THREE.CanvasTexture(textCanvas);
  textTex.minFilter = THREE.LinearFilter;
  textTex.colorSpace = THREE.SRGBColorSpace;

  const textW = topW * 0.35;
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
  textPlane.rotation.x = -Math.PI / 2;
  textPlane.rotation.z = Math.PI;
  textPlane.position.set(
    cx + topW * 0.2,
    FLOOR_Y + tableH - 0.03 + 0.005,
    cz + topD * 0.2
  );
  scene.add(textPlane);
}

// ========================
// PING PONG TABLE
// ========================
function createPingPongTable(scene: THREE.Scene) {
  const tableW = 8;
  const tableD = 4.5;
  const tableH = 2.2;
  const cx = PONG_BOUNDS.cx;
  const cz = PONG_BOUNDS.cz;

  // Table top with markings
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext("2d")!;

  // Green surface
  ctx.fillStyle = "#1a6b30";
  ctx.fillRect(0, 0, 512, 288);

  // White edge lines
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 496, 272);

  // Center line (across width)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 8);
  ctx.lineTo(256, 280);
  ctx.stroke();

  // Center line (along length — for doubles)
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, 144);
  ctx.lineTo(504, 144);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const topMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.3,
    metalness: 0.05,
  });

  // Underside is dark
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

  // Net
  const netMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.8,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const netMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(tableD + 0.4, 0.3),
    netMat
  );
  netMesh.position.set(cx, FLOOR_Y + tableH + 0.19, cz);
  netMesh.rotation.y = Math.PI / 2;
  scene.add(netMesh);

  // Net posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 });
  for (const zOff of [-tableD / 2 - 0.15, tableD / 2 + 0.15]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8),
      postMat
    );
    post.position.set(cx, FLOOR_Y + tableH + 0.175, cz + zOff);
    scene.add(post);
  }
}

// ========================
// TREES — Low-poly trees around the building
// ========================
function loadTrees(scene: THREE.Scene) {
  const GROUND_Y = -0.05;

  // 5 trees, only left and right sides, well away from building (edges at ±23)
  const spots: { x: number; z: number; height: number; rot: number }[] = [
    // Right side
    { x:  40, z: -8,  height: 22, rot: 0.4 },
    { x:  38, z: 10,  height: 18, rot: 2.1 },

    // Left side
    { x: -42, z: -5,  height: 24, rot: 1.2 },
    { x: -38, z: 12,  height: 17, rot: 3.8 },
    { x: -45, z: -16, height: 20, rot: 5.5 },
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
