import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { CustomMoveType } from '../material/CustomMoveType'
import { Memory } from '../material/Memory'
import { PlayerColor } from '../PlayerColor'
import { startFinalTurn, startTurn } from './StartTurn'
import { Move, TaskRule } from './TaskRule'

/** "La fin de partie est déclenchée lorsqu'un joueur, à la fin de son tour, a confectionné ses 12 Violons" (RULES p. 18). */
export const VIOLINS_TO_END = 12

/**
 * The turn is over: the player confirms it, and can still undo until then. Then the next player in the order of play.
 * [H4] the end is triggered when the 12 Violin tokens of the player are at the same time in their Heritage or on
 * musicians. "Ses adversaires, jusqu'à celui placé à droite du premier joueur en début de partie, jouent un dernier
 * tour", then the final phase starts with the first player.
 */
export class EndTurnRule extends TaskRule {
  getChoices(): Move[] {
    return [this.customMove(CustomMoveType.EndTurn)]
  }

  onRuleStart(): Move[] {
    return []
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType(CustomMoveType.EndTurn)(move)) return super.onCustomMove(move)
    if (this.remind(Memory.EndTriggeredBy) === undefined && this.table.madeViolins(this.player).length >= VIOLINS_TO_END) {
      this.memorize<PlayerColor>(Memory.EndTriggeredBy, this.player)
    }
    const players = this.game.players
    const next = players[(players.indexOf(this.player) + 1) % players.length]
    if (this.remind(Memory.EndTriggeredBy) !== undefined && next === players[0]) return startFinalTurn(this, next)
    return startTurn(this, next)
  }
}
