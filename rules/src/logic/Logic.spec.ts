import { describe, expect, it } from 'vitest'
import { Action } from '../material/Action'
import { NoteMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PaneveggioRules } from '../PaneveggioRules'
import { PaneveggioSetup } from '../PaneveggioSetup'
import { PlayerColor } from '../PlayerColor'
import { prerequisitesMet } from '../rules/TaskRule'
import { relationPoints } from './Scoring'
import { SheetMusic } from './SheetMusic'

const { Wood, Study, Crafting, Relation, Restoration } = Action

/** A game of 2 players whose first player has this sheet music, and the Rameau token on a beat if any. */
const withSheetMusic = (lines: Action[], rameau?: number) => {
  const rules = new PaneveggioRules(new PaneveggioSetup().setup({ players: [{ id: PlayerColor.Blue }, { id: PlayerColor.Red }] }))
  const player = rules.players[0]
  const notes = rules.material(MaterialType.NoteToken).player(player)
  for (const index of notes.getIndexes()) {
    const beat = notes.getItem(index).location.x!
    rules.play(notes.index(index).moveItem({ type: LocationType.SheetMusic, player, id: lines[beat], x: beat }))
  }
  if (rameau !== undefined) {
    const note = notes.location((location) => location.x === rameau).getIndex()
    rules.play(rules.material(MaterialType.LutherieToken).id(player).location(LocationType.Reserve).limit(1).moveItem({ type: LocationType.OnNote, parent: note }))
  }
  return new SheetMusic(rules, player)
}

describe('Prerequisites of a musician [H13]', () => {
  it('lets a violin of a higher Prestige stand for a violin of a lower Prestige', () => {
    // RULES p. 17: the Troubadour n°51 (5 violins of Prestige 1) placed with 2 violins of Prestige 1 and 3 of Prestige 2.
    expect(prerequisitesMet([2, 3, 0, 0], [5, 0, 0, 0])).toBe(true)
    // 1-2-1-0 met by 2 violins of Prestige 2 and 2 of Prestige 3.
    expect(prerequisitesMet([0, 2, 2, 0], [1, 2, 1, 0])).toBe(true)
  })

  it('counts each violin once', () => {
    expect(prerequisitesMet([0, 3, 0, 0], [1, 3, 0, 0])).toBe(false)
    expect(prerequisitesMet([4, 0, 0, 0], [0, 1, 0, 0])).toBe(false)
  })
})

describe('Sheet music', () => {
  it('groups consecutive notes on the same line into one action (RULES p. 9)', () => {
    // RULES p. 9 example: Study, Study, Wood, Crafting, Crafting, Wood, Restoration
    const sheet = withSheetMusic([Study, Study, Wood, Crafting, Crafting, Wood, Restoration])
    expect(sheet.actions.map(({ action, time }) => [action, time])).toEqual([
      [Study, 2],
      [Wood, 1],
      [Crafting, 2],
      [Wood, 1],
      [Restoration, 1]
    ])
  })

  it('gives 3 beats to the action of the Rameau token, or more if it already has more notes [H12]', () => {
    expect(withSheetMusic([Wood, Study, Study, Study, Study, Crafting, Relation], 0).actions[0].time).toBe(3)
    expect(withSheetMusic([Wood, Study, Study, Study, Study, Crafting, Relation], 2).actions[1].time).toBe(4)
  })

  it('finds the 3 actions of an apprentice, whatever their time, without looping from the end to the start [H11]', () => {
    const sheet = withSheetMusic([Relation, Restoration, Wood, Wood, Study, Relation, Crafting])
    // RULES p. 16 example: apprentices n°11 (Restoration, Wood, Study) and n°28 (Wood, Study, Relation)
    expect(sheet.hasPattern([Restoration, Wood, Study])).toBe(true)
    expect(sheet.hasPattern([Wood, Study, Relation])).toBe(true)
    expect(sheet.hasPattern([Crafting, Relation, Restoration])).toBe(false)
  })

  it('treats Wood and Restoration as neighbour lines, and the first and last beats as neighbour notes (RULES p. 9)', () => {
    const sheet = withSheetMusic([Restoration, Study, Wood, Study, Crafting, Relation, Wood])
    const lineOf = (moves: [number, Action, number][], beat: number) => moves.find(([, , x]) => x === beat)![1]
    expect(lineOf(sheet.apply({ type: NoteMoveType.Up, beat: 0 }), 0)).toBe(Wood)
    expect(lineOf(sheet.apply({ type: NoteMoveType.Down, beat: 2 }), 2)).toBe(Restoration)
    const swap = sheet.apply({ type: NoteMoveType.Swap, beat: 6 })
    expect([lineOf(swap, 0), lineOf(swap, 6)]).toEqual([Wood, Restoration])
    const shift = sheet.apply({ type: NoteMoveType.ShiftLeft })
    expect(lineOf(shift, 6)).toBe(Restoration)
    expect(lineOf(shift, 0)).toBe(Study)
  })
})

describe('Relation apprentices at the end of the game (RULES p. 18)', () => {
  it('assigns each card of the hand to one apprentice at most, 4 cards each, the best way', () => {
    // n°56 counts Crafting or Restoration, n°58 Crafting or Wood: the Wood card can only go to n°58.
    expect(relationPoints([31, 32, 33, 34, 1], [56, 58])).toEqual({ 56: 4, 58: 1 })
    expect(relationPoints([31, 61, 62, 63, 64, 65], [56, 59])).toEqual({ 56: 4, 59: 2 })
    expect(relationPoints([16, 17], [56])).toEqual({ 56: 0 })
  })
})
