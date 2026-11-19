import { ItemMove, isMoveItemType } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/**
 * Lutherie tokens given back to a player (wear of a violin of another player, Heritage, musician taken back): "les
 * joueurs placent leurs jetons Lutherie en zone Ducats et/ou en zone Études selon leur choix" (RULES p. 15).
 * Decision D2 (BGA): the tokens given back during the turn of another player wait next to the board, and their owner
 * spreads them at the start of their own turn: ducats and studies are only used during one's own turn, so the result
 * is the same as at the table, without stopping the turn of the other player.
 */
export class SpreadReturnedTokensRule extends TaskRule {
  getChoices(): Move[] {
    const token = this.table.returnedTokens(this.player).limit(1)
    if (!token.length) return []
    return [token.moveItem({ type: LocationType.Ducats, player: this.player }), token.moveItem({ type: LocationType.Studies, player: this.player })]
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (isMoveItemType(MaterialType.LutherieToken)(move) && !this.table.returnedTokens(this.player).length) {
      return this.next()
    }
    return []
  }
}
