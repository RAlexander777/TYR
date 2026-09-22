const root = document.querySelector('.carousel');

if (root) {
  const viewport = root.querySelector('.carousel__viewport');
  const track = root.querySelector('.carousel__track');
  const prev = root.querySelector('.carousel__arrow--prev');
  const next = root.querySelector('.carousel__arrow--next');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const realSlides = [...track.children];
  const totalReal = realSlides.length;

  const createClone = (slide) => {
    const copy = slide.cloneNode(true);
    copy.classList.add('is-clone');
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('a, button').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });
    return copy;
  };

  // Buffer: 2 clones at each end so peripheral neighbors are always visible without blank gaps
  const cloneStart1 = createClone(realSlides[totalReal - 2]);
  const cloneStart2 = createClone(realSlides[totalReal - 1]);
  track.insertBefore(cloneStart2, track.firstElementChild);
  track.insertBefore(cloneStart1, track.firstElementChild);

  const cloneEnd1 = createClone(realSlides[0]);
  const cloneEnd2 = createClone(realSlides[1]);
  track.appendChild(cloneEnd1);
  track.appendChild(cloneEnd2);

  const trackSlides = [...track.children];
  const realStart = 2;
  const realEnd = realStart + totalReal - 1;

  const dotsNav = document.createElement('nav');
  dotsNav.className = 'carousel__dots';
  dotsNav.setAttribute('aria-label', 'Seleccionar experiencia');

  const dots = realSlides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel__dot';
    dot.type = 'button';
    const title = slide.querySelector('.carousel__title')?.textContent?.trim() || `Experiencia ${i + 1}`;
    dot.setAttribute('aria-label', `Ir a: ${title}`);
    dotsNav.appendChild(dot);
    return dot;
  });

  root.after(dotsNav);

  let current = 0;
  let trackIndex = realStart;
  let isAnimating = false;

  const slideWidth = () => trackSlides[realStart].offsetWidth;

  const translateFor = (index) => {
    const v = viewport.clientWidth;
    return (v - slideWidth()) / 2 - index * slideWidth();
  };

  const setTransition = (on) => {
    track.style.transition = on ? 'transform var(--duration-base) var(--ease-out)' : 'none';
  };

  const setActiveElement = (element) => {
    trackSlides.forEach((slide) => slide.classList.remove('is-active'));
    if (element) {
      element.classList.add('is-active');
    }
  };

  const apply = () => {
    track.style.transform = `translateX(${translateFor(trackIndex)}px)`;
  };

  const settle = (fn) => {
    if (prefersReducedMotion) {
      fn();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      track.removeEventListener('transitionend', handler);
      fn();
    };
    const handler = (event) => {
      if (event.target === track && event.propertyName === 'transform') finish();
    };
    track.addEventListener('transitionend', handler);
    setTimeout(finish, 500);
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  const updateDots = () => {
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    triggerHaptic();
  };

  const silentSwapTo = (targetIndex) => {
    track.classList.add('is-reordering');
    trackIndex = targetIndex;
    setActiveElement(trackSlides[targetIndex]);
    apply();
    void track.offsetHeight;
    requestAnimationFrame(() => {
      track.classList.remove('is-reordering');
      isAnimating = false;
    });
  };

  const goTo = (targetTrackIndex) => {
    if (isAnimating) return;

    if (targetTrackIndex < realStart) {
      isAnimating = true;
      trackIndex = targetTrackIndex;
      current = ((targetTrackIndex - realStart) % totalReal + totalReal) % totalReal;
      setTransition(true);
      setActiveElement(trackSlides[targetTrackIndex]);
      apply();
      updateDots();

      settle(() => {
        const offsetFromStart = realStart - targetTrackIndex;
        silentSwapTo(realEnd - offsetFromStart + 1);
      });
      return;
    }

    if (targetTrackIndex > realEnd) {
      isAnimating = true;
      trackIndex = targetTrackIndex;
      current = ((targetTrackIndex - realStart) % totalReal + totalReal) % totalReal;
      setTransition(true);
      setActiveElement(trackSlides[targetTrackIndex]);
      apply();
      updateDots();

      settle(() => {
        const offsetFromEnd = targetTrackIndex - realEnd;
        silentSwapTo(realStart + offsetFromEnd - 1);
      });
      return;
    }

    isAnimating = true;
    current = targetTrackIndex - realStart;
    trackIndex = targetTrackIndex;
    setTransition(true);
    setActiveElement(trackSlides[targetTrackIndex]);
    apply();
    updateDots();

    settle(() => {
      isAnimating = false;
    });
  };

  const nextSlide = () => {
    if (isAnimating) return;
    goTo(trackIndex + 1);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    goTo(trackIndex - 1);
  };

  prev.addEventListener('click', prevSlide);
  next.addEventListener('click', nextSlide);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (isAnimating) return;
      goTo(realStart + i);
    });
  });

  trackSlides.forEach((slide, idx) => {
    slide.addEventListener('click', (event) => {
      if (idx !== trackIndex) {
        event.preventDefault();
        goTo(idx);
      }
    });
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      prevSlide();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      nextSlide();
      event.preventDefault();
    }
  });

  const handleResize = () => {
    setTransition(false);
    apply();
    requestAnimationFrame(() => setTransition(true));
  };

  window.addEventListener('resize', handleResize);
  if (window.ResizeObserver) {
    new ResizeObserver(handleResize).observe(viewport);
  }

  root.addEventListener('dragstart', (event) => event.preventDefault());

  let isDragging = false;
  let hasMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartTime = 0;
  let dragStartTranslate = 0;
  let lastMoveX = 0;
  let lastMoveTime = 0;

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isAnimating) return;

    isDragging = true;
    hasMoved = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartTime = performance.now();
    lastMoveX = dragStartX;
    lastMoveTime = dragStartTime;
    dragStartTranslate = translateFor(trackIndex);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    if (!hasMoved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      isDragging = false;
      return;
    }

    if (!hasMoved && Math.abs(dx) > 4) {
      hasMoved = true;
      setTransition(false);
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch {}
      viewport.classList.add('is-dragging');
    }

    if (!hasMoved) return;

    lastMoveX = event.clientX;
    lastMoveTime = performance.now();
    const currentTranslate = dragStartTranslate + dx;
    const v = viewport.clientWidth;
    const sw = slideWidth();
    const tilt = Math.max(-2, Math.min(2, (dx / sw) * 3));
    track.style.transform = `translateX(${currentTranslate}px) rotate(${tilt}deg)`;
    const approxIndex = Math.round(((v - sw) / 2 - currentTranslate) / sw);
    if (trackSlides[approxIndex]) {
      setActiveElement(trackSlides[approxIndex]);
      const activeDotIndex = ((approxIndex - realStart) % totalReal + totalReal) % totalReal;
      dots.forEach((dot, i) => dot.setAttribute('aria-current', i === activeDotIndex ? 'true' : 'false'));
    }
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');

    if (event && viewport.hasPointerCapture && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    const dx = lastMoveX - dragStartX;
    const dt = lastMoveTime - dragStartTime;
    const velocity = dt > 0 ? dx / dt : 0;

    if (hasMoved) {
      const suppress = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      viewport.addEventListener('click', suppress, { capture: true, once: true });
    }

    setTransition(true);

    const sw = slideWidth();
    let step = 0;

    if (velocity < -0.28 || dx < -sw * 0.22) {
      step = 1;
    } else if (velocity > 0.28 || dx > sw * 0.22) {
      step = -1;
    }

    if (step !== 0) {
      goTo(trackIndex + step);
    } else {
      apply();
      setActiveElement(trackSlides[trackIndex]);
      updateDots();
    }
  };

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  setActiveElement(trackSlides[trackIndex]);
  apply();
  updateDots();
}