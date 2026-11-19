import { CustomMove, isCreateItemType, isCustomMoveType, isMoveItemType, isShuffleItemType, ItemMove, MaterialMove, SimultaneousRule } from '@gamepark/rules-api'
import { firstGameMasterMoves, startingDeckMoves } from '../logic/StartingDecks'
import { Action, actions } from '../material/Action'
import { getAffiliation, getPrestige, isMusician } from '../material/CharacterCard'
import { CustomMoveType } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { startingDecks } from '../material/StartingDeck'
import { BEATS } from '../logic/SheetMusic'
import { Table } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { startTurn } from './StartTurn'
import { Move, PaneveggioTurnRule } from './TaskRule'

const KEEP = 7
const CONTACTS = 4
const PILES = [1, 2, 3, 4]

/**
 * Setup "Players choose" [H19]: "Chaque joueur choisit une carte de démarrage" (RULES p. 6), in turn, counterclockwise
 * from the last player (the first player chooses last). Then the Master Luthier board of a first game takes the
 * musician of an unused starting deck at random (the unused cards are shuffled first), and the first player starts.
 */
export class ChooseStartingDeckRule extends PaneveggioTurnRule {
  get available() {
    return this.material(MaterialType.StartingCard).location((location) => location.type === LocationType.StartingCards && location.player === undefined)
  }

  getPlayerMoves(): Move[] {
    return this.available.moveItems({ type: LocationType.StartingCards, player: this.player })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    const players = this.game.players
    if (isMoveItemType(MaterialType.StartingCard)(move)) {
      const index = players.indexOf(this.player)
      if (index > 0) return [this.startPlayerTurn(RuleId.ChooseStartingDeck, players[index - 1])]
      return [this.available.shuffle()]
    }
    if (isShuffleItemType(MaterialType.StartingCard)(move)) {
      const moves: Move[] = []
      for (const card of this.material(MaterialType.StartingCard).location(LocationType.StartingCards).getItems<Action>()) {
        if (card.location.player !== undefined) moves.push(...startingDeckMoves(this, card.location.player, startingDecks[card.id]))
      }
      const unused = this.available.maxBy((item) => item.location.x ?? 0).getItem<Action>()!.id
      moves.push(...firstGameMasterMoves(this, startingDecks[unused].musician))
      moves.push(this.material(MaterialType.StartingCard).deleteItemsAtOnce())
      return [...moves, ...startTurn(this, players[0])]
    }
    return []
  }
}

/**
 * Setup Mulligan, 1st part (RULES p. 5): "Distribuez à chaque joueur 10 cartes. Chacun peut 1 fois remettre sous la
 * pioche centrale autant de cartes qu'il souhaite de sa main et piocher le même nombre." The player puts cards under
 * the draw pile one at a time, then draws as many (or keeps all 10 cards).
 */
export class MulliganRule extends SimultaneousRule<PlayerColor, MaterialType, LocationType, RuleId> {
  getActivePlayerLegalMoves(player: PlayerColor): Move[] {
    return [
      ...new Table(this).hand(player).moveItems({ type: LocationType.Deck, x: 0 }),
      this.customMove(CustomMoveType.DrawCards, player)
    ]
  }

  onCustomMove(move: CustomMove): Move[] {
    if (!isCustomMoveType(CustomMoveType.DrawCards)(move)) return []
    const player = move.data as PlayerColor
    const missing = MULLIGAN_HAND - new Table(this).hand(player).length
    return [...new Table(this).deck.deck().deal({ type: LocationType.PlayerHand, player }, missing), this.endPlayerTurn(player)]
  }

  getMovesAfterPlayersDone(): Move[] {
    return [this.startSimultaneousRule(RuleId.KeepSeven)]
  }
}

const MULLIGAN_HAND = 10

