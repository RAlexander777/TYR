const canvas = document.createElement('canvas');
canvas.className = 'ambient-canvas';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);

const ctx = canvas.getContext('2d');
let animationFrameId = null;
let width = 0;
let height = 0;
let dpr = 1;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const colors = [
  'rgba(212, 175, 55, ',  // gold
  'rgba(232, 143, 156, ', // rose
  'rgba(253, 251, 247, ', // cream/white
  'rgba(209, 73, 91, '    // accent
];

const createParticle = () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.8 + 0.6,
  baseAlpha: Math.random() * 0.35 + 0.15,
  twinkleSpeed: Math.random() * 0.02 + 0.008,
  twinklePhase: Math.random() * Math.PI * 2,
  vy: -(Math.random() * 0.22 + 0.06),
  vx: (Math.random() - 0.5) * 0.12,
  color: colors[Math.floor(Math.random() * colors.length)]
});

let particles = [];

const resize = () => {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  const count = Math.min(55, Math.floor((width * height) / 20000));
  particles = Array.from({ length: count }, createParticle);
};

const draw = () => {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    p.twinklePhase += p.twinkleSpeed;
    const currentAlpha = Math.max(0.04, p.baseAlpha + Math.sin(p.twinklePhase) * 0.18);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `${p.color}${currentAlpha})`;
    ctx.fill();

    if (!prefersReducedMotion) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.twinklePhase * 0.5) * 0.08;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
    }
  }

  if (!prefersReducedMotion) {
    animationFrameId = requestAnimationFrame(draw);
  }
};

const start = () => {
  if (!animationFrameId && !prefersReducedMotion) {
    animationFrameId = requestAnimationFrame(draw);
  }
};

const stop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

window.addEventListener('resize', () => {
  resize();
  if (prefersReducedMotion) draw();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stop();
  } else {
    start();
  }
});

resize();
draw();
