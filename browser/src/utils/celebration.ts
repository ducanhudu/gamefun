const FIREWORK_CONTAINER_SELECTOR = '.board-fireworks'

const FIREWORK_BURSTS = [
  { left: '18%', hue: '352deg', delay: 0 },
  { left: '50%', hue: '212deg', delay: 120 },
  { left: '82%', hue: '46deg', delay: 240 },
]

function createFireworkShell(left: string, hue: string) {
  const shell = document.createElement('span')
  shell.className = 'firework-shell'
  shell.style.left = left
  shell.style.setProperty('--firework-hue', hue)
  return shell
}

function createFireworkBurst(left: string, hue: string) {
  const burst = document.createElement('span')
  burst.className = 'firework-burst'
  burst.style.left = left
  burst.style.setProperty('--firework-hue', hue)

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('span')
    particle.className = 'firework-particle'
    particle.style.setProperty('--particle-angle', `${i * 36}deg`)
    particle.style.setProperty('--particle-delay', `${i * 18}ms`)
    burst.appendChild(particle)
  }

  return burst
}

export function playFireworks(): Promise<void> {
  const container = document.querySelector(FIREWORK_CONTAINER_SELECTOR)
  if (!(container instanceof HTMLDivElement)) {
    return Promise.resolve()
  }

  container.replaceChildren()
  container.classList.add('is-active')

  FIREWORK_BURSTS.forEach(({ left, hue, delay }) => {
    window.setTimeout(() => {
      const shell = createFireworkShell(left, hue)
      const burst = createFireworkBurst(left, hue)
      container.append(shell, burst)
    }, delay)
  })

  return new Promise((resolve) => {
    window.setTimeout(() => {
      container.classList.remove('is-active')
      container.replaceChildren()
      resolve()
    }, 1500)
  })
}
