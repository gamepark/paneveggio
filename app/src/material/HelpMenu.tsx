import { css } from '@emotion/react'
import { CustomMoveType, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { ItemMenuButton } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { Ducat, Study } from '../images/Images'

type Position = { x: number; y: number }

/**
 * Help of the Master Luthier (RULES p. 8), on its help area: 1 token blocked there (−1 PP at the end of the game) for
 * 1 ducat or 1 study. The buttons are the ducat and study icons drawn on the board (cm from its centre): icons alone,
 * the drawing "(L) ➜ [ducat] / [study]" says what they do; their label is a tooltip.
 */
export const HelpMenu = ({ moves, ducat: ducatAt, study: studyAt }: { moves: CustomMove<CustomMoveType, Resource>[]; ducat: Position; study: Position }) => {
  const { t } = useTranslation()
  const ducat = moves.find((move) => move.data === Resource.Ducat)
  const study = moves.find((move) => move.data === Resource.Study)
  return (
    <>
      {ducat && (
        <ItemMenuButton move={ducat} title={t('help-area.ducat')} x={ducatAt.x} y={ducatAt.y}>
          <img src={Ducat} alt="" css={icon} />
        </ItemMenuButton>
      )}
      {study && (
        <ItemMenuButton move={study} title={t('help-area.study')} x={studyAt.x} y={studyAt.y}>
          <img src={Study} alt="" css={icon} />
        </ItemMenuButton>
      )}
    </>
  )
}

const icon = css`
  height: 1.6em;
`
