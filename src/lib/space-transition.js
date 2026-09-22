/**
 * space-transition.js
 * Orchestrates seamless planetary departure and cosmic warp transitions for TYR.
 */

const PLANET_PALETTES = {
  historia: {
    color: '#e88f9c',
    glow: 'rgba(232, 143, 156, 0.65)',
  },
  puzzle: {
    color: '#d1495b',
    glow: 'rgba(209, 73, 91, 0.65)',
  },
  cumple: {
    color: '#d4af37',
    glow: 'rgba(212, 175, 55, 0.65)',
  },
  morpag: {
    color: '#9c8fe8',
    glow: 'rgba(156, 143, 232, 0.65)',
  },
  girasol: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.65)',
  },
};

export function getGalaxyPortalHTML() {
  return `
    <div class="cosmos-portal" aria-hidden="true">
      <div class="cosmos-portal__nebula"></div>
      <div class="cosmos-portal__halo"></div>
      <svg class="cosmos-portal__galaxy" viewBox="0 0 48 48" fill="none">
        <g class="cosmos-galaxy-spin">
          <path d="M24 24C27 18 34 16 38 20C42 24 39 32 33 36C27 40 18 38 14 32C10 26 12 16 19 11C26 6 36 8 41 15" 
                stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.45" stroke-dasharray="2 3"/>
          <path d="M24 24C21 30 14 32 10 28C6 24 9 16 15 12C21 8 30 10 34 16C38 22 36 32 29 37C22 42 12 40 7 33" 
                stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.45" stroke-dasharray="2 3"/>
          <circle cx="24" cy="24" r="3.2" fill="#ffffff" class="cosmos-core-pulse"/>
          <circle cx="21" cy="22" r="1.1" fill="#ffffff" opacity="0.9"/>
          <circle cx="27" cy="25" r="1.2" fill="#ffffff" opacity="0.85"/>
          <circle cx="25" cy="20" r="0.9" fill="#ffccd5" opacity="0.8"/>
          <circle cx="22" cy="27" r="1" fill="#fde68a" opacity="0.8"/>
          <circle cx="29" cy="21" r="0.8" fill="#e0e7ff" opacity="0.75"/>
          <circle cx="18" cy="26" r="0.9" fill="#fbcfe8" opacity="0.7"/>
          <circle cx="31" cy="27" r="0.8" fill="#ffffff" opacity="0.7"/>
          <circle cx="16" cy="21" r="0.8" fill="#ffffff" opacity="0.6"/>
          <circle cx="24" cy="16" r="0.8" fill="#fef08a" opacity="0.65"/>
          <circle cx="24" cy="32" r="0.8" fill="#e9d5ff" opacity="0.65"/>
          <circle cx="33" cy="18" r="0.7" fill="#ffffff" opacity="0.5"/>
          <circle cx="14" cy="29" r="0.7" fill="#ffffff" opacity="0.5"/>
          <circle cx="36" cy="23" r="0.7" fill="#fef08a" opacity="0.5"/>
          <circle cx="11" cy="23" r="0.7" fill="#fbcfe8" opacity="0.5"/>
        </g>
        <path d="M24 17V31M17 24H31" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.85" class="cosmos-flare"/>
      </svg>
    </div>
  `;
}

