import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { CustomMoveType, NoteMove } from '../material/CustomMoveType'
import { NoteMovesRule } from './SheetMusicRule'
import { Move } from './TaskRule'

/**
 * Chapel Master n°22 (RULES p. 20): "Effectuez autant de mouvements de notes que de violons présents sur cette carte."
 * "Contrairement à la séquence Conservation, les mouvements ici ne nécessitent pas de dépenser d'étude."
 */
export class MoveNotesRule extends NoteMovesRule {
  getChoices(): Move[] {
    return this.task.count ? this.noteMoves(true) : []
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.MoveNote)(move)) {
      const count = this.task.count! - 1
      const moves = this.moveNotes(move.data as NoteMove, true)
      if (count === 0) return [...moves, ...this.next()]
      this.updateTask({ count })
      return moves
    }
    return super.onCustomMove(move)
  }
}
