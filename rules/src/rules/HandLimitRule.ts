import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { HAND_LIMIT } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/**
 * "La main d'un joueur est limitée à 10 cartes à la fin de son tour" (RULES p. 8).
 * [H5] (open question, BGA hypothesis): the player chooses the extra cards, which go to the discard of the turn; they
 * are spread over the Contacts at the end of the next Workshop.
 */
export class HandLimitRule extends TaskRule {
  getChoices(): Move[] {
    const hand = this.table.hand(this.player)
    if (hand.length <= HAND_LIMIT) return []
    return hand.moveItems({ type: LocationType.TurnDiscard, player: this.player })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.CharacterCard)(move)) return []
    return this.table.hand(this.player).length <= HAND_LIMIT ? this.next() : []
  }
}
