import { range } from 'es-toolkit'
import { Action } from './Action'

/**
 * The 75 Character cards, numbered as printed, 1 to 75 (ASSETS.md of the BGA adaptation).
 * Each action has 15 cards in a row: 10 musicians, then 5 apprentices.
 * The 10 musicians have, in that order, Prestige 1, then 3 × Prestige 2, 3 × Prestige 3 and 3 × Prestige 4.
 */
export const characterCards: number[] = range(1, 76)

const CARDS_PER_ACTION = 15
const MUSICIANS_PER_ACTION = 10

const rank = (card: number) => (card - 1) % CARDS_PER_ACTION

/** The action the card is affiliated to (icon on the top left, color of the banner). */
export const getAffiliation = (card: number): Action => Math.ceil(card / CARDS_PER_ACTION)

export const isApprentice = (card: number) => rank(card) >= MUSICIANS_PER_ACTION

export const isMusician = (card: number) => !isApprentice(card)

/** Prestige of a musician, 1 to 4 (dots on the red line on the top right). */
export const getPrestige = (card: number): number => {
  const r = rank(card)
  return r === 0 ? 1 : Math.ceil(r / 3) + 1
}
