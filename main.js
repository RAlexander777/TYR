import '@fontsource/playfair-display/400.css';
import '@fontsource/lato/300.css';
import './src/styles/tokens.css';
import './src/styles/base.css';
import './src/styles/space-transition.css';
import './src/styles/ship-ui.css';
import './src/styles/lyrics-plus.css';
import './src/styles/loader.css';
import './style.css';
import './src/solar-system.js';
import './src/background.js';
import './src/music-player.js';
import { spawnBurstHearts } from './src/lib/hearts.js';
import { initTYRLoader } from './src/loader.js';

function initHeroTitle() {
  const heroTitle = document.querySelector('.hero__title--interactive');
  if (!heroTitle) return;

  const toggleTYR = () => {
    const isExpanded = heroTitle.classList.toggle('is-expanded');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(isExpanded ? 22 : 10); } catch {}
    }
    if (isExpanded) {
      spawnBurstHearts(heroTitle);
    }
  };

  heroTitle.addEventListener('click', toggleTYR);
  heroTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTYR();
    }
  });
}

initTYRLoader();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroTitle);
} else {
  initHeroTitle();
}