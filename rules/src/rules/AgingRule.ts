import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { ageMoves, woodsToAge } from './AgeRule'
import { RuleId } from './RuleId'
import { task } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * "Procédez, pour finir votre tour, au vieillissement du bois en stock. Ajouter 1 jeton Lutherie sur vos piles de bois
 * en stock dans la limite de 4 jetons, jeton Violon compris" (RULES p. 14).
 * [H15] (Ludo, 12/11/2026): when the reserve is too small for all the woods, the player may first take back tokens of
 * their Ducats and Studies areas; if some are still missing, the player chooses the woods that age (each one once).
 */
export class AgingRule extends TaskRule {
  onRuleStart(): Move[] {
    const woods = woodsToAge(this)
    if (!woods.length) return this.next()
    const reserve = this.table.reserve(this.player).length
    const missing = woods.length - reserve
    if (missing > 0 && !this.task.reclaimOffered) {
      const resources = this.table.ducats(this.player).length + this.table.studies(this.player).length
      if (resources > 0) {
        this.updateTask({ reclaimOffered: true })
        return this.before(task(RuleId.ReclaimTokens, this.player, { count: Math.min(missing, resources), resourcesOnly: true }))
      }
    }
    if (missing <= 0) {
      const tokens = this.table.reserve(this.player).getIndexes()
      return [
        ...woods.map((wood, i) => this.table.lutheries.index(tokens[i]).moveItem({ type: LocationType.OnViolin, parent: wood })),
        ...this.next()
      ]
    }
    this.updateTask({ count: reserve, used: [] })
    return reserve ? [] : this.next()
  }

  getChoices(): Move[] {
    if (!this.task.count) return []
    return ageMoves(this, woodsToAge(this).filter((wood) => !this.task.used!.includes(wood)))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.LutherieToken)(move) || this.task.count === undefined) return []
    const count = this.task.count - 1
    this.updateTask({ count, used: [...this.task.used!, move.location.parent!] })
    return count > 0 && this.getChoices().length ? [] : this.next()
  }
}
