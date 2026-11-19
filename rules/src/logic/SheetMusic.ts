import { range } from 'es-toolkit'
import { Action } from '../material/Action'
import { NoteMove, NoteMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { GameMaterial } from './Table'

export const BEATS = 7

/** An action of the sheet music: consecutive notes on the same line (RULES p. 9). */
export type SheetAction = {
  action: Action
  /** The beats of its notes. */
  beats: number[]
  /** Its strength: the number of notes, 3 at least with the token of Rameau n°23 [H12]. */
  time: number
}

/** One line up (towards Restoration), Restoration being next to Wood. */
const lineUp = (action: Action): Action => (action === Action.Restoration ? Action.Wood : action + 1)
/** One line down (towards Wood), Wood being next to Restoration. */
const lineDown = (action: Action): Action => (action === Action.Wood ? Action.Restoration : action - 1)

export class SheetMusic {
  constructor(
    private readonly game: GameMaterial,
    private readonly player: PlayerColor
  ) {}

  get notes() {
    return this.game.material(MaterialType.NoteToken).location(LocationType.SheetMusic).player(this.player)
  }

  /** The action of each beat, from the 1st to the 7th. */
  get lines(): Action[] {
    const lines: Action[] = []
    for (const note of this.notes.getItems()) {
      lines[note.location.x!] = note.location.id as Action
    }
    return lines
  }

  /** The beat of the note carrying the token of Rameau n°23, if any. */
  get rameauBeat(): number | undefined {
    const token = this.game.material(MaterialType.LutherieToken).location(LocationType.OnNote).getItems()
    for (const item of token) {
      const note = this.game.material(MaterialType.NoteToken).getItem(item.location.parent!)
      if (note.location.player === this.player) return note.location.x
    }
    return undefined
  }

  /**
   * The actions in the order they are played: each run of consecutive notes on the same line is one action, whose time
   * is the number of notes. The sheet music is read from left to right, without looping back (RULES p. 9).
   */
  get actions(): SheetAction[] {
    const lines = this.lines
    const rameau = this.rameauBeat
    const actions: SheetAction[] = []
    let start = 0
    for (let beat = 1; beat <= BEATS; beat++) {
      if (beat === BEATS || lines[beat] !== lines[start]) {
        const beats = range(start, beat)
        // [H12] the action that has the token is worth 3 beats, or more if it already has more notes.
        const time = rameau !== undefined && beats.includes(rameau) ? Math.max(beats.length, 3) : beats.length
        actions.push({ action: lines[start], beats, time })
        start = beat
      }
    }
    return actions
  }

  /**
   * Does the sheet music show the 3 actions of an apprentice, consecutively, whatever their time (RULES p. 16)?
   * [H11] without looping from the last action to the first one.
   */
  hasPattern(pattern: Action[]): boolean {
    const sequence = this.actions.map((action) => action.action)
    for (let i = 0; i + pattern.length <= sequence.length; i++) {
      if (pattern.every((action, j) => sequence[i + j] === action)) return true
    }
    return false
  }

  /** At least one note on each of the 5 lines (Tartini n°24). */
  hasNoteOnEveryLine() {
    return new Set(this.lines).size === 5
  }

  /** Where each note goes with a move of the sheet music: [note index, new line, new beat]. */
  apply(move: NoteMove): [number, Action, number][] {
    const notes = this.notes
    const at = (beat: number) => notes.location((location) => location.x === beat)
    const result: [number, Action, number][] = []
    switch (move.type) {
      case NoteMoveType.Up:
      case NoteMoveType.Down: {
        const note = at(move.beat!)
        const line = note.getItem()!.location.id as Action
        result.push([note.getIndex(), move.type === NoteMoveType.Up ? lineUp(line) : lineDown(line), move.beat!])
        break
      }
      case NoteMoveType.Swap: {
        const next = (move.beat! + 1) % BEATS
        const a = at(move.beat!)
        const b = at(next)
        result.push([a.getIndex(), a.getItem()!.location.id as Action, next], [b.getIndex(), b.getItem()!.location.id as Action, move.beat!])
        break
      }
      case NoteMoveType.ShiftLeft:
      case NoteMoveType.ShiftRight: {
        const shift = move.type === NoteMoveType.ShiftLeft ? BEATS - 1 : 1
        for (const index of notes.getIndexes()) {
          const location = notes.getItem(index).location
          result.push([index, location.id as Action, (location.x! + shift) % BEATS])
        }
        break
      }
    }
    return result
  }
}

/** All the moves of the sheet music (RULES p. 9): up, down and swap on each beat, and the 2 shifts. */
export const allNoteMoves: NoteMove[] = [
  ...range(BEATS).flatMap((beat) => [
    { type: NoteMoveType.Up, beat },
    { type: NoteMoveType.Down, beat },
    { type: NoteMoveType.Swap, beat }
  ]),
  { type: NoteMoveType.ShiftLeft },
  { type: NoteMoveType.ShiftRight }
]
