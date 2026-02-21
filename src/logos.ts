import * as THREE from "three";
import { ROOM_W, ROOM_D } from "./room";

const FRAME_W = 3.0;
const FRAME_H = 2.0;
const FRAME_DEPTH = 0.1;
const Y_HIGH = 6.0;
const Y_LOW = 3.4;

const FONT = "DM Sans, Helvetica, Arial, sans-serif";

// Canvas dimensions (2× for crisp text)
const CW = 1024;
const CH = 680;
const BORDER = 28;

// Frames per wall: right wall, back wall (right half only), left wall
const WALL_COUNTS = [9, 5, 8];

interface ClientInfo {
  name: string;
  file: string | null;
  badges: string[];
}

// Ordered per wall, center = most important, edges = least important
const CLIENTS: ClientInfo[] = [
  // === Right wall (9 frames) ===
  { name: "Autohrvatska", file: "autohrvatska-logo.svg", badges: ["Webshop", "Support"] },
  { name: "Ritosa", file: "brati-ritosa-logo.jpg", badges: ["Website", "Webshop"] },
  { name: "Fruklab", file: "fruklab-logo.svg", badges: ["Website"] },
  { name: "Pivac", file: "pivac-logo.svg", badges: ["Website", "Support"] },
  { name: "Greenseeker", file: "greenseeker-logo.svg", badges: ["Webshop"] },
  { name: "Klik4", file: "klik-logo.svg", badges: ["Webshop"] },
  { name: "Perpetuum", file: "perpetuum-logo.svg", badges: ["Website", "Partner 10+ Years"] },
  { name: "Mingot", file: "mingor-logo.svg", badges: ["Website"] },
  { name: "Santini", file: "santini-logo.png", badges: ["Website"] },

  // === Back wall (5 frames, right half only) — most important ===
  { name: "Končar", file: "koncar-logo.svg", badges: ["Website", "Support"] },
  { name: "L'Oréal", file: "loreal-logo.svg", badges: ["Internal Webshop", "Support"] },
  { name: "OTP", file: "otp-logo.svg", badges: ["Website", "Support", "10+ Years"] },
  { name: "Hrvatski Sabor", file: "sabor-logo.svg", badges: ["Website", "Support", "10+ Years"] },
  { name: "Atlantic Grupa", file: "atlantic-logo.svg", badges: ["Webshops"] },

  // === Left wall (8 frames) ===
  { name: "Sedmi Odjel", file: "sedmi-odjel-logo.svg", badges: ["Website", "Server Partner"] },
  { name: "Barcaffe", file: "barcaffe-logo.svg", badges: ["Webshop", "Support"] },
  { name: "Cazmatrans", file: "cazmatrans-logo.jpg", badges: ["Internal App", "Support"] },
  { name: "NZJZ", file: "nzjz-logo.svg", badges: ["Website", "Support"] },
  { name: "Cambridge", file: "cambridge-logo.svg", badges: [] },
  { name: "Radiochirurgia", file: "rch-logo.png", badges: ["Website", "Support"] },
  { name: "Farmacia", file: "farmacia-logo.svg", badges: ["Webshop", "Support"] },
  { name: "PBZ", file: "pbz-logo.svg", badges: ["Intranet", "Support"] },
];

