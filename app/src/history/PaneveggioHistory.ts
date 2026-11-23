import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { LogDescription, MovePlayedLogDescription } from '@gamepark/react-game'
import { css } from '@emotion/react'
import { playerColors } from '../panels/playerColors'
import { describeMove, LogContext } from './describeMove'
import { MoveLog } from './LogParts'

type Move = Parameters<typeof describeMove>[0]

/**
 * The journal of the game (references/front.md, "Logs"): the decisions of the players with their avatar, and what they
 * came to indented under them, in the colour of the player (see describeMove).
 */
export class PaneveggioHistory implements LogDescription<Move, PlayerColor> {
  getMovePlayedLogDescription(move: Move, context: LogContext): MovePlayedLogDescription | undefined {
    const description = describeMove(move, context)
    if (!description) return undefined
    // The colour of whose turn it is: the consequences of the end of a turn of the player that Stradivarius plays are his.
    const color = description.player ?? context.game.rule?.player ?? context.action.playerId
    return {
      Component: MoveLog,
      // The avatar only on the decisions, and never for Stradivarius, who has no seat.
      player: description.depth === 0 && context.game.players.includes(description.player!) ? description.player : undefined,
      depth: description.depth,
      css: color === undefined ? undefined : logCss(color),
      liveCss: true
    }
  }
}

const logCss = (player: PlayerColor) => css`
  background-color: ${playerColors[player]};
  color: white;
`
