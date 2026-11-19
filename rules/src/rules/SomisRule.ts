import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { CustomMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { Move, TaskRule } from './TaskRule'

/** Take a partner card back into hand: the violins on a musician go to the Heritage of their owners (RULES p. 17). */
export const takeBackMoves = (rule: TaskRule, card: number): Move[] => [
  ...rule.heritageMoves(card),
  rule.table.cards.index(card).moveItem({ type: LocationType.PlayerHand, player: rule.player })
]

/**
 * Somis n°10 (RULES p. 20): "Ciblez un de vos musiciens Partenaires et suivez les règles habituelles de Conservation :
 * les jetons Violon en patrimoine, les jetons Lutherie des joueurs rendus à leurs propriétaires (pour ducats ou
 * études). S'il existe des violons adverses sur ce musicien, ils sont rendus à leur propriétaire qui les passe aussi en
 * Patrimoine. Reprenez en main la carte Musicien ciblée."
 * The Lutherie tokens of the player wait in their returned tokens: they are spread at the start of their next turn (D2).
 */
export class SomisRule extends TaskRule {
  getChoices(): Move[] {
    return this.table
      .partnerMusicians(this.player)
      .getIndexes()
      .map((card) => this.customMove(CustomMoveType.TakeBack, card))
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.TakeBack)(move)) return [...takeBackMoves(this, move.data as number), ...this.next()]
    return super.onCustomMove(move)
  }
}
