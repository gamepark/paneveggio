import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { musicians } from '../material/CharacterCard'
import { CustomMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { effectTask, EffectType } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * After the sheet music (RULES p. 14): "Activez l'effet de fin de tour d'un seul musicien qui possède l'un de vos jetons
 * Violon" — on a partner of any player or on the Master Luthier board.
 */
export class EndOfTurnEffectRule extends TaskRule {
  getChoices(): Move[] {
    const cards = new Set(
      this.table.violins
        .id(this.player)
        .location(LocationType.MusicianSlot)
        .getItems()
        .map((violin) => violin.location.parent!)
    )
    return [...cards]
      .filter((card) => {
        const musician = musicians[this.table.cardId(card)]
        return musician !== undefined && musician.relation === undefined
      })
      .sort((a, b) => a - b)
      .map((card) => this.customMove(CustomMoveType.ChooseCard, card))
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.ChooseCard)(move)) {
      const card = move.data as number
      return this.next(effectTask(this.player, { type: EffectType.EndOfTurnEffect, card, context: card }))
    }
    return super.onCustomMove(move)
  }
}
