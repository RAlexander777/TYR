/**
 * loader.js
 * Manages the cosmic TYR loading screen and its smooth FLIP transition
 * from the center of the viewport into the hero title.
 * Automatically bypassed when navigating back from any planet.
 */

export function initTYRLoader() {
  const search = window.location.search;
  const referrer = document.referrer || '';
  const isFromPlanet =
    search.includes('from=') ||
    /cumple|historia|puzzle|morpag|flow/.test(referrer) ||
    sessionStorage.getItem('tyr_skip_loader') === '1';

  const loader = document.getElementById('tyrLoader');
  const heroTitle = document.querySelector('.hero__title');

  if (isFromPlanet) {
    if (loader) loader.remove();
    try {
      sessionStorage.removeItem('tyr_skip_loader');
      if (search.includes('from=')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {}
    return;
  }

  if (!loader || !heroTitle) return;

  // Temporarily make the target title invisible while the loader animates
  heroTitle.style.opacity = '0';
  heroTitle.style.transition = 'none';

  const logoWrap = loader.querySelector('.tyr-loader__logo-wrap');
  const logo = loader.querySelector('.tyr-loader__logo');
  const tagline = loader.querySelector('.tyr-loader__tagline');
  const bar = loader.querySelector('.tyr-loader__bar');
  const backdrop = loader.querySelector('.tyr-loader__backdrop');

  let hasExecuted = false;

  const executeTransition = () => {
    if (hasExecuted) return;
    hasExecuted = true;

    // Measure positions for the FLIP transition
    const targetRect = heroTitle.getBoundingClientRect();
    const currentRect = logo.getBoundingClientRect();

    const deltaX = (targetRect.left + targetRect.width / 2) - (currentRect.left + currentRect.width / 2);
    const deltaY = (targetRect.top + targetRect.height / 2) - (currentRect.top + currentRect.height / 2);
    const scale = currentRect.height > 0 ? (targetRect.height / currentRect.height) : 1;

    // Fade out tagline, progress bar, and backdrop
    if (tagline) tagline.style.opacity = '0';
    if (bar) bar.style.opacity = '0';
    if (backdrop) backdrop.style.opacity = '0';

    // Animate loader logo to the target position
    logo.style.transition = 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 0.85s ease';
    logo.style.transform = `translate3d(${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;

    setTimeout(() => {
      // Reveal the interactive hero title in the exact position
      heroTitle.style.opacity = '1';
      heroTitle.style.transition = 'opacity 0.2s ease';

      // Clean up loader from DOM
      loader.remove();
    }, 850);
  };

  // Allow fonts & Three.js canvas to initialize, with minimum display time
  const minDisplayTime = 950;
  const startTime = performance.now();

  const onReady = () => {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);
    setTimeout(executeTransition, remaining);
  };

  if (document.readyState === 'complete') {
    onReady();
  } else {
    window.addEventListener('load', onReady, { once: true });
    setTimeout(onReady, 2500); // Safety fallback
  }
}