/**
 * Setup Mulligan, 2nd part (RULES p. 5): "Parmi ces 10 cartes, chacun en choisit 7. Les autres sont placées sous la
 * pioche centrale. Lorsque tous les joueurs ont sélectionné leurs 7 cartes, mélangez la pioche centrale."
 */
export class KeepSevenRule extends SimultaneousRule<PlayerColor, MaterialType, LocationType, RuleId> {
  getActivePlayerLegalMoves(player: PlayerColor): Move[] {
    return new Table(this).hand(player).moveItems({ type: LocationType.Deck, x: 0 })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === LocationType.Deck) {
      return this.game.rule!.players!.filter((player) => new Table(this).hand(player).length === KEEP).map((player) => this.endPlayerTurn(player))
    }
    if (isShuffleItemType(MaterialType.CharacterCard)(move)) {
      return [this.startPlayerTurn(RuleId.ChooseStartingMusician, this.game.players[0])]
    }
    return []
  }

  getMovesAfterPlayersDone(): Move[] {
    return [new Table(this).deck.shuffle()]
  }
}

/**
 * Setup Draft (RULES p. 5): "Distribuez 8 cartes à chaque joueur. Les joueurs procèdent à un draft : sur les 8 cartes,
 * chacun en choisit 1 et passe le reste à son voisin de gauche. Répétez ce processus pour les cartes restantes. Lorsque
 * chacun n'a plus que 2 cartes, il en garde une dernière et l'autre est mélangée avec la pioche."
 * [H20] the neighbour on the left is the next player in the order of play.
 */
export class DraftRule extends SimultaneousRule<PlayerColor, MaterialType, LocationType, RuleId> {
  packet(player: PlayerColor) {
    return this.material(MaterialType.CharacterCard).location(LocationType.DraftPacket).player(player)
  }

  getActivePlayerLegalMoves(player: PlayerColor): Move[] {
    return this.packet(player).moveItems({ type: LocationType.PlayerHand, player })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === LocationType.PlayerHand) {
      return [this.endPlayerTurn(move.location.player!)]
    }
    if (isShuffleItemType(MaterialType.CharacterCard)(move)) {
      return [this.startPlayerTurn(RuleId.ChooseStartingMusician, this.game.players[0])]
    }
    return []
  }

  getMovesAfterPlayersDone(): Move[] {
    const players = this.game.players
    if (this.packet(players[0]).length <= 1) {
      return [this.material(MaterialType.CharacterCard).location(LocationType.DraftPacket).moveItemsAtOnce({ type: LocationType.Deck }), new Table(this).deck.shuffle()]
    }
    const moves: Move[] = players.map((player, index) =>
      this.packet(player).moveItemsAtOnce({ type: LocationType.DraftPacket, player: players[(index + 1) % players.length] })
    )
    return [...moves, this.startSimultaneousRule(RuleId.Draft)]
  }
}

/**
 * "En commençant par le premier joueur, chacun va choisir le musicien de départ avec lequel il veut commencer et le
 * placer dans sa zone Partenaires" (RULES p. 5, 3). Then the Master Luthier board (RULES p. 6): "Placez en case 1 PP un
 * musicien niveau 1 non retenu. Placez au hasard une carte Musicien selon son Prestige, depuis la pioche, sur les 3
 * emplacements restants": the starting musicians left are shuffled, the top one goes to the slot 1 and the others into
 * the draw pile, shuffled again; then the first musician of Prestige 2, 3 and 4 from the top of the draw pile.
 */
export class ChooseStartingMusicianRule extends PaneveggioTurnRule {
  get aside() {
    return this.material(MaterialType.CharacterCard).location(LocationType.StartingMusicians)
  }

