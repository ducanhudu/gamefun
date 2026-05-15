import { BoardBase, BoardPiece } from '../board'
import {
  BIG_NEGATIVE_NUMBER,
  BIG_POSITIVE_NUMBER,
  choose,
  clone,
  getMockPlayerAction,
} from '../utils'
import { Player } from './player'

export type PlayerAiOptions = {
  maxDepth?: number
  topMoveSpread?: number
  centerWeight?: number
  tacticalAwareness?: boolean
}

export class PlayerAi extends Player {
  static readonly MAX_DEPTH = 4
  static readonly COLUMN_PRIORITY = [3, 2, 4, 1, 5, 0, 6]

  private ownBoardPieceValue: number
  private enemyBoardPiece: BoardPiece
  private readonly maxDepth: number
  private readonly topMoveSpread: number
  private readonly centerWeight: number
  private readonly tacticalAwareness: boolean

  constructor(
    boardPiece: BoardPiece,
    label: string,
    options: PlayerAiOptions = {},
  ) {
    super(boardPiece, label)
    this.ownBoardPieceValue = this.getBoardPieceValue(boardPiece)
    this.enemyBoardPiece =
      boardPiece === BoardPiece.PLAYER_1
        ? BoardPiece.PLAYER_2
        : BoardPiece.PLAYER_1
    this.maxDepth = options.maxDepth ?? PlayerAi.MAX_DEPTH
    this.topMoveSpread = Math.max(1, options.topMoveSpread ?? 1)
    this.centerWeight = options.centerWeight ?? 0
    this.tacticalAwareness = options.tacticalAwareness ?? true
  }

  private getBoardPieceValue(boardPiece: BoardPiece): number {
    return boardPiece === BoardPiece.EMPTY
      ? 0
      : boardPiece === this.boardPiece
        ? 1
        : -1
  }

  private getStateValue(state: Array<Array<BoardPiece>>): {
    winnerBoardPiece: BoardPiece
    chain: number
  } {
    let winnerBoardPiece = BoardPiece.EMPTY
    let chainValue = 0

    for (let i = 0; i < BoardBase.ROWS; i++) {
      for (let j = 0; j < BoardBase.COLUMNS; j++) {
        let tempRight = 0
        let tempBottom = 0
        let tempBottomRight = 0
        let tempTopRight = 0

        for (let k = 0; k <= 3; k++) {
          if (j + k < BoardBase.COLUMNS) {
            tempRight += this.getBoardPieceValue(state[i][j + k])
          }
          if (i + k < BoardBase.ROWS) {
            tempBottom += this.getBoardPieceValue(state[i + k][j])
          }
          if (i + k < BoardBase.ROWS && j + k < BoardBase.COLUMNS) {
            tempBottomRight += this.getBoardPieceValue(state[i + k][j + k])
          }
          if (i - k >= 0 && j + k < BoardBase.COLUMNS) {
            tempTopRight += this.getBoardPieceValue(state[i - k][j + k])
          }
        }

        chainValue += tempRight * tempRight * tempRight
        chainValue += tempBottom * tempBottom * tempBottom
        chainValue += tempBottomRight * tempBottomRight * tempBottomRight
        chainValue += tempTopRight * tempTopRight * tempTopRight

        if (this.centerWeight > 0) {
          const centerDistance = Math.abs(3 - j)
          const positionalBonus = Math.max(0, 3 - centerDistance)
          chainValue +=
            this.getBoardPieceValue(state[i][j]) *
            positionalBonus *
            this.centerWeight
        }

        if (Math.abs(tempRight) === 4) {
          winnerBoardPiece =
            tempRight > 0 ? this.boardPiece : this.enemyBoardPiece
        } else if (Math.abs(tempBottom) === 4) {
          winnerBoardPiece =
            tempBottom > 0 ? this.boardPiece : this.enemyBoardPiece
        } else if (Math.abs(tempBottomRight) === 4) {
          winnerBoardPiece =
            tempBottomRight > 0 ? this.boardPiece : this.enemyBoardPiece
        } else if (Math.abs(tempTopRight) === 4) {
          winnerBoardPiece =
            tempTopRight > 0 ? this.boardPiece : this.enemyBoardPiece
        }
      }
    }

    return {
      winnerBoardPiece,
      chain: chainValue,
    }
  }

  private transformValues(
    returnValue: number,
    winnerBoardPiece: BoardPiece,
    depth: number,
  ): number {
    const isWon = winnerBoardPiece === this.boardPiece
    const isLost = winnerBoardPiece === this.enemyBoardPiece
    returnValue -= depth * depth
    if (isWon) {
      returnValue = BIG_POSITIVE_NUMBER - 100 - depth * depth
    } else if (isLost) {
      returnValue = BIG_NEGATIVE_NUMBER + 100 + depth * depth
    }
    return returnValue
  }

  private getOrderedColumns() {
    return PlayerAi.COLUMN_PRIORITY
  }

