import * as THREE from "three";
import { ROOM_D } from "./room";

const HALF_D = ROOM_D / 2;
const FONT = "DM Sans, Helvetica, Arial, sans-serif";

/**
 * Info panels on the front wall (z = +HALF_D) — the wall with the entrance door.
 * Clock and calendar above the door, side panels with company info.
 */
export function createInfoWall(scene: THREE.Scene) {
  // Clock above door (left side)
  createClock(scene, -1.5, 9, HALF_D - 0.16);

  // Calendar above door (right side)
  createCalendar(scene, 1.5, 9, HALF_D - 0.16);

  // Left info panel
  const leftCanvas = createSideCanvas("Web Development\nStudio", "Zagreb, Croatia");
  const leftTex = new THREE.CanvasTexture(leftCanvas);
  leftTex.minFilter = THREE.LinearFilter;

  const leftPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 4.5),
    new THREE.MeshStandardMaterial({ map: leftTex, roughness: 0.5 })
  );
  leftPanel.position.set(-12, 4.5, HALF_D - 0.15);
  leftPanel.rotation.y = Math.PI;
  scene.add(leftPanel);

  // Right info panel
  const rightCanvas = createSideCanvas("Modern Digital\nExperiences", "hello@evidente.dev");
  const rightTex = new THREE.CanvasTexture(rightCanvas);
  rightTex.minFilter = THREE.LinearFilter;

  const rightPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 4.5),
    new THREE.MeshStandardMaterial({ map: rightTex, roughness: 0.5 })
  );
  rightPanel.position.set(12, 4.5, HALF_D - 0.15);
  rightPanel.rotation.y = Math.PI;
  scene.add(rightPanel);
}

function createClock(scene: THREE.Scene, x: number, y: number, z: number) {
  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const cx = s / 2;
  const cy = s / 2;
  const r = 240;

  // Transparent background — only the circle is drawn
  ctx.clearRect(0, 0, s, s);

  // Clock face
  ctx.fillStyle = "#f8f8f0";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Hour marks
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 28), cy + Math.sin(a) * (r - 28));
    ctx.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
    ctx.stroke();
  }

  // Numbers
  ctx.fillStyle = "#222";
  ctx.font = `bold 36px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    ctx.fillText(String(i), cx + Math.cos(a) * (r - 52), cy + Math.sin(a) * (r - 52));
  }

  // Hands
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();

  ctx.strokeStyle = "#222";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  const hA = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hA) * 110, cy + Math.sin(hA) * 110);
  ctx.stroke();

  ctx.lineWidth = 5;
  const mA = (minutes * Math.PI) / 30 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(mA) * 160, cy + Math.sin(mA) * 160);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = "#cc3333";
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  const clockRadius = 0.6;
  const clockDepth = 0.06;
  const group = new THREE.Group();

  // 3D body — short cylinder
  const bodyGeo = new THREE.CylinderGeometry(clockRadius, clockRadius, clockDepth, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Face — circle with canvas texture
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(clockRadius - 0.005, 32),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, transparent: true })
  );
  face.position.z = clockDepth / 2 + 0.001;
  group.add(face);

  group.position.set(x, y, z);
  group.rotation.y = Math.PI;
  scene.add(group);
}

function createCalendar(scene: THREE.Scene, x: number, y: number, z: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 320);

  ctx.fillStyle = "#cc3333";
  ctx.fillRect(0, 0, 256, 70);

  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 24px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(months[now.getMonth()]!, 128, 32);
  ctx.font = `18px ${FONT}`;
  ctx.fillText(String(now.getFullYear()), 128, 58);

  ctx.fillStyle = "#222";
  ctx.font = `bold 100px ${FONT}`;
  ctx.fillText(String(now.getDate()), 128, 200);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = "#666";
  ctx.fillText(days[now.getDay()]!, 128, 270);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.95),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })
  );
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI;
  scene.add(mesh);
}

function createSideCanvas(title: string, subtitle: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 420;
  c.height = 540;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#f0ede8";
  ctx.fillRect(0, 0, 420, 540);

  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 400, 520);

  ctx.fillStyle = "#333";
  ctx.font = `bold 30px ${FONT}`;
  ctx.textAlign = "center";

  const lines = title.split("\n");
  const lineH = 40;
  const startY = 230 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, 210, startY + i * lineH);
  });

  ctx.font = `300 22px ${FONT}`;
  ctx.fillStyle = "#888";
  ctx.fillText(subtitle, 210, startY + lines.length * lineH + 30);

  return c;
}
