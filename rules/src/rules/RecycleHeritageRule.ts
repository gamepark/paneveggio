import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { task } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * Collectors n°33 and n°36: "Replacez 1 violon de votre Patrimoine dans votre réserve, puis valorisez 1 violon restant
 * de 2." It takes 2 violins in Heritage at least.
 */
export class RecycleHeritageRule extends TaskRule {
  getChoices(): Move[] {
    const heritage = this.table.heritage(this.player)
    if (heritage.length < 2) return []
    return heritage.moveItems({ type: LocationType.Reserve, player: this.player })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ViolinToken)(move)) return []
    return this.next(task(RuleId.Valorize, this.player, { n: 2 }, true))
  }
}