  private findImmediateWinningMove(
    state: Array<Array<BoardPiece>>,
    piece: BoardPiece,
  ) {
    for (const column of this.getOrderedColumns()) {
      const { success, map } = getMockPlayerAction(state, piece, column)
      if (!success) {
        continue
      }
      const { winnerBoardPiece } = this.getStateValue(map)
      if (winnerBoardPiece === piece) {
        return column
      }
    }
    return -1
  }

  private getMove(
    state: Array<Array<BoardPiece>>,
    depth: number,
    alpha: number,
    beta: number,
  ): {
    value: number
    move: number
  } {
    const stateValue = this.getStateValue(state)
    const isWon = stateValue.winnerBoardPiece === this.boardPiece
    const isLost = stateValue.winnerBoardPiece === this.enemyBoardPiece

    if (depth >= this.maxDepth || isWon || isLost) {
      return {
        value:
          this.transformValues(
            stateValue.chain,
            stateValue.winnerBoardPiece,
            depth,
          ) * this.ownBoardPieceValue,
        move: -1,
      }
    }

    return depth % 2 === 0
      ? this.minState(state, depth + 1, alpha, beta)
      : this.maxState(state, depth + 1, alpha, beta)
  }

  private pickMoveFromCandidates(
    moveQueue: Array<{
      move: number
      value: number
    }>,
    maximizing: boolean,
  ) {
    if (!moveQueue.length) {
      return -1
    }

    const dedupedMoves = new Map<number, number>()
    for (const candidate of moveQueue) {
      const previousValue = dedupedMoves.get(candidate.move)
      if (
        previousValue === undefined ||
        (maximizing
          ? candidate.value > previousValue
          : candidate.value < previousValue)
      ) {
        dedupedMoves.set(candidate.move, candidate.value)
      }
    }

    const ordered = [...dedupedMoves.entries()]
      .map(([move, value]) => ({ move, value }))
      .sort((left, right) =>
        maximizing ? right.value - left.value : left.value - right.value,
      )

    const candidateMoves = ordered
      .slice(0, this.topMoveSpread)
      .map((candidate) => candidate.move)

    return choose(candidateMoves)
  }

  private maxState(
    state: Array<Array<BoardPiece>>,
    depth: number,
    alpha: number,
    beta: number,
  ): {
    value: number
    move: number
  } {
    let value = BIG_NEGATIVE_NUMBER
    const moveQueue: Array<{ move: number; value: number }> = []

    for (const column of this.getOrderedColumns()) {
      const { success: actionSuccessful, map: nextState } = getMockPlayerAction(
        state,
        this.boardPiece,
        column,
      )
      if (!actionSuccessful) {
        continue
      }

      const { value: nextValue } = this.getMove(nextState, depth, alpha, beta)
      moveQueue.push({ move: column, value: nextValue })

      if (nextValue > value) {
        value = nextValue
      }

      if (value > beta) {
        return {
          value,
          move: this.pickMoveFromCandidates(moveQueue, true),
        }
      }
      alpha = Math.max(alpha, value)
    }

    return {
      value,
      move: this.pickMoveFromCandidates(moveQueue, true),
    }
  }

  private minState(
    state: Array<Array<BoardPiece>>,
    depth: number,
    alpha: number,
    beta: number,
  ): {
    value: number
    move: number
  } {
    let value = BIG_POSITIVE_NUMBER
    const moveQueue: Array<{ move: number; value: number }> = []

    for (const column of this.getOrderedColumns()) {
      const { success: actionSuccessful, map: nextState } = getMockPlayerAction(
        state,
        this.enemyBoardPiece,
        column,
      )
      if (!actionSuccessful) {
        continue
      }

      const { value: nextValue } = this.getMove(nextState, depth, alpha, beta)
      moveQueue.push({ move: column, value: nextValue })

      if (nextValue < value) {
        value = nextValue
      }

      if (value < alpha) {
        return {
          value,
          move: this.pickMoveFromCandidates(moveQueue, false),
        }
      }
      beta = Math.min(beta, value)
    }

    return {
      value,
      move: this.pickMoveFromCandidates(moveQueue, false),
    }
  }

  async getAction(board: BoardBase): Promise<number> {
    const state = clone(board.map)

    if (this.tacticalAwareness) {
      const winningMove = this.findImmediateWinningMove(state, this.boardPiece)
      if (winningMove >= 0) {
        return winningMove
      }

      const blockingMove = this.findImmediateWinningMove(
        state,
        this.enemyBoardPiece,
      )
      if (blockingMove >= 0) {
        return blockingMove
      }
    }

    const action = this.maxState(
      state,
      0,
      BIG_NEGATIVE_NUMBER,
      BIG_POSITIVE_NUMBER,
    )
    console.log(
      `AI ${this.boardPiece} choose column ${action.move} with value of ${action.value}`,
    )
    return action.move
  }
}
