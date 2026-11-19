import { applyAutomaticMoves, isCustomMove, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { MAX_QUALITY, Table } from './logic/Table'
import { CustomMoveType } from './material/CustomMoveType'
import { LocationType } from './material/LocationType'
import { Memory } from './material/Memory'
import { MaterialType } from './material/MaterialType'
import { DeckDistribution, PaneveggioOptions, SetupMode } from './PaneveggioOptions'
import { PaneveggioRules } from './PaneveggioRules'
import { LUTHERIE_TOKENS, PaneveggioSetup, VIOLIN_TOKENS } from './PaneveggioSetup'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * Whole games played at random, from the setup to the final score. Nothing here checks a rule in particular: it checks
 * that the rules always have a legal move to offer, that the material never ends up somewhere it should not be, and that
 * a game reaches its end.
 *
 * The moves are not drawn evenly: a player who passes or takes their cards back at every occasion never crafts their
 * 12 violins. Passing, taking back, asking for help and moving notes are drawn rarely, the rest evenly. The setup draws
 * at random too: two runs never play the same games.
 */
const MOVES_PER_GAME = 10000
const colors = [PlayerColor.Blue, PlayerColor.Red, PlayerColor.Green, PlayerColor.Orange]

const newGame = (players: number, options: Partial<PaneveggioOptions> = {}): Game =>
  new PaneveggioSetup().setup({ players: colors.slice(0, players).map((id) => ({ id })), ...options })

const rare = [CustomMoveType.Pass, CustomMoveType.TakeBack, CustomMoveType.MoveNote]
const weight = (move: Move, rule: RuleId, broke: boolean) => {
  if (!isCustomMove(move)) return 200
  // The help of the Master Luthier blocks a token for good: only when the player has neither ducat nor study.
  if (move.type === CustomMoveType.AskForHelp) return broke ? 200 : 0
  // In Conservation, a card can be placed and taken back again and again: the random player has to stop some time.
  if (move.type === CustomMoveType.Pass && rule === RuleId.Conservation) return 200
  return rare.includes(move.type as CustomMoveType) ? 10 : 200
}

const playRandomGame = (players: number, seed: number, options: Partial<PaneveggioOptions> = {}) => {
  const game = newGame(players, options)
  let moves = 0
  let random = seed + 1
  const next = () => (random = (random * 1103515245 + 12345) % 2147483648)
  while (game.rule && moves < MOVES_PER_GAME) {
    const rules = new PaneveggioRules(game)
    const active = game.rule.player ?? game.rule.players![next() % game.rule.players!.length]
    const legal = rules.getLegalMoves(active)
    expect(legal, `no legal move for player ${active} on rule ${RuleId[game.rule.id]} (move ${moves})`).not.toHaveLength(0)
    const table = new Table(rules)
    const broke = table.ducats(active).length + table.studies(active).length === 0
    const total = legal.reduce((sum, move) => sum + weight(move, game.rule!.id, broke), 0)
    let pick = next() % total
    const move = legal.find((move) => (pick -= weight(move, game.rule!.id, broke)) < 0)!
    applyAutomaticMoves(rules, [move])
    moves++
    check(game)
  }
  return { game, moves }
}

const tokenPlaces = [
  LocationType.Reserve,
  LocationType.Ducats,
  LocationType.Studies,
  LocationType.ReturnedTokens,
  LocationType.HelpArea,
  LocationType.OnViolin,
  LocationType.OnNote
]
const violinPlaces = [LocationType.Reserve, LocationType.WoodStock, LocationType.MusicianSlot, LocationType.Heritage]

/** What must hold between any two moves of any game. */
const check = (game: Game) => {
  const rules = new PaneveggioRules(game)
  const table = new Table(rules)
  expect(rules.material(MaterialType.CharacterCard).length).toBe(75)
  for (const player of game.players) {
    // The 14 Lutherie and 12 Violin tokens of each player are always somewhere they belong.
    const lutheries = rules.material(MaterialType.LutherieToken).id(player)
    expect(lutheries.length).toBe(LUTHERIE_TOKENS)
    for (const token of lutheries.getItems()) expect(tokenPlaces).toContain(token.location.type)
    const violins = rules.material(MaterialType.ViolinToken).id(player)
    expect(violins.length).toBe(VIOLIN_TOKENS)
    for (const violin of violins.getItems()) expect(violinPlaces).toContain(violin.location.type)
    // A wood or a violin never goes beyond quality 4; a Heritage space is between 1 and 4.
    for (const index of violins.location((l) => l.type === LocationType.WoodStock || l.type === LocationType.MusicianSlot).getIndexes()) {
      expect(table.quality(index)).toBeLessThanOrEqual(MAX_QUALITY)
    }
    for (const violin of table.heritage(player).getItems()) expect([1, 2, 3, 4]).toContain(violin.location.id)
    // Once the sheet music is set: 7 notes, one per beat.
    const notes = rules.material(MaterialType.NoteToken).player(player)
    if (game.rule?.id !== RuleId.ArrangeStart && notes.length) {
      expect(new Set(notes.getItems().map((note) => note.location.x)).size).toBe(7)
    }
  }
  // Two violins never share a slot of a musician.
  const slots = table.violinsOnCards.getItems().map((violin) => `${violin.location.parent}/${violin.location.id}`)
  expect(new Set(slots).size).toBe(slots.length)
  // At most 6 apprentices trained by each player.
  for (const player of game.players) expect(table.partnerApprentices(player).length).toBeLessThanOrEqual(6)
}

const GAMES_PER_TABLE = 6
const setupRules = [RuleId.ChooseStartingDeck, RuleId.Mulligan, RuleId.KeepSeven, RuleId.Draft, RuleId.ChooseStartingMusician, RuleId.ArrangeStart]

/**
 * A random player does not plan anything: it may spend all its ducats and studies with no note on the Crafting line, and
 * never craft a violin again. About 3 games out of 4 reach their end (measured on 100 games of 2 players): half of them
 * at least must do it. Every game, ended or not, keeps the invariants and always offers a legal move.
 */
describe('A game played at random', () => {
  for (const players of [2, 3, 4]) {
    it(`reaches its end with ${players} players`, { timeout: 600_000 }, () => {
      let ended = 0
      for (let seed = 0; seed < GAMES_PER_TABLE; seed++) {
        const { game } = playRandomGame(players, seed)
        if (game.rule) continue
        ended++
        const rules = new PaneveggioRules(game)
        // [H4] the end is triggered by a player with 12 violins in Heritage or on musicians at the end of their turn.
        expect(game.memory[Memory.EndTriggeredBy]).toBeDefined()
        for (const player of game.players) expect(Number.isInteger(rules.getScore(player))).toBe(true)
      }
      expect(ended).toBeGreaterThanOrEqual(GAMES_PER_TABLE / 2)
    })
  }

  for (const [name, options] of [
    ['Players choose', { setup: SetupMode.StartingDecks, decks: DeckDistribution.PlayersChoose }],
    ['Mulligan', { setup: SetupMode.Mulligan }],
    ['Draft', { setup: SetupMode.Draft }]
  ] as const) {
    it(`goes through the setup ${name}`, { timeout: 600_000 }, () => {
      for (const players of [2, 3, 4]) {
        const { game } = playRandomGame(players, players, options)
        expect(game.rule === undefined || !setupRules.includes(game.rule.id)).toBe(true)
      }
    })
  }
})
