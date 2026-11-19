import { CustomMove, isCustomMoveType, ItemMove } from '@gamepark/rules-api'
import { CustomMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { takeBackMoves } from './SomisRule'
import { Move, TaskRule } from './TaskRule'

/**
 * Conservation sequence, after the Heritage (RULES p. 16 and 17): the player may train one or several apprentices and
 * place one or several musicians from their hand, respecting their prerequisites, or take partner cards back into hand
 * ("vous renonceriez alors à leurs PP en fin de partie"), then ends the sequence (pass).
 * Taking back a musician: "S'il devait y avoir des violons adverses sur la carte Musicien reprise en main, ils seraient
 * remis à leurs propriétaires qui les placeraient en zone Patrimoine. Les jetons Lutherie éventuellement placés dessus
 * seraient également rendus pour devenir Ducats ou Études."
 */
export class ConservationRule extends TaskRule {
  getChoices(): Move[] {
    const player = this.player
    const place = this.table
      .hand(player)
      .getIndexes()
      .filter((card) => this.canPlace(this.table.cardId(card)))
      .map((card) => this.placeCard(card))
    const takeBack = [...this.table.partnerApprentices(player).getIndexes(), ...this.table.partnerMusicians(player).getIndexes()].map((card) =>
      this.customMove(CustomMoveType.TakeBack, card)
    )
    return [...place, ...takeBack]
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    this.countTrainedApprentice(move)
    return []
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.TakeBack)(move)) return takeBackMoves(this, move.data as number)
    return super.onCustomMove(move)
  }
}
