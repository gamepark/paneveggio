import { getGameView, playAction } from '@gamepark/rules-api'
import { afterEach, describe, expect, it } from 'vitest'
import { PaneveggioRules } from '../PaneveggioRules'
import { PaneveggioSetup } from '../PaneveggioSetup'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'
import { Table } from '../logic/Table'
import { VIOLINS_TO_END } from '../rules/EndTurnRule'
import { chooseMove, searchSettings } from './PaneveggioAI'
import { PaneveggioGame } from './Simulation'

const players = [PlayerColor.Blue, PlayerColor.Red]
const random = Math.random
const budget = searchSettings.budget

/** The same deal at each run: the shuffles of the setup and of the game read Math.random (mulberry32). */
const seedRandom = (seed: number) => {
  let state = seed * 7919
  Math.random = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Two bots play from a seeded deal; `onDecision` is called before each move. */
const playBots = (seed: number, maxMoves: number, onDecision?: (game: PaneveggioGame, player: PlayerColor) => void) => {
  seedRandom(seed)
  const game: PaneveggioGame = new PaneveggioSetup().setup({ players: players.map((id) => ({ id })) })
  let moves = 0
  while (game.rule && moves < maxMoves) {
    const rules = new PaneveggioRules(game)
    const player = rules.getActivePlayer() ?? game.rule.players![0]
    onDecision?.(game, player)
    const move = chooseMove(game, player)
    expect(move).toBeDefined()
    playAction(rules, move!, player)
    moves++
  }
  return game
}

describe('PaneveggioAI', () => {
  afterEach(() => {
    Math.random = random
    searchSettings.budget = budget
  })

  it('plays a game to its end, a player having crafted their 12 violins', { timeout: 300_000 }, () => {
    searchSettings.budget = 30
    const game = playBots(1, 3000)
    expect(game.rule).toBeUndefined()
    const table = new Table(new PaneveggioRules(game))
    expect(Math.max(...players.map((player) => table.madeViolins(player).length))).toBeGreaterThanOrEqual(VIOLINS_TO_END)
  })

  it('only reads what its player sees: the same move from the view of its player', { timeout: 300_000 }, () => {
    searchSettings.budget = 30
    let checked = 0
    playBots(2, 300, (game, player) => {
      if (game.rule?.id !== RuleId.SheetMusic && game.rule?.id !== RuleId.PlayAction) return
      const view = getGameView(new PaneveggioRules(game), player) as PaneveggioGame
      expect(chooseMove(view, player)).toEqual(chooseMove(game, player))
      checked++
    })
    expect(checked).toBeGreaterThan(10)
  })
})
