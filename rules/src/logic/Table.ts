import { Material, MaterialItem } from '@gamepark/rules-api'
import { getPrestige, isApprentice, isMusician, musicians } from '../material/CharacterCard'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'

/** What the logic needs from the rules: the material. A rules part, the main rules class or the setup all have it. */
export type GameMaterial = { material(type: MaterialType): Material<PlayerColor, MaterialType, LocationType> }

export const MAX_QUALITY = 4
export const HAND_LIMIT = 10
export const MAX_APPRENTICES = 6

/**
 * Read-only questions about the table: tokens, woods and violins, cards. Every count is computed from the items,
 * nothing is memorised (the 14 Lutherie and 12 Violin tokens of each player are always somewhere on the table).
 */
export class Table {
  constructor(private readonly game: GameMaterial) {}

  // ------------------------------------------------------------------ Lutherie tokens

  get lutheries() {
    return this.game.material(MaterialType.LutherieToken)
  }

  reserve(player: PlayerColor) {
    return this.lutheries.location(LocationType.Reserve).player(player)
  }

  ducats(player: PlayerColor) {
    return this.lutheries.location(LocationType.Ducats).player(player)
  }

  studies(player: PlayerColor) {
    return this.lutheries.location(LocationType.Studies).player(player)
  }

  returnedTokens(player: PlayerColor) {
    return this.lutheries.location(LocationType.ReturnedTokens).player(player)
  }

  /** The tokens of a player blocked on the help area of the Master Luthier (−1 PP each). */
  helpTokens(player: PlayerColor) {
    return this.lutheries.location(LocationType.HelpArea).id(player)
  }

  /** Lutherie tokens on a pile (wood or violin), from the lowest to the top. */
  tokensOn(violin: number) {
    return this.lutheries.location(LocationType.OnViolin).parent(violin).sort((item) => item.location.x!)
  }

  /** The top Lutherie token of a pile, if any. */
  topToken(violin: number) {
    return this.lutheries.location(LocationType.OnViolin).parent(violin).maxBy((item) => item.location.x!)
  }

  // ------------------------------------------------------------------ Violin tokens: woods and violins

  get violins() {
    return this.game.material(MaterialType.ViolinToken)
  }

  violinReserve(player: PlayerColor) {
    return this.violins.location(LocationType.Reserve).player(player)
  }

  woods(player: PlayerColor) {
    return this.violins.location(LocationType.WoodStock).player(player)
  }

  /** Quality of a pile: the Violin token and its Lutherie tokens (4 at most). */
  quality(violin: number) {
    return 1 + this.lutheries.location(LocationType.OnViolin).parent(violin).length
  }

  /** The violins crafted on musicians, of any player. */
  get violinsOnCards() {
    return this.violins.location(LocationType.MusicianSlot)
  }

  violinsOnCard(card: number) {
    return this.violinsOnCards.parent(card)
  }

  heritage(player: PlayerColor) {
    return this.violins.location(LocationType.Heritage).player(player)
  }

  /** Prestige of a violin: the one of its musician, or the space of the Heritage. */
  prestige(violin: number) {
    const item = this.violins.getItem(violin)
    if (item.location.type === LocationType.Heritage) return item.location.id as number
    return getPrestige(this.cards.getItem<number>(item.location.parent!).id)
  }

  /** The violins a player crafted: in their Heritage or on any musician. */
  madeViolins(player: PlayerColor) {
    return this.violins.id(player).location((location) => location.type === LocationType.Heritage || location.type === LocationType.MusicianSlot)
  }

  /** Number of violins crafted by a player, by Prestige 1 to 4 (index 0 to 3). */
  madeViolinsByPrestige(player: PlayerColor): number[] {
    const count = [0, 0, 0, 0]
    for (const index of this.madeViolins(player).getIndexes()) {
      count[this.prestige(index) - 1]++
    }
    return count
  }

  /** Does the player have a token on this card: one of their violins, or one of their Lutherie tokens on a violin? */
  hasTokenOnCard(player: PlayerColor, card: number) {
    return this.violinsOnCard(card)
      .getIndexes()
      .some((violin) => this.violins.getItem(violin).id === player || this.tokensOn(violin).id(player).length > 0)
  }

  // ------------------------------------------------------------------ cards

  get cards() {
    return this.game.material(MaterialType.CharacterCard)
  }

  hand(player: PlayerColor) {
    return this.cards.location(LocationType.PlayerHand).player(player)
  }

  partnerMusicians(player: PlayerColor) {
    return this.cards.location(LocationType.PartnerMusicians).player(player)
  }

  partnerApprentices(player: PlayerColor) {
    return this.cards.location(LocationType.PartnerApprentices).player(player)
  }

  /** The musicians violins can be crafted on: the partners of every player and the 4 of the Master Luthier. */
  get musiciansInPlay() {
    return this.cards.location((location) => location.type === LocationType.PartnerMusicians || location.type === LocationType.MasterMusician)
  }

  cardId(index: number): number {
    return this.cards.getItem<number>(index).id
  }

  /** The free violin slots of a musician card. */
  freeSlots(card: number): number[] {
    const id = this.cardId(card)
    const taken = new Set(this.violinsOnCard(card).getItems().map((violin) => violin.location.id))
    return (musicians[id]?.slots ?? []).map((_, slot) => slot).filter((slot) => !taken.has(slot))
  }

  contactPile(player: PlayerColor, pile: number) {
    return this.cards.location(LocationType.Contacts).player(player).locationId(pile)
  }

  /** The visible card of a pile of Contacts (x = 0). */
  contactTop(player: PlayerColor, pile: number) {
    return this.contactPile(player, pile).location((location) => location.x === 0)
  }

  get deck() {
    return this.cards.location(LocationType.Deck)
  }
}

export const isMusicianItem = (item: MaterialItem<PlayerColor, LocationType, number>) => isMusician(item.id)
export const isApprenticeItem = (item: MaterialItem<PlayerColor, LocationType, number>) => isApprentice(item.id)
