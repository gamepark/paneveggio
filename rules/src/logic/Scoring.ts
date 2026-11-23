import { Action } from '../material/Action'
import { apprentices, getAffiliation } from '../material/CharacterCard'
import { LocationType } from '../material/LocationType'
import { PlayerColor } from '../PlayerColor'
import { stradivarius } from './Solo'
import { GameMaterial, Table } from './Table'

/** Elements spent at most by each Wood, Relation and Restoration apprentice (RULES p. 18). */
const PER_APPRENTICE = 4
/** Crafting apprentice: 3/2/1 PP for 12/11/10 violins [H9]. */
const craftingPoints = (violins: number) => (violins >= 12 ? 3 : violins === 11 ? 2 : violins === 10 ? 1 : 0)

export type Score = {
  /** Prestige of the violins in Heritage and on musicians. */
  violins: number
  /** PP of each apprentice, by card number. */
  apprentices: Record<number, number>
  /** Solo, Stradivarius: half of his ducats, studies and cards of his line of Contacts left, rounded down. */
  leftovers?: number
  /** −1 PP per token on the help area. */
  help: number
  total: number
}

/**
 * Final scoring (RULES p. 18), always the best for the player (BGA, DESIGN § 7): the end of game spendings of the
 * apprentices are computed, nothing is asked.
 */
export const computeScore = (game: GameMaterial, player: PlayerColor): Score => {
  const table = new Table(game)
  const violins = table
    .madeViolins(player)
    .getIndexes()
    .reduce((sum, violin) => sum + table.prestige(violin), 0)
  const cards = table
    .partnerApprentices(player)
    .getItems<number>()
    .map((item) => item.id)
  const of = (action: Action) => cards.filter((card) => getAffiliation(card) === action)
  const points: Record<number, number> = {}

  // Wood: "Dépensez jusqu'à 4 jetons Lutherie en provenance des violons actifs sur les musiciens ou des Bois en stock."
  // [H18] only the tokens of the player on their own woods and violins; several apprentices share them.
  let pool = table.violins
    .id(player)
    .location((location) => location.type === LocationType.WoodStock || location.type === LocationType.MusicianSlot)
    .getIndexes()
    .reduce((sum, violin) => sum + table.tokensOn(violin).id(player).length, 0)
  for (const card of of(Action.Wood)) {
    points[card] = Math.min(PER_APPRENTICE, pool)
    pool -= points[card]
  }
  // Study: "Gagnez 1 PP pour chaque type différent d'apprenti autre que Étude que le joueur a posé."
  const otherTypes = new Set(cards.map(getAffiliation).filter((action) => action !== Action.Study)).size
  for (const card of of(Action.Study)) points[card] = otherTypes
  // Crafting: violins in Heritage and on musicians [H9].
  const made = table.madeViolins(player).length
  for (const card of of(Action.Crafting)) points[card] = craftingPoints(made)
  // Relation: up to 4 cards in hand of the types of the apprentice, each card counting once (best assignment).
  Object.assign(points, relationPoints(table.hand(player).getItems<number>().map((item) => item.id), of(Action.Relation)))
  // Restoration: up to 4 ducats and/or studies (the tokens given back and not spread yet included, D2).
  pool = table.ducats(player).length + table.studies(player).length + table.returnedTokens(player).length
  for (const card of of(Action.Restoration)) {
    points[card] = Math.min(PER_APPRENTICE, pool)
    pool -= points[card]
  }

  const help = table.helpTokens(player).length
  const total = violins + Object.values(points).reduce((sum, value) => sum + value, 0) - help
  return { violins, apprentices: points, help, total }
}

/**
 * Best assignment of the cards of the hand to the Relation apprentices (at most 4 each, a card counting once): maximum
 * flow by augmenting paths.
 */
