import '@fontsource/great-vibes/400.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/700.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import './style.css';
import { fireConfetti } from '../src/lib/confetti.js';

const STORAGE_KEY = 'golden_tickets_state';

const tickets = [
    { icon: '🍽️', title: 'Cena Romántica', description: 'El lugar que quieras' },
    { icon: '🎬', title: 'Salida al Cine', description: 'La película que quieras' },
    { icon: '💆‍♀️', title: 'Día de Spa', description: 'Masajes hechos por mí' },
    { icon: '🍦', title: 'Antojo', description: 'Cumplo un antojo al instante' },
    { icon: '🃏', title: 'Libre', description: 'Pide lo que quieras' },
    { icon: '❤️', title: 'Beso Infinito', description: 'Ahora mismo' },
];

function getRevealedTickets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveRevealedTicket(index) {
    const revealed = getRevealedTickets();
    if (!revealed.includes(index)) {
        revealed.push(index);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(revealed));
    }
}

function createBackgroundShapes(container) {
    const shapes = [
        { type: 'square', left: 10, size: 40, duration: 15, delay: 0 },
        { type: 'heart', left: 20, size: 30, duration: 25, delay: 2 },
        { type: 'square', left: 35, size: 60, duration: 20, delay: 4 },
        { type: 'heart', left: 50, size: 25, duration: 18, delay: 0 },
        { type: 'square', left: 65, size: 30, duration: 22, delay: 0 },
        { type: 'heart', left: 80, size: 45, duration: 30, delay: 3 },
        { type: 'square', left: 90, size: 20, duration: 12, delay: 5 },
        { type: 'heart', left: 5, size: 35, duration: 28, delay: 1 },
        { type: 'square', left: 55, size: 15, duration: 10, delay: 6 },
        { type: 'heart', left: 75, size: 50, duration: 35, delay: 2 },
    ];

    for (const { type, left, size, duration, delay } of shapes) {
        const span = document.createElement('span');
        span.className = type === 'square' ? 'shape-square' : 'shape-heart';
        span.style.left = `${left}%`;
        span.style.width = `${size}px`;
        span.style.height = `${size}px`;
        span.style.animationDuration = `${duration}s`;
        span.style.animationDelay = `${delay}s`;
        container.appendChild(span);
    }
}

function buildTicket(ticket, index) {
    const el = document.createElement('div');
    el.className = 'ticket';

    const wrapper = document.createElement('div');
    wrapper.className = 'ticket-content-wrapper';

    const stub = document.createElement('div');
    stub.className = 'stub';
    const stubContent = document.createElement('div');
    stubContent.className = 'stub-content';
    const icon = document.createElement('span');
    icon.className = 'ticket-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ticket.icon;
    const date = document.createElement('span');
    date.className = 'ticket-date';
    date.textContent = `Ticket #${String(index + 1).padStart(2, '0')}`;
    stubContent.append(icon, date);
    stub.appendChild(stubContent);

    const check = document.createElement('div');
    check.className = 'check';
    const prize = document.createElement('div');
    prize.className = 'prize-content';
    const title = document.createElement('h3');
    title.textContent = ticket.title;
    const description = document.createElement('p');
    description.textContent = ticket.description;
    prize.append(title, description);
    check.appendChild(prize);

    const canvas = document.createElement('canvas');
    canvas.className = 'scratch-canvas';
    canvas.width = 380;
    canvas.height = 160;
    canvas.setAttribute('aria-label', `Rasca el ticket ${index + 1}: ${ticket.title}`);

    wrapper.append(stub, check);
    el.append(wrapper, canvas);
    return el;
}

function initScratch(canvas, index) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let isDrawing = false;
    let revealed = getRevealedTickets().includes(index);
    let scratchEvents = 0;

    if (revealed) {
        canvas.classList.add('check-revealed');
        return;
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#d4af37');
    gradient.addColorStop(0.3, '#fdfcba');
    gradient.addColorStop(0.6, '#d4af37');
    gradient.addColorStop(1, '#b38f2d');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0, height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, height / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#8a6e2f';
    ctx.font = 'bold 22px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText('RASCAR', width / 2, height / 2);
    ctx.shadowColor = 'transparent';

    ctx.globalCompositeOperation = 'destination-out';

    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    }

    function scratch(event) {
        if (!isDrawing || revealed) return;
        if (event.type.startsWith('touch')) event.preventDefault();

        const pos = getMousePos(event);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        ctx.fill();

        scratchEvents++;
        if (scratchEvents % 8 === 0) checkScratchPercent();
    }

    function checkScratchPercent() {
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        let transparentCount = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) transparentCount++;
        }

        const percent = (transparentCount / (pixels.length / 4)) * 100;
        if (percent > 70) revealTicket();
    }

    function revealTicket() {
        revealed = true;
        canvas.classList.add('check-revealed');
        fireConfetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#d4af37', '#e2d1c3', '#ffffff', '#ffb7b2'],
        });
        saveRevealedTicket(index);
    }

    canvas.addEventListener('mousedown', () => { isDrawing = true; });
    canvas.addEventListener('touchstart', (event) => { isDrawing = true; scratch(event); }, { passive: false });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    canvas.addEventListener('mouseup', () => { isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; });
    canvas.addEventListener('touchend', () => { isDrawing = false; });
}

const container = document.querySelector('#tickets-container');
createBackgroundShapes(document.querySelector('.background-animation'));

tickets.forEach((ticket, index) => {
    const el = buildTicket(ticket, index);
    container.appendChild(el);
    initScratch(el.querySelector('.scratch-canvas'), index);
});