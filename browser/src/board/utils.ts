import { Board } from './index'

type Callback = () => void
type CircleOptions = {
  x?: number
  y?: number
  r?: number
  fillStyle?: string | CanvasGradient
  strokeStyle?: string
  lineWidth?: number
  shadowColor?: string
  shadowBlur?: number
}

export function onresize(): { add: (callback: Callback) => void } {
  const callbacks: Array<Callback> = []
  let running = false

  function resize() {
    if (!running) {
      running = true
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(runCallbacks)
      } else {
        setTimeout(runCallbacks, 66)
      }
    }
  }

  function runCallbacks() {
    callbacks.forEach((callback) => {
      callback()
    })
    running = false
  }

  function addCallback(callback: Callback) {
    if (callback) {
      callbacks.push(callback)
    }
  }

  return {
    add: (callback: Callback) => {
      if (!callbacks.length) {
        window.addEventListener('resize', resize)
      }
      addCallback(callback)
    },
  }
}

export function drawCircle(
  context: CanvasRenderingContext2D,
  {
    x = 0,
    y = 0,
    r = 0,
    fillStyle = '',
    strokeStyle = '',
    lineWidth = 1,
    shadowColor = 'transparent',
    shadowBlur = 0,
  }: CircleOptions,
) {
  context.save()
  context.fillStyle = fillStyle
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.shadowColor = shadowColor
  context.shadowBlur = shadowBlur
  context.beginPath()
  context.arc(x, y, r, 0, 2 * Math.PI, false)
  context.fill()
  if (strokeStyle) {
    context.stroke()
  }
  context.restore()
}

export function drawRoundedRect(
  context: CanvasRenderingContext2D,
  {
    x,
    y,
    width,
    height,
    radius,
  }: {
    x: number
    y: number
    width: number
    height: number
    radius: number
  },
) {
  const clampedRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + clampedRadius, y)
  context.lineTo(x + width - clampedRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius)
  context.lineTo(x + width, y + height - clampedRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height)
  context.lineTo(x + clampedRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius)
  context.lineTo(x, y + clampedRadius)
  context.quadraticCurveTo(x, y, x + clampedRadius, y)
  context.closePath()
}

export function drawMask(board: Board) {
  const context = board.context
  const boardX = Board.MASK_X_BEGIN - Board.PIECE_RADIUS * 0.9
  const boardY = Board.MASK_Y_BEGIN - Board.PIECE_RADIUS * 0.9
  const boardWidth =
    3 * Board.PIECE_RADIUS * Board.COLUMNS + Board.PIECE_RADIUS * 0.8
  const boardHeight =
    3 * Board.PIECE_RADIUS * Board.ROWS + Board.PIECE_RADIUS * 0.8
  const radius = Board.PIECE_RADIUS * 1.2

  const boardGradient = context.createLinearGradient(
    boardX,
    boardY,
    boardX + boardWidth,
    boardY + boardHeight,
  )
  boardGradient.addColorStop(0, 'rgba(246, 243, 249, 0.88)')
  boardGradient.addColorStop(0.5, 'rgba(228, 236, 247, 0.7)')
  boardGradient.addColorStop(1, 'rgba(246, 243, 249, 0.9)')

  context.save()
  context.shadowColor = 'rgba(82, 99, 138, 0.2)'
  context.shadowBlur = 28
  context.fillStyle = boardGradient
  drawRoundedRect(context, {
    x: boardX,
    y: boardY,
    width: boardWidth,
    height: boardHeight,
    radius,
  })
  context.fill()
  context.restore()

  context.save()
  context.fillStyle = 'rgba(255, 255, 255, 0.3)'
  drawRoundedRect(context, {
    x: boardX,
    y: boardY,
    width: boardWidth,
    height: boardHeight,
    radius,
  })
  context.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  context.lineWidth = 1.5
  context.stroke()
  context.restore()
}

export function clearCanvas(board: Board) {
  board.context.clearRect(0, 0, Board.CANVAS_WIDTH, Board.CANVAS_HEIGHT)
}
