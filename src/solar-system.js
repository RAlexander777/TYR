import * as THREE from 'three';
import { PLANETS } from './planets-data.js';

class ThreeSolarSystem {
  constructor(container) {
    this.container = container;
    this.stage = container.querySelector('.solar-system__stage');
    this.previewModal = container.querySelector('.planet-preview');
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.selectedPlanet = null;
    this.hoveredPlanet = null;
    this.isDragging = false;
    this.hasDragged = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Default overview camera angles
    this.cameraRotY = 0;
    this.cameraRotX = 0.12;
    this.targetCameraRotY = 0;
    this.targetCameraRotX = 0.12;
    // Responsive overview camera distance based on viewport width
    const initialOverviewDist = this.getOverviewDistance();
    this.cameraDistance = initialOverviewDist;
    this.targetCameraDistance = initialOverviewDist;

    // Look-at center point (interpolates to planet position when selected)
    this.lookAtTarget = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);

    this.planetMeshes = [];
    this.labels = [];

    this.init();
  }

  getOverviewDistance() {
    const width = typeof window !== 'undefined' ? window.innerWidth : 800;
    if (width <= 480) {
      return 440; // Zoom out slightly so wider planets have generous breathing room from screen edges
    } else if (width <= 768) {
      return 360;
    }
    return 290;
  }

  triggerHaptic(duration = 12) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  }

  init() {
    this.setupScene();
    this.setupLights();
    this.createDistributedPlanets();
    this.setupCosmicDust();
    this.setupEvents();
    this.checkArrivalTransition();
    this.startLoop();
  }

  setupScene() {
    const width = this.stage.clientWidth || 800;
    const height = this.stage.clientHeight || 420;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000);
    this.updateCameraTransform();

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'solar-system__canvas';
    this.stage.appendChild(this.renderer.domElement);
  }

  updateCameraTransform() {
    const r = this.cameraDistance;
    const cx = this.currentLookAt.x;
    const cy = this.currentLookAt.y;
    const cz = this.currentLookAt.z;

    this.camera.position.x = cx + Math.sin(this.cameraRotY) * Math.cos(this.cameraRotX) * r;
    this.camera.position.y = cy + Math.sin(this.cameraRotX) * r;
    this.camera.position.z = cz + Math.cos(this.cameraRotY) * Math.cos(this.cameraRotX) * r;
    this.camera.lookAt(cx, cy, cz);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xf5e8e8, 1.35);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.7);
    this.dirLight.position.set(-100, 130, 90);
    this.scene.add(this.dirLight);

    const rimLight = new THREE.DirectionalLight(0xffecd2, 0.65);
    rimLight.position.set(110, -40, -80);
    this.scene.add(rimLight);
  }

  createPlanetGeometry(radius) {
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    geo.computeVertexNormals();
    return geo;
  }

  createPetalGeometry(length = 18, width = 6.2, thickness = 1.8) {
    const positions = new Float32Array([
      // 0: base
      0, 0, 0,
      // 1: left mid
      -width / 2, length * 0.4, 0,
      // 2: right mid
      width / 2, length * 0.4, 0,
      // 3: top ridge
      0, length * 0.45, thickness,
      // 4: bottom ridge
      0, length * 0.45, -thickness,
      // 5: tip
      0, length, 0,
    ]);
    const indices = [
      0, 1, 3,  0, 3, 2,  3, 1, 5,  3, 5, 2,
      0, 4, 1,  0, 2, 4,  4, 5, 1,  4, 2, 5,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  createDistributedPlanets() {
    // 5 balanced coordinates: 4 outer corners + 1 center sunflower with wider spread
    const positions = [
      { x: -128, y: 52, z: 22 },   // Top-left: Nuestro puzzle
      { x: 124,  y: 58, z: -20 },  // Top-right: Golden Tickets
      { x: -84,  y: -62, z: -28 }, // Bottom-left: Nuestra historia
      { x: 114,  y: -54, z: 30 },  // Bottom-right: Códigos secretos
      { x: 0,    y: -2,  z: 0 },   // Center: Girasol Cósmico
    ];

    const rotSpeeds = {
      puzzle:   { y: 0.009, x: 0.002, bobPhase: 0,   satSpeed: 0.024 },
      cumple:   { y: 0.015, x: -0.003, bobPhase: 1.6, satSpeed: 0.02 },
      historia: { y: 0.005, x: 0.001, bobPhase: 3.2, satSpeed: 0.018 },
      morpag:   { y: 0.012, x: 0.004, bobPhase: 4.8, satSpeed: 0.022 },
      girasol:  { y: 0.005, x: 0.001, bobPhase: 2.4, satSpeed: 0 },
    };

    this.planets = PLANETS.map((data, index) => {
      const group = new THREE.Group();
      const posConfig = positions[index] || { x: 0, y: 0, z: 0 };
      group.position.set(posConfig.x, posConfig.y, posConfig.z);
      this.scene.add(group);

      const radius = data.size * 0.32;
      const geo = this.createPlanetGeometry(radius);

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(data.isSunflower ? 0x543216 : data.color),
        roughness: 0.88,
        metalness: 0.0,
        flatShading: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Atmospheric soft aura shell
      const atmoColor = data.isSunflower ? 0xf59e0b : data.color;
      const atmoGeo = new THREE.IcosahedronGeometry(radius * (data.isSunflower ? 1.25 : 1.09), 1);
      atmoGeo.computeVertexNormals();
      const atmoMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(atmoColor),
        transparent: true,
        opacity: data.isSunflower ? 0.22 : 0.16,
        side: THREE.BackSide,
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      group.add(atmoMesh);

      // 3D Sunflower Petals and Center Disc Florets
      let petals = null;
      let flowerGroup = null;

      if (data.isSunflower) {
        flowerGroup = new THREE.Group();
        flowerGroup.rotation.x = 0.22; // angled toward camera view
        group.add(flowerGroup);

        petals = [];
        const innerGeo = this.createPetalGeometry(radius * 0.95, radius * 0.35, radius * 0.1);
        const outerGeo = this.createPetalGeometry(radius * 1.25, radius * 0.42, radius * 0.12);

        const innerMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xfbbf24), // radiant sunflower yellow
          roughness: 0.72,
          metalness: 0.05,
          flatShading: true,
        });

        const outerMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xf59e0b), // deep amber gold
          roughness: 0.75,
          metalness: 0.05,
          flatShading: true,
        });

        // Layer 1: 14 inner petals
        const count1 = 14;
        for (let i = 0; i < count1; i++) {
          const angle = (i / count1) * Math.PI * 2;
          const pivot = new THREE.Group();
          pivot.rotation.z = angle;
          pivot.rotation.x = -1.45; // folded back against core

          const pMesh = new THREE.Mesh(innerGeo, innerMat);
          pMesh.position.y = radius * 0.72;
          pMesh.scale.set(0.01, 0.01, 0.01);
          pMesh.castShadow = true;
          pivot.add(pMesh);
          flowerGroup.add(pivot);

          petals.push({
            pivot,
            mesh: pMesh,
            angleRest: -1.45,
            angleBloom: 0.18,
          });
        }

        // Layer 2: 14 outer petals (interspersed)
        const count2 = 14;
        const offsetAngle = Math.PI / count2;
        for (let i = 0; i < count2; i++) {
          const angle = (i / count2) * Math.PI * 2 + offsetAngle;
          const pivot = new THREE.Group();
          pivot.rotation.z = angle;
          pivot.rotation.x = -1.55;

          const pMesh = new THREE.Mesh(outerGeo, outerMat);
          pMesh.position.y = radius * 0.8;
          pMesh.scale.set(0.01, 0.01, 0.01);
          pMesh.castShadow = true;
          pivot.add(pMesh);
          flowerGroup.add(pivot);

          petals.push({
            pivot,
            mesh: pMesh,
            angleRest: -1.55,
            angleBloom: 0.12,
          });
        }

        // Golden seed florets on the center disc
        const seedGeo = new THREE.DodecahedronGeometry(0.75, 0);
        const seedMat = new THREE.MeshStandardMaterial({
          color: 0x92400e,
          roughness: 0.65,
          flatShading: true,
        });
        for (let s = 0; s < 24; s++) {
          const phi = s * 2.39996;
          const r = Math.sqrt((s + 1) / 24) * (radius * 0.72);
          const sMesh = new THREE.Mesh(seedGeo, seedMat);
          sMesh.position.set(Math.cos(phi) * r, Math.sin(phi) * r, radius * 0.62);
          sMesh.rotation.set(s * 0.5, s * 0.3, s * 0.2);
          flowerGroup.add(sMesh);
        }
      }

      // Low-poly satellite / moon orbiting the planet on its wireframe ring
      let satellite = null;
      let satOrbitLine = null;
      let satAngle = Math.random() * Math.PI * 2;
      const satRx = radius * 1.85;
      const satRy = radius * 1.85;
      const satTiltX = Math.PI * 0.26;
      const satTiltY = Math.PI * 0.14;

      if (data.ring) {
        const moonRadius = radius * 0.26;
        const moonGeo = new THREE.IcosahedronGeometry(moonRadius, 0);
        moonGeo.computeVertexNormals();

        const moonMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(data.ringColor || 0xd2d5e3),
          flatShading: true,
          roughness: 0.85,
          metalness: 0.0,
        });
        satellite = new THREE.Mesh(moonGeo, moonMat);
        group.add(satellite);

        const satRingPts = [];
        const satSegments = 64;
        for (let s = 0; s <= satSegments; s++) {
          const t = (s / satSegments) * Math.PI * 2;
          satRingPts.push(new THREE.Vector3(Math.cos(t) * satRx, 0, Math.sin(t) * satRy));
        }
        const satRingGeo = new THREE.BufferGeometry().setFromPoints(satRingPts);
        const satRingMat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.45,
        });
        satOrbitLine = new THREE.Line(satRingGeo, satRingMat);
        satOrbitLine.rotation.x = satTiltX;
        satOrbitLine.rotation.y = satTiltY;
        group.add(satOrbitLine);
      }

      // Invisible generous hit sphere for effortless touching and clicking
      const hitRadius = Math.max(radius * (data.isSunflower ? 1.6 : 1.45), (satRx || radius) * 1.05);
      const hitGeo = new THREE.SphereGeometry(hitRadius, 12, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      group.add(hitMesh);

      const speedConfig = rotSpeeds[data.id] || { y: 0.008, x: 0.002, bobPhase: 0, satSpeed: 0.02 };

      const planetObj = {
        ...data,
        basePos: { ...posConfig },
        group,
        mesh,
        flowerGroup,
        petals,
        petalGrowth: 0,
        targetPetalGrowth: 0,
        satellite,
        satAngle,
        satRx,
        satRy,
        satTiltX,
        satTiltY,
        satSpeed: speedConfig.satSpeed,
        bobPhase: speedConfig.bobPhase,
        currentScale: 1,
        targetScale: 1,
        rotSpeedX: speedConfig.x,
        rotSpeedY: speedConfig.y,
      };

      mesh.userData = { planet: planetObj };
      hitMesh.userData = { planet: planetObj };
      this.planetMeshes.push(hitMesh, mesh);
      return planetObj;
    });
  }

  setupCosmicDust() {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color(0xd1495b),
      new THREE.Color(0xd4af37),
      new THREE.Color(0xe88f9c),
      new THREE.Color(0x9c8fe8),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 420;
      positions[i3 + 1] = (Math.random() - 0.5) * 240;
      positions[i3 + 2] = (Math.random() - 0.5) * 220;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  setupEvents() {
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.planet-preview__card')) {
        return;
      }
      this.isDragging = true;
      this.hasDragged = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.downTime = performance.now();
      this.container.classList.add('is-dragging');

      // Immediate raycast update on tap/down position
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    window.addEventListener('pointermove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        // Strict threshold so a clean tap never counts as a drag
        if (Math.hypot(dx, dy) > 9) {
          this.hasDragged = true;
        }
        this.targetCameraRotY -= dx * 0.004;
        this.targetCameraRotX = Math.max(-0.35, Math.min(0.55, this.targetCameraRotX + dy * 0.003));
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      }
    });

    const endDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.container.classList.remove('is-dragging');

      // If user tapped directly without dragging, select immediately on pointerup
      if (!this.hasDragged && (performance.now() - (this.downTime || 0) < 450)) {
        if (e && e.clientX !== undefined) {
          const rect = this.renderer.domElement.getBoundingClientRect();
          this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.planetMeshes);
        if (intersects.length > 0) {
          const planet = intersects[0].object.userData.planet;
          if (planet) {
            this.selectPlanet(planet);
          }
        }
      }

      setTimeout(() => {
        this.hasDragged = false;
      }, 50);
    };

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Keyboard support
    this.stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        this.targetCameraRotY += 0.12;
        this.triggerHaptic(5);
      } else if (e.key === 'ArrowLeft') {
        this.targetCameraRotY -= 0.12;
        this.triggerHaptic(5);
      } else if (e.key === 'Escape' && this.selectedPlanet) {
        this.closePreview();
      }
    });

    // Preview close button, backdrop, and CTA button
    const closeBtn = this.previewModal.querySelector('.planet-preview__close');
    const backdrop = this.previewModal.querySelector('.planet-preview__backdrop');
    const ctaBtn = this.previewModal.querySelector('.planet-preview__cta');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closePreview());
    if (backdrop) backdrop.addEventListener('click', () => this.closePreview());

    window.addEventListener('resize', () => {
      const w = this.stage.clientWidth || 800;
      const h = this.stage.clientHeight || 420;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);

      if (!this.selectedPlanet) {
        this.targetCameraDistance = this.getOverviewDistance();
      }
    });
  }

  selectPlanet(planet) {
    this.selectedPlanet = planet;
    this.hoveredPlanet = null;
    this.triggerHaptic(20);

    const hubEl = document.querySelector('.hub');
    if (hubEl) hubEl.classList.add('has-planet-focus');
    this.container.classList.add('has-focus');

    // Zoom and center camera directly on the selected planet
    this.lookAtTarget.set(planet.basePos.x, planet.basePos.y, planet.basePos.z);
    this.targetCameraDistance = planet.isSunflower ? 124 : 144;
    this.targetCameraRotY = 0;
    this.targetCameraRotX = 0.08;

    const titleEl = this.previewModal.querySelector('.planet-preview__title');
    const tagEl = this.previewModal.querySelector('.planet-preview__tag');
    const descEl = this.previewModal.querySelector('.planet-preview__desc');
    const ctaEl = this.previewModal.querySelector('.planet-preview__cta');
    const iconWrapper = this.previewModal.querySelector('.planet-preview__icon-sphere');
    const cardEl = this.previewModal.querySelector('.planet-preview__card');

    if (titleEl) titleEl.textContent = planet.name;
    if (tagEl) tagEl.textContent = planet.tag;
    if (descEl) descEl.textContent = planet.description;
    if (ctaEl) {
      ctaEl.href = planet.href;
      ctaEl.style.setProperty('--btn-glow', planet.glow);
      ctaEl.style.setProperty('--btn-color', planet.petalColor || planet.color);
      const ctaSpan = ctaEl.querySelector('span');
      if (ctaSpan) {
        ctaSpan.textContent = planet.isSunflower ? 'Entrar al prado' : 'Entrar al universo';
      }
    }
    if (iconWrapper) {
      iconWrapper.style.setProperty('--sphere-atmosphere', planet.atmosphere);
      iconWrapper.style.setProperty('--sphere-glow', planet.glow);
      iconWrapper.innerHTML = `
        <div class="planet-preview__svg-icon">${planet.icon}</div>
      `;
    }
    if (cardEl) {
      cardEl.style.setProperty('--card-accent', planet.color);
    }

    this.previewModal.setAttribute('aria-hidden', 'false');
    this.previewModal.classList.add('is-visible');

    if (ctaEl) {
      setTimeout(() => ctaEl.focus(), 150);
    }
  }

  closePreview() {
    this.selectedPlanet = null;
    this.hoveredPlanet = null;
    this.previewModal.setAttribute('aria-hidden', 'true');
    this.previewModal.classList.remove('is-visible');

    const hubEl = document.querySelector('.hub');
    if (hubEl) hubEl.classList.remove('has-planet-focus');
    document.body.classList.remove('has-planet-focus');
    this.container.classList.remove('has-focus');

    // Return camera to global overview center with responsive distance
    this.lookAtTarget.set(0, 0, 0);
    this.targetCameraDistance = this.getOverviewDistance();
    this.targetCameraRotY = 0;
    this.targetCameraRotX = 0.12;

    this.triggerHaptic(10);
  }

  checkArrivalTransition() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromPlanetId = params.get('from');
      if (!fromPlanetId) return;

      const planet = this.planets.find((p) => p.id === fromPlanetId);
      if (!planet) return;

      // Clean the URL so reloads don't re-trigger the animation
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      // Start camera close to the departing planet
      this.lookAtTarget.set(planet.basePos.x, planet.basePos.y, planet.basePos.z);
      this.currentLookAt.set(planet.basePos.x, planet.basePos.y, planet.basePos.z);
      this.cameraDistance = 75;
      this.targetCameraDistance = 75;
      this.cameraRotY = 0;
      this.targetCameraRotY = 0;
      this.cameraRotX = 0.08;
      this.targetCameraRotX = 0.08;
      this.updateCameraTransform();

      // Cosmic arrival overlay for smooth deceleration
      const overlay = document.createElement('div');
      overlay.className = 'space-arrival-overlay';
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.add('is-dissipating');
      });

      // Smoothly zoom out to full overview
      setTimeout(() => {
        this.lookAtTarget.set(0, 0, 0);
        this.targetCameraDistance = this.getOverviewDistance();
        this.targetCameraRotY = 0;
        this.targetCameraRotX = 0.12;
      }, 250);

      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 1300);
    } catch (err) {
      console.warn('Cosmos arrival transition warning:', err);
    }
  }

  updatePlanets(time) {
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;

    // Smooth camera target and position interpolation
    this.currentLookAt.lerp(this.lookAtTarget, 0.07);
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.07;
    this.cameraRotY += (this.targetCameraRotY - this.cameraRotY) * 0.08;
    this.cameraRotX += (this.targetCameraRotX - this.cameraRotX) * 0.08;
    this.updateCameraTransform();

    // Check hover state
    if (!this.isDragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.planetMeshes);
      if (intersects.length > 0) {
        this.hoveredPlanet = intersects[0].object.userData.planet;
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.hoveredPlanet = null;
        this.renderer.domElement.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      }
    }

    if (this.particles) {
      this.particles.rotation.y += 0.00015;
    }

    this.planets.forEach((planet) => {
      // Very tiny subtle breathing oscillation (0.8px margin, planets stay grounded in place)
      const tinyBob = Math.sin(time * 0.0008 + planet.bobPhase) * 0.8;
      planet.group.position.set(planet.basePos.x, planet.basePos.y + tinyBob, planet.basePos.z);

      // Self faceted rotation in place
      planet.mesh.rotation.y += planet.rotSpeedY;
      planet.mesh.rotation.x += planet.rotSpeedX;

      // Orbiting satellite / moon
      if (planet.satellite) {
        planet.satAngle += planet.satSpeed;

        const localX = Math.cos(planet.satAngle) * planet.satRx;
        const localZ = Math.sin(planet.satAngle) * planet.satRy;
        const posVec = new THREE.Vector3(localX, 0, localZ);

        posVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), planet.satTiltX);
        posVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), planet.satTiltY);

        planet.satellite.position.copy(posVec);
        planet.satellite.rotation.y += 0.02;
        planet.satellite.rotation.x += 0.01;
      }

      // Smooth hover / selection scale spring
      const isSelected = this.selectedPlanet && this.selectedPlanet.id === planet.id;
      const isHovered = this.hoveredPlanet && this.hoveredPlanet.id === planet.id;

      if (isSelected) {
        planet.targetScale = 1.35;
      } else if (isHovered) {
        planet.targetScale = 1.15;
      } else {
        planet.targetScale = 1.0;
      }

      planet.currentScale += (planet.targetScale - planet.currentScale) * 0.15;
      planet.mesh.scale.setScalar(planet.currentScale);

      // Sunflower blooming animation
      if (planet.isSunflower && planet.petals) {
        if (isSelected) {
          planet.targetPetalGrowth = 1.0;
        } else if (isHovered) {
          planet.targetPetalGrowth = 0.32; // Gentle budding preview on hover/touch
        } else {
          planet.targetPetalGrowth = 0.0;
        }

        planet.petalGrowth += (planet.targetPetalGrowth - planet.petalGrowth) * 0.08;
        const growth = planet.petalGrowth;

        planet.petals.forEach((p, idx) => {
          const stg = Math.min(1, Math.max(0, growth * 1.3 - (idx % 6) * 0.05));
          p.mesh.scale.setScalar(Math.max(0.001, stg));
          p.pivot.rotation.x = THREE.MathUtils.lerp(p.angleRest, p.angleBloom, stg);
        });

        if (planet.flowerGroup) {
          planet.flowerGroup.scale.setScalar(planet.currentScale);
          planet.flowerGroup.rotation.y += planet.rotSpeedY * 0.75;
        }
      }
    });
  }

  startLoop() {
    const animate = (time) => {
      this.updatePlanets(time);
      this.renderer.render(this.scene, this.camera);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

function initSolarSystem() {
  const container = document.querySelector('.solar-system');
  if (container) {
    new ThreeSolarSystem(container);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSolarSystem);
} else {
  initSolarSystem();
}
