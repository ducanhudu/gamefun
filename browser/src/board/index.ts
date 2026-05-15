import {
  BoardBase,
  BoardPiece,
  type BoardSnapshot,
  type Player,
  type WinningSequenceCell,
} from '@kenrick95/c4'
import { animationFrame } from '../utils/animate-frame'
import {
  clearCanvas,
  drawCircle,
  drawMask,
  drawRoundedRect,
  onresize,
} from './utils'

export class Board extends BoardBase {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    super()
    this.canvas = canvas
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.getBoardScale()
    this.initConstants()
    this.reset()
    this.onresize()
  }

  getBoardScale() {
    BoardBase.SCALE = window.innerWidth < 640 ? 0.5 : 1
    return BoardBase.SCALE
  }

  onresize() {
    let prevBoardScale = BoardBase.SCALE
    onresize().add(() => {
      this.getBoardScale()
      if (prevBoardScale !== BoardBase.SCALE) {
        prevBoardScale = BoardBase.SCALE
        this.initConstants()
        clearCanvas(this)
        this.render()
      }
    })
  }

  reset() {
    super.reset()
    if (this.canvas && this.context) {
      clearCanvas(this)
      this.render()
    }
  }

  restoreSnapshot(snapshot: BoardSnapshot) {
    super.restoreSnapshot(snapshot)
    clearCanvas(this)
    this.render()
  }

  initConstants() {
    super.initConstants()
    if (!this.canvas || !this.context) {
      return
    }
    const dpr = self.devicePixelRatio || 1
    this.canvas.width = Board.CANVAS_WIDTH * dpr
    this.canvas.height = Board.CANVAS_HEIGHT * dpr
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.canvas.style.width = `${Board.CANVAS_WIDTH}px`
    this.canvas.style.height = `${Board.CANVAS_HEIGHT}px`
  }

  private getCellCenter(column: number, row: number) {
    return {
      x:
        3 * BoardBase.PIECE_RADIUS * column +
        BoardBase.MASK_X_BEGIN +
        2 * BoardBase.PIECE_RADIUS,
      y:
        3 * BoardBase.PIECE_RADIUS * row +
        BoardBase.MASK_Y_BEGIN +
        2 * BoardBase.PIECE_RADIUS,
    }
  }

  private getSlotGradient(x: number, y: number) {
    const gradient = this.context.createRadialGradient(
      x - Board.PIECE_RADIUS * 0.32,
      y - Board.PIECE_RADIUS * 0.38,
      Board.PIECE_RADIUS * 0.2,
      x,
      y,
      Board.PIECE_RADIUS,
    )
    gradient.addColorStop(0, 'rgba(160, 170, 194, 0.45)')
    gradient.addColorStop(1, 'rgba(118, 129, 154, 0.82)')
    return gradient
  }

  private getPieceGradient(
    x: number,
    y: number,
    boardPiece: BoardPiece,
  ): CanvasGradient {
    const gradient = this.context.createRadialGradient(
      x - Board.PIECE_RADIUS * 0.38,
      y - Board.PIECE_RADIUS * 0.42,
      Board.PIECE_RADIUS * 0.15,
      x,
      y,
      Board.PIECE_RADIUS,
    )
    if (boardPiece === BoardPiece.PLAYER_1) {
      gradient.addColorStop(0, '#ffc2d1')
      gradient.addColorStop(0.45, '#ff6b85')
      gradient.addColorStop(1, '#d9415c')
      return gradient
    }

    gradient.addColorStop(0, '#c8ddff')
    gradient.addColorStop(0.45, '#7aa8ff')
    gradient.addColorStop(1, '#4d73db')
    return gradient
  }

  private drawBoardBackdrop() {
    const padding = Board.PIECE_RADIUS * 1.7
    const width = Board.CANVAS_WIDTH - padding * 2
    const height = Board.CANVAS_HEIGHT - padding * 2
    const gradient = this.context.createLinearGradient(
      padding,
      padding,
      padding + width,
      padding + height,
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.24)')
    gradient.addColorStop(1, 'rgba(225, 235, 255, 0.08)')

    this.context.save()
    this.context.fillStyle = gradient
    this.context.shadowColor = 'rgba(84, 103, 145, 0.12)'
    this.context.shadowBlur = 24
    drawRoundedRect(this.context, {
      x: padding,
      y: padding,
      width,
      height,
      radius: Board.PIECE_RADIUS * 1.7,
    })
    this.context.fill()
    this.context.restore()
  }

  private drawSlot(column: number, row: number) {
    const { x, y } = this.getCellCenter(column, row)

    drawCircle(this.context, {
      x,
      y,
      r: Board.PIECE_RADIUS,
      fillStyle: this.getSlotGradient(x, y),
      shadowColor: 'rgba(62, 77, 107, 0.18)',
      shadowBlur: 10,
    })

    drawCircle(this.context, {
      x: x - Board.PIECE_RADIUS * 0.1,
      y: y - Board.PIECE_RADIUS * 0.1,
      r: Board.PIECE_RADIUS * 0.68,
      fillStyle: 'rgba(255, 255, 255, 0.12)',
    })
  }

  private drawPiece(column: number, row: number, boardPiece: BoardPiece) {
    const { x, y } = this.getCellCenter(column, row)
    const pieceGradient = this.getPieceGradient(x, y, boardPiece)

    drawCircle(this.context, {
      x,
      y,
      r: Board.PIECE_RADIUS,
      fillStyle: pieceGradient,
      strokeStyle: 'rgba(255, 255, 255, 0.5)',
      lineWidth: 1.25,
      shadowColor:
        boardPiece === BoardPiece.PLAYER_1
          ? 'rgba(255, 92, 123, 0.45)'
          : 'rgba(92, 138, 255, 0.45)',
      shadowBlur: 16,
    })

    drawCircle(this.context, {
      x: x - Board.PIECE_RADIUS * 0.2,
      y: y - Board.PIECE_RADIUS * 0.26,
      r: Board.PIECE_RADIUS * 0.45,
      fillStyle: 'rgba(255, 255, 255, 0.28)',
    })
  }

  private async animateAction(
    newRow: number,
    column: number,
    boardPiece: BoardPiece,
  ): Promise<void> {
    let currentY = 0

    while (newRow * 3 * BoardBase.PIECE_RADIUS >= currentY) {
      await animationFrame()
      clearCanvas(this)
      this.drawBoardBackdrop()
      drawMask(this)
      for (let y = 0; y < BoardBase.ROWS; y++) {
        for (let x = 0; x < BoardBase.COLUMNS; x++) {
          this.drawSlot(x, y)
        }
      }

      this.context.save()
      this.context.translate(0, currentY)
      this.drawPiece(column, 0, boardPiece)
      this.context.restore()
      this.renderPieces()
      currentY += BoardBase.PIECE_RADIUS
    }
  }

  private renderPieces() {
    for (let row = 0; row < BoardBase.ROWS; row++) {
      for (let column = 0; column < BoardBase.COLUMNS; column++) {
        const piece = this.map[row][column]
        if (piece !== BoardPiece.EMPTY) {
          this.drawPiece(column, row, piece)
        }
      }
    }
  }

  private drawWinningLine(winningSequence: Array<WinningSequenceCell>) {
    if (winningSequence.length < 4) {
      return
    }

    const start = this.getCellCenter(
      winningSequence[0].column,
      winningSequence[0].row,
    )
    const end = this.getCellCenter(
      winningSequence[winningSequence.length - 1].column,
      winningSequence[winningSequence.length - 1].row,
    )

    this.context.save()
    this.context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
    this.context.shadowColor = 'rgba(255, 255, 255, 0.86)'
    this.context.shadowBlur = 20
    this.context.lineCap = 'round'
    this.context.lineWidth = Math.max(8, Board.PIECE_RADIUS * 0.28)
    this.context.beginPath()
    this.context.moveTo(start.x, start.y)
    this.context.lineTo(end.x, end.y)
    this.context.stroke()
    this.context.restore()
  }

  render() {
    this.drawBoardBackdrop()
    drawMask(this)
    for (let row = 0; row < BoardBase.ROWS; row++) {
      for (let column = 0; column < BoardBase.COLUMNS; column++) {
        this.drawSlot(column, row)
      }
    }
    this.renderPieces()
    this.drawWinningLine(this.getWinningSequence())
  }

  async applyPlayerAction(player: Player, column: number): Promise<boolean> {
    if (
      this.map[0][column] !== BoardPiece.EMPTY ||
      column < 0 ||
      column >= BoardBase.COLUMNS
    ) {
      return false
    }

    let isColumnEverFilled = false
    let row = 0
    for (let i = 0; i < BoardBase.ROWS - 1; i++) {
      if (this.map[i + 1][column] !== BoardPiece.EMPTY) {
        isColumnEverFilled = true
        row = i
        break
      }
    }
    if (!isColumnEverFilled) {
      row = BoardBase.ROWS - 1
    }

    await this.animateAction(row, column, player.boardPiece)
    this.map[row][column] = player.boardPiece
    await animationFrame()
    clearCanvas(this)
    this.render()
    return true
  }
}
