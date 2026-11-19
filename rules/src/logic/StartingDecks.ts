import { Location, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { firstGameMasterMusicians, StartingDeck } from '../material/StartingDeck'
import { PlayerColor } from '../PlayerColor'
import { GameMaterial } from './Table'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

/**
 * A starting card (RULES p. 6) gives: "Le placement des 7 jetons Note sur sa partition. 1 carte musicien de Prestige 1 à
 * placer en zone Musiciens Partenaires. 3 cartes à prendre en main. 4 cartes à placer dans la zone de Contacts."
 * The cards are taken from the draw pile. In the setup, the moves are played as soon as they are built.
 */
export const startingDeckMoves = (game: GameMaterial, player: PlayerColor, deck: StartingDeck): Move[] => {
  const move = cardMove(game)
  return [
    ...deck.sheetMusic.map((action, beat) =>
      game.material(MaterialType.NoteToken).createItem({ location: { type: LocationType.SheetMusic, player, id: action, x: beat } })
    ),
    ...move(deck.musician, { type: LocationType.PartnerMusicians, player }),
    ...deck.contacts.flatMap((id, index) => move(id, { type: LocationType.Contacts, player, id: index + 1, x: 0 })),
    ...deck.hand.flatMap((id) => move(id, { type: LocationType.PlayerHand, player }))
  ]
}

/**
 * The move of a card of the draw pile found by its number. In the browser, the cards of the draw pile are hidden: the
 * card is not found, and no move is built (the moves played come from the server anyway).
 */
const cardMove =
  (game: GameMaterial) =>
  (id: number, location: Location<PlayerColor, LocationType>): Move[] => {
    const card = game.material(MaterialType.CharacterCard).id(id)
    return card.length ? [card.moveItem(location)] : []
  }

/**
 * Master Luthier board for a first game (RULES p. 6): "Placez 1 carte musicien de Prestige 1, prise d'un deck de
 * démarrage non utilisé. Placez la carte musicien de Prestige 2, n°62. […] Prestige 3, n°7. […] Prestige 4, n°69."
 */
export const firstGameMasterMoves = (game: GameMaterial, prestige1: number): Move[] => {
  const move = cardMove(game)
  const musicians: Record<number, number> = { 1: prestige1, ...firstGameMasterMusicians }
  return Object.entries(musicians).flatMap(([slot, id]) => move(id, { type: LocationType.MasterMusician, id: Number(slot) }))
}