export function createLogos(scene: THREE.Scene) {
  const halfW = ROOM_W / 2;
  const halfD = ROOM_D / 2;
  const offset = 0.15;

  const walls: WallConfig[] = [
    {
      center: new THREE.Vector3(halfW - offset, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      normal: new THREE.Vector3(-1, 0, 0),
      width: ROOM_D,
    },
    {
      // Right half of back wall only (window on left half)
      center: new THREE.Vector3(halfW / 2, 0, -halfD + offset),
      right: new THREE.Vector3(1, 0, 0),
      normal: new THREE.Vector3(0, 0, 1),
      width: halfW,
    },
    {
      center: new THREE.Vector3(-halfW + offset, 0, 0),
      right: new THREE.Vector3(0, 0, -1),
      normal: new THREE.Vector3(1, 0, 0),
      width: ROOM_D,
    },
  ];

  let idx = 0;
  for (let w = 0; w < walls.length; w++) {
    const wall = walls[w]!;
    const count = WALL_COUNTS[w]!;
    for (let i = 0; i < count; i++) {
      const client = idx < CLIENTS.length ? CLIENTS[idx]! : null;
      const group = createFrameGroup();
      positionFrame(group, wall, i, count);
      scene.add(group);

      if (client) {
        loadClientFrame(group, client);
      }

      idx++;
    }
  }
}

interface WallConfig {
  center: THREE.Vector3;
  right: THREE.Vector3;
  normal: THREE.Vector3;
  width: number;
}

function positionFrame(obj: THREE.Object3D, wall: WallConfig, index: number, frameCount: number) {
  const spacing = wall.width / (frameCount + 1);
  const hOffset = (index - (frameCount - 1) / 2) * spacing;
  const y = index % 2 === 0 ? Y_HIGH : Y_LOW;

  const pos = wall.center.clone();
  pos.y = y;
  pos.addScaledVector(wall.right, hOffset);
  obj.position.copy(pos);
  obj.lookAt(pos.clone().add(wall.normal));
}

function createFrameGroup(): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.15,
  });
  const frameBox = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_W, FRAME_H, FRAME_DEPTH),
    frameMat
  );
  frameBox.castShadow = true;
  frameBox.receiveShadow = true;
  group.add(frameBox);

  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;
  drawFrameBackground(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const faceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(FRAME_W - 0.06, FRAME_H - 0.06),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.95, metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  faceMesh.position.z = FRAME_DEPTH / 2 + 0.005;
  faceMesh.name = "face";
  group.add(faceMesh);

  return group;
}

function drawFrameBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#222222";
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(BORDER, BORDER, CW - BORDER * 2, CH - BORDER * 2);
}

function drawBadges(ctx: CanvasRenderingContext2D, badges: string[]) {
  if (badges.length === 0) return;

  const fontSize = 16;
  const letterSpacing = 2.5;
  const padX = 14;
  const padY = 8;
  const gap = 10;
  const cornerRadius = 6;
  const bottomMargin = 44;
  const rightMargin = 44;

  ctx.font = `600 ${fontSize}px ${FONT}`;
  ctx.textBaseline = "middle";

  let yOffset = CH - bottomMargin;

  for (let i = badges.length - 1; i >= 0; i--) {
    const text = badges[i]!.toUpperCase();
    const textW = measureSpacedText(ctx, text, letterSpacing);
    const bw = textW + padX * 2;
    const bh = fontSize + padY * 2;
    const bx = CW - rightMargin - bw;
    const by = yOffset - bh;

    ctx.fillStyle = "#222222";
    roundRect(ctx, bx, by, bw, bh, cornerRadius);
    ctx.fill();

    ctx.fillStyle = "#c6fb50";
    drawSpacedText(ctx, text, bx + padX, by + bh / 2, letterSpacing);

    yOffset = by - gap;
  }
}

function measureSpacedText(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    w += ctx.measureText(text[i]!).width;
    if (i < text.length - 1) w += spacing;
  }
  return w;
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  ctx.textAlign = "left";
  let cx = x;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i]!, cx, y);
    cx += ctx.measureText(text[i]!).width + spacing;
  }
}

function drawClientName(ctx: CanvasRenderingContext2D, name: string) {
  ctx.fillStyle = "#888888";
  ctx.font = `bold 56px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, CW / 2, CH / 2 - 20);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadClientFrame(group: THREE.Group, client: ClientInfo) {
  const faceMesh = group.getObjectByName("face") as THREE.Mesh | undefined;
  if (!faceMesh) return;

  if (!client.file) {
    // No logo file — draw name + badges
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d")!;
    drawFrameBackground(ctx);
    drawClientName(ctx, client.name);
    drawBadges(ctx, client.badges);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = faceMesh.material as THREE.MeshStandardMaterial;
    mat.map = tex;
    mat.needsUpdate = true;
    return;
  }

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d")!;

    drawFrameBackground(ctx);

    const innerX = BORDER;
    const innerY = BORDER;
    const innerW = CW - BORDER * 2;
    const innerH = CH - BORDER * 2;
    const badgeSpace = 70;
    const targetW = innerW * 0.8;
    const targetH = (innerH - badgeSpace) * 0.8;
    const scale = Math.min(targetW / img.width, targetH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = innerX + (innerW - drawW) / 2;
    const drawY = innerY + (innerH - badgeSpace - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    drawBadges(ctx, client.badges);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;

    const mat = faceMesh.material as THREE.MeshStandardMaterial;
    mat.map = tex;
    mat.needsUpdate = true;
  };
  img.src = `./textures/${client.file}`;
}
