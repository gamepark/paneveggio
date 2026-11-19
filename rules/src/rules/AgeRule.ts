import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MAX_QUALITY } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/** The woods of the stock of a player that can still age (quality < 4). */
export const woodsToAge = (rule: TaskRule) =>
  rule.table
    .woods(rule.player)
    .getIndexes()
    .filter((wood) => rule.table.quality(wood) < MAX_QUALITY)

/** Age a wood: a token of the reserve on top of it. */
export const ageMoves = (rule: TaskRule, woods: number[]): Move[] => {
  const token = rule.table.reserve(rule.player).limit(1)
  if (!token.length) return []
  return woods.map((wood) => token.moveItem({ type: LocationType.OnViolin, parent: wood }))
}

/** "Vieillir: ajouter 1 jeton Lutherie sur 1 bois en stock pour une qualité maximale de 4" (RULES p. 19). */
export class AgeRule extends TaskRule {
  get autoSingle() {
    return true
  }

  getChoices(): Move[] {
    return ageMoves(this, woodsToAge(this))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    return isMoveItemType(MaterialType.LutherieToken)(move) ? this.next() : []
  }
}
