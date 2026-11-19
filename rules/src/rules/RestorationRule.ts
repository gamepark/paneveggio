import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MAX_QUALITY } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/** The violins on musicians that can be restored: any of them, opponents' included [H6], of quality < 4. */
export const restorableViolins = (rule: TaskRule) =>
  rule.table.violinsOnCards.getIndexes().filter((violin) => rule.table.quality(violin) < MAX_QUALITY)

/** Put a token of the reserve on top of a violin. */
export const restoreMoves = (rule: TaskRule, violins: number[]): Move[] => {
  const token = rule.table.reserve(rule.player).limit(1)
  if (!token.length) return []
  return violins.map((violin) => token.moveItem({ type: LocationType.OnViolin, parent: violin }))
}

/**
 * Restoration action (RULES p. 13): "Ajoutez autant de jetons Lutherie que le temps de l'action aux violons de votre
 * choix pour en améliorer la qualité du bois. Vous pouvez restaurer les violons de n'importe quel musicien de l'aire
 * de jeu, y compris ceux des adversaires. Répartissez les jetons à votre convenance. La qualité du bois d'un violon ne
 * peut jamais dépasser 4." The tokens are placed one at a time (count = tokens left); the player may stop.
 */
export class RestorationRule extends TaskRule {
  getChoices(): Move[] {
    return restoreMoves(this, restorableViolins(this))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.LutherieToken)(move) || move.location.type !== LocationType.OnViolin) return []
    const count = this.task.count! - 1
    if (count <= 0) return this.next()
    this.updateTask({ count })
    return this.getChoices().length ? [] : this.next()
  }
}
