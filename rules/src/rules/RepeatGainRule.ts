import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { CustomMoveType, Pick, Resource } from '../material/CustomMoveType'
import { RuleId } from './RuleId'
import { task } from './Task'
import { Move, TaskRule } from './TaskRule'

/** Troubadour n°52: "Effectuez 3 fois : Piochez ou gagnez 1 étude ou gagnez 1 ducat." (count = times left) */
export class RepeatGainRule extends TaskRule {
  getChoices(): Move[] {
    if (!this.task.count) return []
    const moves = [this.customMove(CustomMoveType.Pick, Pick.Draw)]
    if (this.table.reserve(this.player).length) {
      moves.push(this.customMove(CustomMoveType.Pick, Pick.Study), this.customMove(CustomMoveType.Pick, Pick.Ducat))
    }
    return moves
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType(CustomMoveType.Pick)(move)) return super.onCustomMove(move)
    const count = this.task.count! - 1
    this.updateTask({ count })
    if (move.data === Pick.Draw) {
      const draw = task(RuleId.Draw, this.player)
      return count > 0 ? this.before(draw) : this.next(draw)
    }
    const moves = this.bank().gain(move.data === Pick.Study ? Resource.Study : Resource.Ducat, 1)
    return count > 0 ? moves : [...moves, ...this.next()]
  }
}
