import {
  type BoardBase,
  type BoardSnapshot,
  BoardPiece,
  GameBase,
  getColumnFromCoord,
  type Player,
  type PlayerAi,
  PlayerHuman,
} from '@kenrick95/c4'
import { Board } from '../board'
import { animationFrame } from '../utils/animate-frame'
import { playFireworks } from '../utils/celebration'
import { closeMessage, showMessage } from '../utils/message'
import { soundController } from '../utils/sound'

const statusbox = document.querySelector('.statusbox')
const statusboxBodyGame = document.querySelector('.statusbox-body-game')
const statusboxBodyConnection = document.querySelector(
  '.statusbox-body-connection',
)
const statusboxBodyPlayer = document.querySelector('.statusbox-body-player')
const scoreboard = document.querySelector('.scoreboard')
const player1ScoreLabel = document.querySelector('.scorecard-player-1-label')
const player1ScoreValue = document.querySelector('.scorecard-player-1-value')
const player2ScoreLabel = document.querySelector('.scorecard-player-2-label')
const player2ScoreValue = document.querySelector('.scorecard-player-2-value')
const drawScoreValue = document.querySelector('.scorecard-draw-value')
const undoButton = document.querySelector(
  '.statusbox-button-undo',
) as HTMLButtonElement | null
const nextRoundButton = document.querySelector(
  '.statusbox-button-next-round',
) as HTMLButtonElement | null
const resetMatchButton = document.querySelector(
  '.statusbox-button-reset-match',
) as HTMLButtonElement | null

type GameLocalSnapshot = {
  board: BoardSnapshot
  currentPlayerId: number
}

type GameLocalHooks = {
  onTurnReady?: (game: GameLocal) => void
  onMoveApplied?: (game: GameLocal, action: number) => void
  onRoundFinished?: (
    game: GameLocal,
    winnerBoardPiece: BoardPiece,
    winnerPlayer?: Player,
  ) => void
}

type LocalGameOptions = {
  allowUndo?: boolean
  showScoreboard?: boolean
  showRoundButtons?: boolean
}

type ScoreState = {
  player1: number
  player2: number
  draw: number
}

function getPieceTone(boardPiece: BoardPiece) {
  return boardPiece === BoardPiece.PLAYER_1 ? 'Đỏ' : 'Xanh'
}

function formatPlayerPiece(player: Player) {
  return `${player.label} - quân ${getPieceTone(player.boardPiece)}`
}

function formatTurn(player: Player) {
  return `Lượt hiện tại: ${formatPlayerPiece(player)}`
}

function formatWinner(player: Player) {
  return `Chiến thắng: ${formatPlayerPiece(player)}`
}

function buildRoundMessage(
  winnerBoardPiece: BoardPiece,
  winnerPlayer: Player | undefined,
  useRoundButtons: boolean,
) {
  if (winnerBoardPiece === BoardPiece.DRAW) {
    return useRoundButtons
      ? '<h1>Ván đấu hòa.</h1><p>Nhấn "Chơi tiếp" để sang ván mới hoặc "Chơi lại" để đưa tỉ số về 0.</p>'
      : '<h1>Ván đấu hòa.</h1><p>Bấm vào bàn cờ để bắt đầu ván mới.</p>'
  }

  const winnerText = winnerPlayer
    ? formatWinner(winnerPlayer)
    : 'Đã tìm ra người chiến thắng'

  return useRoundButtons
    ? `<h1>Ván đấu kết thúc.</h1><p>${winnerText}.</p><p>Nhấn "Chơi tiếp" để sang ván mới hoặc "Chơi lại" để bắt đầu lại từ đầu.</p>`
    : `<h1>Ván đấu kết thúc.</h1><p>${winnerText}.</p><p>Bấm vào bàn cờ để bắt đầu ván mới.</p>`
}

function areSnapshotsEqual(
  left: GameLocalSnapshot | undefined,
  right: GameLocalSnapshot,
) {
  if (!left || left.currentPlayerId !== right.currentPlayerId) {
    return false
  }
  return JSON.stringify(left.board.map) === JSON.stringify(right.board.map)
}

function updateScoreboard(
  firstPlayer: Player,
  secondPlayer: Player,
  score: ScoreState,
  visible: boolean,
) {
  scoreboard?.classList.toggle('hidden', !visible)
  if (!visible) {
    return
  }

  if (player1ScoreLabel) {
    player1ScoreLabel.textContent = firstPlayer.label
  }
  if (player2ScoreLabel) {
    player2ScoreLabel.textContent = secondPlayer.label
  }
  if (player1ScoreValue) {
    player1ScoreValue.textContent = String(score.player1)
  }
  if (player2ScoreValue) {
    player2ScoreValue.textContent = String(score.player2)
  }
  if (drawScoreValue) {
    drawScoreValue.textContent = String(score.draw)
  }
}

