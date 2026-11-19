import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

const PILES = [1, 2, 3, 4]

/**
 * Draw (RULES p. 8): "Prendre l'une des 4 cartes visibles de sa zone de Contacts ; Échanger une carte de sa main avec une
 * carte visible parmi les contacts adverses ; Piocher la première carte de la pioche".
 * [H8] only the top card of a pile can be taken. [H10] an empty draw pile cannot be drawn from any more.
 */
export class DrawRule extends TaskRule {
  get autoSingle() {
    return true
  }

  getChoices(): Move[] {
    const player = this.player
    const table = this.table
    const hand = { type: LocationType.PlayerHand, player }
    const moves: Move[] = []
    if (table.deck.length) moves.push(table.deck.deck().dealOne(hand))
    for (const pile of PILES) {
      const top = table.contactTop(player, pile)
      if (top.length) moves.push(top.moveItem(hand))
    }
    // A swap: one of my cards goes on top of a pile of an opponent, whose former top card comes into my hand.
    for (const opponent of this.game.players.filter((other) => other !== player)) {
      for (const pile of PILES) {
        if (!table.contactTop(opponent, pile).length) continue
        moves.push(...table.hand(player).moveItems({ type: LocationType.Contacts, player: opponent, id: pile, x: 0 }))
      }
    }
    return moves
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.CharacterCard)(move)) return []
    if (move.location.type === LocationType.Contacts) {
      // The former top card comes into the hand: that move ends the draw.
      const previousTop = this.table.contactPile(move.location.player!, move.location.id as number).location((location) => location.x === 1)
      return [previousTop.moveItem({ type: LocationType.PlayerHand, player: this.player })]
    }
    return this.next()
  }
}
