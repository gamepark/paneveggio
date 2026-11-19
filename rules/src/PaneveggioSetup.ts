import { MaterialGameSetup } from '@gamepark/rules-api'
import { sample, shuffle } from 'es-toolkit'
import { PaneveggioOptions } from './PaneveggioOptions'
import { PaneveggioRules } from './PaneveggioRules'
import { Action, actions } from './material/Action'
import { characterCards } from './material/CharacterCard'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { firstGameMasterMusicians, StartingDeck, startingDecks } from './material/StartingDeck'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

/** RULES p. 3 and decision H1: per player. */
export const VIOLIN_TOKENS = 12
export const LUTHERIE_TOKENS = 14

/**
 * This class creates a new Game based on the game options.
 *
 * Setup with the starting decks (RULES p. 6, BGA option "Starting decks", the default one): everything is automatic.
 * The Mulligan and Draft setups (RULES p. 5) will come with the rules, as their own phases.
 */
export class PaneveggioSetup extends MaterialGameSetup<PlayerColor, MaterialType, LocationType, PaneveggioOptions> {
  Rules = PaneveggioRules

  setupMaterial(_options: PaneveggioOptions) {
    // [H19] each player gets a different starting deck, drawn at random.
    const decks = shuffle(actions)
    this.players.forEach((player, index) => this.setupPlayer(player, startingDecks[decks[index]]))
    this.setupMasterBoard(decks.slice(this.players.length))
    this.setupDeck()
    this.material(MaterialType.FirstPlayerCard).createItem({ location: { type: LocationType.FirstPlayer, player: this.players[0] } })
  }

  /**
   * "Chaque joueur choisit une carte de démarrage qui lui indique : le placement des 7 jetons Note sur sa partition,
   * 1 carte musicien de Prestige 1 à placer en zone Musiciens Partenaires, 3 cartes à prendre en main,
   * 4 cartes à placer dans la zone de Contacts. Enfin, chacun débute avec un jeton Lutherie en zone Ducats."
   */
  setupPlayer(player: PlayerColor, deck: StartingDeck) {
    this.material(MaterialType.NoteToken).createItems(
      deck.sheetMusic.map((action, beat) => ({ location: { type: LocationType.SheetMusic, player, id: action, x: beat } }))
    )
    const cards = this.material(MaterialType.CharacterCard)
    cards.createItem({ id: deck.musician, location: { type: LocationType.PartnerMusicians, player } })
    cards.createItems(deck.contacts.map((id, index) => ({ id, location: { type: LocationType.Contacts, player, id: index + 1 } })))
    cards.createItems(deck.hand.map((id) => ({ id, location: { type: LocationType.PlayerHand, player } })))
    this.material(MaterialType.ViolinToken).createItem({ id: player, quantity: VIOLIN_TOKENS, location: { type: LocationType.Reserve, player } })
    this.material(MaterialType.LutherieToken).createItem({ id: player, location: { type: LocationType.Ducats, player } })
    this.material(MaterialType.LutherieToken).createItem({ id: player, quantity: LUTHERIE_TOKENS - 1, location: { type: LocationType.Reserve, player } })
  }

  /**
   * Master Luthier board for a first game (RULES p. 6): a Prestige 1 musician taken from an unused starting deck,
   * then n°62, n°7 and n°69.
   */
  setupMasterBoard(unusedDecks: Action[]) {
    const musicians = { 1: startingDecks[sample(unusedDecks)].musician, ...firstGameMasterMusicians }
    this.material(MaterialType.CharacterCard).createItems(
      Object.entries(musicians).map(([slot, id]) => ({ id, location: { type: LocationType.MasterMusician, id: Number(slot) } }))
    )
  }

  /** "Les cartes Personnage sont mélangées puis placées faces cachées pour former une pioche centrale, y inclure les cartes des decks de démarrage non utilisés" */
  setupDeck() {
    const placed = new Set(this.material(MaterialType.CharacterCard).getItems().map((item) => item.id))
    this.material(MaterialType.CharacterCard).createItems(
      characterCards.filter((id) => !placed.has(id)).map((id) => ({ id, location: { type: LocationType.Deck } }))
    )
    this.material(MaterialType.CharacterCard).location(LocationType.Deck).shuffle()
  }

  /** "Le premier joueur est désigné au hasard": on Game Park, the seats are random, so the first seat starts. */
  start() {
    this.startPlayerTurn(RuleId.TheFirstStep, this.players[0])
  }
}
