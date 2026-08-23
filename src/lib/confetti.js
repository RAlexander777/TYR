import confetti from 'canvas-confetti'

const DEFAULT_COLORS = ['#d4af37', '#e2d1c3', '#ffffff', '#ffb7b2']

export function fireConfetti({ particleCount = 150, spread = 90, origin = { y: 0.6 }, colors = DEFAULT_COLORS } = {}) {
  confetti({
    particleCount,
    spread,
    origin,
    colors,
    disableForReducedMotion: true,
  })
}

export function fireHeartConfetti() {
  const colors = ['#d1495b', '#e88f9c', '#fdf7f0', '#d4af37']
  fireConfetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors })
}