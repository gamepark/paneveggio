import { Action } from './Action'

/**
 * A starting card (RULES p. 6, files 76 to 80): a ready-made sheet music, a Prestige 1 partner musician,
 * 4 cards for the Contacts and 3 cards in hand. Each deck is named after the action of its icon:
 * the 8 cards of the deck bear that icon before their number.
 */
export type StartingDeck = {
  /** The action of each beat, from the 1st to the 7th. */
  sheetMusic: Action[]
  musician: number
  contacts: number[]
  hand: number[]
}

const { Wood, Study, Crafting, Relation, Restoration } = Action

export const startingDecks: Record<Action, StartingDeck> = {
  [Wood]: {
    sheetMusic: [Wood, Wood, Study, Crafting, Wood, Relation, Restoration],
    musician: 1,
    contacts: [9, 20, 34, 58],
    hand: [4, 15, 64]
  },
  [Study]: {
    sheetMusic: [Relation, Wood, Study, Study, Crafting, Relation, Restoration],
    musician: 16,
    contacts: [25, 43, 48, 65],
    hand: [3, 26, 60]
  },
  [Crafting]: {
    sheetMusic: [Wood, Wood, Wood, Study, Crafting, Relation, Restoration],
    musician: 31,
    contacts: [6, 10, 51, 63],
    hand: [13, 18, 41]
  },
  [Relation]: {
    sheetMusic: [Wood, Relation, Crafting, Study, Relation, Restoration, Relation],
    musician: 46,
    contacts: [23, 36, 54, 71],
    hand: [2, 49, 57]
  },
  [Restoration]: {
    sheetMusic: [Study, Relation, Wood, Study, Crafting, Crafting, Restoration],
    musician: 61,
    contacts: [27, 40, 52, 67],
    hand: [12, 17, 32]
  }
}

/** Master Luthier board for a first game (RULES p. 6), slots 2 to 4. Slot 1 gets the musician of an unused starting deck. */
export const firstGameMasterMusicians: Record<number, number> = { 2: 62, 3: 7, 4: 69 }
