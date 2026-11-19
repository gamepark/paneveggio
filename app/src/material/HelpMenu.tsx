import { css } from '@emotion/react'
import { CustomMoveType, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { ItemMenuButton } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { Ducat, Study } from '../images/Images'

/**
 * Help of the Master Luthier (RULES p. 8), on its help area: 1 token blocked there (−1 PP at the end of the game) for
 * 1 ducat or 1 study. x and y: the help area, in cm from the centre of the board.
 */
export const HelpMenu = ({ moves, x, y }: { moves: CustomMove<CustomMoveType, Resource>[]; x: number; y: number }) => {
  const { t } = useTranslation()
  const ducat = moves.find((move) => move.data === Resource.Ducat)
  const study = moves.find((move) => move.data === Resource.Study)
  return (
    <>
      {ducat && (
        <ItemMenuButton move={ducat} label={t('help-area.ducat')} labelPosition="left" x={x - 1.2} y={y}>
          <img src={Ducat} alt="" css={icon} />
        </ItemMenuButton>
      )}
      {study && (
        <ItemMenuButton move={study} label={t('help-area.study')} labelPosition="right" x={x + 1.2} y={y}>
          <img src={Study} alt="" css={icon} />
        </ItemMenuButton>
      )}
    </>
  )
}

const icon = css`
  height: 1.6em;
`
