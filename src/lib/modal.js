export function openModal(modal) {
  if (!modal) return
  modal.classList.add('visible')
  const focusTarget = modal.querySelector('input, button, a, [tabindex]')
  if (focusTarget) focusTarget.focus()
}

export function closeModal(modal) {
  if (!modal) return
  modal.classList.remove('visible')
}

export function bindModal(modal, opts = {}) {
  if (!modal) return () => {}
  const { onClose } = opts

  const handleKey = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('visible')) {
      closeModal(modal)
      if (onClose) onClose()
    }
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal)
      if (onClose) onClose()
    }
  })

  document.addEventListener('keydown', handleKey)
  return () => document.removeEventListener('keydown', handleKey)
}