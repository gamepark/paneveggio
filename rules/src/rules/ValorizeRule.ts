import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { ValorizeCost } from './Task'
import { Move, TaskRule } from './TaskRule'

/** The cost of the valorizations of Chapel Master n°20 (2 studies) and Burgher n°65 (2 ducats and/or studies). */
const AMOUNT = 2

/**
 * "Valoriser: appliqué sur les violons en patrimoine, il s'agit d'augmenter le niveau de Prestige d'un violon en le
 * changeant de case. […] La valorisation ne peut pas être répartie sur plusieurs violons. L'excédent éventuel de
 * valorisation est perdu" (RULES p. 19). Geminiani n°70: x ducats to valorize by x.
 * Burgher n°65: the 2 ducats and/or studies are paid one at a time once the violin has moved (count = left to pay).
 */
export class ValorizeRule extends TaskRule {
  get autoSingle() {
    return (this.task.cost ?? ValorizeCost.None) === ValorizeCost.None
  }

  getChoices(): Move[] {
    const player = this.player
    if (this.task.count) return this.paymentMoves()
    const ducats = this.table.ducats(player).length
    const studies = this.table.studies(player).length
    const cost = this.task.cost ?? ValorizeCost.None
    if (cost === ValorizeCost.Studies && studies < AMOUNT) return []
    if (cost === ValorizeCost.Either && ducats + studies < AMOUNT) return []
    const moves: Move[] = []
    for (const violin of this.table.heritage(player).getIndexes()) {
      const level = this.table.violins.getItem(violin).location.id as number
      if (level >= 4) continue
      const levels = cost === ValorizeCost.DucatsX ? range(level + 1, Math.min(4, level + ducats) + 1) : [Math.min(4, level + this.task.n!)]
      moves.push(...levels.map((id) => this.table.violins.index(violin).moveItem({ type: LocationType.Heritage, player, id })))
    }
    return moves
  }

  paymentMoves(): Move[] {
    const player = this.player
    return [this.table.ducats(player).limit(1), this.table.studies(player).limit(1)]
      .filter((token) => token.length)
      .map((token) => token.moveItem({ type: LocationType.Reserve, player }))
  }

  beforeItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (isMoveItemType(MaterialType.ViolinToken)(move)) {
      // The level before the move: Geminiani n°70 pays the difference.
      this.updateTask({ n: this.table.violins.getItem(move.itemIndex).location.id as number })
    }
    return []
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    const bank = this.bank()
    if (isMoveItemType(MaterialType.ViolinToken)(move)) {
      switch (this.task.cost ?? ValorizeCost.None) {
        case ValorizeCost.Studies:
          return [...bank.pay(Resource.Study, AMOUNT), ...this.next()]
        case ValorizeCost.DucatsX:
          return [...bank.pay(Resource.Ducat, (move.location.id as number) - this.task.n!), ...this.next()]
        case ValorizeCost.Either: {
          const ducats = this.table.ducats(this.player).length
          const studies = this.table.studies(this.player).length
          if (ducats === 0) return [...bank.pay(Resource.Study, AMOUNT), ...this.next()]
          if (studies === 0) return [...bank.pay(Resource.Ducat, AMOUNT), ...this.next()]
          this.updateTask({ count: AMOUNT, mandatory: true })
          return []
        }
        default:
          return this.next()
      }
    }
    if (isMoveItemType(MaterialType.LutherieToken)(move) && this.task.count) {
      const count = this.task.count - 1
      this.updateTask({ count })
      if (count === 0) return this.next()
      // Only one way left to pay: done at once.
      const left = this.paymentMoves()
      return left.length === 1 ? [left[0]] : []
    }
    return []
  }
}
