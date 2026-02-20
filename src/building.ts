import * as THREE from "three";

const W = 46;
const H = 40;
const D = 46;
const HALF_W = W / 2;
const HALF_D = D / 2;
const DOOR_W = 3; // each panel
const DOOR_H = 8;

const CONCRETE = 0xc8c0b4;
const TRIM = 0x555555;
const AWNING = 0x222222;

export function createBuilding(scene: THREE.Scene) {
  const wallMat = new THREE.MeshStandardMaterial({
    color: CONCRETE,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Lighter blue glass — semi-reflective, visible from both sides
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc,
    roughness: 0.05,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });

  // Dark interior visible behind glass
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x080810,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: TRIM,
    roughness: 0.5,
    metalness: 0.3,
  });

  const awningMat = new THREE.MeshStandardMaterial({
    color: AWNING,
    roughness: 0.7,
    metalness: 0.2,
  });

  // --- Walls (as boxes with some thickness) ---
  const wallThick = 0.3;

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, wallThick),
    wallMat
  );
  backWall.position.set(0, H / 2, -HALF_D);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, H, D),
    wallMat
  );
  leftWall.position.set(-HALF_W, H / 2, 0);
  leftWall.castShadow = true;
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, H, D),
    wallMat
  );
  rightWall.position.set(HALF_W, H / 2, 0);
  rightWall.castShadow = true;
  scene.add(rightWall);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.6, 0.4, D + 0.6),
    trimMat
  );
  roof.position.set(0, H, 0);
  roof.castShadow = true;
  scene.add(roof);

  // --- Front wall (with door opening) ---
  const panelW = (W - DOOR_W * 2) / 2;

  const frontLeft = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, H, wallThick),
    wallMat
  );
  frontLeft.position.set(-HALF_W + panelW / 2, H / 2, HALF_D);
  frontLeft.castShadow = true;
  scene.add(frontLeft);

  const frontRight = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, H, wallThick),
    wallMat
  );
  frontRight.position.set(HALF_W - panelW / 2, H / 2, HALF_D);
  frontRight.castShadow = true;
  scene.add(frontRight);

  // Top panel above door
  const topPanelH = H - DOOR_H;
  const topPanel = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W * 2, topPanelH, wallThick),
    wallMat
  );
  topPanel.position.set(0, DOOR_H + topPanelH / 2, HALF_D);
  scene.add(topPanel);

  // --- Floor-level ledges ---
  const ledgeH = 0.35;
  const ledgeProtrude = 0.45;
  for (const fy of [8, 16, 24, 32]) {
    for (const zs of [1, -1]) {
      const ledge = new THREE.Mesh(
        new THREE.BoxGeometry(W + 0.8, ledgeH, ledgeProtrude),
        trimMat
      );
      ledge.position.set(0, fy, zs * (HALF_D + ledgeProtrude / 2));
      ledge.castShadow = true;
      scene.add(ledge);
    }
    for (const xs of [1, -1]) {
      const ledge = new THREE.Mesh(
        new THREE.BoxGeometry(ledgeProtrude, ledgeH, D + 0.8),
        trimMat
      );
      ledge.position.set(xs * (HALF_W + ledgeProtrude / 2), fy, 0);
      ledge.castShadow = true;
      scene.add(ledge);
    }
  }

  // --- Windows ---
  const winW = 3.8;
  const winH = 4.5;

  // Side walls — 6 cols × 5 rows
  addSideWindows(scene, glassMat, trimMat, interiorMat,
    -HALF_W - 0.17, Math.PI / 2, new THREE.Vector3(0.22, 0, 0), winW, winH);
  addSideWindows(scene, glassMat, trimMat, interiorMat,
    HALF_W + 0.17, -Math.PI / 2, new THREE.Vector3(-0.22, 0, 0), winW, winH);

  // Back wall — 6 cols × 5 rows
  addBackWindows(scene, glassMat, trimMat, interiorMat,
    -HALF_D - 0.17, new THREE.Vector3(0, 0, 0.22), winW, winH);

  // Front wall — panels for lower floors, full width for upper floors
  addFrontWindows(scene, glassMat, trimMat, interiorMat,
    HALF_D + 0.17, new THREE.Vector3(0, 0, -0.22), winW, winH, panelW);

  // --- Door frame ---
  const frameT = 0.12;

  const doorFrameLeft = new THREE.Mesh(
    new THREE.BoxGeometry(frameT, DOOR_H, frameT * 2),
    trimMat
  );
  doorFrameLeft.position.set(-DOOR_W, DOOR_H / 2, HALF_D);
  scene.add(doorFrameLeft);

  const doorFrameRight = new THREE.Mesh(
    new THREE.BoxGeometry(frameT, DOOR_H, frameT * 2),
    trimMat
  );
  doorFrameRight.position.set(DOOR_W, DOOR_H / 2, HALF_D);
  scene.add(doorFrameRight);

  const doorFrameTop = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W * 2 + frameT * 2, frameT, frameT * 2),
    trimMat
  );
  doorFrameTop.position.set(0, DOOR_H, HALF_D);
  scene.add(doorFrameTop);

  // --- Awning ---
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W * 2 + 3, 0.15, 2),
    awningMat
  );
  awning.position.set(0, DOOR_H + 0.5, HALF_D + 1);
  awning.castShadow = true;
  scene.add(awning);

  for (const xOff of [-DOOR_W - 1.2, DOOR_W + 1.2]) {
    const support = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 2),
      trimMat
    );
    support.position.set(xOff, DOOR_H + 0.42, HALF_D + 1);
    scene.add(support);
  }

  // --- Company logo signs (loaded from SVG) ---
  const logoImg = new Image();
  logoImg.onload = () => {
    const aspect = logoImg.width / logoImg.height;

    // Sign above entrance door
    const entranceH = 2.0;
    const entranceW = entranceH * aspect;
    const entranceCanvas = document.createElement("canvas");
    entranceCanvas.width = 512;
    entranceCanvas.height = Math.round(512 / aspect);
    const ctx1 = entranceCanvas.getContext("2d")!;
    ctx1.drawImage(logoImg, 0, 0, entranceCanvas.width, entranceCanvas.height);
    const entranceTex = new THREE.CanvasTexture(entranceCanvas);
    entranceTex.minFilter = THREE.LinearFilter;
    entranceTex.colorSpace = THREE.SRGBColorSpace;

    const entranceSign = new THREE.Mesh(
      new THREE.PlaneGeometry(entranceW, entranceH),
      new THREE.MeshStandardMaterial({ map: entranceTex, roughness: 0.5, metalness: 0.1 })
    );
    entranceSign.position.set(0, DOOR_H + 2, HALF_D + 0.2);
    scene.add(entranceSign);

    // Jumbo billboard on top of building
    const billboardH = 6;
    const billboardW = billboardH * aspect;
    const billboardCanvas = document.createElement("canvas");
    billboardCanvas.width = 1024;
    billboardCanvas.height = Math.round(1024 / aspect);
    const ctx2 = billboardCanvas.getContext("2d")!;
    ctx2.drawImage(logoImg, 0, 0, billboardCanvas.width, billboardCanvas.height);
    const billboardTex = new THREE.CanvasTexture(billboardCanvas);
    billboardTex.minFilter = THREE.LinearFilter;
    billboardTex.colorSpace = THREE.SRGBColorSpace;

    const billboard = new THREE.Mesh(
      new THREE.PlaneGeometry(billboardW, billboardH),
      new THREE.MeshStandardMaterial({ map: billboardTex, roughness: 0.4, metalness: 0.1 })
    );
    billboard.position.set(0, H + billboardH / 2 + 0.5, HALF_D + 0.2);
    scene.add(billboard);

    // Billboard support structure
    const supportMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 });
    for (const xOff of [-billboardW / 3, billboardW / 3]) {
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, billboardH + 1, 0.15),
        supportMat
      );
      pole.position.set(xOff, H + (billboardH + 1) / 2, HALF_D + 0.1);
      scene.add(pole);
    }
  };
  logoImg.src = "./logo/evidente-logo-black-bg.svg";

  // --- Base trim ---
  const baseTrim = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.4, 0.4, D + 0.4),
    trimMat
  );
  baseTrim.position.set(0, 0.2, 0);
  scene.add(baseTrim);

  // --- Walkway ---
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x999990, roughness: 0.9 });
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W * 2 + 2, 20),
    pathMat
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, HALF_D + 10);
  path.receiveShadow = true;
  scene.add(path);
}

