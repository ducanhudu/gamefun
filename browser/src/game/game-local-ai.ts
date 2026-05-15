import { BoardPiece, PlayerAi, PlayerHuman, type PlayerAiOptions } from '@kenrick95/c4'
import { GameLocal, initGameLocal } from './game-local'

export type AiDifficulty = 'easy' | 'medium' | 'hard'

const AI_DIFFICULTY_CONFIG: Record<AiDifficulty, PlayerAiOptions> = {
  easy: {
    maxDepth: 1,
    topMoveSpread: 5,
    centerWeight: 0,
    tacticalAwareness: false,
  },
  medium: {
    maxDepth: 4,
    topMoveSpread: 2,
    centerWeight: 8,
    tacticalAwareness: true,
  },
  hard: {
    maxDepth: 6,
    topMoveSpread: 1,
    centerWeight: 16,
    tacticalAwareness: true,
  },
}

class GameLocalAi extends GameLocal {}

export function initGameLocalAi(
  playerName: string,
  difficulty: AiDifficulty = 'medium',
) {
  const firstPlayer = new PlayerHuman(BoardPiece.PLAYER_1, playerName)
  const aiPlayer = new PlayerAi(
    BoardPiece.PLAYER_2,
    'Máy',
    AI_DIFFICULTY_CONFIG[difficulty],
  )
  return initGameLocal(GameLocalAi, firstPlayer, aiPlayer, {
    allowUndo: true,
  })
}
