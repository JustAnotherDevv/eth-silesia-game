type SoundName = 'click' | 'correct' | 'wrong' | 'xp-gain' | 'badge' | 'swipe-yes' | 'swipe-no' | 'complete' | 'modal-open' | 'streak'

const cache = new Map<SoundName, HTMLAudioElement>()

function get(name: SoundName): HTMLAudioElement {
  if (!cache.has(name)) {
    const audio = new Audio(`/sounds/${name}.mp3`)
    audio.preload = 'auto'
    cache.set(name, audio)
  }
  return cache.get(name)!
}

export function play(name: SoundName, volume = 0.55) {
  try {
    const audio = get(name)
    audio.currentTime = 0
    audio.volume = volume
    audio.play().catch(() => {})
  } catch {}
}

// Preload all sounds so first play is instant
export function preload() {
  const names: SoundName[] = ['click', 'correct', 'wrong', 'xp-gain', 'badge', 'swipe-yes', 'swipe-no', 'complete', 'modal-open', 'streak']
  names.forEach(get)
}
