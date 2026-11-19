import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { musicians } from '../material/CharacterCard'
import { CustomMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { CopyMode, effectTask, EffectType } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * Apply the Relation effect of another musician; when the effect depends on the number of violins, the violins of that
 * musician count (RULES p. 20):
 * - Mascitti n°54: a partner musician of Prestige 1 or 2, even without a violin of the player;
 * - Burgher n°67: a musician of an opponent, even without violin.
 */
export class CopyRelationRule extends TaskRule {
  getChoices(): Move[] {
    const player = this.player
    return this.table.cards
      .location(LocationType.PartnerMusicians)
      .getIndexes()
      .filter((card) => {
        const item = this.table.cards.getItem<number>(card)
        const musician = musicians[item.id]
        if (musician?.relation === undefined) return false
        if (this.task.copy === CopyMode.PartnerUpTo2) return item.location.player === player && musician.prestige <= 2
        return item.location.player !== player
      })
      .map((card) => this.customMove(CustomMoveType.ChooseCard, card))
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.ChooseCard)(move)) {
      const card = move.data as number
      return this.next(effectTask(this.player, { type: EffectType.RelationEffect, card, context: card }))
    }
    return super.onCustomMove(move)
  }
}