export function initSpaceExit({
  planetId = 'historia',
  targetUrl = '../index.html',
  customButton = null,
} = {}) {
  const palette = PLANET_PALETTES[planetId] || {
    color: '#ffccd5',
    glow: 'rgba(255, 204, 213, 0.5)',
  };

  // Find or create the button
  let exitBtn = customButton || document.querySelector('.cosmos-exit-btn');
  if (!exitBtn) {
    const legacyBtn = document.querySelector('.suite-btn--corner');
    if (legacyBtn) {
      exitBtn = legacyBtn;
    }
  }

  if (!exitBtn) return;

  // Apply planet theme CSS variables and attributes
  exitBtn.style.setProperty('--planet-exit-color', palette.color);
  exitBtn.style.setProperty('--planet-exit-glow', palette.glow);
  exitBtn.setAttribute('aria-label', 'Volver al cosmos');
  exitBtn.setAttribute('title', 'Volver al cosmos');

  // Inject galaxy and star cluster portal visual if not already present
  if (!exitBtn.querySelector('.cosmos-portal')) {
    exitBtn.innerHTML = getGalaxyPortalHTML();
  }

  let isDeparting = false;

  exitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (isDeparting) return;
    isDeparting = true;

    // Haptic feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15, 30, 45]);
      } catch {}
    }

    triggerPlanetaryDeparture({
      planetId,
      targetUrl: exitBtn.getAttribute('href') || targetUrl,
      palette,
    });
  });
}

function triggerPlanetaryDeparture({ planetId, targetUrl, palette }) {
  try {
    sessionStorage.setItem('tyr_skip_loader', '1');
  } catch (err) {}
  document.body.classList.add('is-planet-departing');

  // Create warp overlay container
  const overlay = document.createElement('div');
  overlay.className = 'space-warp-overlay';
  overlay.style.setProperty('--planet-exit-color', palette.color);
  overlay.style.setProperty('--planet-exit-glow', palette.glow);

  const canvas = document.createElement('canvas');
  canvas.className = 'space-warp-canvas';
  overlay.appendChild(canvas);

  const shockwave = document.createElement('div');
  shockwave.className = 'space-warp-shockwave';
  overlay.appendChild(shockwave);

  const veil = document.createElement('div');
  veil.className = 'space-warp-veil';
  overlay.appendChild(veil);

  document.body.appendChild(overlay);

  // Setup Warp Starfield
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const onResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  const starCount = 200;
  const stars = [];
  const cx = () => width / 2;
  const cy = () => height / 2;

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: (Math.random() - 0.5) * width * 1.6,
      y: (Math.random() - 0.5) * height * 1.6,
      z: Math.random() * 900 + 100,
      prevZ: 0,
      size: Math.random() * 1.5 + 0.8,
    });
    stars[i].prevZ = stars[i].z;
  }

  let speed = 4.5;
  let animId = null;
  const startTime = performance.now();
  const transitionDuration = 720; // milliseconds

  function renderWarp(now) {
    const elapsed = now - startTime;
    // Accelerate smoothly
    speed = Math.min(speed * 1.07, 52);

    ctx.fillStyle = 'rgba(5, 3, 8, 0.28)';
    ctx.fillRect(0, 0, width, height);

    const centerX = cx();
    const centerY = cy();

    ctx.lineWidth = 1.6;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      star.prevZ = star.z;
      star.z -= speed;

      if (star.z <= 0) {
        star.x = (Math.random() - 0.5) * width * 1.6;
        star.y = (Math.random() - 0.5) * height * 1.6;
        star.z = 1000;
        star.prevZ = 1000;
      }

      const k = 320 / star.z;
      const px = centerX + star.x * k;
      const py = centerY + star.y * k;

      const prevK = 320 / star.prevZ;
      const ppx = centerX + star.x * prevK;
      const ppy = centerY + star.y * prevK;

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        const distRatio = Math.min(1, elapsed / transitionDuration);
        ctx.strokeStyle = distRatio > 0.4 ? '#ffffff' : palette.color;
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    if (elapsed < transitionDuration) {
      animId = requestAnimationFrame(renderWarp);
    }
  }

  animId = requestAnimationFrame(renderWarp);

  // Blackout fade right before navigation
  setTimeout(() => {
    veil.classList.add('is-blackout');
  }, 440);

  // Final navigation with destination query param
  setTimeout(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', onResize);
    const separator = targetUrl.includes('?') ? '&' : '?';
    window.location.href = `${targetUrl}${separator}from=${encodeURIComponent(planetId)}`;
  }, transitionDuration);
}
