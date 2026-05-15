import type { Player } from '../player'
import { clone, getMockPlayerAction } from '../utils'

export enum BoardPiece {
  EMPTY = ' ',
  PLAYER_1 = '🔴',
  PLAYER_2 = '🔵',
  DRAW = 'D',
}
export type BoardSnapshot = {
  map: Array<Array<BoardPiece>>
  winnerBoardPiece: BoardPiece
  winningSequence: Array<WinningSequenceCell>
}

export type WinningSequenceCell = {
  row: number
  column: number
}

export class BoardBase {
  static readonly ROWS: number = 6
  static readonly COLUMNS: number = 7
  static readonly PLAYER_1_COLOR: string = '#ef453b'
  static readonly PLAYER_2_COLOR: string = '#0059ff'
  static readonly PIECE_STROKE_STYLE: string = 'black'
  static readonly MASK_COLOR: string = '#d8d8d8'
  static CANVAS_HEIGHT: number
  static CANVAS_WIDTH: number
  static PIECE_RADIUS: number
  static MASK_X_BEGIN: number
  static MASK_Y_BEGIN: number
  static MESSAGE_WIDTH: number
  static MESSAGE_X_BEGIN: number
  static MESSAGE_Y_BEGIN: number
  static SCALE: number

  map: Array<Array<BoardPiece>>
  protected winnerBoardPiece: BoardPiece
  protected winningSequence: Array<WinningSequenceCell>

  constructor() {
    this.map = []
    this.winnerBoardPiece = BoardPiece.EMPTY
    this.winningSequence = []
    this.initConstants()
    this.reset()
  }

  reset() {
    this.map = []
    for (let i = 0; i < BoardBase.ROWS; i++) {
      this.map.push([])
      for (let j = 0; j < BoardBase.COLUMNS; j++) {
        this.map[i].push(BoardPiece.EMPTY)
      }
    }
    this.winnerBoardPiece = BoardPiece.EMPTY
    this.winningSequence = []
  }

  getSnapshot(): BoardSnapshot {
    return {
      map: clone(this.map),
      winnerBoardPiece: this.winnerBoardPiece,
      winningSequence: this.winningSequence.map((cell) => ({ ...cell })),
    }
  }

  restoreSnapshot(snapshot: BoardSnapshot) {
    this.map = clone(snapshot.map)
    this.winnerBoardPiece = snapshot.winnerBoardPiece
    this.winningSequence = snapshot.winningSequence.map((cell) => ({ ...cell }))
  }

  initConstants() {
    BoardBase.CANVAS_HEIGHT = BoardBase.SCALE * 480
    BoardBase.CANVAS_WIDTH = BoardBase.SCALE * 640
    BoardBase.PIECE_RADIUS = BoardBase.SCALE * 25
    BoardBase.MASK_X_BEGIN =
      Math.max(
        0,
        BoardBase.CANVAS_WIDTH -
          (3 * BoardBase.COLUMNS + 1) * BoardBase.PIECE_RADIUS,
      ) / 2
    BoardBase.MASK_Y_BEGIN =
      Math.max(
        0,
        BoardBase.CANVAS_HEIGHT -
          (3 * BoardBase.ROWS + 1) * BoardBase.PIECE_RADIUS,
      ) / 2
    BoardBase.MESSAGE_WIDTH = BoardBase.SCALE * 400
    BoardBase.MESSAGE_X_BEGIN =
      (BoardBase.CANVAS_WIDTH - BoardBase.MESSAGE_WIDTH) / 2
    BoardBase.MESSAGE_Y_BEGIN = BoardBase.SCALE * 20
  }

  /**
   * @returns is the action succesfully applied
   * @param player current player
   * @param column the colum in which the player want to drop a piece
   */
  async applyPlayerAction(player: Player, column: number): Promise<boolean> {
    const { success: actionSuccessful, map: nextState } = getMockPlayerAction(
      this.map,
      player.boardPiece,
      column,
    )

    this.map = nextState
    // this.debug()

    return actionSuccessful
  }

  debug() {
    console.log(this.map.map((row) => row.join(' ')).join('\n'))
  }

  getWinner(): BoardPiece {
    if (this.winnerBoardPiece !== BoardPiece.EMPTY) {
      return this.winnerBoardPiece
    }
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]
    let countEmpty = 0
    for (let i = 0; i < BoardBase.ROWS; i++) {
      for (let j = 0; j < BoardBase.COLUMNS; j++) {
        const playerPiece = this.map[i][j]
        if (playerPiece !== BoardPiece.EMPTY) {
          for (const [rowDelta, columnDelta] of directions) {
            const winningCells: Array<WinningSequenceCell> = []
            for (let step = 0; step < 4; step++) {
              const row = i + rowDelta * step
              const column = j + columnDelta * step
              if (
                row < 0 ||
                column < 0 ||
                row >= BoardBase.ROWS ||
                column >= BoardBase.COLUMNS ||
                this.map[row][column] !== playerPiece
              ) {
                winningCells.length = 0
                break
              }
              winningCells.push({ row, column })
            }

            if (winningCells.length === 4) {
              this.winnerBoardPiece = playerPiece
              this.winningSequence = winningCells
              return playerPiece
            }
          }
        } else {
          countEmpty++
        }
      }
    }
    if (countEmpty === 0) {
      this.winnerBoardPiece = BoardPiece.DRAW
      return BoardPiece.DRAW
    }

    return BoardPiece.EMPTY
  }

  getWinningSequence(): Array<WinningSequenceCell> {
    return this.winningSequence.map((cell) => ({ ...cell }))
  }

  protected getPlayerColor(boardPiece: BoardPiece): string {
    switch (boardPiece) {
      case BoardPiece.PLAYER_1:
        return BoardBase.PLAYER_1_COLOR
      case BoardPiece.PLAYER_2:
        return BoardBase.PLAYER_2_COLOR
      default:
        return 'transparent'
    }
  }
}
