import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { CustomMoveType } from '../material/CustomMoveType'
import { endTurn } from './StartTurn'
import { Move, TaskRule } from './TaskRule'

export { VIOLINS_TO_END } from './StartTurn'

/** The turn is over: the player confirms it, and can still undo until then. Then the next player (see endTurn). */
export class EndTurnRule extends TaskRule {
  getChoices(): Move[] {
    return [this.customMove(CustomMoveType.EndTurn)]
  }

  onRuleStart(): Move[] {
    return []
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType(CustomMoveType.EndTurn)(move)) return super.onCustomMove(move)
    return endTurn(this, this.player)
  }
}
