import { BoardPiece } from '@kenrick95/c4'

const STORAGE_KEY = 'xo-plus-sound-enabled'
const MASTER_GAIN_MULTIPLIER = 2.8
const BACKGROUND_MUSIC_URL = `${import.meta.env.BASE_URL}audio/hitslab-game-gaming-music-295075.mp3`
const BACKGROUND_MUSIC_VOLUME = 0.42
const BACKGROUND_LOOP_EDGE_TRIM = 0.12
const WINNER_SOUND_URL = `${import.meta.env.BASE_URL}audio/mori_sound-fx-game-winner-497166_1.mp3`
const WINNER_SOUND_VOLUME = 0.72
const GAME_OVER_SOUND_URL = `${import.meta.env.BASE_URL}audio/mori_sound-fx-game-over-497165_1.mp3`
const GAME_OVER_SOUND_VOLUME = 0.68

type Envelope = {
  frequency: number
  duration: number
  gain: number
  type?: OscillatorType
  delay?: number
}

class SoundController {
  private audioContext: AudioContext | null = null
  private backgroundBufferPromise: Promise<AudioBuffer | null> | null = null
  private backgroundSource: AudioBufferSourceNode | null = null
  private backgroundGainNode: GainNode | null = null
  private backgroundLoopStart = 0
  private backgroundLoopEnd = 0
  private winnerAudio: HTMLAudioElement | null = null
  private gameOverAudio: HTMLAudioElement | null = null
  private activeForegroundAudio: HTMLAudioElement | null = null
  private shouldResumeBackgroundAfterForeground = false
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

    if (!this.enabled) {
      this.stopForegroundAudio()
    }
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

  async playVictoryTrack() {
    await this.playForegroundTrack(this.getWinnerAudio())
  }

  async playGameOverTrack() {
    await this.playForegroundTrack(this.getGameOverAudio())
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
    if (!this.enabled || this.activeForegroundAudio) {
      return
    }

    const context = await this.getContext()
    if (!context || this.backgroundSource) {
      return
    }

    const backgroundBuffer = await this.getBackgroundBuffer(context)
    if (!backgroundBuffer) {
      return
    }

    const backgroundGainNode = this.getBackgroundGainNode(context)
    const source = context.createBufferSource()
    source.buffer = backgroundBuffer
    source.loop = true
    source.loopStart = this.backgroundLoopStart
    source.loopEnd = this.backgroundLoopEnd
    source.connect(backgroundGainNode)

    backgroundGainNode.gain.cancelScheduledValues(context.currentTime)
    backgroundGainNode.gain.setValueAtTime(0.0001, context.currentTime)
    backgroundGainNode.gain.linearRampToValueAtTime(
      BACKGROUND_MUSIC_VOLUME,
      context.currentTime + 0.16,
    )

    source.addEventListener('ended', () => {
      if (this.backgroundSource === source) {
        this.backgroundSource = null
      }
    })

    this.backgroundSource = source

    try {
      source.start(0, this.backgroundLoopStart)
    } catch {
      if (this.backgroundSource === source) {
        this.backgroundSource = null
      }
      return
    }
  }

  stopBackgroundMusic() {
    if (!this.backgroundSource || !this.audioContext) {
      return
    }

    const source = this.backgroundSource
    const now = this.audioContext.currentTime
    if (this.backgroundGainNode) {
      this.backgroundGainNode.gain.cancelScheduledValues(now)
      this.backgroundGainNode.gain.setValueAtTime(
        Math.max(this.backgroundGainNode.gain.value, 0.0001),
        now,
      )
      this.backgroundGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
    }

    this.backgroundSource = null
    source.stop(now + 0.1)
  }

  private async playForegroundTrack(audio: HTMLAudioElement) {
    if (!this.enabled) {
      return
    }

    this.stopForegroundAudio()
    this.pauseBackgroundForForeground()
    audio.currentTime = 0
    this.activeForegroundAudio = audio

    try {
      await audio.play()
    } catch {
      if (this.activeForegroundAudio === audio) {
        this.activeForegroundAudio = null
      }
      await this.resumeBackgroundAfterForeground()
    }
  }

  private pauseBackgroundForForeground() {
    this.shouldResumeBackgroundAfterForeground = Boolean(this.backgroundSource)
    this.stopBackgroundMusic()
  }

  private async resumeBackgroundAfterForeground() {
    if (!this.shouldResumeBackgroundAfterForeground) {
      return
    }

    this.shouldResumeBackgroundAfterForeground = false
    await this.startBackgroundMusic()
  }

  private stopForegroundAudio() {
    if (!this.activeForegroundAudio) {
      return
    }

    this.activeForegroundAudio.pause()
    this.activeForegroundAudio.currentTime = 0
    this.activeForegroundAudio = null
    this.shouldResumeBackgroundAfterForeground = false
  }

  private async getBackgroundBuffer(context: AudioContext) {
    if (!this.backgroundBufferPromise) {
      this.backgroundBufferPromise = fetch(BACKGROUND_MUSIC_URL)
        .then(async (response) => {
          if (!response.ok) {
            return null
          }

          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await context.decodeAudioData(arrayBuffer)
          const firstHalf = audioBuffer.duration / 2
          const loopStart = Math.min(BACKGROUND_LOOP_EDGE_TRIM, firstHalf / 4)
          const loopEnd = Math.max(firstHalf - BACKGROUND_LOOP_EDGE_TRIM, loopStart + 1)

          this.backgroundLoopStart = loopStart
          this.backgroundLoopEnd = loopEnd

          return audioBuffer
        })
        .catch(() => null)
    }

    return this.backgroundBufferPromise
  }

  private getBackgroundGainNode(context: AudioContext) {
    if (!this.backgroundGainNode) {
      this.backgroundGainNode = context.createGain()
      this.backgroundGainNode.gain.setValueAtTime(0.0001, context.currentTime)
      this.backgroundGainNode.connect(context.destination)
    }

    return this.backgroundGainNode
  }

  private getWinnerAudio() {
    if (!this.winnerAudio) {
      this.winnerAudio = this.createForegroundAudio(
        WINNER_SOUND_URL,
        WINNER_SOUND_VOLUME,
      )
    }

    return this.winnerAudio
  }

  private getGameOverAudio() {
    if (!this.gameOverAudio) {
      this.gameOverAudio = this.createForegroundAudio(
        GAME_OVER_SOUND_URL,
        GAME_OVER_SOUND_VOLUME,
      )
    }

    return this.gameOverAudio
  }

  private createForegroundAudio(src: string, volume: number) {
    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.volume = volume

    audio.addEventListener('ended', () => {
      if (this.activeForegroundAudio !== audio) {
        return
      }

      this.activeForegroundAudio = null
      void this.resumeBackgroundAfterForeground()
    })

    return audio
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
