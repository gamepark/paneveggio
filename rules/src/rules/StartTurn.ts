import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { task } from './Task'
import { AnyRule, goToTask, Move } from './TaskRule'

/**
 * The turn of a player starts (RULES p. 9): first the tokens given back by the other players become ducats or studies
 * (D2), then the player may change the sheet music before choosing the Workshop or the Conservation.
 */
export const startTurn = (rule: AnyRule, player: PlayerColor): Move[] =>
  goToTask(rule, [task(RuleId.SpreadReturnedTokens, player, {}, true), task(RuleId.SheetMusic, player, {}, true)])

/**
 * End of the game (RULES p. 18): each player, from the first one, may change their sheet music, then train apprentices.
 */
export const startFinalTurn = (rule: AnyRule, player: PlayerColor): Move[] =>
  goToTask(rule, [
    task(RuleId.SpreadReturnedTokens, player, {}, true),
    task(RuleId.FinalSheetMusic, player),
    task(RuleId.FinalApprentices, player)
  ])
