import '@fontsource/playfair-display/400.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/great-vibes/400.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import '../src/styles/space-transition.css';
import './style.css';

import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { initSpaceExit } from '../src/lib/space-transition.js';

import { GRASS_BLOCK_DATA, SUNFLOWER_BLOCK_DATA } from './meadow-models.js';
import { TULIP_BLOCK_DATA } from './tulip-model.js';

// ============================================================================
// MENSAJE SECRETO: Edita este bloque para cambiar el texto que se descubre
// ============================================================================
export const SECRET_MESSAGE = {
  title: "Para la flor más hermosa de mi universo",
  stanzas: [
    [
      "Tu llegada dio dicha a mi vida y a mi alma,",
      "cada vez que te veo a lo lejos, se me acelera el corazón",
      "y cada vez que me besas, se detiene el tiempo."
    ],
    [
      "Tu sonrisa me alegra el día,",
      "y tu voz es la melodía que deseo escuchar todas las mañanas",
      "por el resto de mi vida."
    ],
    [
      "Tu mirada hipnotiza mi mente, cuando veo tus ojos, veo el universo, y tu",
      "tacto me hace perder el control."
    ]
  ],
  signature: "❤️ Siempre tuyo, Rodrigo"
};

class SlitherMeadowGame {
  constructor() {
    this.stage = document.getElementById('girasol-stage');
    this.hudPercent = document.getElementById('hud-percent');
    this.hudFill = document.getElementById('hud-fill');
    this.secretModal = document.getElementById('secret-modal');

    this.fieldWidth = 90;
    this.fieldHeight = 90;
    this.totalMeadowBlocks = 0;
    this.eatenBlocks = 0;
    this.isGameCompleted = false;
    this.isPaused = false;

    // Pick a random stanza once per game session
    const stanzas = SECRET_MESSAGE.stanzas;
    this.selectedStanza = stanzas[Math.floor(Math.random() * stanzas.length)];

    // Snake properties
    this.segmentCount = 24;
    this.segmentSpacing = 1.05;
    this.baseSpeed = 21.0;
    this.boostSpeed = 35.0;
    this.currentSpeed = this.baseSpeed;
    this.isBoosting = false;

    // Snake color skins
    this.snakePalettes = {
      coral: {
        base: '#b85c70',
        dark: ['#4f2430', '#632e3d', '#3d1a25'],
        light: ['#c97488', '#d6879b', '#b3566b'],
        belly: ['#e3cdb8', '#dbc0a7', '#eed9c7'],
        tongue: 0xef4444,
      },
      emerald: {
        base: '#2d6a4f',
        dark: ['#1b4332', '#081c15', '#204e3b'],
        light: ['#40916c', '#52b788', '#74c69d'],
        belly: ['#d8f3dc', '#b7e4c7', '#95d5b2'],
        tongue: 0xf43f5e,
      },
      gold: {
        base: '#b45309',
        dark: ['#78350f', '#451a03', '#92400e'],
        light: ['#d97706', '#f59e0b', '#fbbf24'],
        belly: ['#fef3c7', '#fde68a', '#fef9c3'],
        tongue: 0xbe123c,
      },
      lavender: {
        base: '#7e22ce',
        dark: ['#581c87', '#3b0764', '#6b21a8'],
        light: ['#9333ea', '#a855f7', '#c084fc'],
        belly: ['#f3e8ff', '#e9d5ff', '#fae8ff'],
        tongue: 0xec4899,
      },
      night: {
        base: '#1e293b',
        dark: ['#0f172a', '#020617', '#1e1b4b'],
        light: ['#334155', '#475569', '#38bdf8'],
        belly: ['#cbd5e1', '#94a3b8', '#e2e8f0'],
        tongue: 0x06b6d4,
      },
    };
    this.currentSkin = 'coral';

    // Controls & continuous movement
    this.targetPoint = new THREE.Vector3(0, 0, 10);
    this.moveDirection = new THREE.Vector3(0, 0, 1);
    this.pointerDown = false;
    this.isUserSteering = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(0, 0);
    this.planeIntersect = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Mobile Boost button
    this.boostBtnEl = document.getElementById('mobile-boost-btn');

    // Virtual Joystick
    this.joystickEl = document.getElementById('touch-joystick');
    this.joystickKnob = this.joystickEl ? this.joystickEl.querySelector('.girasol-joystick__knob') : null;
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.touchOrigin = { x: 0, y: 0 };
    this.joystickVector = new THREE.Vector2(0, 0);

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupLights();
    this.setupGroundReveal();
    this.setupMeadowField();
    this.setupSnake();
    this.setupPollenParticles();
    this.setupEvents();
    this.populateModalText();

    initSpaceExit({ planetId: 'girasol', targetUrl: '../index.html' });

    this.clock = new THREE.Clock();
    this.startLoop();
  }

