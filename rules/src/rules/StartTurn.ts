import { stradivarius, turnOrder } from '../logic/Solo'
import { Table } from '../logic/Table'
import { Memory } from '../material/Memory'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { task } from './Task'
import { AnyRule, goToTask, Move } from './TaskRule'

/** "La fin de partie est déclenchée lorsqu'un joueur, à la fin de son tour, a confectionné ses 12 Violons" (RULES p. 18). */
export const VIOLINS_TO_END = 12

/**
 * The turn of a player starts (RULES p. 9): first the tokens given back by the other players become ducats or studies
 * (D2), then the player may change the sheet music before choosing the Workshop or the Conservation. In solo, the turn of
 * Stradivarius is played automatically.
 */
export const startTurn = (rule: AnyRule, player: PlayerColor): Move[] => {
  if (player === stradivarius(rule.game)) return [rule.startPlayerTurn(RuleId.StradivariusTurn, player)]
  return goToTask(rule, [task(RuleId.SpreadReturnedTokens, player, {}, true), task(RuleId.SheetMusic, player, {}, true)])
}

/** The setup is over: the first turn, or in solo the setup of Stradivarius first (RULES p. 21). */
export const startGame = (rule: AnyRule): Move[] => {
  const bot = stradivarius(rule.game)
  if (bot !== undefined) return [rule.startPlayerTurn(RuleId.SetupStradivarius, bot)]
  return startTurn(rule, rule.game.players[0])
}

/**
 * End of the game (RULES p. 18): each player, from the first one, may change their sheet music, then train apprentices.
 * Stradivarius has no final phase (misc/docs/SOLO.md).
 */
export const startFinalTurn = (rule: AnyRule, player: PlayerColor): Move[] => {
  if (player === stradivarius(rule.game)) return startFinalTurn(rule, rule.game.players[0])
  return goToTask(rule, [
    task(RuleId.SpreadReturnedTokens, player, {}, true),
    task(RuleId.FinalSheetMusic, player),
    task(RuleId.FinalApprentices, player)
  ])
}

/**
 * The turn of a player is over: the next one in the order of play. [H4] the end is triggered when the 12 Violin tokens
 * of the player are at the same time in their Heritage or on musicians. "Ses adversaires, jusqu'à celui placé à droite du
 * premier joueur en début de partie, jouent un dernier tour", then the final phase starts with the first player.
 * In solo, Stradivarius triggers the end as a player (RULES p. 23).
 */
export const endTurn = (rule: AnyRule, player: PlayerColor): Move[] => {
  if (rule.remind(Memory.EndTriggeredBy) === undefined && new Table(rule).madeViolins(player).length >= VIOLINS_TO_END) {
    rule.memorize<PlayerColor>(Memory.EndTriggeredBy, player)
  }
  const order = turnOrder(rule)
  const next = order[(order.indexOf(player) + 1) % order.length]
  if (rule.remind(Memory.EndTriggeredBy) !== undefined && next === order[0]) return startFinalTurn(rule, next)
  return startTurn(rule, next)
}