// ========================================
// Window helper — glass + dark interior backdrop + frame
// ========================================
function addWindow(
  scene: THREE.Scene,
  glassMat: THREE.Material,
  trimMat: THREE.Material,
  interiorMat: THREE.Material,
  x: number, y: number, z: number,
  rotY: number,
  intOffset: THREE.Vector3,
  winW: number, winH: number,
) {
  // Glass pane
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
  glass.position.set(x, y, z);
  glass.rotation.y = rotY;
  scene.add(glass);

  // Dark interior backdrop (slightly behind glass)
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(winW - 0.15, winH - 0.15),
    interiorMat
  );
  backdrop.position.set(x + intOffset.x, y, z + intOffset.z);
  backdrop.rotation.y = rotY;
  scene.add(backdrop);

  // Frame bars
  addWindowFrame(scene, trimMat, x, y, z, rotY, winW, winH);
}

// ========================================
// Side walls — 6 cols × 5 rows
// ========================================
function addSideWindows(
  scene: THREE.Scene,
  glassMat: THREE.Material,
  trimMat: THREE.Material,
  interiorMat: THREE.Material,
  x: number,
  rotY: number,
  intOffset: THREE.Vector3,
  winW: number,
  winH: number,
) {
  const cols = 6;
  const spacing = D / (cols + 1);
  const rowYs = [4, 12, 20, 28, 36];

  for (const y of rowYs) {
    for (let col = 0; col < cols; col++) {
      const z = -D / 2 + spacing * (col + 1);
      addWindow(scene, glassMat, trimMat, interiorMat, x, y, z, rotY, intOffset, winW, winH);
    }
  }
}

