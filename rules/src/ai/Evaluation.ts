import { computeScore } from '../logic/Scoring'
import { SheetMusic } from '../logic/SheetMusic'
import { MAX_APPRENTICES, Table } from '../logic/Table'
import { apprentices, getPrestige, isApprentice, musicians } from '../material/CharacterCard'
import { LocationType } from '../material/LocationType'
import { Memory } from '../material/Memory'
import { PaneveggioRules } from '../PaneveggioRules'
import { PlayerColor } from '../PlayerColor'
import { prerequisitesMet } from '../rules/TaskRule'
import { VIOLINS_TO_END } from '../rules/EndTurnRule'
import { PaneveggioGame } from './Simulation'

/**
 * What the evaluation counts, in Prestige points (PP) at the end of the game: every weight has a meaning, and the arena
 * tunes them. The values of what will only pay later are multiplied by the part of the game still to play.
 */
export const evaluationSettings = {
  /**
   * Share of its Prestige a violin on a musician keeps, by number of Lutherie tokens on it: it loses one at the end of each
   * Workshop of its owner and breaks without any (RULES p. 14), unless a Conservation puts it in the Heritage first.
   */
  violinKept: [0.7, 0.85, 0.95, 1],
  /** A violin on a musician opens its Relation effect to its owner. */
  relationAccess: 0.3,
  /**
   * Every violin crafted, whatever its Prestige: a step towards the 12 that end the game, and Crafting apprentices count them.
   */
  madeViolin: 1,
  /** A wood in stock is a violin to come, better with its quality. */
  wood: 0.5,
  woodQuality: 0.4,
  /** The first ducat or study is worth this much, each next one a little less. */
  ducat: 0.4,
  study: 0.3,
  decay: 0.85,
  /**
   * A Lutherie token on the violin of an opponent comes back to its owner as a ducat or a study (D2), when the violin wears
   * out or goes to the Heritage: with the slot bonuses, the main source of ducats (Ludo, 20/11/2026).
   */
  lentToken: 0.25,
  /** A card in hand: a boost of an action, or a card to play. */
  card: 0.15,
  /** A musician of the hand whose prerequisites are met, by Prestige; an apprentice whose condition is met. */
  playableMusician: 0.35,
  playableApprentice: 1.5,
  /**
   * A slot of a partner musician, by Prestige: a place to craft a violin of that Prestige. Free or not, so that crafting
   * on it never looks like a loss (a free-slot count kept the bot from crafting, as measured).
   */
  partnerSlot: 0.12,
  /** A card that will be drawn from the draw pile, unknown. */
  drawnCard: 0.3,
  /** The part of the game still to play is never counted below this. */
  minRemaining: 0.15
}

/** How much a series of n resources is worth, each one a little less than the one before. */
const diminishing = (count: number, first: number) => {
  let value = 0
  let unit = first
  for (let index = 0; index < count; index++) {
    value += unit
    unit *= evaluationSettings.decay
  }
  return value
}

/**
 * The final score the player can expect from this position, in PP. It only reads what the player can see: their own hand,
 * and the table.
 */
export const evaluate = (game: PaneveggioGame, player: PlayerColor): number => {
  const settings = evaluationSettings
  const rules = new PaneveggioRules(game)
  const table = new Table(rules)
  const score = computeScore(rules, player)

  // The part of the game still to play: the game ends when a player has crafted their 12 violins.
  const progress = Math.max(...game.players.map((other) => table.madeViolins(other).length)) / VIOLINS_TO_END
  const remaining = Math.max(settings.minRemaining, 1 - progress)

  // Violins: in Heritage for sure, on a musician as long as they last.
  let violins = 0
  for (const violin of table.madeViolins(player).getIndexes()) {
    const prestige = table.prestige(violin)
    const item = table.violins.getItem(violin)
    if (item.location.type === LocationType.Heritage) {
      violins += prestige + settings.madeViolin
    } else {
      const tokens = table.tokensOn(violin).length
      violins += (prestige + settings.madeViolin) * settings.violinKept[Math.min(tokens, settings.violinKept.length - 1)] + settings.relationAccess * remaining
    }
  }
  const apprenticePoints = Object.values(score.apprentices).reduce((sum, points) => sum + points, 0)

  // What will turn into points later.
  const woods = table
    .woods(player)
    .getIndexes()
    .reduce((sum, wood) => sum + settings.wood + settings.woodQuality * (table.quality(wood) - 1), 0)
  const resources = diminishing(table.ducats(player).length, settings.ducat) + diminishing(table.studies(player).length, settings.study)
  let lent = 0
  for (const violin of table.violins.location(LocationType.MusicianSlot).getIndexes()) {
    if (table.violins.getItem(violin).id !== player) lent += table.tokensOn(violin).id(player).length * settings.lentToken
  }

  const made = table.madeViolinsByPrestige(player)
  const sheetMusic = new SheetMusic(rules, player)
  const trained = (rules.remind<number | undefined>(Memory.ApprenticesTrained, player) ?? 0) < MAX_APPRENTICES
  let hand = 0
  for (const card of table.hand(player).getItems<number>()) {
    hand += settings.card
    if (isApprentice(card.id)) {
      if (trained && sheetMusic.hasPattern(apprentices[card.id].pattern)) hand += settings.playableApprentice
    } else if (musicians[card.id] && prerequisitesMet(made, musicians[card.id].prerequisites)) {
      hand += settings.playableMusician * getPrestige(card.id)
    }
  }
  const slots = table
    .partnerMusicians(player)
    .getIndexes()
    .reduce((sum, card) => sum + (musicians[table.cardId(card)]?.slots.length ?? 0) * getPrestige(table.cardId(card)) * settings.partnerSlot, 0)

  return violins + apprenticePoints - score.help + remaining * (woods + resources + lent + hand + slots)
}
