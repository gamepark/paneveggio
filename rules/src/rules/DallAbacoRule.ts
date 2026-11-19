import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { restorableViolins, restoreMoves } from './RestorationRule'
import { effectTask, EffectType } from './Task'
import { Move, TaskRule } from './TaskRule'

const DALL_ABACO = 68

/**
 * Dall'Abaco n°68: "Restaurez 1 violon (autre que celui de ce musicien) pour 1 temps, appliquez l'effet fin de tour de
 * la carte restaurée." RULES p. 20: the musician may have no end of turn effect (the violin is only restored), and may
 * belong to an opponent.
 */
export class DallAbacoRule extends TaskRule {
  getChoices(): Move[] {
    return restoreMoves(
      this,
      restorableViolins(this).filter((violin) => this.table.cardId(this.table.violins.getItem(violin).location.parent!) !== DALL_ABACO)
    )
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.LutherieToken)(move) || move.location.type !== LocationType.OnViolin) return []
    const card = this.table.violins.getItem(move.location.parent!).location.parent!
    return this.next(effectTask(this.player, { type: EffectType.EndOfTurnEffect, card, context: card }))
  }
}
