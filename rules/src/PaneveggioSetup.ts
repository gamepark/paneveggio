import { MaterialGameSetup } from '@gamepark/rules-api'
import { range, sample, shuffle } from 'es-toolkit'
import { firstGameMasterMoves, startingDeckMoves } from './logic/StartingDecks'
import { actions } from './material/Action'
import { characterCards, startingMusicians } from './material/CharacterCard'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { Memory } from './material/Memory'
import { startingDecks } from './material/StartingDeck'
import { DeckDistribution, PaneveggioOptions, SetupMode } from './PaneveggioOptions'
import { PaneveggioRules } from './PaneveggioRules'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'
import { task } from './rules/Task'

/** RULES p. 3 and decision H1: per player. */
export const VIOLIN_TOKENS = 12
export const LUTHERIE_TOKENS = 14
/** RULES p. 5: Mulligan 10 cards, Draft 8 cards. */
export const MULLIGAN_DEAL = 10
export const DRAFT_DEAL = 8

/**
 * This class creates a new Game based on the game options (RULES p. 5 and 6, decision D1 on BGA).
 */
export class PaneveggioSetup extends MaterialGameSetup<PlayerColor, MaterialType, LocationType, PaneveggioOptions, RuleId> {
  Rules = PaneveggioRules

  setupMaterial(options: PaneveggioOptions) {
    for (const player of this.players) this.setupTokens(player)
    this.material(MaterialType.FirstPlayerCard).createItem({ location: { type: LocationType.FirstPlayer, player: this.players[0] } })
    const mode = options.setup ?? SetupMode.StartingDecks
    if (mode === SetupMode.StartingDecks) {
      this.setupDeck(characterCards)
      if (options.decks === DeckDistribution.PlayersChoose) {
        this.material(MaterialType.StartingCard).createItems(actions.map((id) => ({ id, location: { type: LocationType.StartingCards } })))
      } else {
        this.setupRandomDecks()
      }
      return
    }
    // "Placez, à proximité du plateau Maître Luthier, les 5 musiciens de départ" (RULES p. 5)
    this.material(MaterialType.CharacterCard).createItems(startingMusicians.map((id) => ({ id, location: { type: LocationType.StartingMusicians } })))
    this.setupDeck(characterCards.filter((id) => !startingMusicians.includes(id)))
    const deck = this.material(MaterialType.CharacterCard).location(LocationType.Deck).deck()
    for (const player of this.players) {
      if (mode === SetupMode.Mulligan) deck.deal({ type: LocationType.PlayerHand, player }, MULLIGAN_DEAL)
      else deck.deal({ type: LocationType.DraftPacket, player }, DRAFT_DEAL)
    }
  }

  /** "Chacun commence avec 1 jeton Lutherie dans sa zone Ducats" (RULES p. 5); every other token in reserve. */
  setupTokens(player: PlayerColor) {
    this.material(MaterialType.ViolinToken).createItems(range(VIOLIN_TOKENS).map(() => ({ id: player, location: { type: LocationType.Reserve, player } })))
    this.material(MaterialType.LutherieToken).createItem({ id: player, location: { type: LocationType.Ducats, player } })
    this.material(MaterialType.LutherieToken).createItems(range(LUTHERIE_TOKENS - 1).map(() => ({ id: player, location: { type: LocationType.Reserve, player } })))
  }

  /** "Les cartes Personnage sont mélangées puis placées faces cachées pour former une pioche centrale" (RULES p. 6) */
  setupDeck(cards: number[]) {
    this.material(MaterialType.CharacterCard).createItems(cards.map((id) => ({ id, location: { type: LocationType.Deck } })))
    this.material(MaterialType.CharacterCard).location(LocationType.Deck).shuffle()
  }

  /** [H19] each player gets a different starting deck drawn at random; the Master Luthier board of a first game. */
  setupRandomDecks() {
    const decks = shuffle(actions)
    this.players.forEach((player, index) => startingDeckMoves(this, player, startingDecks[decks[index]]))
    firstGameMasterMoves(this, startingDecks[sample(decks.slice(this.players.length))].musician)
  }

  /** "Le premier joueur est désigné au hasard": on Game Park, the seats are random, so the first seat starts. */
  start(options: PaneveggioOptions) {
    const mode = options.setup ?? SetupMode.StartingDecks
    if (mode === SetupMode.Mulligan) return this.startSimultaneousRule(RuleId.Mulligan)
    if (mode === SetupMode.Draft) return this.startSimultaneousRule(RuleId.Draft)
    if (options.decks === DeckDistribution.PlayersChoose) {
      // [H19] counterclockwise from the last player: the first player chooses last.
      return this.startPlayerTurn(RuleId.ChooseStartingDeck, this.players[this.players.length - 1])
    }
    const first = this.players[0]
    this.memorize(Memory.Tasks, [task(RuleId.SpreadReturnedTokens, first, {}, true), task(RuleId.SheetMusic, first, {}, true)])
    this.startPlayerTurn(RuleId.SpreadReturnedTokens, first)
  }
}
