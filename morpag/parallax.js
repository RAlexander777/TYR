/**
 * Parallax and ambient particle system for morpag hero section.
 * Features:
 * - Multi-layer 3D depth parallax (Background + Stardust / Bokeh Particles + Foreground Hero Text)
 * - Organic ambient drift (continuous cinematic breathing and swaying)
 * - Mouse movement, touch drag, and mobile gyroscope (deviceorientation) support
 * - Prefers-reduced-motion accessibility support
 * - Page visibility pause/resume optimization
 */

export function initParallax() {
  const container = document.querySelector('#parallaxContainer');
  const bg = document.querySelector('#parallaxBg');
  const canvas = document.querySelector('#parallaxCanvas');
  const heroText = document.querySelector('.h-text');

  if (!container || !bg || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Dynamic particle count based on screen area
  const count = Math.min(50, Math.max(25, Math.floor((width * height) / 24000)));
  const particles = [];
  const palette = [
    'rgba(232, 143, 156, ', // Rose
    'rgba(212, 175, 55, ',  // Warm gold
    'rgba(255, 255, 255, ', // Starlight white
    'rgba(253, 247, 240, ', // Soft cream
  ];

  class RomanticParticle {
    constructor(isInitial = false) {
      this.reset(isInitial);
    }

    reset(isInitial = false) {
      this.x = Math.random() * width;
      this.y = isInitial ? Math.random() * height : height + Math.random() * 20;
      this.isOrb = Math.random() < 0.22;
      this.size = this.isOrb ? Math.random() * 4.5 + 3.5 : Math.random() * 1.8 + 0.8;
      this.depth = Math.random() * 0.75 + 0.25; // 0.25 to 1.0 (z-depth)
      this.speedY = (Math.random() * 0.35 + 0.15) * (this.isOrb ? 0.65 : 1);
      this.colorPrefix = palette[Math.floor(Math.random() * palette.length)];
      this.baseAlpha = this.isOrb ? Math.random() * 0.22 + 0.08 : Math.random() * 0.45 + 0.25;
      this.alpha = this.baseAlpha;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulseOffset = Math.random() * Math.PI * 2;
      this.oscillationSpeed = Math.random() * 0.015 + 0.008;
      this.oscillationDistance = Math.random() * 16 + 6;
    }

    update(time) {
      this.y -= this.speedY;
      this.alpha = Math.max(0.04, this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15);

      if (this.y < -30) {
        this.reset(false);
      }
    }

    draw(ctx, offsetX, offsetY, time) {
      const sway = Math.sin(time * this.oscillationSpeed + this.pulseOffset) * this.oscillationDistance;
      const renderX = this.x + sway + offsetX * this.depth * 1.6;
      const renderY = this.y + offsetY * this.depth * 1.2;

      ctx.beginPath();
      ctx.arc(renderX, renderY, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `${this.colorPrefix}${Math.max(0, Math.min(1, this.alpha))})`;

      if (this.isOrb) {
        ctx.shadowBlur = this.size * 2.5;
        ctx.shadowColor = `${this.colorPrefix}0.35)`;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fill();
    }
  }

  for (let i = 0; i < count; i++) {
    particles.push(new RomanticParticle(true));
  }

  // Mouse & gyroscope targets
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  function onMouseMove(e) {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    targetX = (mouseX - 0.5) * 45;
    targetY = (mouseY - 0.5) * 30;
  }

  function onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      const touchX = e.touches[0].clientX / window.innerWidth;
      const touchY = e.touches[0].clientY / window.innerHeight;
      targetX = (touchX - 0.5) * 35;
      targetY = (touchY - 0.5) * 25;
    }
  }

  function onOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
      const clampedGamma = Math.max(-40, Math.min(40, e.gamma));
      const clampedBeta = Math.max(-40, Math.min(40, e.beta - 45));
      targetX = (clampedGamma / 40) * 30;
      targetY = (clampedBeta / 40) * 22;
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
  }

  function onResize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', onResize, { passive: true });

  let animationId = null;
  let isRunning = true;

  function render(now) {
    if (!isRunning) return;

    const time = now * 0.001;

    // Organic ambient drift (continuous subtle breathing of background)
    const ambientX = Math.sin(time * 0.35) * 12;
    const ambientY = Math.cos(time * 0.28) * 9;
    const ambientScale = 1.07 + Math.sin(time * 0.22) * 0.015;

    // Smooth inertia interpolation (lerp)
    currentX += (targetX - currentX) * 0.055;
    currentY += (targetY - currentY) * 0.055;

    const totalBgX = -(currentX + ambientX);
    const totalBgY = -(currentY + ambientY);

    // Apply 3D translate & scale to background layer
    bg.style.transform = `translate3d(${totalBgX.toFixed(2)}px, ${totalBgY.toFixed(2)}px, 0) scale(${ambientScale.toFixed(3)})`;

    // Subtle opposing foreground depth for hero text
    if (heroText && heroText.style.display !== 'none') {
      const textX = (currentX * 0.28).toFixed(2);
      const textY = (currentY * 0.28).toFixed(2);
      heroText.style.transform = `translate(calc(-50% + ${textX}px), calc(-50% + ${textY}px))`;
    }

    // Render particles
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update(time);
      p.draw(ctx, currentX, currentY, time);
    }

    animationId = requestAnimationFrame(render);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
    } else {
      if (!isRunning) {
        isRunning = true;
        animationId = requestAnimationFrame(render);
      }
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  animationId = requestAnimationFrame(render);
}
