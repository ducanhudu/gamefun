import { Board } from './board'
import * as Game from './game'
import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('.section-canvas') as HTMLCanvasElement

  if (!canvas) {
    console.error('Không tìm thấy vùng bàn cờ')
    return
  }
  const initScreenDOM = document.querySelector(
    '.init-screen',
  ) as HTMLDialogElement
  if (!initScreenDOM) {
    console.error('Không tìm thấy cửa sổ chọn chế độ')
    return
  }
  const board = new Board(canvas)
  board.render()
  const backToModeSelector = document.querySelector(
    '.statusbox-button-back',
  ) as HTMLDivElement

  const settingsForm = document.querySelector(
    '.game-settings-form',
  ) as HTMLFormElement

  if (!settingsForm) {
    console.error('Không tìm thấy biểu mẫu thiết lập trò chơi')
    return
  }

  const player1NameLabel = settingsForm.querySelector(
    '.game-settings-player-1-name-label',
  ) as HTMLLabelElement
  const player2NameLabel = settingsForm.querySelector(
    '.game-settings-player-2-name-label',
  ) as HTMLLabelElement
  const player1NameInput = settingsForm.querySelector(
    '.game-settings-player-1-name-input',
  ) as HTMLInputElement
  const player2NameInput = settingsForm.querySelector(
    '.game-settings-player-2-name-input',
  ) as HTMLInputElement

  let currentGameHandler:
    | {
        end: () => void
      }
    | undefined
    | null = null

  backToModeSelector?.classList.add('hidden')
  initScreenDOM.showModal()

  let chosenMode = 'offline-ai'
  renderForm()

  backToModeSelector?.addEventListener('click', () => {
    if (currentGameHandler?.end) {
      currentGameHandler.end()
    }
    backToModeSelector?.classList.add('hidden')
    initScreenDOM.showModal()
  })

  initScreenDOM.addEventListener('cancel', (ev) => {
    ev.preventDefault()
  })

  initScreenDOM.addEventListener('close', (ev) => {
    const formData = new FormData(settingsForm)
    const gameMode = formData.get('mode') as string
    const firstPlayerName = formData.get('player-1-name') as string | null
    const secondPlayerName = formData.get('player-2-name') as string | null
    initGame(gameMode, [firstPlayerName, secondPlayerName])
  })

  settingsForm.addEventListener('input', (ev) => {
    const formData = new FormData(settingsForm)
    chosenMode = formData.get('mode') as string
    renderForm()
  })

  function renderForm() {
    if (chosenMode === 'offline-human') {
      player1NameLabel.textContent = `Tên người chơi thứ nhất:`
      player2NameLabel.textContent = `Tên người chơi thứ hai:`
      player1NameLabel.classList.remove('hidden')
      player1NameInput.classList.remove('hidden')
      player2NameLabel.classList.remove('hidden')
      player2NameInput.classList.remove('hidden')
      player1NameInput.disabled = false
      player2NameInput.disabled = false
    } else if (chosenMode === 'offline-ai') {
      player1NameLabel.textContent = `Tên người chơi:`
      player2NameLabel.textContent = `Tên người chơi:`
      player1NameLabel.classList.remove('hidden')
      player1NameInput.classList.remove('hidden')
      player2NameLabel.classList.add('hidden')
      player2NameInput.classList.add('hidden')
      player1NameInput.disabled = false
      player2NameInput.disabled = true
    }
  }

  function initGame(chosenMode: string | null, playerNames: (string | null)[]) {
    console.log('Khởi tạo ván với chế độ:', chosenMode)
    backToModeSelector?.classList.remove('hidden')
    if (chosenMode === 'offline-human') {
      currentGameHandler = Game.initGameLocal2p(
        playerNames[0] || 'Người chơi 1',
        playerNames[1] || 'Người chơi 2',
      )
    } else if (chosenMode === 'offline-ai') {
      currentGameHandler = Game.initGameLocalAi(
        playerNames[0] || 'Người chơi 1',
      )
    } else {
      console.error('Nhận được chế độ chơi không hợp lệ', chosenMode)
    }
  }
})