export class GameLocal extends GameBase {
  hooks: GameLocalHooks

  constructor(
    players: Array<Player>,
    board: BoardBase,
    hooks: GameLocalHooks = {},
  ) {
    super(players, board)
    this.hooks = hooks
  }

  beforeMoveApplied() {
    if (statusboxBodyGame) {
      const currentPlayer = this.players[this.currentPlayerId]
      statusboxBodyGame.textContent = `Đang xử lý lượt của ${currentPlayer.label}`
    }
  }

  waitingForMove() {
    if (!this.isMoveAllowed || this.isGameWon) {
      return
    }

    const currentPlayer = this.players[this.currentPlayerId]
    if (statusboxBodyGame) {
      statusboxBodyGame.textContent = 'Chọn một cột để thả quân'
    }
    if (statusboxBodyPlayer) {
      statusboxBodyPlayer.textContent = formatTurn(currentPlayer)
    }

    this.hooks.onTurnReady?.(this)
  }

  afterMove(action: number) {
    this.hooks.onMoveApplied?.(this, action)
  }

  announceWinner(winnerBoardPiece: BoardPiece) {
    super.announceWinner(winnerBoardPiece)

    const winnerPlayer = this.players.find(
      (player) => player.boardPiece === winnerBoardPiece,
    )

    if (statusboxBodyGame) {
      statusboxBodyGame.textContent =
        winnerBoardPiece === BoardPiece.DRAW
          ? 'Kết quả ván: Hòa'
          : 'Kết quả ván: Đã có người chiến thắng'
    }

    if (statusboxBodyPlayer) {
      statusboxBodyPlayer.textContent =
        winnerBoardPiece === BoardPiece.DRAW
          ? 'Không ai ghi điểm ở ván này'
          : winnerPlayer
            ? formatWinner(winnerPlayer)
            : 'Đã có người chiến thắng'
    }

    this.hooks.onRoundFinished?.(this, winnerBoardPiece, winnerPlayer)
  }

  getSnapshot(): GameLocalSnapshot {
    return {
      board: this.board.getSnapshot(),
      currentPlayerId: this.currentPlayerId,
    }
  }

  restoreSnapshot(snapshot: GameLocalSnapshot) {
    this.board.restoreSnapshot(snapshot.board)
    this.currentPlayerId = snapshot.currentPlayerId
    this.isGameEnded = false
    this.isGameWon = false
    this.isMoveAllowed = true
    this.waitingForMove()
  }
}

