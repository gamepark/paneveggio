import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/**
 * Gain n things, ducats or studies, mixed as the player likes (RULES p. 19 "Ou"): one token at a time from the
 * reserve, to the Ducats or the Studies area. At most what the reserve holds.
 */
export class GainChoiceRule extends TaskRule {
  getChoices(): Move[] {
    const token = this.table.reserve(this.player).limit(1)
    if (!token.length || !this.task.n) return []
    return [token.moveItem({ type: LocationType.Ducats, player: this.player }), token.moveItem({ type: LocationType.Studies, player: this.player })]
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.LutherieToken)(move)) return []
    const n = this.task.n! - 1
    this.updateTask({ n })
    return this.getChoices().length ? [] : this.next()
  }
}
