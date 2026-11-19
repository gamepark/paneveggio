import { range } from 'es-toolkit'
import { Action } from './Action'
import { SlotBonus } from './SlotBonus'

/**
 * The 75 Character cards, numbered as printed, 1 to 75 (card by card survey: ASSETS.md of the BGA adaptation).
 * Each action has 15 cards in a row: 10 musicians, then 5 apprentices.
 */
export const characterCards: number[] = range(1, 76)

const { Wood, Study, Crafting, Relation, Restoration } = Action
const { Place, Draw, Study: S, Quality: Q, Ducat: D } = SlotBonus

export type Musician = {
  prestige: number
  /** Minimum number of violins of Prestige 1, 2, 3, 4 (the printed column read from bottom to top, RULES p. 17). */
  prerequisites: [number, number, number, number]
  /** Time of the Relation effect (1 to 3), or undefined for an end of turn effect (‖). */
  relation?: number
  /** Violin slots, from top to bottom. */
  slots: SlotBonus[]
}

export type Apprentice = {
  /** The 3 consecutive actions the sheet music must show to train the apprentice (RULES p. 16). */
  pattern: [Action, Action, Action]
  /** Relation apprentices: the types of cards spent at the end of the game (RULES p. 18). */
  endGameActions?: [Action, Action]
}

const m = (prestige: number, prerequisites: Musician['prerequisites'], relation: number | undefined, slots: SlotBonus[]): Musician => ({
  prestige,
  prerequisites,
  relation,
  slots
})
const FT = undefined

export const musicians: Record<number, Musician> = {
  1: m(1, [0, 0, 0, 0], 1, [Place, Q, D]),
  2: m(2, [0, 1, 0, 0], 2, [S, Q, D]),
  3: m(2, [2, 0, 0, 0], 2, [S, Q, D, D]),
  4: m(2, [3, 0, 0, 0], 2, [S, Q, D, D]),
  5: m(3, [2, 3, 0, 0], 3, [S, Q, Q, D]),
  6: m(3, [3, 2, 0, 0], FT, [S, Q, Q, D]),
  7: m(3, [3, 3, 0, 0], FT, [S, Q, D]),
  8: m(4, [0, 0, 0, 0], FT, [Q]), // Vivaldi
  9: m(4, [3, 3, 2, 0], FT, [Q]), // Tessarini
  10: m(4, [3, 3, 0, 0], FT, [Q]), // Somis

  16: m(1, [0, 0, 0, 0], 1, [Place, S, D]),
  17: m(2, [0, 1, 0, 0], 2, [Place, S, D]),
  18: m(2, [2, 0, 0, 0], 2, [Place, S, Q, D]),
  19: m(2, [0, 1, 0, 0], 2, [Place, S, Q, D]),
  20: m(3, [3, 3, 0, 0], 3, [Place, S, S, Q, D]),
  21: m(3, [2, 3, 0, 0], 3, [S, Q]),
  22: m(3, [2, 2, 1, 0], FT, [Place, S, Q, Q]),
  23: m(4, [2, 2, 2, 0], FT, [S]), // Rameau
  24: m(4, [1, 1, 1, 0], FT, [S]), // Tartini
  25: m(4, [3, 2, 0, 0], FT, [S]), // Bach

  31: m(1, [0, 0, 0, 0], 1, [Place, Draw, D]),
  32: m(2, [1, 0, 0, 0], 2, [Place, S]),
  33: m(2, [3, 0, 0, 0], 2, [Place, Place, Draw, S]),
  34: m(2, [2, 0, 0, 0], 2, [Place, Draw, S]),
  35: m(3, [2, 2, 0, 0], 3, [Place, Draw, S]),
  36: m(3, [3, 2, 0, 0], FT, [Place, Place, Draw, S]),
  37: m(3, [3, 2, 1, 0], FT, [Place, Draw, S]),
  38: m(4, [2, 2, 2, 2], FT, [Place, Draw]), // Veracini
  39: m(4, [3, 4, 0, 0], FT, [Place]), // Senaillé
  40: m(4, [0, 1, 1, 1], FT, [Place]), // Leclair

  46: m(1, [0, 0, 0, 0], 1, [Place, Draw, D]),
  47: m(2, [0, 1, 0, 0], 2, [Place, Draw, D]),
  48: m(2, [2, 0, 0, 0], 2, [Place, Draw, Draw, D]),
  49: m(2, [4, 0, 0, 0], 2, [Place, Draw, D]),
  50: m(3, [3, 1, 1, 0], 3, [Place, Draw, D]),
  51: m(3, [5, 0, 0, 0], 3, [Place, Draw, Draw, D]),
  52: m(3, [3, 2, 0, 0], 3, [Place, Draw, D]),
  53: m(4, [3, 3, 2, 0], FT, [Draw]), // Bonporti
  54: m(4, [0, 2, 2, 1], FT, [Draw]), // Mascitti
  55: m(4, [3, 2, 0, 0], FT, [Draw]), // Pisendel

  61: m(1, [0, 0, 0, 0], 1, [Draw, Q, D]),
  62: m(2, [2, 0, 0, 0], 2, [Draw, Q, D]),
  63: m(2, [0, 1, 0, 0], 2, [Draw, Q, D]),
  64: m(2, [3, 0, 0, 0], 2, [Place, Draw, Q, D]),
  65: m(3, [3, 3, 0, 0], 3, [Place, Draw, Q, D]),
  66: m(3, [2, 4, 0, 0], FT, [Place, Draw, Q, D]),
  67: m(3, [0, 2, 1, 0], 3, [Place, Draw, S, Q, D]),
  68: m(4, [3, 2, 2, 0], FT, [D]), // Dall'Abaco
  69: m(4, [3, 2, 0, 0], FT, [D]), // Albinoni
  70: m(4, [3, 2, 1, 0], FT, [D]) // Geminiani
}

