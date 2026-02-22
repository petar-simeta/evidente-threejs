import * as THREE from "three";
import { ROOM_W, ROOM_H, ROOM_D } from "./room";

const HALF_W = ROOM_W / 2;
const HALF_D = ROOM_D / 2;
const WALL_T = 0.25;
const FONT = "DM Sans, Helvetica, Arial, sans-serif";

// Push panels well in front of the inner wall surface to avoid z-fighting
const PANEL_Z = HALF_D - WALL_T / 2 - 0.12;

const DOOR_W = 3;

export function createInfoWall(scene: THREE.Scene) {
  createClock(scene, -1.5, 9, PANEL_Z);
  createCalendar(scene, 1.5, 9, PANEL_Z);
  createLeftPanel(scene);  // privacy & cookies (small text)
  createRightPanel(scene); // company info (large text)
}

// ========================
// LEFT PANEL — Privacy & Cookies (small text)
// ========================
function createLeftPanel(scene: THREE.Scene) {
  const panelW = HALF_W - DOOR_W;
  const panelCX = -HALF_W + panelW / 2;

  const meshW = 6;
  const meshH = 7;

  const CW = 900;
  const CH = Math.round(CW * (meshH / meshW));
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f0ede8";
  ctx.fillRect(0, 0, CW, CH);

  const margin = 50;
  const maxW = CW - margin * 2;

  // Two-pass: first measure total height, then draw centered
  const content = buildPrivacyContent(ctx, maxW);
  const startY = (CH - content.totalH) / 2;
  let y = startY;

  for (const item of content.items) {
    if (item.type === "title") {
      ctx.fillStyle = "#222222";
      ctx.font = `700 30px ${FONT}`;
      y += 30;
      ctx.fillText(item.text, margin, y);
    } else if (item.type === "heading") {
      ctx.fillStyle = "#222222";
      ctx.font = `700 20px ${FONT}`;
      y += 28;
      ctx.fillText(item.text, margin, y);
      y += 4;
    } else if (item.type === "subheading") {
      ctx.fillStyle = "#333333";
      ctx.font = `600 16px ${FONT}`;
      y += 22;
      ctx.fillText(item.text, margin, y);
      y += 2;
    } else if (item.type === "bodyline") {
      ctx.fillStyle = "#555555";
      ctx.font = `400 14px ${FONT}`;
      y += 18;
      ctx.fillText(item.text, margin, y);
    } else if (item.type === "bodygap") {
      y += item.gap!;
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(meshW, meshH),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0.0,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })
  );
  panel.position.set(panelCX, ROOM_H / 2, PANEL_Z);
  panel.rotation.y = Math.PI;
  scene.add(panel);
}

// ========================
// RIGHT PANEL — Company info
// ========================
function createRightPanel(scene: THREE.Scene) {
  const panelW = HALF_W - DOOR_W;
  const panelCX = HALF_W - panelW / 2;

  const meshW = 6;
  const meshH = 5;

  const CW = 800;
  const CH = Math.round(CW * (meshH / meshW));
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f0ede8";
  ctx.fillRect(0, 0, CW, CH);

  ctx.textAlign = "center";
  const centerX = CW / 2;

  // Measure total block height to center vertically
  // Lines: name(42) + gap(24) + addr1(28) + gap(8) + addr2(28) + gap(20) + vat(22) + gap(24) + email(30) + gap(20) + copyright(20)
  const blockH = 42 + 24 + 28 + 8 + 28 + 20 + 22 + 24 + 30 + 20 + 20;
  let y = (CH - blockH) / 2;

  // Company name
  ctx.fillStyle = "#222222";
  ctx.font = `700 42px ${FONT}`;
  y += 42;
  ctx.fillText("Evidente d.o.o.", centerX, y);

  // Address
  ctx.font = `400 28px ${FONT}`;
  ctx.fillStyle = "#444444";
  y += 24 + 28;
  ctx.fillText("Prečko 22", centerX, y);
  y += 8 + 28;
  ctx.fillText("Zagreb, Croatia", centerX, y);

  // VAT
  ctx.font = `300 22px ${FONT}`;
  ctx.fillStyle = "#666666";
  y += 20 + 22;
  ctx.fillText("VAT: HR48530401743", centerX, y);

  // Email
  ctx.font = `500 30px ${FONT}`;
  ctx.fillStyle = "#222222";
  y += 24 + 30;
  ctx.fillText("support@evidente.hr", centerX, y);

  // Copyright
  ctx.font = `300 20px ${FONT}`;
  ctx.fillStyle = "#888888";
  y += 20 + 20;
  ctx.fillText("Copyright © 2026 Evidente", centerX, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(meshW, meshH),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0.0,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })
  );
  panel.position.set(panelCX, ROOM_H / 2 - 0.5, PANEL_Z);
  panel.rotation.y = Math.PI;
  scene.add(panel);

  // Logo above text
  const logoImg = new Image();
  logoImg.onload = () => {
    const aspect = logoImg.width / logoImg.height;
    const logoW = meshW * 0.55;
    const logoH = logoW / aspect;

    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = 512;
    logoCanvas.height = Math.round(512 / aspect);
    const lctx = logoCanvas.getContext("2d")!;
    lctx.drawImage(logoImg, 0, 0, logoCanvas.width, logoCanvas.height);

    const logoTex = new THREE.CanvasTexture(logoCanvas);
    logoTex.minFilter = THREE.LinearFilter;
    logoTex.colorSpace = THREE.SRGBColorSpace;

    const logoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(logoW, logoH),
      new THREE.MeshStandardMaterial({
        map: logoTex,
        roughness: 0.5,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      })
    );
    logoMesh.position.set(panelCX, ROOM_H - 1.5, PANEL_Z - 0.001);
    logoMesh.rotation.y = Math.PI;
    scene.add(logoMesh);
  };
  logoImg.src = "./logo/evidente-logo-black-bg.svg";
}

