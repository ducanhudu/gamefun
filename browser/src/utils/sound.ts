import { BoardPiece } from '@kenrick95/c4'

const STORAGE_KEY = 'xo-plus-sound-enabled'

type Envelope = {
  frequency: number
  duration: number
  gain: number
  type?: OscillatorType
  delay?: number
}

class SoundController {
  private audioContext: AudioContext | null = null
  private enabled =
    window.localStorage.getItem(STORAGE_KEY) !== null
      ? window.localStorage.getItem(STORAGE_KEY) === 'true'
      : true

  isEnabled() {
    return this.enabled
  }

  toggle() {
    this.enabled = !this.enabled
    window.localStorage.setItem(STORAGE_KEY, String(this.enabled))
    return this.enabled
  }

  async playMove(boardPiece: BoardPiece) {
    await this.play([
      {
        frequency: boardPiece === BoardPiece.PLAYER_1 ? 372 : 494,
        duration: 0.12,
        gain: 0.08,
        type: 'sine',
      },
    ])
  }

  async playUndo() {
    await this.play([
      { frequency: 520, duration: 0.08, gain: 0.05, type: 'triangle' },
      {
        frequency: 390,
        duration: 0.11,
        gain: 0.05,
        type: 'triangle',
        delay: 0.06,
      },
    ])
  }

  async playWin(boardPiece: BoardPiece) {
    const baseFrequency = boardPiece === BoardPiece.PLAYER_1 ? 392 : 440
    await this.play([
      { frequency: baseFrequency, duration: 0.12, gain: 0.07, type: 'triangle' },
      {
        frequency: baseFrequency * 1.25,
        duration: 0.14,
        gain: 0.07,
        type: 'triangle',
        delay: 0.09,
      },
      {
        frequency: baseFrequency * 1.5,
        duration: 0.2,
        gain: 0.08,
        type: 'triangle',
        delay: 0.18,
      },
    ])
  }

  async playDraw() {
    await this.play([
      { frequency: 320, duration: 0.12, gain: 0.05, type: 'sawtooth' },
      {
        frequency: 280,
        duration: 0.18,
        gain: 0.04,
        type: 'sawtooth',
        delay: 0.08,
      },
    ])
  }

  private async play(envelopes: Envelope[]) {
    if (!this.enabled) {
      return
    }
    const context = await this.getContext()
    if (!context) {
      return
    }

    const startTime = context.currentTime
    for (const envelope of envelopes) {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      const noteStart = startTime + (envelope.delay ?? 0)
      const noteEnd = noteStart + envelope.duration

      oscillator.type = envelope.type ?? 'sine'
      oscillator.frequency.setValueAtTime(envelope.frequency, noteStart)

      gainNode.gain.setValueAtTime(0.0001, noteStart)
      gainNode.gain.linearRampToValueAtTime(envelope.gain, noteStart + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteEnd + 0.03)
    }
  }

  private async getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return null
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContextClass()
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    return this.audioContext
  }
}

export const soundController = new SoundController()