export const apprentices: Record<number, Apprentice> = {
  11: { pattern: [Restoration, Wood, Study] },
  12: { pattern: [Relation, Wood, Study] },
  13: { pattern: [Restoration, Wood, Crafting] },
  14: { pattern: [Study, Wood, Restoration] },
  15: { pattern: [Crafting, Wood, Relation] },

  26: { pattern: [Wood, Study, Crafting] },
  27: { pattern: [Restoration, Study, Crafting] },
  28: { pattern: [Wood, Study, Relation] },
  29: { pattern: [Crafting, Study, Wood] },
  30: { pattern: [Relation, Study, Restoration] },

  41: { pattern: [Study, Crafting, Relation] },
  42: { pattern: [Wood, Crafting, Relation] },
  43: { pattern: [Study, Crafting, Restoration] },
  44: { pattern: [Relation, Crafting, Study] },
  45: { pattern: [Restoration, Crafting, Wood] },

  56: { pattern: [Crafting, Relation, Restoration], endGameActions: [Crafting, Restoration] },
  57: { pattern: [Study, Relation, Restoration], endGameActions: [Study, Restoration] },
  58: { pattern: [Crafting, Relation, Wood], endGameActions: [Crafting, Wood] },
  59: { pattern: [Restoration, Relation, Crafting], endGameActions: [Crafting, Restoration] },
  60: { pattern: [Wood, Relation, Study], endGameActions: [Wood, Study] },

  71: { pattern: [Relation, Restoration, Wood] },
  72: { pattern: [Crafting, Restoration, Wood] },
  73: { pattern: [Relation, Restoration, Study] },
  74: { pattern: [Wood, Restoration, Relation] },
  75: { pattern: [Study, Restoration, Crafting] }
}

const CARDS_PER_ACTION = 15

/** The action the card is affiliated to (icon on the top left, color of the banner). */
export const getAffiliation = (card: number): Action => Math.ceil(card / CARDS_PER_ACTION)

export const isApprentice = (card: number) => card in apprentices

export const isMusician = (card: number) => card in musicians

/** Prestige of a musician, 1 to 4 (dots on the red line on the top right). 0 for an apprentice. */
export const getPrestige = (card: number): number => musicians[card]?.prestige ?? 0

/** Number of violin slots of a card (0 for an apprentice). */
export const countSlots = (card: number): number => musicians[card]?.slots.length ?? 0

/** The 5 starting musicians, of Prestige 1 (RULES p. 5). */
export const startingMusicians = [1, 16, 31, 46, 61]
