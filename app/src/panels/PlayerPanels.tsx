import { css } from '@emotion/react'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { StyledPlayerPanel, usePlay, usePlayerId, usePlayers, useRules } from '@gamepark/react-game'
import { MaterialMoveBuilder, MaterialRules } from '@gamepark/rules-api'
import { createPortal } from 'react-dom'
import { getDisplayedPlayer } from '../locators/TableLayout'

/**
 * A click on a panel displays that player area large (decision of 19/11/2026). The panel of the area displayed large
 * is outlined; the others show an eye.
 */
export const PlayerPanels = () => {
  const players = usePlayers<PlayerColor>({ sortFromMe: true })
  const rules = useRules<MaterialRules<PlayerColor, MaterialType, LocationType>>()
  const me = usePlayerId<PlayerColor>()
  const play = usePlay()
  const root = document.getElementById('root')
  if (!root || !rules) {
    return null
  }
  const displayed = getDisplayedPlayer(rules, me)

  return createPortal(
    <>
      {players.map((player, index) => (
        <div key={player.id} css={panelPosition(index)}>
          <StyledPlayerPanel
            player={player}
            activeRing
            onClick={() => play(MaterialMoveBuilder.changeView(player.id), { transient: true })}
            css={[clickable, player.id === displayed && displayedPanel]}
          />
          {player.id !== displayed && <FontAwesomeIcon icon={faEye} css={eye} />}
        </div>
      ))}
    </>,
    root
  )
}

const panelPosition = (index: number) => css`
  position: absolute;
  right: 1em;
  top: ${8.5 + index * 16}em;
  width: 28em;
`

const clickable = css`
  cursor: pointer;
`

const displayedPanel = css`
  outline: 0.3em solid #f3cd4a;
  outline-offset: 0.2em;
`

const eye = css`
  position: absolute;
  left: -2.2em;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.6em;
  color: white;
  pointer-events: none;
`