export const relationPoints = (hand: number[], relationApprentices: number[]): Record<number, number> => {
  const assigned: Record<number, number[]> = Object.fromEntries(relationApprentices.map((card) => [card, []]))
  const augment = (card: number, visited: Set<number>): boolean => {
    for (const apprentice of relationApprentices) {
      if (visited.has(apprentice) || !apprentices[apprentice].endGameActions!.includes(getAffiliation(card))) continue
      visited.add(apprentice)
      if (assigned[apprentice].length < PER_APPRENTICE) {
        assigned[apprentice].push(card)
        return true
      }
      for (let i = 0; i < assigned[apprentice].length; i++) {
        if (augment(assigned[apprentice][i], visited)) {
          assigned[apprentice][i] = card
          return true
        }
      }
    }
    return false
  }
  for (const card of hand) augment(card, new Set())
  return Object.fromEntries(relationApprentices.map((card) => [card, assigned[card].length]))
}

/**
 * Score shown during the game (decision D6, 09/11/2026): the Prestige of the violins minus the help tokens. The points
 * of the apprentices only count at the final scoring, which replaces it.
 */
export const currentScore = (game: GameMaterial, player: PlayerColor): number => {
  const table = new Table(game)
  const violins = table
    .madeViolins(player)
    .getIndexes()
    .reduce((sum, violin) => sum + table.prestige(violin), 0)
  return violins - table.helpTokens(player).length
}

/**
 * Score of Stradivarius (RULES p. 23, misc/docs/SOLO.md): "Points de Prestige des violons (musiciens Partenaire et
 * Patrimoine). Comptez Ducats, Études et Cartes dans la ligne de Contacts puis divisez par 2" (rounded down [C11]), minus
 * 1 PP per token on the help area [C11]. Forte: his apprentices first spend what they count [S12], a Relation
 * apprentice counting every card of his line, whatever its type (RULES p. 24).
 */
export const stradivariusScore = (game: GameMaterial, bot: PlayerColor): Score => {
  const table = new Table(game)
  const violins = table
    .madeViolins(bot)
    .getIndexes()
    .reduce((sum, violin) => sum + table.prestige(violin), 0)
  const cards = table
    .partnerApprentices(bot)
    .getItems<number>()
    .map((item) => item.id)
  const of = (action: Action) => cards.filter((card) => getAffiliation(card) === action)
  const points: Record<number, number> = {}
  let pool = table.violins
    .id(bot)
    .location(LocationType.MusicianSlot)
    .getIndexes()
    .reduce((sum, violin) => sum + table.tokensOn(violin).id(bot).length, 0)
  for (const card of of(Action.Wood)) {
    points[card] = Math.min(PER_APPRENTICE, pool)
    pool -= points[card]
  }
  const otherTypes = new Set(cards.map(getAffiliation).filter((action) => action !== Action.Study)).size
  for (const card of of(Action.Study)) points[card] = otherTypes
  const made = table.madeViolins(bot).length
  for (const card of of(Action.Crafting)) points[card] = craftingPoints(made)
  let contacts = table.cards.location(LocationType.StradivariusContacts).player(bot).length
  for (const card of of(Action.Relation)) {
    points[card] = Math.min(PER_APPRENTICE, contacts)
    contacts -= points[card]
  }
  let tokens = table.ducats(bot).length + table.studies(bot).length + table.returnedTokens(bot).length
  for (const card of of(Action.Restoration)) {
    points[card] = Math.min(PER_APPRENTICE, tokens)
    tokens -= points[card]
  }
  const leftovers = Math.floor((tokens + contacts) / 2)
  const help = table.helpTokens(bot).length
  const total = violins + Object.values(points).reduce((sum, value) => sum + value, 0) + leftovers - help
  return { violins, apprentices: points, leftovers, help, total }
}

/**
 * Solo: the player wins with more PP than Stradivarius; on a tie, more violins crafted, then more partner apprentices
 * [S13]; a perfect tie is no victory [S17].
 */
export const soloWon = (game: GameMaterial & { game: { players: PlayerColor[] } }): boolean => {
  const bot = stradivarius(game.game)!
  const player = game.game.players[0]
  const table = new Table(game)
  const mine = [computeScore(game, player).total, table.madeViolins(player).length, table.partnerApprentices(player).length]
  const theirs = [stradivariusScore(game, bot).total, table.madeViolins(bot).length, table.partnerApprentices(bot).length]
  for (let i = 0; i < mine.length; i++) {
    if (mine[i] !== theirs[i]) return mine[i] > theirs[i]
  }
  return false
}
