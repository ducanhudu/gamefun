import {
  type BoardBase,
  BoardPiece,
  GameBase,
  getColumnFromCoord,
  type Player,
  type PlayerAi,
  PlayerHuman,
} from '@kenrick95/c4'
import { Board } from '../board'
import { animationFrame } from '../utils/animate-frame'
import { showMessage } from '../utils/message'

const statusbox = document.querySelector('.statusbox')
const statusboxBodyGame = document.querySelector('.statusbox-body-game')
const statusboxBodyConnection = document.querySelector(
  '.statusbox-body-connection',
)
const statusboxBodyPlayer = document.querySelector('.statusbox-body-player')

export class GameLocal extends GameBase {
  constructor(players: Array<Player>, board: BoardBase) {
    super(players, board)
  }
  beforeMoveApplied() {
    if (statusboxBodyGame) {
      const currentPlayer = this.players[this.currentPlayerId]
      statusboxBodyGame.textContent = `Đang thả quân ${currentPlayer.boardPiece}`
    }
  }
  waitingForMove() {
    if (!this.isMoveAllowed || this.isGameWon) {
      return
    }

    if (statusboxBodyGame) {
      statusboxBodyGame.textContent = 'Đang chờ nước đi'
    }

    if (statusboxBodyPlayer) {
      // `currentPlayerId` is not updated yet
      const currentPlayer = this.players[this.currentPlayerId]
      statusboxBodyPlayer.textContent = `${currentPlayer.label} ${currentPlayer.boardPiece}`
    }
  }
  afterMove() {
    // no-op
  }

  announceWinner(winnerBoardPiece: BoardPiece) {
    super.announceWinner(winnerBoardPiece)

    if (winnerBoardPiece === BoardPiece.EMPTY) {
      return
    }
    let winnerPlayer: Player | undefined
    let message = '<h1>Ván chơi đã kết thúc.</h1>'
    if (winnerBoardPiece === BoardPiece.DRAW) {
      message += 'Kết quả hòa'
    } else {
      winnerPlayer = this.players.find(
        (player) => player.boardPiece === winnerBoardPiece,
      )
      if (winnerPlayer) {
        message += `${winnerPlayer.label} ${winnerPlayer.boardPiece} chiến thắng`
      } else {
        message += `Người chơi ${winnerBoardPiece} chiến thắng`
      }
    }
    message +=
      '.<br />Sau khi đóng thông báo này, hãy bấm vào bàn cờ để chơi lại.'
    showMessage(message)

    if (statusboxBodyGame) {
      statusboxBodyGame.textContent = 'Ván chơi kết thúc'
    }
    if (statusboxBodyPlayer) {
      statusboxBodyPlayer.textContent =
        winnerBoardPiece === BoardPiece.DRAW
          ? 'Kết quả hòa'
          : winnerPlayer
            ? `${winnerPlayer.label} ${winnerPlayer.boardPiece} chiến thắng`
            : `Người chơi ${
                winnerBoardPiece === BoardPiece.PLAYER_1 ? '1 🔴' : '2 🔵'
              } chiến thắng`
    }
  }
}
export function initGameLocal(
  GameLocalConstructor: typeof GameLocal,
  firstPlayer: PlayerHuman,
  secondPlayer: PlayerHuman | PlayerAi,
) {
  const canvas = document.querySelector('canvas')
  if (!canvas) {
    console.error('Không tìm thấy phần tử bàn cờ')
    return
  }
  const board = new Board(canvas)
  const game = new GameLocalConstructor([firstPlayer, secondPlayer], board)
  statusbox?.classList.remove('hidden')
  statusboxBodyConnection?.classList.add('hidden')

  game.start()
  if (statusboxBodyGame) {
    statusboxBodyGame.textContent = 'Đang chờ nước đi'
  }

  if (statusboxBodyPlayer) {
    statusboxBodyPlayer.textContent = `${firstPlayer.label} ${firstPlayer.boardPiece}`
  }

  async function handleCanvasClick(event: MouseEvent) {
    if (game.isGameWon) {
      game.reset()
      await animationFrame()
      game.start()
    } else {
      if (!canvas) {
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
  }

  canvas.addEventListener('click', handleCanvasClick)
  return {
    end: () => {
      game.end()
      canvas.removeEventListener('click', handleCanvasClick)
      statusbox?.classList.add('hidden')
    },
  }
}
