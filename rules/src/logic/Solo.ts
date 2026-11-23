import { getEnumValues, MaterialGame, MaterialMove, MaterialRulesPart } from '@gamepark/rules-api'
import { isMusician } from '../material/CharacterCard'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from '../material/Memory'
import { SoloLevel } from '../PaneveggioOptions'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'
import { GameMaterial } from './Table'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>
type Rules = MaterialRulesPart<PlayerColor, MaterialType, LocationType, RuleId>

/** Partners of Stradivarius: always 3 musicians (RULES p. 21). */
export const STRADIVARIUS_MUSICIANS = 3
export const MAX_ACTIVITY = 4
/** Forte: an apprentice costs him 2 studies [C11]. */
export const APPRENTICE_COST = 2

/**
 * Solo (RULES p. 21): "Jouez en solo contre le bot Stradivarius comme s'il s'agissait d'une partie à 2 joueurs." He has no
 * seat on the platform: his color is the first one the player did not take, his tokens and cards are on the table like
 * those of a player, and his turns are played automatically.
 */
export const stradivarius = (game: Pick<MaterialGame, 'players'>): PlayerColor | undefined =>
  game.players.length === 1 ? getEnumValues(PlayerColor).find((color) => color !== game.players[0]) : undefined

export const isSolo = (game: Pick<MaterialGame, 'players'>) => game.players.length === 1

export const soloLevel = (rules: Pick<Rules, 'remind'>): SoloLevel => rules.remind<SoloLevel | undefined>(Memory.SoloLevel) ?? SoloLevel.Pianissimo

/** "Stradivarius joue en premier", except at the Fortissimo: "Vous commencez la partie" (RULES p. 21 and 24). */
export const stradivariusFirst = (rules: Pick<Rules, 'remind'>) => soloLevel(rules) !== SoloLevel.Fortissimo

/** The order of play: the players, or in solo Stradivarius and the player. */
export const turnOrder = (rules: Pick<Rules, 'game' | 'remind'>): PlayerColor[] => {
  const bot = stradivarius(rules.game)
  if (bot === undefined) return rules.game.players
  return stradivariusFirst(rules) ? [bot, rules.game.players[0]] : [rules.game.players[0], bot]
}

/** His level of activity: the place of the Note token on his track (RULES p. 21). */
export const activityLevel = (game: GameMaterial, bot: PlayerColor): number =>
  (game.material(MaterialType.NoteToken).location(LocationType.ActivityTrack).player(bot).getItem()?.location.x as number | undefined) ?? 1

/**
 * The draw pile while the moves of a step are computed: the cards drawn are taken out of it, the cards put under it go
 * to its bottom, so that the next draws of the same step see the pile as it will be. The top card is the highest x.
 */
export class DeckDraw {
  /** The indexes of the cards of the draw pile, from the top. */
  private readonly order: number[]
  private moves: Move[] = []

  constructor(private readonly game: GameMaterial) {
    this.order = game
      .material(MaterialType.CharacterCard)
      .location(LocationType.Deck)
      .sort((item) => -(item.location.x ?? 0))
      .getIndexes()
  }

  /** The moves of the cards put under the pile since the last call: to play before the move of the card found. */
  flush(): Move[] {
    const moves = this.moves
    this.moves = []
    return moves
  }

  get cards() {
    return this.game.material(MaterialType.CharacterCard)
  }

  cardId(index: number): number {
    return this.cards.getItem<number>(index).id
  }

  /** The top card, taken out of the pile: the caller moves it. */
  takeTop(): number | undefined {
    return this.order.shift()
  }

  /** The first card from the top that fits, taken out of the pile without moving the others. */
  takeFirst(accept: (card: number) => boolean): number | undefined {
    const position = this.order.findIndex((index) => accept(this.cardId(index)))
    if (position < 0) return undefined
    return this.order.splice(position, 1)[0]
  }

  /**
   * "Piochez jusqu'à trouver" a musician that fits: the cards drawn before it go back under the pile, in order [S15].
   * Nothing changes when none fits.
   */
  drawMusician(accept: (card: number) => boolean): number | undefined {
    const position = this.order.findIndex((index) => isMusician(this.cardId(index)) && accept(this.cardId(index)))
    if (position < 0) return undefined
    const skipped = this.order.splice(0, position)
    const found = this.order.shift()!
    for (const index of skipped) this.putUnder(index)
    return found
  }

  /** A card under the pile (the pairs of the Piano, the cards drawn before a musician) [S15]. */
  putUnder(index: number) {
    this.moves.push(this.cards.index(index).moveItem({ type: LocationType.Deck, x: 0 }))
    this.order.push(index)
  }
}