  setupRenderer() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x120c07);
    this.scene.fog = new THREE.FogExp2(0x160f09, 0.016);

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 500);
    this.camera.position.set(0, 36, 26);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.stage.appendChild(this.renderer.domElement);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.4);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffe6a3, 2.2);
    this.sunLight.position.set(40, 70, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.6);
    rimLight.position.set(-50, 20, -50);
    this.scene.add(rimLight);
  }

  setupGroundReveal() {
    // 1024x1024 dynamic canvas revealing golden secret message underneath
    this.canvasSize = 1024;
    this.groundCanvas = document.createElement('canvas');
    this.groundCanvas.width = this.canvasSize;
    this.groundCanvas.height = this.canvasSize;
    this.groundCtx = this.groundCanvas.getContext('2d');

    this.drawInitialGround();

    this.groundTexture = new THREE.CanvasTexture(this.groundCanvas);
    this.groundTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.groundTexture.wrapT = THREE.ClampToEdgeWrapping;

    const groundGeo = new THREE.PlaneGeometry(this.fieldWidth, this.fieldHeight, 32, 32);
    groundGeo.rotateX(-Math.PI * 0.5);

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      roughness: 0.82,
      metalness: 0.08,
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Outer boundary fence / soft hill ring
    const borderGeo = new THREE.RingGeometry(this.fieldWidth * 0.48, this.fieldWidth * 0.62, 48);
    borderGeo.rotateX(-Math.PI * 0.5);
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0x0c0805,
      side: THREE.DoubleSide,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.y = -0.05;
    this.scene.add(borderMesh);
  }

  drawInitialGround() {
    const ctx = this.groundCtx;
    const w = this.canvasSize;
    const h = this.canvasSize;

    // Deep fertile cosmic soil base
    ctx.fillStyle = '#1c120a';
    ctx.fillRect(0, 0, w, h);

    // Subtle soil texture specks
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(50, 32, 16, 0.4)' : 'rgba(234, 179, 8, 0.06)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Secret Golden Letter calligraphed onto the deep soil
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glowing golden ambient aura around the message
    const auraGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 360);
    auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.38)');
    auraGrad.addColorStop(0.6, 'rgba(251, 113, 133, 0.18)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, w, h);

    // Decorative golden frame
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(140, 140, w - 280, h - 280);

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(152, 152, w - 304, h - 304);

    // Message Title
    ctx.font = 'bold 36px "Playfair Display", serif';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
    ctx.shadowBlur = 18;
    ctx.fillText(SECRET_MESSAGE.title, w / 2, 230);

    // Message Lines
    ctx.font = '24px "Montserrat", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    const startY = 320;
    const lineSpacing = 68;
    this.selectedStanza.forEach((line, idx) => {
      ctx.fillText(line, w / 2, startY + idx * lineSpacing);
    });

    // Signature
    ctx.font = 'italic 44px "Great Vibes", cursive';
    ctx.fillStyle = '#fbcfe8';
    ctx.shadowColor = 'rgba(244, 63, 94, 0.9)';
    ctx.shadowBlur = 15;
    ctx.fillText(SECRET_MESSAGE.signature, w / 2, 740);

    ctx.restore();
  }

  revealGroundAt(worldX, worldZ, radius = 4.2) {
    // World coordinates [-fieldWidth/2, fieldWidth/2] -> Canvas [0, canvasSize]
    const u = (worldX + this.fieldWidth * 0.5) / this.fieldWidth;
    const v = (worldZ + this.fieldHeight * 0.5) / this.fieldHeight;

    if (u < 0 || u > 1 || v < 0 || v > 1) return;

    const cx = u * this.canvasSize;
    const cy = v * this.canvasSize;
    const r = (radius / this.fieldWidth) * this.canvasSize * 1.6;

    const ctx = this.groundCtx;
    ctx.save();
    // Illuminating cleared golden sheen on the soil
    const shine = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    shine.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
    shine.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    shine.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.groundTexture.needsUpdate = true;
  }

  buildGeometryFromData(data) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    if (data.normals) {
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    }
    if (data.uvs) {
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    }
    if (data.indices) {
      geo.setIndex(data.indices);
    }
    if (!data.normals) {
      geo.computeVertexNormals();
    }
    return geo;
  }

  setupMeadowField() {
    // 1. Build Grass block geometry and original texture material
    const grassGeo = this.buildGeometryFromData(GRASS_BLOCK_DATA);
    const grassTexLoader = new THREE.TextureLoader();
    const grassTexture = grassTexLoader.load(GRASS_BLOCK_DATA.textureDataUrl);
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    grassTexture.magFilter = THREE.NearestFilter;
    grassTexture.minFilter = THREE.NearestMipmapLinearFilter;

    this.grassMaterial = new THREE.MeshStandardMaterial({
      map: grassTexture,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    // 2. Build Sunflower block geometry and original texture material
    const sunflowerGeo = this.buildGeometryFromData(SUNFLOWER_BLOCK_DATA);
    const sfTexLoader = new THREE.TextureLoader();
    const sfTexture = sfTexLoader.load(SUNFLOWER_BLOCK_DATA.textureDataUrl);
    sfTexture.colorSpace = THREE.SRGBColorSpace;
    sfTexture.magFilter = THREE.NearestFilter;
    sfTexture.minFilter = THREE.NearestMipmapLinearFilter;

    this.sunflowerMaterial = new THREE.MeshStandardMaterial({
      map: sfTexture,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
      alphaTest: 0.05,
    });

    // 2b. Tulip block, restyled from the photoreal GLB to match the voxel look
    const tulipGeo = this.buildGeometryFromData(TULIP_BLOCK_DATA);
    const tulipTexLoader = new THREE.TextureLoader();
    const tulipTexture = tulipTexLoader.load(TULIP_BLOCK_DATA.textureDataUrl);
    tulipTexture.colorSpace = THREE.SRGBColorSpace;
    tulipTexture.magFilter = THREE.NearestFilter;
    tulipTexture.minFilter = THREE.NearestMipmapLinearFilter;

    this.tulipMaterial = new THREE.MeshStandardMaterial({
      map: tulipTexture,
      roughness: 0.78,
      metalness: 0.03,
      side: THREE.DoubleSide,
      alphaTest: 0.05,
    });

    // 3. Meadow block grid distribution: grass everywhere, sunflowers on a coarser lattice
    // Models scaled up substantially so they look prominent and rich
    const cols = 26;
    const rows = 26;
    const spacing = 3.25;

    const blockConfigs = [];
    const offsetX = ((cols - 1) * spacing) * 0.5;
    const offsetZ = ((rows - 1) * spacing) * 0.5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const baseX = c * spacing - offsetX;
        const baseZ = r * spacing - offsetZ;

        // Leave a comfortable safe spawning clearing around origin (0, 0)
        const distFromCenter = Math.hypot(baseX, baseZ);
        if (distFromCenter < 4.2) continue;

        // Organic position scatter
        const jitterX = (Math.random() - 0.5) * 0.85;
        const jitterZ = (Math.random() - 0.5) * 0.85;
        const x = baseX + jitterX;
        const z = baseZ + jitterZ;

        // Sunflowers sit on a coarser lattice. Their block model is 3 units wide,
        // so placing one per cell at the field's 3.25 spacing made neighbouring
        // flower heads interpenetrate into an unreadable canopy of yellow slabs.
        const onSunflowerLattice = c % 3 === 1 && r % 3 === 1;
        const isSunflower = onSunflowerLattice && Math.random() > 0.15;
        // Tulips are far thinner (0.35 wide), so they fill the cells in between
        const isTulip = !onSunflowerLattice && Math.random() > 0.72;

        // Random continuous Y-axis rotation (0 to 360 degrees)
        // Clean Y rotation preserves the vertical stem and upright flower petals without distortion
        const rotY = Math.random() * Math.PI * 2;

        // Scales keep each block within its lattice spacing. Base models:
        // grass 1.6x1.2x1.5, sunflower 3x1.5x3, tulip 0.35x1.5x0.36.
        const scale = isSunflower
          ? 2.50 + Math.random() * 0.30
          : isTulip
            ? 2.10 + Math.random() * 0.70
            : 2.65 + Math.random() * 0.45;

        blockConfigs.push({
          x,
          z,
          isSunflower,
          isTulip,
          rotY,
          scale,
        });
      }
    }

    const grassList = blockConfigs.filter(b => !b.isSunflower && !b.isTulip);
    const sunflowerList = blockConfigs.filter(b => b.isSunflower);
    const tulipList = blockConfigs.filter(b => b.isTulip);

    this.totalMeadowBlocks = blockConfigs.length;
    this.eatenBlocks = 0;

    // 4. Create an InstancedMesh per block type
    this.grassMesh = new THREE.InstancedMesh(grassGeo, this.grassMaterial, grassList.length);
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    this.sunflowerMesh = new THREE.InstancedMesh(sunflowerGeo, this.sunflowerMaterial, sunflowerList.length);
    this.sunflowerMesh.castShadow = true;
    this.sunflowerMesh.receiveShadow = true;

    this.tulipMesh = new THREE.InstancedMesh(tulipGeo, this.tulipMaterial, tulipList.length);
    this.tulipMesh.castShadow = true;
    this.tulipMesh.receiveShadow = true;

    this.blocksData = [];
    this.gridBuckets = new Map();
    this.gridCellSize = 6.0;

    const dummy = new THREE.Object3D();

    // Populate Grass InstancedMesh
    grassList.forEach((b, idx) => {
      dummy.position.set(b.x, 0, b.z);
      dummy.rotation.set(0, b.rotY, 0);
      dummy.scale.set(b.scale, b.scale, b.scale);
      dummy.updateMatrix();
      this.grassMesh.setMatrixAt(idx, dummy.matrix);

      const blockObj = {
        id: this.blocksData.length,
        type: 'grass',
        meshIndex: idx,
        x: b.x,
        z: b.z,
        scale: b.scale,
        isEaten: false,
      };
      this.blocksData.push(blockObj);

      const cellKey = this.getCellKey(b.x, b.z);
      if (!this.gridBuckets.has(cellKey)) this.gridBuckets.set(cellKey, []);
      this.gridBuckets.get(cellKey).push(blockObj);
    });

    // Populate Sunflower InstancedMesh
    sunflowerList.forEach((b, idx) => {
      dummy.position.set(b.x, 0, b.z);
      dummy.rotation.set(0, b.rotY, 0);
      dummy.scale.set(b.scale, b.scale, b.scale);
      dummy.updateMatrix();
      this.sunflowerMesh.setMatrixAt(idx, dummy.matrix);

      const blockObj = {
        id: this.blocksData.length,
        type: 'sunflower',
        meshIndex: idx,
        x: b.x,
        z: b.z,
        scale: b.scale,
        isEaten: false,
      };
      this.blocksData.push(blockObj);

      const cellKey = this.getCellKey(b.x, b.z);
      if (!this.gridBuckets.has(cellKey)) this.gridBuckets.set(cellKey, []);
      this.gridBuckets.get(cellKey).push(blockObj);
    });

    // Populate Tulip InstancedMesh
    tulipList.forEach((b, idx) => {
      dummy.position.set(b.x, 0, b.z);
      dummy.rotation.set(0, b.rotY, 0);
      dummy.scale.set(b.scale, b.scale, b.scale);
      dummy.updateMatrix();
      this.tulipMesh.setMatrixAt(idx, dummy.matrix);

      const blockObj = {
        id: this.blocksData.length,
        type: 'tulip',
        meshIndex: idx,
        x: b.x,
        z: b.z,
        scale: b.scale,
        isEaten: false,
      };
      this.blocksData.push(blockObj);

      const cellKey = this.getCellKey(b.x, b.z);
      if (!this.gridBuckets.has(cellKey)) this.gridBuckets.set(cellKey, []);
      this.gridBuckets.get(cellKey).push(blockObj);
    });

    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.sunflowerMesh.instanceMatrix.needsUpdate = true;
    this.tulipMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.grassMesh);
    this.scene.add(this.sunflowerMesh);
    this.scene.add(this.tulipMesh);

    this.updateHUD();
  }

  getCellKey(x, z) {
    const gx = Math.floor(x / this.gridCellSize);
    const gz = Math.floor(z / this.gridCellSize);
    return `${gx}_${gz}`;
  }

  createVoxelCanvasTexture(type, skinName = this.currentSkin) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const pal = this.snakePalettes[skinName] || this.snakePalettes.coral;
    const baseColor = pal.base;
    const darkBands = pal.dark;
    const lightBands = pal.light;
    const bellyTan = pal.belly;

    if (type === 'head') {
      // Base color
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 16, 16);

      // Top diamond/chevron pattern (reference snake.png)
      ctx.fillStyle = darkBands[0];
      ctx.fillRect(4, 2, 8, 4);
      ctx.fillRect(6, 6, 4, 3);
      ctx.fillStyle = lightBands[0];
      ctx.fillRect(5, 3, 6, 2);

      // Sides shading
      ctx.fillStyle = darkBands[1] || darkBands[0];
      ctx.fillRect(0, 0, 2, 16);
      ctx.fillRect(14, 0, 2, 16);

      // Belly underside
      ctx.fillStyle = bellyTan[0];
      ctx.fillRect(0, 13, 16, 3);
    } else {
      // Body segments with alternating voxel banded stripes (reference snake.png)
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 16, 16);

      // Distinct dark & warm stripes
      for (let y = 0; y < 16; y += 4) {
        ctx.fillStyle = darkBands[(y / 4) % darkBands.length];
        ctx.fillRect(2, y, 12, 2);
        ctx.fillStyle = lightBands[(y / 4) % lightBands.length];
        ctx.fillRect(2, y + 2, 12, 2);
      }

      // Micro-pixel variations for authentic Minecraft/voxel look
      for (let px = 2; px < 14; px += 2) {
        for (let py = 0; py < 16; py += 2) {
          if (Math.random() > 0.6) {
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }

      // Creamy pale underside belly
      ctx.fillStyle = bellyTan[0];
      ctx.fillRect(0, 13, 16, 3);
      ctx.fillStyle = bellyTan[1] || bellyTan[0];
      ctx.fillRect(0, 15, 16, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  setSnakeSkin(skinName) {
    if (!this.snakePalettes[skinName]) return;
    this.currentSkin = skinName;

    // Generate new canvas textures for the chosen skin
    const newHeadTex = this.createVoxelCanvasTexture('head', skinName);
    const newBodyTex = this.createVoxelCanvasTexture('body', skinName);

    if (this.snakeHeadMat) {
      this.snakeHeadMat.map = newHeadTex;
      this.snakeHeadMat.needsUpdate = true;
    }
    if (this.snakeBodyMat) {
      this.snakeBodyMat.map = newBodyTex;
      this.snakeBodyMat.needsUpdate = true;
    }
    if (this.snakeTongueMat) {
      const pal = this.snakePalettes[skinName];
      this.snakeTongueMat.color.setHex(pal.tongue || 0xef4444);
      this.snakeTongueMat.needsUpdate = true;
    }

    // Update active UI swatch chip
    const chips = document.querySelectorAll('.girasol-skin-chip');
    chips.forEach((chip) => {
      if (chip.getAttribute('data-skin') === skinName) {
        chip.classList.add('is-active');
      } else {
        chip.classList.remove('is-active');
      }
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(10); } catch {}
    }
  }

  setupSnake() {
    this.snakeSegments = [];
    this.snakeGroup = new THREE.Group();
    this.scene.add(this.snakeGroup);

    // Matte non-shiny Voxel Materials (roughness 0.95, metalness 0.0, zero emissive)
    const headTex = this.createVoxelCanvasTexture('head');
    const bodyTex = this.createVoxelCanvasTexture('body');

    this.snakeHeadMat = new THREE.MeshStandardMaterial({
      map: headTex,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    });

    this.snakeBodyMat = new THREE.MeshStandardMaterial({
      map: bodyTex,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221118 });
    const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.snakeTongueMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true,
    });

    const baseWidth = 2.1;
    const baseHeight = 1.25;
    const baseDepth = 2.3;

    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / (this.segmentCount - 1);
      // Subtle graceful taper towards the tail
      const taper = i === 0 ? 1.05 : THREE.MathUtils.lerp(0.98, 0.42, Math.pow(t, 1.2));
      const w = baseWidth * taper;
      const h = baseHeight * taper;
      const d = baseDepth * taper;

      const segGroup = new THREE.Group();

      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(boxGeo, i === 0 ? this.snakeHeadMat : this.snakeBodyMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.y = h * 0.5 + 0.04;
      segGroup.add(mesh);

      // Start snake stretched along negative Z
      segGroup.position.set(0, 0, -i * this.segmentSpacing);

      // Head decorations: voxel eyes and animated forked tongue
      if (i === 0) {
        // Voxel blocky eyes on sides of the snout
        const eyeW = 0.28;
        const eyeH = 0.28;
        const eyeD = 0.48;
        const eyeGeo = new THREE.BoxGeometry(eyeW, eyeH, eyeD);

        // Left eye
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(w * 0.49, h * 0.72, d * 0.18);
        const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeW * 0.5, eyeH * 0.5, eyeD * 0.5), eyeHighlightMat);
        leftPupil.position.set(w * 0.52, h * 0.82, d * 0.26);
        segGroup.add(leftEye, leftPupil);

        // Right eye
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(-w * 0.49, h * 0.72, d * 0.18);
        const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeW * 0.5, eyeH * 0.5, eyeD * 0.5), eyeHighlightMat);
        rightPupil.position.set(-w * 0.52, h * 0.82, d * 0.26);
        segGroup.add(rightEye, rightPupil);

        // Voxel forked red tongue
        this.tongueGroup = new THREE.Group();
        this.tongueGroup.position.set(0, h * 0.35, d * 0.5);

        // Main tongue stem
        const stemGeo = new THREE.BoxGeometry(0.24, 0.1, 0.85);
        const stemMesh = new THREE.Mesh(stemGeo, this.snakeTongueMat);
        stemMesh.position.z = 0.42;
        this.tongueGroup.add(stemMesh);

        // Left fork tip
        const forkGeo = new THREE.BoxGeometry(0.12, 0.1, 0.36);
        const leftFork = new THREE.Mesh(forkGeo, this.snakeTongueMat);
        leftFork.position.set(0.12, 0, 0.98);
        leftFork.rotation.y = 0.32;
        this.tongueGroup.add(leftFork);

        // Right fork tip
        const rightFork = new THREE.Mesh(forkGeo, this.snakeTongueMat);
        rightFork.position.set(-0.12, 0, 0.98);
        rightFork.rotation.y = -0.32;
        this.tongueGroup.add(rightFork);

        segGroup.add(this.tongueGroup);
        this.snakeHeadMesh = segGroup;
      }

      this.snakeSegments.push({
        mesh: segGroup,
        pos: segGroup.position.clone(),
        width: w,
        height: h,
      });
      this.snakeGroup.add(segGroup);
    }
  }

  setupPollenParticles() {
    this.maxPollen = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxPollen * 3);
    const colors = new Float32Array(this.maxPollen * 3);

    for (let i = 0; i < this.maxPollen; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // hide initially
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 0.98;
      colors[i * 3 + 1] = 0.92;
      colors[i * 3 + 2] = 0.35;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.pollenMesh = new THREE.Points(geo, mat);
    this.scene.add(this.pollenMesh);

    this.activePollen = [];
  }

  spawnPollen(x, z, count = 6) {
    for (let i = 0; i < count; i++) {
      this.activePollen.push({
        x: x + (Math.random() - 0.5) * 1.5,
        y: 0.8 + Math.random() * 1.2,
        z: z + (Math.random() - 0.5) * 1.5,
        vx: (Math.random() - 0.5) * 4.0,
        vy: 3.5 + Math.random() * 3.5,
        vz: (Math.random() - 0.5) * 4.0,
        life: 1.0,
      });
      if (this.activePollen.length > this.maxPollen) {
        this.activePollen.shift();
      }
    }
  }

  updatePollen(delta) {
    const posAttr = this.pollenMesh.geometry.attributes.position;
    const array = posAttr.array;

    for (let i = 0; i < this.maxPollen; i++) {
      if (i < this.activePollen.length) {
        const p = this.activePollen[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        p.vy -= 8.0 * delta; // gravity
        p.life -= delta * 1.6;

        array[i * 3] = p.x;
        array[i * 3 + 1] = p.y;
        array[i * 3 + 2] = p.z;

        if (p.life <= 0 || p.y < 0) {
          this.activePollen.splice(i, 1);
          i--;
        }
      } else {
        array[i * 3 + 1] = -100;
      }
    }
    posAttr.needsUpdate = true;
  }

  setupEvents() {
    const updateTargetFromPointer = (clientX, clientY) => {
      this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersection = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.planeIntersect, intersection)) {
        this.targetPoint.copy(intersection);
      }
    };

    // Touch steering is relative: the direction the finger is pulled from where it
    // first landed becomes the heading. Aiming at the absolute point under the finger
    // meant the hand covered the snake and short drags whipped the heading around.
    const TOUCH_DEAD_ZONE = 12;

    const steerFromTouch = (clientX, clientY) => {
      const dx = clientX - this.touchOrigin.x;
      const dy = clientY - this.touchOrigin.y;
      const mag = Math.hypot(dx, dy);
      if (mag < TOUCH_DEAD_ZONE) return; // inside the dead zone the snake keeps cruising

      this.isUserSteering = true;
      const head = this.snakeSegments[0].pos;
      // The camera looks straight down -Z with no yaw, so screen +x maps to world +x
      // and screen +y maps to world +z.
      this.targetPoint.set(head.x + (dx / mag) * 20, 0, head.z + (dy / mag) * 20);
    };

    const moveJoystickKnob = (clientX, clientY) => {
      if (!this.joystickActive || !this.joystickKnob) return;
      const dx = clientX - this.joystickCenter.x;
      const dy = clientY - this.joystickCenter.y;
      const dist = Math.min(42, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      this.joystickKnob.style.transform =
        `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
    };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        // Mouse keeps precise absolute aiming at the point under the cursor.
        this.isUserSteering = true;
        updateTargetFromPointer(e.clientX, e.clientY);
        return;
      }

      if (this.pointerDown) {
        steerFromTouch(e.clientX, e.clientY);
        moveJoystickKnob(e.clientX, e.clientY);
      }
    });

    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.secret-modal') || e.target.closest('.cosmos-exit-btn') || e.target.closest('.girasol-boost-btn')) return;
      this.pointerDown = true;

      // On desktop mouse: absolute aiming, plus holding left click triggers turbo boost
      if (e.pointerType === 'mouse') {
        this.isUserSteering = true;
        updateTargetFromPointer(e.clientX, e.clientY);
        this.isBoosting = true;
        this.currentSpeed = this.boostSpeed;
        return;
      }

      // On touch: remember where the drag starts. The drag steers relative to this
      // origin, so the snake never jumps to the point under the finger.
      this.touchOrigin = { x: e.clientX, y: e.clientY };
      if (this.joystickEl) {
        this.joystickActive = true;
        this.joystickCenter = { x: e.clientX, y: e.clientY };
        this.joystickEl.style.left = `${e.clientX}px`;
        this.joystickEl.style.top = `${e.clientY}px`;
        this.joystickEl.classList.add('is-active');
        if (this.joystickKnob) {
          this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        }
      }
    });

    const onPointerUp = (e) => {
      this.pointerDown = false;
      this.isUserSteering = false;
      if (!e || e.pointerType === 'mouse') {
        this.isBoosting = false;
        this.currentSpeed = this.baseSpeed;
      }
      if (this.joystickEl) {
        this.joystickActive = false;
        this.joystickEl.classList.remove('is-active');
      }
    };

    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Dedicated Mobile Boost (Turbo) Button events
    if (this.boostBtnEl) {
      const activateBoost = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isBoosting = true;
        this.currentSpeed = this.boostSpeed;
        this.boostBtnEl.classList.add('is-active');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch {}
        }
      };

      const deactivateBoost = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isBoosting = false;
        this.currentSpeed = this.baseSpeed;
        this.boostBtnEl.classList.remove('is-active');
      };

      this.boostBtnEl.addEventListener('pointerdown', activateBoost);
      this.boostBtnEl.addEventListener('pointerup', deactivateBoost);
      this.boostBtnEl.addEventListener('pointercancel', deactivateBoost);
      this.boostBtnEl.addEventListener('touchstart', activateBoost, { passive: false });
      this.boostBtnEl.addEventListener('touchend', deactivateBoost, { passive: false });
    }

    // Touch movement steering (pointer events already cover touch on modern
    // browsers; this stays as a fallback path for older engines)
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      steerFromTouch(touch.clientX, touch.clientY);
      moveJoystickKnob(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener('touchend', () => { this.isUserSteering = false; }, { passive: true });
    window.addEventListener('touchcancel', () => { this.isUserSteering = false; }, { passive: true });

    // Snake Skin Picker buttons
    const skinChips = document.querySelectorAll('.girasol-skin-chip');
    skinChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const skin = chip.getAttribute('data-skin');
        if (skin) this.setSnakeSkin(skin);
      });
    });

    // Modal buttons
    const closeBtn = document.getElementById('secret-close');
    const restartBtn = document.getElementById('secret-btn-restart');
    const closeModal = () => this.secretModal.classList.remove('is-visible');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());

    // Responsive resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  populateModalText() {
    const titleEl = document.getElementById('secret-title');
    const bodyEl = document.getElementById('secret-body');
    const sigEl = document.getElementById('secret-sig');

    if (titleEl) titleEl.textContent = SECRET_MESSAGE.title;
    if (sigEl) sigEl.textContent = SECRET_MESSAGE.signature;

    if (bodyEl) {
      bodyEl.innerHTML = this.selectedStanza
        .map((line) => `<p>${line}</p>`)
        .join('');
    }
  }

  eatBlocksNearHead(headPos) {
    const eatRadius = 3.2;
    const dummy = new THREE.Object3D();
    let hasEatenAny = false;
    let grassUpdated = false;
    let sunflowerUpdated = false;
    let tulipUpdated = false;

    // Check surrounding 3x3 cells in spatial grid
    const centerCellX = Math.floor(headPos.x / this.gridCellSize);
    const centerCellZ = Math.floor(headPos.z / this.gridCellSize);

    for (let gx = centerCellX - 1; gx <= centerCellX + 1; gx++) {
      for (let gz = centerCellZ - 1; gz <= centerCellZ + 1; gz++) {
        const cellKey = `${gx}_${gz}`;
        const blocks = this.gridBuckets.get(cellKey);
        if (!blocks) continue;

        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          if (b.isEaten) continue;

          const dx = b.x - headPos.x;
          const dz = b.z - headPos.z;
          const distSq = dx * dx + dz * dz;

          if (distSq < eatRadius * eatRadius) {
            b.isEaten = true;
            this.eatenBlocks++;
            hasEatenAny = true;

            // Collapse block by moving beneath the ground and setting scale to near 0
            dummy.position.set(b.x, -5, b.z);
            dummy.scale.set(0.001, 0.001, 0.001);
            dummy.updateMatrix();

            if (b.type === 'grass') {
              this.grassMesh.setMatrixAt(b.meshIndex, dummy.matrix);
              grassUpdated = true;
              // Subtle earthy green-gold pollen burst
              this.spawnPollen(b.x, b.z, 2);
            } else if (b.type === 'tulip') {
              this.tulipMesh.setMatrixAt(b.meshIndex, dummy.matrix);
              tulipUpdated = true;
              // Delicate golden tulip pollen burst
              this.spawnPollen(b.x, b.z, 3);
            } else {
              this.sunflowerMesh.setMatrixAt(b.meshIndex, dummy.matrix);
              sunflowerUpdated = true;
              // Radiant golden sunflower pollen burst
              this.spawnPollen(b.x, b.z, 4);
            }
          }
        }
      }
    }

    if (hasEatenAny) {
      if (grassUpdated) this.grassMesh.instanceMatrix.needsUpdate = true;
      if (sunflowerUpdated) this.sunflowerMesh.instanceMatrix.needsUpdate = true;
      if (tulipUpdated) this.tulipMesh.instanceMatrix.needsUpdate = true;

      this.revealGroundAt(headPos.x, headPos.z, 4.6);
      this.updateHUD();

      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(8); } catch {}
      }

      // Check win condition (92% of meadow cleared)
      if (!this.isGameCompleted && this.eatenBlocks >= this.totalMeadowBlocks * 0.92) {
        this.triggerGameCompletion();
      }
    }
  }

  updateHUD() {
    if (!this.totalMeadowBlocks) return;
    const pct = Math.min(100, Math.floor((this.eatenBlocks / this.totalMeadowBlocks) * 100));
    if (this.hudPercent) this.hudPercent.textContent = `${pct}%`;
    if (this.hudFill) this.hudFill.style.width = `${pct}%`;
  }

  triggerGameCompletion() {
    this.isGameCompleted = true;
    // Freeze the snake while the letter is on screen
    this.isPaused = true;

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fb7185', '#fde047', '#ffffff', '#e11d48'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 120,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fde047', '#ffccd5'],
        });
      }, 500);
    } catch {}

    // Fully reveal ground canvas
    const ctx = this.groundCtx;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    this.groundTexture.needsUpdate = true;

    // Show secret love letter modal after a brief celebratory moment
    setTimeout(() => {
      this.secretModal.classList.add('is-visible');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([30, 60, 90]); } catch {}
      }
    }, 1200);
  }

  restartGame() {
    this.secretModal.classList.remove('is-visible');

    // Tear down the cleared meadow so the letter is buried under fresh plants again
    for (const mesh of [this.grassMesh, this.sunflowerMesh, this.tulipMesh]) {
      if (!mesh) continue;
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material.map) mesh.material.map.dispose();
      mesh.material.dispose();
    }
    this.grassMesh = null;
    this.sunflowerMesh = null;
    this.tulipMesh = null;

    // Rebuild the snake at its starting pose
    if (this.snakeGroup) {
      this.scene.remove(this.snakeGroup);
      this.snakeGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      this.snakeGroup = null;
    }
    for (const mat of [this.snakeHeadMat, this.snakeBodyMat, this.snakeTongueMat]) {
      if (!mat) continue;
      if (mat.map) mat.map.dispose();
      mat.dispose();
    }

    this.moveDirection.set(0, 0, 1);
    this.targetPoint.set(0, 0, 10);
    this.isUserSteering = false;
    this.isBoosting = false;
    this.currentSpeed = this.baseSpeed;

    // Every run gets its own random stanza
    const stanzas = SECRET_MESSAGE.stanzas;
    this.selectedStanza = stanzas[Math.floor(Math.random() * stanzas.length)];

    this.drawInitialGround();
    this.setupMeadowField();
    this.setupSnake();
    this.populateModalText();

    this.isGameCompleted = false;
    this.isPaused = false;
    this.updateHUD();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(20); } catch {}
    }
  }

  updateSnake(delta) {
    if (this.isPaused) return;

    const head = this.snakeSegments[0];
    const headPos = head.pos;

    // When not actively steering, project targetPoint ahead so the snake cruises straight
    if (!this.isUserSteering) {
      this.targetPoint.copy(headPos).addScaledVector(this.moveDirection, 20);
    }

    // Calculate desired steering direction towards target point
    const desiredDir = new THREE.Vector3().subVectors(this.targetPoint, headPos);
    desiredDir.y = 0;
    const distToTarget = desiredDir.length();

    if (this.isUserSteering && distToTarget > 0.6) {
      desiredDir.normalize();
      // Smoothly steer current forward direction towards desired target direction
      const turnRate = 6.5 * delta;
      this.moveDirection.lerp(desiredDir, THREE.MathUtils.clamp(turnRate, 0.05, 0.35)).normalize();
    }

    // Always move continuously forward — the snake NEVER stops!
    const moveDist = this.currentSpeed * delta;
    headPos.addScaledVector(this.moveDirection, moveDist);

    // Bounce / deflect softly if colliding with meadow border boundaries
    const bound = this.fieldWidth * 0.46;
    if (Math.abs(headPos.x) > bound) {
      headPos.x = Math.sign(headPos.x) * bound;
      this.moveDirection.x *= -0.8;
      this.moveDirection.normalize();
      this.targetPoint.copy(headPos).addScaledVector(this.moveDirection, 15);
    }
    if (Math.abs(headPos.z) > bound) {
      headPos.z = Math.sign(headPos.z) * bound;
      this.moveDirection.z *= -0.8;
      this.moveDirection.normalize();
      this.targetPoint.copy(headPos).addScaledVector(this.moveDirection, 15);
    }

    head.mesh.position.copy(headPos);
    head.mesh.lookAt(headPos.x + this.moveDirection.x, headPos.y, headPos.z + this.moveDirection.z);

    // Eat meadow blocks as head slithers over them
    this.eatBlocksNearHead(headPos);

    // Segments smoothly follow preceding segment (Inverse Kinematics / verlet constraint)
    for (let i = 1; i < this.snakeSegments.length; i++) {
      const prev = this.snakeSegments[i - 1];
      const curr = this.snakeSegments[i];

      const segDir = new THREE.Vector3().subVectors(curr.pos, prev.pos);
      segDir.y = 0;
      const segDist = segDir.length();

      if (segDist > 0.001) {
        segDir.normalize();
        // Maintain fixed distance from previous segment
        curr.pos.copy(prev.pos).addScaledVector(segDir, this.segmentSpacing);
        curr.mesh.position.copy(curr.pos);
        curr.mesh.lookAt(prev.pos.x, curr.pos.y, prev.pos.z);
      }
    }

    // Camera smoothly follows the snake head with an isometric angle
    const targetCamX = headPos.x;
    const targetCamZ = headPos.z + 28;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.07;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.07;
    this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z - 28);
  }

  startLoop() {
    const animate = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const time = this.clock.getElapsedTime();

      // Animate forked voxel tongue flicking in and out
      if (this.tongueGroup) {
        // Flickers periodically every 1.8 seconds with double darting motion
        const cycle = (time * 2.2) % (Math.PI * 2);
        const flick = Math.sin(time * 14.0);
        const isActive = Math.sin(cycle) > 0.45;
        if (isActive) {
          this.tongueGroup.scale.set(1, 1, 0.8 + flick * 0.45);
          this.tongueGroup.position.z = (this.snakeSegments[0].height || 1.25) * 0.5 + 0.15 + (flick > 0 ? 0.35 : 0.05);
          this.tongueGroup.visible = true;
        } else {
          this.tongueGroup.scale.set(1, 1, 0.05);
          this.tongueGroup.visible = false;
        }
      }

      this.updateSnake(delta);
      this.updatePollen(delta);

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

function initGame() {
  new SlitherMeadowGame();

  // Header cosmos exit button
  initSpaceExit({ planetId: 'girasol' });

  // Modal "Volver al cosmos" button
  const modalCosmosBtn = document.querySelector('.secret-modal__btn--cosmos');
  if (modalCosmosBtn) {
    initSpaceExit({ planetId: 'girasol', customButton: modalCosmosBtn });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
