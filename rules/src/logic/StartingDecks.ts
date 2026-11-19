import { MaterialMove } from '@gamepark/rules-api'
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
  const cards = game.material(MaterialType.CharacterCard)
  return [
    ...deck.sheetMusic.map((action, beat) =>
      game.material(MaterialType.NoteToken).createItem({ location: { type: LocationType.SheetMusic, player, id: action, x: beat } })
    ),
    cards.id(deck.musician).moveItem({ type: LocationType.PartnerMusicians, player }),
    ...deck.contacts.map((id, index) => cards.id(id).moveItem({ type: LocationType.Contacts, player, id: index + 1, x: 0 })),
    ...deck.hand.map((id) => cards.id(id).moveItem({ type: LocationType.PlayerHand, player }))
  ]
}

/**
 * Master Luthier board for a first game (RULES p. 6): "Placez 1 carte musicien de Prestige 1, prise d'un deck de
 * démarrage non utilisé. Placez la carte musicien de Prestige 2, n°62. […] Prestige 3, n°7. […] Prestige 4, n°69."
 */
export const firstGameMasterMoves = (game: GameMaterial, prestige1: number): Move[] => {
  const cards = game.material(MaterialType.CharacterCard)
  const musicians: Record<number, number> = { 1: prestige1, ...firstGameMasterMusicians }
  return Object.entries(musicians).map(([slot, id]) => cards.id(id).moveItem({ type: LocationType.MasterMusician, id: Number(slot) }))
}
