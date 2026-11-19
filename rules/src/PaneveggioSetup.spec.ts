import { describe, expect, it } from 'vitest'
import { Action } from './material/Action'
import { getPrestige, isMusician } from './material/CharacterCard'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { startingDecks } from './material/StartingDeck'
import { PaneveggioRules } from './PaneveggioRules'
import { LUTHERIE_TOKENS, PaneveggioSetup, VIOLIN_TOKENS } from './PaneveggioSetup'
import { PlayerColor } from './PlayerColor'

const colors = [PlayerColor.Blue, PlayerColor.Red, PlayerColor.Green, PlayerColor.Orange]
const setup = (count: number) => new PaneveggioRules(new PaneveggioSetup().setup({ players: colors.slice(0, count).map((id) => ({ id })) }))

/** The starting deck of a player, found from their partner musician. */
const deckOf = (rules: PaneveggioRules, player: PlayerColor) => {
  const musician = rules.material(MaterialType.CharacterCard).location(LocationType.PartnerMusicians).player(player).getItem()!.id
  return Object.values(startingDecks).find((deck) => deck.musician === musician)!
}

describe('Setup with the starting decks', () => {
  it.each([2, 3, 4])('gives %i players a different starting deck, laid out as on its card', (count) => {
    const rules = setup(count)
    const musicians = new Set<number>()
    for (const player of rules.players) {
      const deck = deckOf(rules, player)
      musicians.add(deck.musician)
      const cards = rules.material(MaterialType.CharacterCard)
      const contacts = cards.location(LocationType.Contacts).player(player).sort((card) => card.location.id).getItems()
      expect(contacts.map((card) => [card.location.id, card.location.x, card.id])).toEqual(deck.contacts.map((id, pile) => [pile + 1, 0, id]))
      expect(cards.location(LocationType.PlayerHand).player(player).getItems().map((card) => card.id).sort()).toEqual([...deck.hand].sort())
      const notes = rules.material(MaterialType.NoteToken).location(LocationType.SheetMusic).player(player).getItems()
      expect(notes.sort((a, b) => a.location.x! - b.location.x!).map((note) => note.location.id)).toEqual(deck.sheetMusic)
    }
    expect(musicians.size).toBe(count)
  })

  it('gives each player 12 Violin tokens in reserve, 1 Lutherie token in Ducats and the 13 others in reserve', () => {
    const rules = setup(4)
    for (const player of rules.players) {
      expect(rules.material(MaterialType.ViolinToken).id(player).location(LocationType.Reserve).player(player).length).toBe(VIOLIN_TOKENS)
      expect(rules.material(MaterialType.LutherieToken).id(player).location(LocationType.Ducats).player(player).length).toBe(1)
      expect(rules.material(MaterialType.LutherieToken).id(player).location(LocationType.Reserve).player(player).length).toBe(LUTHERIE_TOKENS - 1)
    }
  })

  it.each([2, 3, 4])('sets the Master Luthier board of a first game with %i players', (count) => {
    const rules = setup(count)
    const master = rules.material(MaterialType.CharacterCard).location(LocationType.MasterMusician)
    expect(master.location((location) => location.id === 2).getItem()?.id).toBe(62)
    expect(master.location((location) => location.id === 3).getItem()?.id).toBe(7)
    expect(master.location((location) => location.id === 4).getItem()?.id).toBe(69)
    const first = master.location((location) => location.id === 1).getItem()!.id
    expect(getPrestige(first)).toBe(1)
    expect(isMusician(first)).toBe(true)
    const used = rules.players.map((player) => deckOf(rules, player).musician)
    expect(Object.values(startingDecks).map((deck) => deck.musician)).toContain(first)
    expect(used).not.toContain(first)
  })

  it.each([2, 3, 4])('puts every other card in the draw pile with %i players', (count) => {
    const rules = setup(count)
    const cards = rules.material(MaterialType.CharacterCard)
    expect(cards.length).toBe(75)
    expect(new Set(cards.getItems().map((card) => card.id)).size).toBe(75)
    expect(cards.location(LocationType.Deck).length).toBe(75 - 8 * count - 4)
  })

  it('gives the first player card to the first player', () => {
    const rules = setup(3)
    expect(rules.material(MaterialType.FirstPlayerCard).getItem()?.location).toEqual({ type: LocationType.FirstPlayer, player: rules.players[0] })
  })

  it('hides the hands from the others, the draw pile from everyone, and the Contacts under the top from the others', () => {
    const rules = setup(2)
    const [me, other] = rules.players
    // A second card on a pile of the other player, to check what is under the top card.
    rules.play(rules.material(MaterialType.CharacterCard).location(LocationType.Deck).deck().dealOne({ type: LocationType.Contacts, player: other, id: 1, x: 0 }))
    const view = new PaneveggioRules(rules.getPlayerView(me))
    const cards = view.material(MaterialType.CharacterCard)
    expect(cards.location(LocationType.PlayerHand).player(me).getItems().every((card) => card.id !== undefined)).toBe(true)
    expect(cards.location(LocationType.PlayerHand).player(other).getItems().every((card) => card.id === undefined)).toBe(true)
    expect(cards.location(LocationType.Deck).getItems().every((card) => card.id === undefined)).toBe(true)
    const pile = cards.location(LocationType.Contacts).player(other).locationId(1).getItems()
    expect(pile.map((card) => [card.location.x, card.id !== undefined])).toEqual(expect.arrayContaining([[0, true], [1, false]]))
    expect(new PaneveggioRules(rules.getPlayerView(other)).material(MaterialType.CharacterCard).location(LocationType.Contacts).player(other).getItems().every((card) => card.id !== undefined)).toBe(true)
  })

  it('places each note on the line of its action', () => {
    const rules = setup(2)
    const notes = rules.material(MaterialType.NoteToken).getItems()
    expect(notes).toHaveLength(14)
    expect(notes.every((note) => Object.values(Action).includes(note.location.id))).toBe(true)
  })
})
