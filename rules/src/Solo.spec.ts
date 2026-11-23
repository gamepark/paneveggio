import { applyAutomaticMoves, isCustomMove, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { stradivariusScore } from './logic/Scoring'
import { activityLevel, stradivarius } from './logic/Solo'
import { Table } from './logic/Table'
import { getPrestige } from './material/CharacterCard'
import { CustomMoveType } from './material/CustomMoveType'
import { LocationType } from './material/LocationType'
import { Memory } from './material/Memory'
import { MaterialType } from './material/MaterialType'
import { DeckDistribution, PaneveggioOptions, SetupMode, SoloLevel } from './PaneveggioOptions'
import { PaneveggioRules } from './PaneveggioRules'
import { LUTHERIE_TOKENS, PaneveggioSetup, VIOLIN_TOKENS } from './PaneveggioSetup'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * Solo games against Stradivarius, the player playing at random (see PaneveggioGame.spec): every level and every setup
 * reaches its end, the material of both stays where it belongs, and Stradivarius keeps his 3 musicians.
 */
const MOVES_PER_GAME = 10000
const rare = [CustomMoveType.Pass, CustomMoveType.TakeBack, CustomMoveType.MoveNote, CustomMoveType.AskForHelp]
const weight = (move: Move, rule: RuleId) => {
  if (!isCustomMove(move)) return 200
  if (move.type === CustomMoveType.Pass && rule === RuleId.Conservation) return 200
  return rare.includes(move.type as CustomMoveType) ? 10 : 200
}

const playSolo = (seed: number, options: Partial<PaneveggioOptions>) => {
  const game: Game = new PaneveggioSetup().setup({ players: [{ id: PlayerColor.Red }], ...options })
  const bot = stradivarius(game)!
  let random = seed + 1
  const next = () => (random = (random * 1103515245 + 12345) % 2147483648)
  let moves = 0
  check(game, bot)
  while (game.rule && moves < MOVES_PER_GAME) {
    const rules = new PaneveggioRules(game)
    const active = game.rule.player ?? game.rule.players![0]
    expect(active, `Stradivarius waits on rule ${RuleId[game.rule.id]}`).not.toBe(bot)
    const legal = rules.getLegalMoves(active)
    expect(legal, `no legal move on rule ${RuleId[game.rule.id]} (move ${moves})`).not.toHaveLength(0)
    const total = legal.reduce((sum, move) => sum + weight(move, game.rule!.id), 0)
    let pick = next() % total
    const move = legal.find((move) => (pick -= weight(move, game.rule!.id)) < 0)!
    applyAutomaticMoves(rules, [move])
    moves++
    check(game, bot)
  }
  return { game, bot }
}

const check = (game: Game, bot: PlayerColor) => {
  const rules = new PaneveggioRules(game)
  const table = new Table(rules)
  expect(rules.material(MaterialType.CharacterCard).length).toBe(75)
  for (const color of [game.players[0], bot]) {
    expect(rules.material(MaterialType.LutherieToken).id(color).length).toBe(LUTHERIE_TOKENS)
    expect(rules.material(MaterialType.ViolinToken).id(color).length).toBe(VIOLIN_TOKENS)
    for (const violin of table.heritage(color).getItems()) expect([1, 2, 3, 4]).toContain(violin.location.id)
  }
  // Stradivarius has no hand, no sheet music, no pile of Contacts.
  expect(table.hand(bot).length).toBe(0)
  expect(rules.material(MaterialType.CharacterCard).location(LocationType.Contacts).player(bot).length).toBe(0)
  const activity = activityLevel(rules, bot)
  expect(activity).toBeGreaterThanOrEqual(1)
  expect(activity).toBeLessThanOrEqual(4)
  const musicians = table.partnerMusicians(bot).getItems<number>()
  // Once set up (after the setup of the player), and while the draw pile can give him musicians.
  if (musicians.length && table.deck.length > 10) expect(musicians).toHaveLength(3)
  // His partners are sorted by decreasing Prestige, from left to right.
  const prestiges = [...musicians].sort((a, b) => a.location.x! - b.location.x!).map((item) => getPrestige(item.id))
  expect(prestiges).toEqual([...prestiges].sort((a, b) => b - a))
}

describe('Solo against Stradivarius', () => {
  for (const level of [SoloLevel.Pianissimo, SoloLevel.Piano, SoloLevel.Forte, SoloLevel.Fortissimo]) {
    it(`reaches its end at the level ${SoloLevel[level]}`, { timeout: 600_000 }, () => {
      let ended = 0
      for (let seed = 0; seed < 6; seed++) {
        const { game, bot } = playSolo(seed, { level })
        if (game.rule) continue
        ended++
        expect(game.memory[Memory.EndTriggeredBy]).toBeDefined()
        const rules = new PaneveggioRules(game)
        expect(Number.isInteger(rules.getScore(game.players[0]))).toBe(true)
        expect(Number.isInteger(stradivariusScore(rules, bot).total)).toBe(true)
      }
      expect(ended).toBeGreaterThanOrEqual(3)
    })
  }

  for (const [name, options] of [
    ['Players choose', { setup: SetupMode.StartingDecks, decks: DeckDistribution.PlayersChoose }],
    ['Mulligan', { setup: SetupMode.Mulligan }]
  ] as const) {
    it(`goes through the setup ${name}`, { timeout: 600_000 }, () => {
      const { game, bot } = playSolo(1, { ...options, level: SoloLevel.Forte })
      const table = new Table(new PaneveggioRules(game))
      expect(table.madeViolins(bot).length + table.madeViolins(game.players[0]).length).toBeGreaterThan(0)
    })
  }

  it('starts with Stradivarius, except at the Fortissimo', () => {
    for (const level of [SoloLevel.Pianissimo, SoloLevel.Fortissimo]) {
      const game: Game = new PaneveggioSetup().setup({ players: [{ id: PlayerColor.Red }], level })
      const bot = stradivarius(game)!
      const first = game.items[MaterialType.FirstPlayerCard]![0].location.player
      expect(first).toBe(level === SoloLevel.Fortissimo ? PlayerColor.Red : bot)
      const table = new Table(new PaneveggioRules(game))
      const musicians = table.partnerMusicians(bot).getItems<number>().map((item) => item.id)
      expect(musicians).toHaveLength(3)
      expect(new Set(musicians.map((id) => Math.ceil(id / 15))).size).toBe(3)
      expect(musicians.map(getPrestige)).toContain(1)
      if (level === SoloLevel.Fortissimo) expect(musicians.map(getPrestige)).toContain(2)
      // 2 cards [C11]; at the Pianissimo, his first turn is already played (a Workshop may draw more).
      const contacts = table.cards.location(LocationType.StradivariusContacts).player(bot).length
      if (level === SoloLevel.Fortissimo) expect(contacts).toBe(2)
      else expect(contacts).toBeGreaterThanOrEqual(2)
    }
  })
})
