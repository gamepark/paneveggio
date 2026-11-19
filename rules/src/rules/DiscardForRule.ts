import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { getAffiliation, getPrestige, isMusician, musicians } from '../material/CharacterCard'
import { CustomMoveType, Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { actionTasks } from './CardEffects'
import { RuleId } from './RuleId'
import { DiscardFilter, DiscardReward, effectTask, EffectType, task, Task } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * Discard cards of the hand for an effect (Troubadours n°46 to 51, Bonporti n°53, Burgher n°63), or as the cost of an
 * apprentice (n°12, 42, 44, 71). The cards go to the discard of the turn. Once the first card is discarded, the next
 * ones are mandatory.
 */
export class DiscardForRule extends TaskRule {
  get isBonporti() {
    return this.task.reward === DiscardReward.ValorizeByCount
  }

  getChoices(): Move[] {
    const player = this.player
    const hand = this.table.hand(player)
    if (!this.isBonporti && hand.length < this.task.count!) return []
    // Bonporti n°53: only worth it with a violin to valorize.
    if (this.isBonporti && !this.table.heritage(player).location((location) => (location.id as number) < 4).length) return []
    return hand
      .id<number>((card) => {
        switch (this.task.filter) {
          case DiscardFilter.Musician:
            return isMusician(card)
          case DiscardFilter.Relation:
            return musicians[card]?.relation !== undefined
          default:
            return true
        }
      })
      .moveItems({ type: LocationType.TurnDiscard, player })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.CharacterCard)(move)) return []
    if (this.isBonporti) {
      const discarded = this.task.discarded! + 1
      if (discarded === 3 || !this.table.hand(this.player).length) return this.next(...this.bonporti(discarded))
      this.updateTask({ discarded })
      return []
    }
    const count = this.task.count! - 1
    if (count > 0) {
      this.updateTask({ count, mandatory: true })
      return []
    }
    return this.next(...this.reward(move.itemIndex))
  }

  onCustomMove(move: CustomMove): Move[] {
    // Bonporti n°53: stop after 1 or 2 cards.
    if (isCustomMoveType(CustomMoveType.Pass)(move) && this.isBonporti && this.task.discarded) {
      return this.next(...this.bonporti(this.task.discarded))
    }
    return super.onCustomMove(move)
  }

  /** Bonporti n°53: "Défaussez 1/2/3 cartes pour valoriser de 1/2/3, 1 violon en patrimoine." */
  bonporti(discarded: number): Task[] {
    return [task(RuleId.Valorize, this.player, { n: discarded }, true)]
  }

  /** What the player gets for the discarded card (the last one when there are several). */
  reward(card: number): Task[] {
    const player = this.player
    const id = this.table.cardId(card)
    const n = this.task.n ?? 1
    switch (this.task.reward) {
      case DiscardReward.GainChoice:
        return [task(RuleId.GainChoice, player, { n }, true)]
      case DiscardReward.Valorize:
        return [task(RuleId.Valorize, player, { n }, true)]
      case DiscardReward.Ducats:
        return [effectTask(player, { type: EffectType.Gain, resource: Resource.Ducat, n })]
      case DiscardReward.PrestigeDucats:
        return [effectTask(player, { type: EffectType.Gain, resource: Resource.Ducat, n: getPrestige(id) })]
      case DiscardReward.Affiliated:
        return actionTasks(player, getAffiliation(id), this.task.time!)
      case DiscardReward.RelationOf:
        // The discarded card comes from the hand: it carries no violin (RULES p. 20, n°51).
        return [effectTask(player, { type: EffectType.RelationEffect, card })]
      default:
        return []
    }
  }
}
