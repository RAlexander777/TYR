import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import '../src/styles/space-transition.css';
import './style.css';
import { initSpaceExit } from '../src/lib/space-transition.js';

const START_DATE = new Date('2022-09-04T00:00:00');
const items = Array.from(document.querySelectorAll('.item'));
const multiScroll = document.querySelector('#multiScroll');
const progressFill = document.querySelector('.multiscroll-progress__fill');
const windowHeight = () => window.innerHeight;

// Scroll reveal animations using IntersectionObserver
function setupScrollReveals() {
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
            }
        });
    }, {
        threshold: 0.18,
        rootMargin: '0px 0px -40px 0px',
    });

    revealEls.forEach((el) => observer.observe(el));
}

// Dynamic ambient background theme transitions according to active narrative act
function setupThemeObserver() {
    const themedSections = document.querySelectorAll('[data-theme]');
    const themeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const theme = entry.target.getAttribute('data-theme');
                if (theme) {
                    document.body.dataset.activeTheme = theme;
                }
            }
        });
    }, {
        threshold: 0.25,
        rootMargin: '-10% 0px -30% 0px',
    });

    themedSections.forEach((section) => themeObserver.observe(section));
}

// MultiScroll timeline cards progress with smooth fading & scaling
function handleScroll() {
    if (!multiScroll) return;
    const rect = multiScroll.getBoundingClientRect();
    const wHeight = windowHeight();

    if (rect.top <= 0 && rect.bottom >= wHeight) {
        const scrollable = multiScroll.offsetHeight - wHeight;
        const progress = scrollable > 0
            ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
            : 1;

        if (progressFill) {
            progressFill.style.width = `${progress * 100}%`;
        }

        const step = 1 / items.length;
        items.forEach((item, index) => {
            const isVisible = progress >= step * (index * 0.85);
            item.classList.toggle('visible', isVisible);
        });
    } else if (rect.top > 0) {
        if (progressFill) progressFill.style.width = '0%';
        items.forEach((item, index) => {
            if (index === 0 && window.innerWidth > 900) {
                item.classList.add('visible');
            } else if (window.innerWidth > 900) {
                item.classList.remove('visible');
            }
        });
    } else if (rect.bottom < wHeight) {
        if (progressFill) progressFill.style.width = '100%';
        items.forEach((item) => item.classList.add('visible'));
    }
}

// Countdown timer formatted in days, hours, minutes and seconds
function updateTimeTogether() {
    const now = new Date();
    const diff = Math.max(0, now - START_DATE);

    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);

    const diasEl = document.querySelector('#diasVal');
    const horasEl = document.querySelector('#horasVal');
    const minutosEl = document.querySelector('#minutosVal');
    const segundosEl = document.querySelector('#segundosVal');

    if (diasEl) diasEl.textContent = days.toLocaleString();
    if (horasEl) horasEl.textContent = String(hours).padStart(2, '0');
    if (minutosEl) minutosEl.textContent = String(minutes).padStart(2, '0');
    if (segundosEl) segundosEl.textContent = String(seconds).padStart(2, '0');
}

// Parallax header backgrounds
const parallaxSections = document.querySelectorAll('.parallax-section');

function handleParallax() {
    const wHeight = windowHeight();
    for (const section of parallaxSections) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > wHeight) continue;
        const progress = (rect.top + rect.height / 2 - wHeight / 2) / wHeight;
        const bg = section.querySelector('.parallax-bg');
        if (bg) {
            bg.style.transform = `translate3d(0, ${progress * 55}px, 0)`;
        }
    }
}

window.addEventListener('scroll', () => {
    handleScroll();
    requestAnimationFrame(handleParallax);
}, { passive: true });

