import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

const PILES = [1, 2, 3, 4]

/**
 * End of the Workshop (RULES p. 14), after the empty piles of Contacts are refilled (ApplyEffectRule):
 * - "Répartissez, à votre convenance, les cartes défaussées ce tour au-dessus des piles de votre zone de Contacts"
 *   ([H7] every card discarded since the last Workshop, [H5] the extra cards of the hand limit included);
 * - then the wear of all the violins of the player.
 */
export class SpreadDiscardsRule extends TaskRule {
  get discards() {
    return this.table.cards.location(LocationType.TurnDiscard).player(this.player)
  }

  onRuleStart(): Move[] {
    return this.discards.length ? [] : [...this.wear(), ...this.next()]
  }

  getChoices(): Move[] {
    const player = this.player
    return PILES.flatMap((pile) => this.discards.moveItems({ type: LocationType.Contacts, player, id: pile, x: 0 }))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.CharacterCard)(move) || move.location.type !== LocationType.Contacts) return []
    if (this.discards.length) return []
    return [...this.wear(), ...this.next()]
  }

  /**
   * "Procédez à l'usure de tous vos violons" (RULES p. 14): the top Lutherie token of each violin of the player on a
   * musician is removed. Theirs goes back to their reserve; the one of an opponent goes back to its owner, who will make
   * it a ducat or a study (D2). A violin without any Lutherie token is broken: the Violin token goes back to the reserve.
   */
  wear(): Move[] {
    const player = this.player
    const moves: Move[] = []
    for (const violin of this.table.violins.id(player).location(LocationType.MusicianSlot).getIndexes()) {
      const top = this.table.topToken(violin)
      if (!top.length) {
        moves.push(this.table.violins.index(violin).moveItem({ type: LocationType.Reserve, player }))
        continue
      }
      const owner = top.getItem<PlayerColor>()!.id
      moves.push(top.moveItem(owner === player ? { type: LocationType.Reserve, player } : { type: LocationType.ReturnedTokens, player: owner }))
    }
    return moves
  }
}
