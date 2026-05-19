import { Board } from './board'
import * as Game from './game'
import './style.css'
import type { AiDifficulty } from './game/game-local-ai'
import { soundController } from './utils/sound'

const DEFAULT_HUMAN_1 = 'Người chơi 1'
const DEFAULT_HUMAN_2 = 'Người chơi 2'
const DEFAULT_AI = 'Máy'

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('.section-canvas')
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error('Không tìm thấy vùng bàn cờ')
    return
  }

  const initScreenDOM = document.querySelector('.init-screen')
  if (!(initScreenDOM instanceof HTMLDialogElement)) {
    console.error('Không tìm thấy cửa sổ chọn chế độ')
    return
  }

  const backToModeSelector = document.querySelector('.statusbox-button-back')
  const soundToggleButton = document.querySelector('.statusbox-button-sound')
  const settingsForm = document.querySelector('.game-settings-form')
  if (!(settingsForm instanceof HTMLFormElement)) {
    console.error('Không tìm thấy biểu mẫu thiết lập trò chơi')
    return
  }

  const player1NameLabel = settingsForm.querySelector(
    '.game-settings-player-1-name-label',
  ) as HTMLLabelElement | null
  const player2NameLabel = settingsForm.querySelector(
    '.game-settings-player-2-name-label',
  ) as HTMLLabelElement | null
  const player1NameInput = settingsForm.querySelector(
    '.game-settings-player-1-name-input',
  ) as HTMLInputElement | null
  const player2NameInput = settingsForm.querySelector(
    '.game-settings-player-2-name-input',
  ) as HTMLInputElement | null
  const aiDifficultyLabel = settingsForm.querySelector(
    '.game-settings-ai-difficulty-label',
  ) as HTMLLabelElement | null
  const aiDifficultyInput = settingsForm.querySelector(
    '.game-settings-ai-difficulty-input',
  ) as HTMLSelectElement | null

  let currentGameHandler:
    | {
        end: () => void
      }
    | undefined
    | null = null

  const board = new Board(canvas)
  board.render()

  function updateSoundButton() {
    if (soundToggleButton instanceof HTMLButtonElement) {
      soundToggleButton.textContent = soundController.isEnabled()
        ? 'Âm thanh: Bật'
        : 'Âm thanh: Tắt'
    }
  }

  function setDefaultHumanNames() {
    if (!player1NameInput || !player2NameInput) {
      return
    }

    if (!player1NameInput.value.trim() || player1NameInput.value === DEFAULT_AI) {
      player1NameInput.value = DEFAULT_HUMAN_1
    }
    if (!player2NameInput.value.trim() || player2NameInput.value === DEFAULT_AI) {
      player2NameInput.value = DEFAULT_HUMAN_2
    }
  }

  function renderForm(chosenMode: string) {
    if (
      !player1NameLabel ||
      !player2NameLabel ||
      !player1NameInput ||
      !player2NameInput ||
      !aiDifficultyLabel ||
      !aiDifficultyInput
    ) {
      return
    }

    if (chosenMode === 'offline-human') {
      setDefaultHumanNames()
      player1NameLabel.textContent = 'Tên người chơi thứ nhất:'
      player2NameLabel.textContent = 'Tên người chơi thứ hai:'
      player1NameLabel.classList.remove('hidden')
      player1NameInput.classList.remove('hidden')
      player2NameLabel.classList.remove('hidden')
      player2NameInput.classList.remove('hidden')
      aiDifficultyLabel.classList.add('hidden')
      aiDifficultyInput.classList.add('hidden')
      aiDifficultyInput.disabled = true
      player1NameInput.disabled = false
      player2NameInput.disabled = false
      return
    }

    if (!player1NameInput.value.trim()) {
      player1NameInput.value = DEFAULT_HUMAN_1
    }
    player1NameLabel.textContent = 'Tên người chơi:'
    player2NameLabel.textContent = 'Tên đối thủ:'
    player1NameLabel.classList.remove('hidden')
    player1NameInput.classList.remove('hidden')
    player2NameLabel.classList.add('hidden')
    player2NameInput.classList.add('hidden')
    aiDifficultyLabel.classList.remove('hidden')
    aiDifficultyInput.classList.remove('hidden')
    aiDifficultyInput.disabled = false
    player1NameInput.disabled = false
    player2NameInput.disabled = true
    player2NameInput.value = DEFAULT_AI
  }

  function initGame(
    chosenMode: string | null,
    playerNames: Array<string | null>,
    aiDifficulty: AiDifficulty,
  ) {
    backToModeSelector?.classList.remove('hidden')

    if (chosenMode === 'offline-human') {
      currentGameHandler = Game.initGameLocal2p(
        playerNames[0]?.trim() || DEFAULT_HUMAN_1,
        playerNames[1]?.trim() || DEFAULT_HUMAN_2,
      )
      return
    }

    currentGameHandler = Game.initGameLocalAi(
      playerNames[0]?.trim() || DEFAULT_HUMAN_1,
      aiDifficulty,
    )
  }

  backToModeSelector?.classList.add('hidden')
  updateSoundButton()
  initScreenDOM.showModal()

  let chosenMode = 'offline-ai'
  renderForm(chosenMode)

  backToModeSelector?.addEventListener('click', () => {
    currentGameHandler?.end()
    backToModeSelector.classList.add('hidden')
    initScreenDOM.showModal()
  })

  soundToggleButton?.addEventListener('click', () => {
    soundController.toggle()
    updateSoundButton()
  })

  initScreenDOM.addEventListener('cancel', (event) => {
    event.preventDefault()
  })

  initScreenDOM.addEventListener('close', () => {
    const formData = new FormData(settingsForm)
    const gameMode = formData.get('mode') as string
    const firstPlayerName = formData.get('player-1-name') as string | null
    const secondPlayerName = formData.get('player-2-name') as string | null
    const aiDifficulty = (formData.get('ai-difficulty') as AiDifficulty) || 'medium'
    initGame(gameMode, [firstPlayerName, secondPlayerName], aiDifficulty)
    void soundController.syncBackgroundMusic()
  })

  settingsForm.addEventListener('input', () => {
    const formData = new FormData(settingsForm)
    chosenMode = formData.get('mode') as string
    renderForm(chosenMode)
  })
})
