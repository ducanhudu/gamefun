import { BoardPiece } from '@kenrick95/c4'

const STORAGE_KEY = 'xo-plus-sound-enabled'
const MASTER_GAIN_MULTIPLIER = 2.8
const BACKGROUND_MUSIC_GAIN = 0.56
const BACKGROUND_STEP_DURATION = 0.4

type BackgroundStep = {
  bass?: number
  harmony?: number
  lead?: number
}

const BACKGROUND_PATTERN: BackgroundStep[] = [
  { bass: 130.81, harmony: 261.63, lead: 392.0 },
  { harmony: 329.63, lead: 440.0 },
  { bass: 130.81, harmony: 261.63, lead: 392.0 },
  { harmony: 329.63, lead: 349.23 },
  { bass: 110.0, harmony: 220.0, lead: 369.99 },
  { harmony: 277.18, lead: 392.0 },
  { bass: 98.0, harmony: 196.0, lead: 329.63 },
  { harmony: 246.94, lead: 293.66 },
  { bass: 98.0, harmony: 196.0, lead: 329.63 },
  { harmony: 246.94, lead: 392.0 },
  { bass: 87.31, harmony: 174.61, lead: 293.66 },
  { harmony: 220.0, lead: 329.63 },
]

type Envelope = {
  frequency: number
  duration: number
  gain: number
  type?: OscillatorType
  delay?: number
}