// ========================================
// Back wall — 6 cols × 5 rows
// ========================================
function addBackWindows(
  scene: THREE.Scene,
  glassMat: THREE.Material,
  trimMat: THREE.Material,
  interiorMat: THREE.Material,
  z: number,
  intOffset: THREE.Vector3,
  winW: number,
  winH: number,
) {
  const cols = 6;
  const spacing = W / (cols + 1);
  const rowYs = [4, 12, 20, 28, 36];

  for (const y of rowYs) {
    for (let col = 0; col < cols; col++) {
      const x = -W / 2 + spacing * (col + 1);
      addWindow(scene, glassMat, trimMat, interiorMat, x, y, z, Math.PI, intOffset, winW, winH);
    }
  }
}

// ========================================
// Front wall — panels for floors 1-2, full width for floors 3-5
// ========================================
function addFrontWindows(
  scene: THREE.Scene,
  glassMat: THREE.Material,
  trimMat: THREE.Material,
  interiorMat: THREE.Material,
  z: number,
  intOffset: THREE.Vector3,
  winW: number,
  winH: number,
  panelW: number,
) {
  const lowerYs = [4, 12];
  const upperYs = [20, 28, 36];

  // Floors 1-2: 2 windows per side panel (avoiding door area)
  const panelCols = 2;
  const panelSpacing = panelW / (panelCols + 1);

  for (const y of lowerYs) {
    // Left panel
    for (let col = 0; col < panelCols; col++) {
      const x = -W / 2 + panelSpacing * (col + 1);
      addWindow(scene, glassMat, trimMat, interiorMat, x, y, z, 0, intOffset, winW, winH);
    }
    // Right panel
    for (let col = 0; col < panelCols; col++) {
      const x = W / 2 - panelW + panelSpacing * (col + 1);
      addWindow(scene, glassMat, trimMat, interiorMat, x, y, z, 0, intOffset, winW, winH);
    }
  }

  // Floors 3-5: 6 windows across full building width
  const fullCols = 6;
  const fullSpacing = W / (fullCols + 1);

  for (const y of upperYs) {
    for (let col = 0; col < fullCols; col++) {
      const x = -W / 2 + fullSpacing * (col + 1);
      addWindow(scene, glassMat, trimMat, interiorMat, x, y, z, 0, intOffset, winW, winH);
    }
  }
}

// ========================================
// Window frame — 4 bars around glass
// ========================================
function addWindowFrame(
  scene: THREE.Scene,
  mat: THREE.Material,
  x: number, y: number, z: number,
  rotY: number,
  winW: number, winH: number,
) {
  const t = 0.1;
  const positions: [number, number, number, number][] = [
    [winW + t * 2, t, 0, winH / 2],   // top
    [winW + t * 2, t, 0, -winH / 2],  // bottom
    [t, winH, -winW / 2, 0],          // left
    [t, winH, winW / 2, 0],           // right
  ];

  for (const [fw, fh, ox, oy] of positions) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), mat);

    const offset = new THREE.Vector3(ox, oy, 0.01);
    if (rotY !== 0) {
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    }

    bar.position.set(x + offset.x, y + offset.y, z + offset.z);
    bar.rotation.y = rotY;
    scene.add(bar);
  }
}
