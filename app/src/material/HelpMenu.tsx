import { css } from '@emotion/react'
import { CustomMoveType, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { ItemMenuButton, PlayMoveButton, RulesDialog } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ducat, Study } from '../images/Images'

type Position = { x: number; y: number }

/**
 * Help of the Master Luthier (RULES p. 8), on its help area: 1 token blocked there (−1 PP at the end of the game) for
 * 1 ducat or 1 study. The buttons are the ducat and study icons drawn on the board (cm from its centre). A click on
 * either one opens a dialog that explains the help, where the player chooses the resource (Ludo, 19/11/2026).
 */
export const HelpMenu = ({ moves, ducat: ducatAt, study: studyAt }: { moves: CustomMove<CustomMoveType, Resource>[]; ducat: Position; study: Position }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ducat = moves.find((move) => move.data === Resource.Ducat)
  const study = moves.find((move) => move.data === Resource.Study)
  return (
    <>
      <ItemMenuButton title={t('help-area.title')} x={ducatAt.x} y={ducatAt.y} onClick={() => setOpen(true)}>
        <img src={Ducat} alt="" css={icon} />
      </ItemMenuButton>
      <ItemMenuButton title={t('help-area.title')} x={studyAt.x} y={studyAt.y} onClick={() => setOpen(true)}>
        <img src={Study} alt="" css={icon} />
      </ItemMenuButton>
      <RulesDialog open={open} close={() => setOpen(false)}>
        <div css={dialog}>
          <h2>{t('help-area.title')}</h2>
          <p>{t('help-area.text')}</p>
          <div css={buttons}>
            {ducat && (
              <PlayMoveButton move={ducat} onPlay={() => setOpen(false)}>
                <img src={Ducat} alt="" css={buttonIcon} />
                {t('help-area.ducat')}
              </PlayMoveButton>
            )}
            {study && (
              <PlayMoveButton move={study} onPlay={() => setOpen(false)}>
                <img src={Study} alt="" css={buttonIcon} />
                {t('help-area.study')}
              </PlayMoveButton>
            )}
          </div>
        </div>
      </RulesDialog>
    </>
  )
}

const icon = css`
  height: 1.6em;
`

const dialog = css`
  max-width: 40em;
  margin: 0 1em 1em;
  padding-top: 0.6em;
  font-size: 3em;
  h2 {
    margin: 0 1.5em 0.5em 0;
  }
  p {
    line-height: 1.4;
  }
`

const buttons = css`
  display: flex;
  justify-content: center;
  gap: 1em;
  margin-top: 1em;
`

const buttonIcon = css`
  height: 1.2em;
  vertical-align: middle;
  margin-right: 0.3em;
`