// Ambient golden stardust floating gently in Act 1
function setupStardustAct1() {
    const canvas = document.querySelector('#stardustAct1');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        initDust();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const DUST_COUNT = 55;
    let dust = [];

    function initDust() {
        dust = Array.from({ length: DUST_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.2 + 0.8,
            baseAlpha: Math.random() * 0.45 + 0.25,
            phase: Math.random() * Math.PI * 2,
            speedPhase: Math.random() * 0.02 + 0.008,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -Math.random() * 0.35 - 0.1,
            color: Math.random() > 0.4 ? '229, 185, 92' : '255, 205, 210',
        }));
    }

    initDust();

    let isVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < dust.length; i++) {
            const p = dust[i];
            p.phase += p.speedPhase;
            const alpha = p.baseAlpha + Math.sin(p.phase) * 0.2;

            p.x += p.vx + Math.sin(p.phase * 0.5) * 0.15;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${Math.max(0.05, alpha)})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${p.color}, 0.6)`;
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    requestAnimationFrame(render);
}

// Animated cosmic warp / deep-space forward voyage for Act 2
function setupStarfieldAct2() {
    const canvas = document.querySelector('#starfieldAct2');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        initStars();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const STAR_COUNT = 380;
    const MAX_DEPTH = 1000;
    const BASE_SPEED = 2.4;
    let stars = [];

    function resetStar(star) {
        star.x = (Math.random() - 0.5) * width * 2;
        star.y = (Math.random() - 0.5) * height * 2;
        star.z = MAX_DEPTH;
        star.prevZ = MAX_DEPTH;
        star.radius = Math.random() * 1.4 + 0.6;
        star.color = Math.random() > 0.85 ? '#ffccd5' : (Math.random() > 0.85 ? '#d0e1fd' : '#ffffff');
    }

    function initStars() {
        stars = Array.from({ length: STAR_COUNT }, () => {
            const z = Math.random() * MAX_DEPTH;
            return {
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z,
                prevZ: z,
                radius: Math.random() * 1.4 + 0.6,
                color: Math.random() > 0.85 ? '#ffccd5' : (Math.random() > 0.85 ? '#d0e1fd' : '#ffffff'),
            };
        });
    }

    initStars();

    let isVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const fov = width * 0.75;

        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            star.prevZ = star.z;
            star.z -= BASE_SPEED;

            if (star.z <= 0) {
                resetStar(star);
                continue;
            }

            // Project 3D coordinates to 2D
            const k = fov / star.z;
            const px = star.x * k + cx;
            const py = star.y * k + cy;

            // Past position for subtle streak elongation as we travel
            const prevK = fov / star.prevZ;
            const prevPx = star.x * prevK + cx;
            const prevPy = star.y * prevK + cy;

            // Check boundaries
            if (px < 0 || px > width || py < 0 || py > height) {
                resetStar(star);
                continue;
            }

            // Alpha and size grow as star gets closer to the viewer
            const depthFactor = 1 - star.z / MAX_DEPTH;
            const alpha = Math.min(1, Math.max(0.1, depthFactor * 1.2));
            const size = Math.max(0.6, (1 - star.z / MAX_DEPTH) * star.radius * 2.2);

            ctx.beginPath();
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = star.color;
            ctx.lineWidth = size;
            ctx.globalAlpha = alpha;
            ctx.stroke();

            // Glow head on closer stars
            if (depthFactor > 0.6) {
                ctx.beginPath();
                ctx.arc(px, py, size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.globalAlpha = alpha;
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
    }

    requestAnimationFrame(render);
}

// Gravitational spiral vortex / accretion disk particles and deep starfield for Act 3
function setupVortexAct3() {
    const canvas = document.querySelector('#vortexAct3');
    const section = document.querySelector('#img3');
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        initVortex();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const PARTICLE_COUNT = 280;
    const BG_STAR_COUNT = 90;
    let particles = [];
    let bgStars = [];

    function getSingularityCenter() {
        const img = section.querySelector('.singularity-img');
        if (img) {
            const imgRect = img.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            return {
                x: (imgRect.left - canvasRect.left) + imgRect.width * 0.5,
                y: (imgRect.top - canvasRect.top) + imgRect.height * 0.27,
            };
        }
        return { x: width * 0.35, y: height * 0.45 };
    }

    function initVortex() {
        bgStars = Array.from({ length: BG_STAR_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.4,
            alpha: Math.random() * 0.7 + 0.2,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.03 + 0.01,
            color: Math.random() > 0.6 ? '#c084fc' : (Math.random() > 0.4 ? '#93c5fd' : '#ffffff'),
        }));

        particles = Array.from({ length: PARTICLE_COUNT }, () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 650 + 30;
            return {
                angle,
                dist,
                speed: (0.012 + (700 - dist) * 0.00008),
                radius: Math.random() * 2.6 + 0.6,
                color: Math.random() > 0.6 ? '#e9d5ff' : (Math.random() > 0.4 ? '#93c5fd' : '#ffffff'),
                alpha: Math.random() * 0.85 + 0.25,
            };
        });
    }

    initVortex();

    let isVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(section);

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        ctx.clearRect(0, 0, width, height);

        // Draw twinkling background cosmos stars
        for (let i = 0; i < bgStars.length; i++) {
            const s = bgStars[i];
            s.phase += s.speed;
            const a = s.alpha + Math.sin(s.phase) * 0.25;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, a));
            ctx.fill();
        }

        const center = getSingularityCenter();
        const cx = center.x;
        const cy = center.y;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.angle += p.speed;
            p.dist -= 0.5; // Relentless inward gravitational suction

            if (p.dist < 18) {
                p.dist = Math.random() * 600 + 120;
                p.angle = Math.random() * Math.PI * 2;
            }

            // Elliptical rotation perspective for massive accretion disk
            const px = cx + Math.cos(p.angle) * p.dist;
            const py = cy + Math.sin(p.angle) * (p.dist * 0.38);

            const prevAngle = p.angle - p.speed * 2;
            const prevDist = p.dist + 1.4;
            const prevPx = cx + Math.cos(prevAngle) * prevDist;
            const prevPy = cy + Math.sin(prevAngle) * (prevDist * 0.38);

            const depthAlpha = Math.min(1, Math.max(0.12, (p.dist / 650) * p.alpha));

            // Stream tail
            ctx.beginPath();
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.radius;
            ctx.globalAlpha = depthAlpha * 0.85;
            ctx.stroke();

            // Core particle
            ctx.beginPath();
            ctx.arc(px, py, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = depthAlpha;
            ctx.shadowBlur = p.radius > 1.4 ? 14 : 6;
            ctx.shadowColor = p.color;
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    requestAnimationFrame(render);
}

// Full atmospheric cosmic particles and quantum stardust for Act 4
function setupParticlesAct4() {
    const canvas = document.querySelector('#particlesAct4');
    const section = document.querySelector('#img4');
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        initArrivalField();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const STAR_COUNT = 130;
    const QUANTUM_DUST_COUNT = 85;
    let stars = [];
    let quantumDust = [];

    function getContactPoint() {
        const img = section.querySelector('.arrival-img');
        if (img) {
            const imgRect = img.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            return {
                x: (imgRect.left - canvasRect.left) + imgRect.width * 0.465,
                y: (imgRect.top - canvasRect.top) + imgRect.height * 0.515,
            };
        }
        return { x: width * 0.45, y: height * 0.5 };
    }

    function initArrivalField() {
        stars = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.6 + 0.4,
            alpha: Math.random() * 0.75 + 0.25,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.03 + 0.008,
            color: Math.random() > 0.5 ? '#fbcfe8' : (Math.random() > 0.4 ? '#fed7aa' : '#ffffff'),
        }));

        quantumDust = Array.from({ length: QUANTUM_DUST_COUNT }, () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 320 + 20;
            return {
                angle,
                dist,
                speed: Math.random() * 0.015 + 0.006,
                radius: Math.random() * 2.2 + 0.8,
                color: Math.random() > 0.5 ? '#fb7185' : '#fed7aa',
                alpha: Math.random() * 0.7 + 0.3,
            };
        });
    }

    initArrivalField();

    let isVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(section);

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        ctx.clearRect(0, 0, width, height);

        // Ambient starry space field
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            s.phase += s.speed;
            const a = s.alpha + Math.sin(s.phase) * 0.3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, a));
            ctx.fill();
        }

        // Swirling quantum dust flowing around contact point
        const contact = getContactPoint();
        for (let i = 0; i < quantumDust.length; i++) {
            const q = quantumDust[i];
            q.angle += q.speed;
            q.dist += Math.sin(q.angle * 2) * 0.35;

            const px = contact.x + Math.cos(q.angle) * q.dist;
            const py = contact.y + Math.sin(q.angle) * (q.dist * 0.75);

            ctx.beginPath();
            ctx.arc(px, py, q.radius, 0, Math.PI * 2);
            ctx.fillStyle = q.color;
            ctx.globalAlpha = q.alpha * 0.85;
            ctx.shadowBlur = 8;
            ctx.shadowColor = q.color;
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    requestAnimationFrame(render);
}

// Act 5: Star birth supernova pulse and shimmering starlight crystal shards
function setupCanvasAct5() {
    const canvas = document.querySelector('#canvasAct5');
    const section = document.querySelector('#img5');
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        initStarBirthField();
    };
    window.addEventListener('resize', onResize, { passive: true });

    const BG_STAR_COUNT = 100;
    const SHARD_COUNT = 65;
    let bgStars = [];
    let shards = [];

    function getStarContactPoint() {
        const img = section.querySelector('.connection-img');
        if (img) {
            const imgRect = img.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            return {
                x: (imgRect.left - canvasRect.left) + imgRect.width * 0.52,
                y: (imgRect.top - canvasRect.top) + imgRect.height * 0.35,
            };
        }
        return { x: width * 0.5, y: height * 0.4 };
    }

    function initStarBirthField() {
        bgStars = Array.from({ length: BG_STAR_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.7 + 0.2,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.025 + 0.008,
            color: Math.random() > 0.5 ? '#fde047' : (Math.random() > 0.3 ? '#f43f5e' : '#ffffff'),
        }));

        shards = Array.from({ length: SHARD_COUNT }, () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 300 + 15;
            return {
                angle,
                dist,
                baseDist: dist,
                speed: (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
                radialSpeed: Math.random() * 0.35 + 0.15,
                maxDist: Math.random() * 260 + 180,
                size: Math.random() * 3.2 + 1.2,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
                alpha: Math.random() * 0.75 + 0.25,
                color: Math.random() > 0.6 ? '#fef08a' : (Math.random() > 0.3 ? '#fbcfe8' : '#ffffff'),
            };
        });
    }

    initStarBirthField();

    let isVisible = false;
    const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(section);

    function render() {
        requestAnimationFrame(render);
        if (!isVisible) return;

        ctx.clearRect(0, 0, width, height);

        // Twinkling cosmic backdrop stars
        for (let i = 0; i < bgStars.length; i++) {
            const s = bgStars[i];
            s.phase += s.speed;
            const a = s.alpha + Math.sin(s.phase) * 0.28;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, a));
            ctx.fill();
        }

        const center = getStarContactPoint();

        // Shimmering crystalline glass and starlight shards radiating outwards
        for (let i = 0; i < shards.length; i++) {
            const sh = shards[i];
            sh.angle += sh.speed;
            sh.rotation += sh.rotSpeed;
            sh.dist += sh.radialSpeed;

            if (sh.dist > sh.maxDist) {
                sh.dist = Math.random() * 25 + 10;
                sh.angle = Math.random() * Math.PI * 2;
            }

            const px = center.x + Math.cos(sh.angle) * sh.dist;
            const py = center.y + Math.sin(sh.angle) * (sh.dist * 0.85);

            // Shimmering brightness factor based on distance
            const fade = Math.sin((sh.dist / sh.maxDist) * Math.PI);
            const shardAlpha = Math.max(0.1, Math.min(1, sh.alpha * fade));

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(sh.rotation);

            // Draw diamond / crystalline glass shard
            ctx.beginPath();
            ctx.moveTo(0, -sh.size * 1.5);
            ctx.lineTo(sh.size * 0.8, 0);
            ctx.lineTo(0, sh.size * 1.5);
            ctx.lineTo(-sh.size * 0.8, 0);
            ctx.closePath();

            ctx.fillStyle = sh.color;
            ctx.globalAlpha = shardAlpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = sh.color;
            ctx.fill();

            ctx.restore();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    requestAnimationFrame(render);
}

document.addEventListener('DOMContentLoaded', () => {
    setupScrollReveals();
    setupThemeObserver();
    setupStardustAct1();
    setupStarfieldAct2();
    setupVortexAct3();
    setupParticlesAct4();
    setupCanvasAct5();
    updateTimeTogether();
    setInterval(updateTimeTogether, 1000);
    handleScroll();
    handleParallax();
    initSpaceExit({ planetId: 'historia' });
});