class SoundController {
  private audioContext: AudioContext | null = null
  private backgroundGainNode: GainNode | null = null
  private backgroundLoopTimer: number | null = null
  private backgroundLoopToken = 0
  private isBackgroundLoopRunning = false
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
    void this.syncBackgroundMusic()
    return this.enabled
  }

  async syncBackgroundMusic() {
    if (!this.enabled) {
      this.stopBackgroundMusic()
      return
    }

    await this.startBackgroundMusic()
  }

  async playMove(boardPiece: BoardPiece) {
    await this.play([
      {
        frequency: boardPiece === BoardPiece.PLAYER_1 ? 392 : 523.25,
        duration: 0.09,
        gain: 0.085,
        type: 'triangle',
      },
      {
        frequency: boardPiece === BoardPiece.PLAYER_1 ? 523.25 : 659.25,
        duration: 0.08,
        gain: 0.06,
        type: 'sine',
        delay: 0.045,
      },
    ])
  }

  async playUndo() {
    await this.play([
      { frequency: 659.25, duration: 0.06, gain: 0.055, type: 'triangle' },
      {
        frequency: 493.88,
        duration: 0.08,
        gain: 0.05,
        type: 'triangle',
        delay: 0.045,
      },
      {
        frequency: 369.99,
        duration: 0.1,
        gain: 0.04,
        type: 'sine',
        delay: 0.09,
      },
    ])
  }

  async playWin(boardPiece: BoardPiece) {
    const baseFrequency = boardPiece === BoardPiece.PLAYER_1 ? 392 : 440
    await this.play([
      { frequency: baseFrequency, duration: 0.1, gain: 0.075, type: 'triangle' },
      {
        frequency: baseFrequency * 1.25,
        duration: 0.11,
        gain: 0.07,
        type: 'triangle',
        delay: 0.07,
      },
      {
        frequency: baseFrequency * 1.5,
        duration: 0.14,
        gain: 0.08,
        type: 'triangle',
        delay: 0.14,
      },
      {
        frequency: baseFrequency * 2,
        duration: 0.16,
        gain: 0.06,
        type: 'sine',
        delay: 0.21,
      },
    ])
  }

  async playDraw() {
    await this.play([
      { frequency: 349.23, duration: 0.09, gain: 0.045, type: 'triangle' },
      {
        frequency: 311.13,
        duration: 0.11,
        gain: 0.04,
        type: 'triangle',
        delay: 0.06,
      },
      {
        frequency: 261.63,
        duration: 0.14,
        gain: 0.038,
        type: 'sine',
        delay: 0.12,
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
    await this.startBackgroundMusic()

    const startTime = context.currentTime
    for (const envelope of envelopes) {
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      const noteStart = startTime + (envelope.delay ?? 0)
      const noteEnd = noteStart + envelope.duration

      oscillator.type = envelope.type ?? 'sine'
      oscillator.frequency.setValueAtTime(envelope.frequency, noteStart)

      const gain = Math.min(envelope.gain * MASTER_GAIN_MULTIPLIER, 0.24)
      gainNode.gain.setValueAtTime(0.0001, noteStart)
      gainNode.gain.linearRampToValueAtTime(gain, noteStart + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteEnd + 0.03)
    }
  }

  async startBackgroundMusic() {
    if (!this.enabled || this.isBackgroundLoopRunning) {
      return
    }

    const context = await this.getContext()
    if (!context) {
      return
    }

    const backgroundGainNode = this.getBackgroundGainNode(context)
    const now = context.currentTime

    backgroundGainNode.gain.cancelScheduledValues(now)
    backgroundGainNode.gain.setValueAtTime(0.0001, now)
    backgroundGainNode.gain.exponentialRampToValueAtTime(
      BACKGROUND_MUSIC_GAIN,
      now + 0.9,
    )

    this.isBackgroundLoopRunning = true
    const token = ++this.backgroundLoopToken
    this.scheduleBackgroundPhrase(context, now + 0.06, token)
  }

  stopBackgroundMusic() {
    this.isBackgroundLoopRunning = false
    this.backgroundLoopToken += 1

    if (this.backgroundLoopTimer !== null) {
      window.clearTimeout(this.backgroundLoopTimer)
      this.backgroundLoopTimer = null
    }

    if (!this.audioContext || !this.backgroundGainNode) {
      return
    }

    const now = this.audioContext.currentTime
    this.backgroundGainNode.gain.cancelScheduledValues(now)
    this.backgroundGainNode.gain.setValueAtTime(
      Math.max(this.backgroundGainNode.gain.value, 0.0001),
      now,
    )
    this.backgroundGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
  }

  private scheduleBackgroundPhrase(
    context: AudioContext,
    startTime: number,
    token: number,
  ) {
    for (const [index, step] of BACKGROUND_PATTERN.entries()) {
      const stepStart = startTime + index * BACKGROUND_STEP_DURATION
      this.scheduleBackgroundStep(context, stepStart, step)
    }

    const phraseDuration = BACKGROUND_PATTERN.length * BACKGROUND_STEP_DURATION
    const nextStartTime = startTime + phraseDuration
    const nextDelayMs = Math.max((phraseDuration - 0.32) * 1000, 0)

    this.backgroundLoopTimer = window.setTimeout(() => {
      if (
        !this.enabled ||
        !this.isBackgroundLoopRunning ||
        token !== this.backgroundLoopToken
      ) {
        return
      }

      this.scheduleBackgroundPhrase(
        context,
        Math.max(nextStartTime, context.currentTime + 0.06),
        token,
      )
    }, nextDelayMs)
  }

  private scheduleBackgroundStep(
    context: AudioContext,
    startTime: number,
    step: BackgroundStep,
  ) {
    if (step.bass) {
      this.scheduleBackgroundTone(
        context,
        step.bass,
        startTime,
        BACKGROUND_STEP_DURATION * 1.5,
        0.11,
        'sine',
        0.02,
        0.22,
      )
      this.scheduleBackgroundTone(
        context,
        step.bass * 2,
        startTime + 0.02,
        BACKGROUND_STEP_DURATION * 1.15,
        0.048,
        'triangle',
        0.03,
        0.18,
      )
    }

    if (step.harmony) {
      this.scheduleBackgroundTone(
        context,
        step.harmony,
        startTime + 0.04,
        BACKGROUND_STEP_DURATION * 1.18,
        0.064,
        'triangle',
        0.06,
        0.22,
      )
      this.scheduleBackgroundTone(
        context,
        step.harmony * 1.5,
        startTime + 0.06,
        BACKGROUND_STEP_DURATION * 0.92,
        0.036,
        'sine',
        0.05,
        0.18,
      )
    }

    if (step.lead) {
      this.scheduleBackgroundTone(
        context,
        step.lead,
        startTime + 0.08,
        BACKGROUND_STEP_DURATION * 0.72,
        0.092,
        'square',
        0.02,
        0.14,
      )
      this.scheduleBackgroundTone(
        context,
        step.lead * 2,
        startTime + 0.22,
        BACKGROUND_STEP_DURATION * 0.24,
        0.03,
        'sine',
        0.01,
        0.06,
      )
    }
  }

  private scheduleBackgroundTone(
    context: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    attack: number,
    release: number,
  ) {
    if (!this.backgroundGainNode) {
      return
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    const peakTime = startTime + attack
    const noteEnd = startTime + duration
    const releaseStart = Math.max(peakTime + 0.05, noteEnd - release)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, startTime)
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.linearRampToValueAtTime(gain, peakTime)
    gainNode.gain.linearRampToValueAtTime(gain * 0.78, releaseStart)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd)

    oscillator.connect(gainNode)
    gainNode.connect(this.backgroundGainNode)
    oscillator.start(startTime)
    oscillator.stop(noteEnd + 0.05)
  }

  private getBackgroundGainNode(context: AudioContext) {
    if (!this.backgroundGainNode) {
      this.backgroundGainNode = context.createGain()
      this.backgroundGainNode.gain.setValueAtTime(0.0001, context.currentTime)
      this.backgroundGainNode.connect(context.destination)
    }

    return this.backgroundGainNode
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