export function initGameLocal(
  GameLocalConstructor: new (
    players: Array<Player>,
    board: BoardBase,
    hooks?: GameLocalHooks,
  ) => GameLocal,
  firstPlayer: PlayerHuman,
  secondPlayer: PlayerHuman | PlayerAi,
  options: LocalGameOptions = {},
) {
  const canvas = document.querySelector('canvas')
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error('Không tìm thấy phần tử bàn cờ')
    return
  }

  const score: ScoreState = {
    player1: 0,
    player2: 0,
    draw: 0,
  }
  const board = new Board(canvas)
  const decisionSnapshots: Array<GameLocalSnapshot> = []
  const showScore = options.showScoreboard ?? false
  const allowUndo = options.allowUndo ?? false
  const showRoundButtons = options.showRoundButtons ?? false
  const autoRestartOnBoardClick = !showRoundButtons
  let celebrationToken = 0

  const game = new GameLocalConstructor([firstPlayer, secondPlayer], board, {
    onTurnReady: (currentGame) => {
      if (
        allowUndo &&
        currentGame.currentPlayerId === 0 &&
        !currentGame.isGameWon
      ) {
        const snapshot = currentGame.getSnapshot()
        if (!areSnapshotsEqual(decisionSnapshots.at(-1), snapshot)) {
          decisionSnapshots.push(snapshot)
        }
      }

      syncControls()
    },
    onMoveApplied: (currentGame) => {
      const currentPlayer = currentGame.players[currentGame.currentPlayerId]
      void soundController.playMove(currentPlayer.boardPiece)
      syncControls()
    },
    onRoundFinished: (_currentGame, winnerBoardPiece, winnerPlayer) => {
      if (winnerBoardPiece === BoardPiece.DRAW) {
        score.draw += 1
      } else if (winnerPlayer?.boardPiece === firstPlayer.boardPiece) {
        score.player1 += 1
      } else if (winnerPlayer?.boardPiece === secondPlayer.boardPiece) {
        score.player2 += 1
      }

      updateScoreboard(firstPlayer, secondPlayer, score, showScore)
      board.render()
      syncControls()

      void (async () => {
        const token = ++celebrationToken
        if (winnerBoardPiece === BoardPiece.DRAW) {
          void soundController.playDraw()
        } else {
          void soundController.playWin(winnerBoardPiece)
          await playFireworks()
        }

        if (token !== celebrationToken || !game.isGameWon) {
          return
        }

        showMessage(
          buildRoundMessage(
            winnerBoardPiece,
            winnerPlayer,
            showRoundButtons,
          ),
        )
      })()
    },
  })

  updateScoreboard(firstPlayer, secondPlayer, score, showScore)
  statusbox?.classList.remove('hidden')
  statusboxBodyConnection?.classList.add('hidden')

  if (allowUndo) {
    undoButton?.classList.remove('hidden')
  } else {
    undoButton?.classList.add('hidden')
  }

  if (showRoundButtons) {
    nextRoundButton?.classList.remove('hidden')
    resetMatchButton?.classList.remove('hidden')
  } else {
    nextRoundButton?.classList.add('hidden')
    resetMatchButton?.classList.add('hidden')
  }

  void game.start()

  function syncControls() {
    if (undoButton) {
      const isHumanTurn = game.currentPlayerId === 0 && !game.isGameEnded
      const canUndo = game.isGameWon
        ? decisionSnapshots.length >= 1
        : isHumanTurn && decisionSnapshots.length >= 2
      undoButton.disabled = !allowUndo || !canUndo
    }

    if (nextRoundButton) {
      nextRoundButton.disabled = !showRoundButtons || !game.isGameWon
    }

    if (resetMatchButton) {
      resetMatchButton.disabled = !showRoundButtons
    }
  }

  async function resetRound(resetScore = false) {
    celebrationToken += 1
    closeMessage()
    decisionSnapshots.length = 0

    if (resetScore) {
      score.player1 = 0
      score.player2 = 0
      score.draw = 0
      updateScoreboard(firstPlayer, secondPlayer, score, showScore)
    }

    game.reset()
    board.render()
    syncControls()
    await animationFrame()
    void game.start()
  }

  async function handleCanvasClick(event: MouseEvent) {
    if (game.isGameWon) {
      if (autoRestartOnBoardClick) {
        await resetRound()
      }
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const column = getColumnFromCoord({ x, y })

    if (game.currentPlayerId === 0) {
      firstPlayer.doAction(column)
    } else if (
      game.currentPlayerId === 1 &&
      secondPlayer instanceof PlayerHuman
    ) {
      secondPlayer.doAction(column)
    }
  }

  function handleUndoClick() {
    if (!allowUndo) {
      return
    }

    const wasGameWon = game.isGameWon
    const targetIndex = wasGameWon
      ? decisionSnapshots.length - 1
      : decisionSnapshots.length - 2

    if (targetIndex < 0) {
      return
    }

    celebrationToken += 1
    closeMessage()
    const snapshot = decisionSnapshots[targetIndex]
    decisionSnapshots.splice(targetIndex + 1)
    game.restoreSnapshot(snapshot)
    board.render()
    syncControls()
    void soundController.playUndo()

    if (wasGameWon) {
      void game.start()
    }
  }

  function handleNextRoundClick() {
    if (game.isGameWon) {
      void resetRound()
    }
  }

  function handleResetMatchClick() {
    void resetRound(true)
  }

  canvas.addEventListener('click', handleCanvasClick)
  undoButton?.addEventListener('click', handleUndoClick)
  nextRoundButton?.addEventListener('click', handleNextRoundClick)
  resetMatchButton?.addEventListener('click', handleResetMatchClick)

  syncControls()

  return {
    end: () => {
      game.end()
      celebrationToken += 1
      closeMessage()
      canvas.removeEventListener('click', handleCanvasClick)
      undoButton?.removeEventListener('click', handleUndoClick)
      nextRoundButton?.removeEventListener('click', handleNextRoundClick)
      resetMatchButton?.removeEventListener('click', handleResetMatchClick)
      statusbox?.classList.add('hidden')
      scoreboard?.classList.add('hidden')
      nextRoundButton?.classList.add('hidden')
      resetMatchButton?.classList.add('hidden')
    },
  }
}
