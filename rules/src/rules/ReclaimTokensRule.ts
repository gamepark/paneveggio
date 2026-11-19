import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, reclaimableStacks, TaskRule } from './TaskRule'

/**
 * Lack of tokens (RULES p. 7): "Ces jetons sont en quantité limitée, si un joueur venait à en manquer dans sa réserve,
 * il pourrait en retirer un ailleurs sur son plateau depuis l'une des 3 zones de son atelier." Decided by Ludo on
 * 10/11/2026: the player takes back, one at a time, as many of their tokens as they like, at most what is missing, from
 * the Ducats area, the Studies area, or the top of a pile (wood in stock, or violin on any musician). Never a token
 * covered by another one, nor a token of the help area.
 * [H15] before the aging of the end of turn: only from the Ducats and Studies areas.
 */
export class ReclaimTokensRule extends TaskRule {
  getChoices(): Move[] {
    const player = this.player
    if (!this.task.count) return []
    const reserve = { type: LocationType.Reserve, player }
    const moves = [this.table.ducats(player).limit(1), this.table.studies(player).limit(1)]
      .filter((token) => token.length)
      .map((token) => token.moveItem(reserve))
    if (!this.task.resourcesOnly) {
      moves.push(...reclaimableStacks(this.table, player).map((token) => this.table.lutheries.index(token).moveItem(reserve)))
    }
    return moves
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.LutherieToken)(move)) return []
    const count = this.task.count! - 1
    this.updateTask({ count })
    return count > 0 && this.getChoices().length ? [] : this.next()
  }
}