  getPlayerMoves(): Move[] {
    return this.aside.moveItems({ type: LocationType.PartnerMusicians, player: this.player })
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    const players = this.game.players
    if (isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === LocationType.PartnerMusicians) {
      const index = players.indexOf(this.player)
      if (index < players.length - 1) return [this.startPlayerTurn(RuleId.ChooseStartingMusician, players[index + 1])]
      return [this.aside.shuffle()]
    }
    if (isShuffleItemType(MaterialType.CharacterCard)(move) && this.aside.length) {
      const top = this.aside.maxBy((item) => item.location.x ?? 0)
      return [
        top.moveItem({ type: LocationType.MasterMusician, id: 1 }),
        ...this.aside.filter((_, index) => index !== top.getIndex()).moveItems({ type: LocationType.Deck }),
        new Table(this).deck.shuffle()
      ]
    }
    if (isShuffleItemType(MaterialType.CharacterCard)(move)) {
      const deck = new Table(this).deck.sort((item) => -(item.location.x ?? 0))
      const moves: Move[] = [2, 3, 4].map((prestige) =>
        deck
          .filter<number>((item) => isMusician(item.id) && getPrestige(item.id) === prestige)
          .limit(1)
          .moveItem({ type: LocationType.MasterMusician, id: prestige })
      )
      return [...moves, this.startSimultaneousRule(RuleId.ArrangeStart)]
    }
    return []
  }
}

/**
 * "Sur ses 7 cartes conservées, chaque joueur en place 4 pour former sa zone de Contacts et conserve en main les 3
 * cartes restantes. Formation de la partition : le type d'affiliation des cartes sélectionnées (main et contacts)
 * indique les 7 notes que chaque joueur peut placer (une seule note par temps). Le joueur choisit dans quel ordre il
 * veut les positionner." (RULES p. 5, 4 and 5)
 */
export class ArrangeStartRule extends SimultaneousRule<PlayerColor, MaterialType, LocationType, RuleId> {
  getActivePlayerLegalMoves(player: PlayerColor): Move[] {
    const table = new Table(this)
    const moves: Move[] = []
    const contacts = this.material(MaterialType.CharacterCard).location(LocationType.Contacts).player(player)
    if (contacts.length < CONTACTS) {
      for (const pile of PILES) {
        if (!table.contactPile(player, pile).length) moves.push(...table.hand(player).moveItems({ type: LocationType.Contacts, player, id: pile, x: 0 }))
      }
    }
    const notes = this.material(MaterialType.NoteToken).location(LocationType.SheetMusic).player(player)
    const free = Array.from({ length: BEATS }, (_, beat) => beat).filter((beat) => !notes.location((location) => location.x === beat).length)
    for (const action of this.notesLeft(player)) {
      moves.push(...free.map((x) => this.material(MaterialType.NoteToken).createItem({ location: { type: LocationType.SheetMusic, player, id: action, x } })))
    }
    return moves
  }

  /** The notes the player still has to place: one per kept card, on the line of its affiliation (each action once). */
  notesLeft(player: PlayerColor): Action[] {
    const table = new Table(this)
    const kept = [...table.hand(player).getItems<number>(), ...this.material(MaterialType.CharacterCard).location(LocationType.Contacts).player(player).getItems<number>()]
    const left = kept.map((card) => getAffiliation(card.id))
    for (const note of this.material(MaterialType.NoteToken).location(LocationType.SheetMusic).player(player).getItems()) {
      left.splice(left.indexOf(note.location.id as Action), 1)
    }
    return actions.filter((action) => left.includes(action))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    const player = isCreateItemType(MaterialType.NoteToken)(move)
      ? move.item.location.player
      : isMoveItemType(MaterialType.CharacterCard)(move)
        ? move.location.player
        : undefined
    if (player === undefined) return []
    const done =
      this.material(MaterialType.CharacterCard).location(LocationType.Contacts).player(player).length === CONTACTS &&
      this.material(MaterialType.NoteToken).location(LocationType.SheetMusic).player(player).length === BEATS
    return done ? [this.endPlayerTurn(player)] : []
  }

  getMovesAfterPlayersDone(): MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>[] {
    return startTurn(this, this.game.players[0])
  }
}
