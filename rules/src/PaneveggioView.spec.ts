import { applyAutomaticMoves, getGameView, getMoveView, isCustomMove, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { describe, expect, it } from 'vitest'
import { CustomMoveType } from './material/CustomMoveType'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PaneveggioRules } from './PaneveggioRules'
import { PaneveggioSetup } from './PaneveggioSetup'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * The check the framework runs in the browser (GameLocalAPI.getNotifications): each player sees a view of the game
 * (the hands of the others and the draw pile hidden). Playing the views of the moves on that view must give the same
 * view as playing the moves on the whole game. Otherwise the browser of a player drifts away from the server: wrong
 * headers, failed undo, crashes on hidden cards (bugs of 20/11/2026).
 */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const players = [PlayerColor.Blue, PlayerColor.Red]
const rare = [CustomMoveType.Pass, CustomMoveType.TakeBack, CustomMoveType.MoveNote, CustomMoveType.AskForHelp]

const checkGame = (seed: number, maxMoves: number) => {
  const game: Game = new PaneveggioSetup().setup({ players: players.map((id) => ({ id })) })
  const rules = new PaneveggioRules(game)
  const clients = players.map((player) => new PaneveggioRules(clone(getGameView(rules, player)), { player }))
  let random = seed + 1
  const next = () => (random = (random * 1103515245 + 12345) % 2147483648)
  for (let moves = 0; moves < maxMoves && game.rule; moves++) {
    const active = game.rule.player ?? game.rule.players![next() % game.rule.players!.length]
    const legal = rules.getLegalMoves(active)
    const common = legal.filter((move) => !isCustomMove(move) || !rare.includes(move.type as CustomMoveType))
    const choices = common.length ? common : legal
    const move = choices[next() % choices.length]
    const context = { player: active }
    applyAutomaticMoves(
      rules,
      [move],
      (played: Move) => {
        players.forEach((player, index) => {
          const view = getMoveView(rules, clone(played), player)
          clients[index].play(clone(view), context)
        })
      },
      context
    )
    players.forEach((player, index) => {
      const expected = clone(getGameView(rules, player))
      const actual = clone(clients[index].game)
      expect(actual, `seed ${seed}, move ${moves} (${JSON.stringify(move)}), view of player ${player}`).toEqual(expected)
    })
  }
}

describe('The view of each player stays the same as the game seen by them', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    it(`random game ${seed}`, () => checkGame(seed, 1500), 120_000)
  }
})
