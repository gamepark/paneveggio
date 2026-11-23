import { css } from '@emotion/react'
import { CustomMoveType, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { PlayMoveButton, RulesDialog } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ducat, Study } from '../images/Images'
import { helpDucatX, helpStudyX } from '../locators/MasterBoardLayout'
import { masterScale } from '../locators/TableLayout'

/**
 * Help of the Master Luthier (RULES p. 8), on its help area: 1 token blocked there (−1 PP at the end of the game) for
 * 1 ducat or 1 study. While the player can ask for it, a light frame around "L ➜ ducat / study" drawn on the band shows
 * that it can be clicked (Ludo, 23/11/2026); `y` is the band, in cm from the centre of the board. A click on it opens a
 * dialog that explains the help, where the player chooses the resource (Ludo, 19/11/2026).
 */
export const HelpMenu = ({ moves, y }: { moves: CustomMove<CustomMoveType, Resource>[]; y: number }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ducat = moves.find((move) => move.data === Resource.Ducat)
  const study = moves.find((move) => move.data === Resource.Study)
  return (
    <>
      <button type="button" title={t('help-area.title')} css={frame} style={{ transform: `translate(-50%, -50%) translate(${frameX}em, ${y}em)` }} onClick={() => setOpen(true)} />
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

/** The frame goes from the L token (2.6 cm left of the ducat, MasterBoardContent.Band) to the study icon, with a margin. */
const frameLeft = helpDucatX - 2.6 * masterScale - 0.7
const frameRight = helpStudyX + 0.7
const frameX = (frameLeft + frameRight) / 2

const frame = css`
  width: ${frameRight - frameLeft}em;
  height: 1.6em;
  padding: 0;
  border: 0.07em solid rgba(243, 230, 204, 0.75);
  border-radius: 0.3em;
  background: rgba(243, 230, 204, 0.1);
  box-shadow: 0 0 0.3em rgba(243, 230, 204, 0.35);
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: rgba(243, 230, 204, 0.25);
  }
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
