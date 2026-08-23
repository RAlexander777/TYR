export function createFallingHeart(container) {
  const heart = document.createElement('div')
  heart.className = 'heart-item'
  heart.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'

  const startLeft = Math.random() * 100
  const scale = Math.random() * 1.2 + 0.8
  const duration = Math.random() * 10 + 15
  const tilt = Math.random() * 90 - 45
  const blurAmount = Math.random() * 2 + 0.5

  heart.style.left = `${startLeft}%`
  heart.style.setProperty('--heart-scale', scale)
  heart.style.setProperty('--fall-duration', `${duration}s`)
  heart.style.setProperty('--rotation-tilt', `${tilt}deg`)
  heart.style.filter = `blur(${blurAmount}px)`

  container.appendChild(heart)
  setTimeout(() => heart.remove(), duration * 1000 + 500)
}

export function spawnBurstHearts(container) {
  if (!container) return
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const heart = document.createElement('div')
      heart.className = 'floating-heart'
      heart.textContent = '❤️'
      heart.style.left = `${50 + Math.random() * 40 - 20}%`
      heart.style.top = '50%'
      container.appendChild(heart)
      setTimeout(() => heart.remove(), 2000)
    }, i * 100)
  }
}

export function startHeartRain(container, intervalMs = 800) {
  if (!container) return null
  createFallingHeart(container)
  return setInterval(() => createFallingHeart(container), intervalMs)
}