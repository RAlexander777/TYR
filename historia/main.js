import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import './style.css';

const START_DATE = new Date('2022-09-04T00:00:00');
const items = Array.from(document.querySelectorAll('.item'));
const multiScroll = document.querySelector('#multiScroll');
const windowHeight = () => window.innerHeight;

function handleScroll() {
    const rect = multiScroll.getBoundingClientRect();
    if (rect.top <= 0 && rect.bottom >= windowHeight()) {
        const scrollable = multiScroll.offsetHeight - windowHeight();
        const progress = scrollable > 0
            ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
            : 1;
        const step = 1 / items.length;

        items.forEach((item, index) => {
            item.classList.toggle('visible', progress >= step * index);
        });
    }
}

function updateTimeTogether() {
    const now = new Date();
    const diff = Math.max(0, now - START_DATE);

    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);

    const el = document.querySelector('#tiempoJuntos');
    el.textContent = `${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos 💕`;
}

const parallaxSections = document.querySelectorAll('.parallax-section');

function handleParallax() {
    for (const section of parallaxSections) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > windowHeight()) continue;
        const progress = (rect.top + rect.height / 2 - windowHeight() / 2) / windowHeight();
        const bg = section.querySelector('.parallax-bg');
        bg.style.transform = `translateY(${progress * 40}px)`;
    }
}

window.addEventListener('scroll', () => {
    handleScroll();
    requestAnimationFrame(handleParallax);
}, { passive: true });

updateTimeTogether();
setInterval(updateTimeTogether, 1000);
handleScroll();