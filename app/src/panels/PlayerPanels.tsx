import { css } from '@emotion/react'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { StyledPlayerPanel, usePlay, usePlayerId, usePlayers, useRules } from '@gamepark/react-game'
import { computeScore, currentScore } from '@gamepark/paneveggio/logic/Scoring'
import { Table } from '@gamepark/paneveggio/logic/Table'
import { MaterialMoveBuilder, MaterialRules } from '@gamepark/rules-api'
import { createPortal } from 'react-dom'
import { CardBack, Ducat, lutherieImages, Star, Study, violinImages, Wood } from '../images/Images'
import { getDisplayedPlayer } from '../locators/TableLayout'

/**
 * A click on a panel displays that player area large (decision of 19/11/2026). The panel of the area displayed large
 * is outlined; the others show an eye.
 * Counters (decision D6, as on BGA): the score, then violins crafted /12, ducats, studies, woods in stock, cards in hand,
 * and the Lutherie tokens left in reserve (Ludo, 23/11/2026).
 * The score is the Prestige of the violins minus the help during the game, the final scoring once it is over.
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
  const table = new Table(rules)
  const over = rules.isOver()

  return createPortal(
    <>
      {players.map((player, index) => (
        <div key={player.id} css={panelPosition(index)}>
          <StyledPlayerPanel
            player={player}
            activeRing
            mainCounter={{ image: Star, value: over ? computeScore(rules, player.id).total : currentScore(rules, player.id) }}
            counters={[
              { image: violinImages[player.id], value: `${table.madeViolins(player.id).length}/12` },
              { image: Ducat, value: table.ducats(player.id).length },
              { image: Study, value: table.studies(player.id).length },
              { image: Wood, value: table.woods(player.id).length },
              { image: CardBack, value: table.hand(player.id).length },
              { image: lutherieImages[player.id], value: table.reserve(player.id).length }
            ]}
            countersPerLine={3}
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