// ========================
// Privacy content builder (for measuring + drawing)
// ========================
interface ContentItem {
  type: "title" | "heading" | "subheading" | "bodyline" | "bodygap";
  text: string;
  gap?: number;
}

function buildPrivacyContent(ctx: CanvasRenderingContext2D, maxW: number): { items: ContentItem[]; totalH: number } {
  const items: ContentItem[] = [];
  let h = 0;

  function title(text: string) { items.push({ type: "title", text }); h += 30; }
  function heading(text: string) { items.push({ type: "heading", text }); h += 28 + 4; }
  function subheading(text: string) { items.push({ type: "subheading", text }); h += 22 + 2; }
  function body(text: string) {
    ctx.font = `400 14px DM Sans, Helvetica, Arial, sans-serif`;
    items.push({ type: "bodygap", text: "", gap: 4 }); h += 4;
    const lines = wrapText(ctx, text, maxW);
    for (const line of lines) { items.push({ type: "bodyline", text: line }); h += 18; }
    items.push({ type: "bodygap", text: "", gap: 6 }); h += 6;
  }

  title("Privacy Policy and Cookie Notice");
  heading("Introduction");
  body("Welcome to Evidente d.o.o. This Privacy Policy and Cookie Notice explain what data is processed when you use this website.");
  heading("Privacy Policy");
  subheading("Data We Process");
  body("We keep data processing to a minimum. When you browse the site, standard technical request data (such as IP address, browser type, and request time) may be processed by our hosting infrastructure for security and reliability. We also process language preference used to serve the website in English or Croatian.");
  subheading("What We Do Not Use");
  body("At this time, we do not use reCAPTCHA, Google Analytics, or similar third-party tracking tools on this website.");
  subheading("Use of Information");
  body("Any processed data is used only to deliver and protect the website, ensure stable operation, and improve usability. We do not sell or rent personal data.");
  heading("Cookie Policy");
  subheading("Essential Cookies");
  body("These are required for core functionality, such as remembering language preference (for example, NEXT_LOCALE where applicable).");
  subheading("Functional Cookies");
  body("We use a short-lived cookie named seenPreloader to avoid repeatedly showing the preloader animation. This cookie expires after approximately 10 minutes.");
  subheading("Analytics and Advertising Cookies");
  body("We do not currently set analytics or advertising cookies.");
  subheading("Managing Cookies");
  body("You can control or delete cookies through your browser settings. Disabling essential cookies may affect website behavior.");
  heading("Your Rights");
  body("You may request access, correction, deletion, restriction, objection, and data portability where applicable under relevant data protection law.");
  heading("Changes to This Policy");
  body("We may update this page from time to time. Please review it periodically for the latest version.");
  heading("Contact");
  body("If you have questions about privacy or cookies, contact us at support@evidente.hr.");

  return { items, totalH: h };
}

// ========================
// Text wrapping helper
// ========================
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ========================
// CLOCK
// ========================
function createClock(scene: THREE.Scene, x: number, y: number, z: number) {
  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const cx = s / 2;
  const cy = s / 2;
  const r = 240;

  ctx.clearRect(0, 0, s, s);

  ctx.fillStyle = "#f8f8f0";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 28), cy + Math.sin(a) * (r - 28));
    ctx.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12));
    ctx.stroke();
  }

  ctx.fillStyle = "#222";
  ctx.font = `bold 36px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    ctx.fillText(String(i), cx + Math.cos(a) * (r - 52), cy + Math.sin(a) * (r - 52));
  }

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

  ctx.fillStyle = "#cc3333";
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  const clockRadius = 0.6;
  const clockDepth = 0.06;
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(clockRadius, clockRadius, clockDepth, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(clockRadius - 0.005, 32),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.4, transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  face.position.z = clockDepth / 2 + 0.001;
  group.add(face);

  group.position.set(x, y, z);
  group.rotation.y = Math.PI;
  scene.add(group);
}

// ========================
// CALENDAR
// ========================
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
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI;
  scene.add(mesh);
}
