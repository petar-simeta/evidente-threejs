import * as THREE from "three";

// Main room: 26 × 26 × 10
export const ROOM_W = 34;
export const ROOM_H = 10;
export const ROOM_D = 34;
const HALF_W = ROOM_W / 2; // 13
const HALF_D = ROOM_D / 2; // 13
const WALL_T = 0.25;

// Deterministic pseudo-random from seed
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function createParquetTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base fill
  ctx.fillStyle = "#c8a870";
  ctx.fillRect(0, 0, size, size);

  // Herringbone pattern: planks arranged in V-shape
  const plankW = 48;    // narrow dimension
  const plankH = 140;   // long dimension
  const gap = 1.5;

  // Wood plank base colors — light-medium oak range
  const woodColors = [
    [195, 165, 110],
    [200, 170, 118],
    [185, 155, 100],
    [210, 178, 125],
    [190, 160, 108],
    [205, 172, 120],
    [180, 150, 98],
    [198, 168, 115],
  ];

  // Draw herringbone: two planks form a V — one horizontal, one vertical
  // Rows of herringbone blocks
  const blockW = plankH; // horizontal extent of one V-block
  const blockH = plankW * 2; // vertical extent of one V-block

  for (let by = -1; by * blockH < size + blockH; by++) {
    for (let bx = -1; bx * blockW < size + blockW; bx++) {
      const ox = bx * blockW + (by % 2 === 0 ? 0 : blockW / 2);
      const oy = by * blockH;

      // Left-leaning plank (top of V)
      drawPlank(ctx, ox, oy, plankH, plankW, gap, woodColors, bx * 7 + by * 13);
      // Right-leaning plank (bottom of V)
      drawPlank(ctx, ox, oy + plankW, plankH, plankW, gap, woodColors, bx * 11 + by * 17 + 100);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function drawPlank(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  gap: number,
  colors: number[][],
  seed: number,
) {
  const ci = Math.abs(seed) % colors.length;
  const col = colors[ci]!;

  // Slight per-plank color variation
  const rv = seededRand(seed) * 12 - 6;
  const r = Math.max(0, Math.min(255, col[0]! + rv));
  const g = Math.max(0, Math.min(255, col[1]! + rv * 0.8));
  const b = Math.max(0, Math.min(255, col[2]! + rv * 0.6));

  // Plank base
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x + gap, y + gap, w - gap * 2, h - gap * 2);

  // Wood grain lines
  ctx.globalAlpha = 0.08;
  const grainCount = 6 + Math.floor(seededRand(seed + 1) * 5);
  for (let i = 0; i < grainCount; i++) {
    const gy = y + gap + seededRand(seed + i * 3 + 50) * (h - gap * 2);
    const gx1 = x + gap;
    const gx2 = x + w - gap;
    const curve = seededRand(seed + i * 7 + 99) * 4 - 2;

    ctx.strokeStyle = seededRand(seed + i) > 0.5 ? "#8a7050" : "#c8b888";
    ctx.lineWidth = 0.8 + seededRand(seed + i * 5) * 1.2;
    ctx.beginPath();
    ctx.moveTo(gx1, gy);
    ctx.quadraticCurveTo((gx1 + gx2) / 2, gy + curve, gx2, gy + seededRand(seed + i * 11) * 2 - 1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Subtle knot (occasional)
  if (seededRand(seed + 200) > 0.82) {
    const kx = x + gap + seededRand(seed + 201) * (w - gap * 4) + gap;
    const ky = y + gap + seededRand(seed + 202) * (h - gap * 4) + gap;
    const kr = 3 + seededRand(seed + 203) * 5;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#6a5030";
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr, kr * 0.7, seededRand(seed + 204) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Edge shadow for depth
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + gap, y + gap, w - gap * 2, 1.5);
  ctx.fillRect(x + gap, y + gap, 1.5, h - gap * 2);
  ctx.globalAlpha = 1.0;
}

export function createRoom(scene: THREE.Scene) {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede8,
    roughness: 0.9,
    metalness: 0.02,
  });

  const parquetTex = createParquetTexture();
  parquetTex.repeat.set(4, 4);
  const floorMat = new THREE.MeshStandardMaterial({
    map: parquetTex,
    roughness: 0.6,
    metalness: 0.05,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x8a8078,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.45; // above building base trim (top at y=0.4)
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_H;
  scene.add(ceiling);

  // Right wall
  addBox(scene, wallMat, WALL_T, ROOM_H, ROOM_D, HALF_W, ROOM_H / 2, 0);

  // Back wall
  addBox(scene, wallMat, ROOM_W, ROOM_H, WALL_T, 0, ROOM_H / 2, -HALF_D);

  // Left wall (solid)
  addBox(scene, wallMat, WALL_T, ROOM_H, ROOM_D, -HALF_W, ROOM_H / 2, 0);

  // Front wall — with door opening (6 wide × 8 high, centered)
  const doorW = 6;
  const doorH = 8;
  const frontPanelW = (ROOM_W - doorW) / 2;

  addBox(scene, wallMat, frontPanelW, ROOM_H, WALL_T,
    -HALF_W + frontPanelW / 2, ROOM_H / 2, HALF_D);
  addBox(scene, wallMat, frontPanelW, ROOM_H, WALL_T,
    HALF_W - frontPanelW / 2, ROOM_H / 2, HALF_D);
  addBox(scene, wallMat, doorW, ROOM_H - doorH, WALL_T,
    0, doorH + (ROOM_H - doorH) / 2, HALF_D);

  // Baseboard trim
  const trimH = 0.2;
  const trimD = 0.05;
  addBox(scene, trimMat, trimD, trimH, ROOM_D, HALF_W - trimD / 2, trimH / 2, 0);
  addBox(scene, trimMat, ROOM_W, trimH, trimD, 0, trimH / 2, -HALF_D + trimD / 2);
  addBox(scene, trimMat, trimD, trimH, ROOM_D, -HALF_W + trimD / 2, trimH / 2, 0);
}

function addBox(
  scene: THREE.Scene,
  mat: THREE.Material,
  w: number, h: number, d: number,
  x: number, y: number, z: number
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
}
