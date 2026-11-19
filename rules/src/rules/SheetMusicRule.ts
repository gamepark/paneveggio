import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { CustomMoveType, NoteMove, Resource, Sequence } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { allNoteMoves } from '../logic/SheetMusic'
import { RuleId } from './RuleId'
import { effectTask, EffectType, task, Task } from './Task'
import { Move, TaskRule } from './TaskRule'

/** "Au début de votre tour de jeu, vous pouvez modifier votre partition, chaque modification coûte 1 étude" (RULES p. 9). */
export const NOTE_MOVE_COST = 1

/** Moving notes, paid with studies (start of turn, end of the game) or free (Chapel Master n°22). */
export abstract class NoteMovesRule extends TaskRule {
  /** The moves of the sheet music the player can do now. */
  noteMoves(free = false): Move[] {
    if (!free && this.table.studies(this.player).length < NOTE_MOVE_COST) return []
    return allNoteMoves.map((noteMove) => this.customMove(CustomMoveType.MoveNote, noteMove))
  }

  /** The notes move (the token of Rameau n°23 follows its note, RULES p. 20); the move is paid unless it is free. */
  moveNotes(noteMove: NoteMove, free = false): Move[] {
    const notes = this.material(MaterialType.NoteToken)
    const moves: Move[] = this.sheetMusic()
      .apply(noteMove)
      .map(([note, line, beat]) => notes.index(note).moveItem({ type: LocationType.SheetMusic, player: this.player, id: line, x: beat }))
    if (!free) moves.push(...this.bank().pay(Resource.Study, NOTE_MOVE_COST))
    return moves
  }
}

/**
 * Start of turn (RULES p. 9): change the sheet music, 1 study per move, then choose the Workshop sequence (the sheet
 * music is played) or the Conservation sequence.
 */
export class SheetMusicRule extends NoteMovesRule {
  getChoices(): Move[] {
    return [
      ...this.noteMoves(),
      this.customMove(CustomMoveType.ChooseSequence, Sequence.Workshop),
      this.customMove(CustomMoveType.ChooseSequence, Sequence.Conservation)
    ]
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.MoveNote)(move)) return this.moveNotes(move.data as NoteMove)
    if (isCustomMoveType(CustomMoveType.ChooseSequence)(move)) {
      return move.data === Sequence.Workshop ? this.workshop() : this.conservation()
    }
    return super.onCustomMove(move)
  }

  /** Workshop sequence: the actions of the sheet music from left to right, then the end of the Workshop (RULES p. 9 and 14). */
  workshop(): Move[] {
    const player = this.player
    const actions: Task[] = this.sheetMusic().actions.map(({ action, time, beats }) => task(RuleId.PlayAction, player, { action, time, beats }))
    return this.next(
      ...actions,
      task(RuleId.EndOfTurnEffect, player),
      effectTask(player, { type: EffectType.RefillContacts }),
      task(RuleId.SpreadDiscards, player, {}, true),
      task(RuleId.Aging, player, {}, true),
      task(RuleId.HandLimit, player, {}, true),
      task(RuleId.EndTurn, player, {}, true)
    )
  }

  /**
   * Conservation sequence (RULES p. 15): the token of Rameau n°23 goes back to the reserve, all the violins of the player
   * on musicians go to their Heritage, the Lutherie tokens on them go back to their owners; then the player trains
   * apprentices and places musicians, or takes partners back into hand (RULES p. 16 and 17).
   * Rameau: RULES p. 20 says "le joueur reprend le jeton en tant qu'étude", but Ludo decided on 19/11/2026 that the
   * token goes back to the reserve the next turn, whatever the sequence: do not make it a study again.
   */
  conservation(): Move[] {
    const player = this.player
    const moves: Move[] = []
    const rameau = this.material(MaterialType.LutherieToken)
      .location(LocationType.OnNote)
      .filter((item) => this.material(MaterialType.NoteToken).getItem(item.location.parent!).location.player === player)
    if (rameau.length) moves.push(rameau.moveItem({ type: LocationType.Reserve, player }))
    const cards = new Set(
      this.table.violins
        .id(player)
        .location(LocationType.MusicianSlot)
        .getItems()
        .map((violin) => violin.location.parent!)
    )
    for (const card of cards) moves.push(...this.heritageMoves(card, player))
    return [
      ...moves,
      ...this.next(
        task(RuleId.SpreadReturnedTokens, player, {}, true),
        task(RuleId.Conservation, player),
        task(RuleId.SpreadReturnedTokens, player, {}, true),
        task(RuleId.HandLimit, player, {}, true),
        task(RuleId.EndTurn, player, {}, true)
      )
    ]
  }
}
