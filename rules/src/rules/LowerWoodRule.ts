import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/**
 * Apprentice n°60: "Diminuez de 1 la qualité d'un bois en stock et piochez 1 carte." RULES p. 19: "On ne peut retirer
 * que les jetons Lutherie, pas la base de la pile de jetons, qui est un jeton Violon." The token goes back to the reserve.
 */
export class LowerWoodRule extends TaskRule {
  getChoices(): Move[] {
    return this.table
      .woods(this.player)
      .getIndexes()
      .filter((wood) => this.table.quality(wood) >= 2)
      .map((wood) => this.table.topToken(wood).moveItem({ type: LocationType.Reserve, player: this.player }))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    return isMoveItemType(MaterialType.LutherieToken)(move) ? this.next() : []
  }
}
