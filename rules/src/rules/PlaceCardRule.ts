import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { isApprentice } from '../material/CharacterCard'
import { Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/**
 * Play a card of the hand in the partners zone (RULES p. 8 "Pose de carte"): placement bonus, Vivaldi n°8 and
 * apprentice n°26 (for 1 study), Chapel Master n°21 (an apprentice, ignoring its prerequisites, RULES p. 20).
 */
export class PlaceCardRule extends TaskRule {
  getChoices(): Move[] {
    const player = this.player
    if (this.table.studies(player).length < (this.task.studies ?? 0)) return []
    return this.table
      .hand(player)
      .getIndexes()
      .filter((index) => {
        const card = this.table.cardId(index)
        if (this.task.apprenticeOnly && !isApprentice(card)) return false
        return this.canPlace(card, player, this.task.ignorePrerequisites)
      })
      .map((index) => this.placeCard(index))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.CharacterCard)(move)) return []
    this.countTrainedApprentice(move)
    return [...this.bank().pay(Resource.Study, this.task.studies ?? 0), ...this.next()]
  }
}
