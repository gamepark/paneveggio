import { css } from '@emotion/react'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { Counters, StyledPlayerPanel, usePlay, usePlayerId, usePlayers, useRules } from '@gamepark/react-game'
import { computeScore, currentScore, stradivariusScore } from '@gamepark/paneveggio/logic/Scoring'
import { activityLevel, stradivarius } from '@gamepark/paneveggio/logic/Solo'
import { Table } from '@gamepark/paneveggio/logic/Table'
import { MaterialMoveBuilder, MaterialRules } from '@gamepark/rules-api'
import { createPortal } from 'react-dom'
import { CardBack, Ducat, lutherieImages, Note, PanelBackground, Star, Study, violinImages, Wood } from '../images/Images'
import { useTranslation } from 'react-i18next'
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
  const bot = stradivarius(rules.game)
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
            backgroundImage={PanelBackground}
            onClick={() => play(MaterialMoveBuilder.changeView(player.id), { transient: true })}
            css={[clickable, player.id === displayed && displayedPanel]}
          />
          {player.id !== displayed && <FontAwesomeIcon icon={faEye} css={eye} />}
        </div>
      ))}
      {bot !== undefined && (
        <div css={panelPosition(players.length)}>
          <StradivariusPanel bot={bot} displayed={bot === displayed} onClick={() => play(MaterialMoveBuilder.changeView(bot), { transient: true })} />
          {bot !== displayed && <FontAwesomeIcon icon={faEye} css={eye} />}
        </div>
      )}
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

/**
 * Solo: the panel of Stradivarius, who has no seat (no avatar, no timer): his score, his violins crafted /12, his level of
 * activity, ducats, studies, cards of his line of Contacts and Lutherie tokens left in reserve.
 */
const StradivariusPanel = ({ bot, displayed, onClick }: { bot: PlayerColor; displayed: boolean; onClick: () => void }) => {
  const { t } = useTranslation()
  const rules = useRules<MaterialRules<PlayerColor, MaterialType, LocationType>>()!
  const table = new Table(rules)
  const score = rules.isOver() ? stradivariusScore(rules, bot).total : currentScore(rules, bot)
  return (
    <div css={[botPanel, clickable, displayed && displayedPanel]} onClick={onClick}>
      <img src={violinImages[bot]} alt="" css={botAvatar} />
      <h2 css={botName}>{t('solo.stradivarius')}</h2>
      <div css={botMain}>
        <Counters counters={[{ image: Star, value: score }]} lineSize={1} />
      </div>
      <Counters
        counters={[
          { image: violinImages[bot], value: `${table.madeViolins(bot).length}/12` },
          { image: Note, value: `${activityLevel(rules, bot)}/4` },
          { image: Ducat, value: table.ducats(bot).length },
          { image: Study, value: table.studies(bot).length },
          { image: CardBack, value: rules.material(MaterialType.CharacterCard).location(LocationType.StradivariusContacts).player(bot).length },
          { image: lutherieImages[bot], value: table.reserve(bot).length }
        ]}
        lineSize={3}
      />
    </div>
  )
}

const botPanel = css`
  position: relative;
  color: black;
  background: rgba(0, 0, 0, 0.8) url(${PanelBackground});
  background-size: cover;
  border-radius: 3em 1.5em 1.5em 1.5em;
  box-shadow: 0 0 0.5em black, 0 0 0.5em black;
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  padding: 0.5em;
`

const botAvatar = css`
  position: absolute;
  top: 0;
  left: 0;
  height: 6em;
  width: 6em;
  border-radius: 100%;
  background: #f3e6cc;
`

const botName = css`
  align-self: end;
  margin: 0;
  font-size: 2.4em;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.1em 0.3em;
  border-radius: 0.4em;
`

const botMain = css`
  align-self: flex-end;
  min-height: 3.4em;
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
