import { css } from '@emotion/react'
import { Location } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { Ducat, Study } from '../images/Images'
import { costY, helpDucatX, helpStudyX } from './MasterBoardLayout'
import { masterWidth } from './TableLayout'

/** "n [study] ●…●": n studies more to craft a violin on the musician of Prestige n (RULES p. 6). */
export const Cost = ({ location }: { location: Location }) => {
  const n = location.id as number
  return (
    <div css={cost}>
      <span css={costNumber}>{n}</span>
      <img src={Study} alt="" css={costIcon} />
      <span css={prestige}>
        {Array.from({ length: n }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </div>
  )
}

/** "Zone d'aide (L) ➜ [ducat] / [study]" and "Fin de partie 1 (L) = −1 PP" (RULES p. 6). */
export const Band = () => {
  const { t } = useTranslation()
  return (
    <>
      <span css={[text, { left: '1%', top: '6%' }]}>{t('master.help-area')}</span>
      <span css={[token, { left: at(helpDucatX - 2.6) }]}>L</span>
      <span css={[text, centered, { left: at(helpDucatX - 1.4) }]}>➜</span>
      <img src={Ducat} alt="" css={[icon, { left: at(helpDucatX) }]} />
      <span css={[text, centered, { left: at((helpDucatX + helpStudyX) / 2) }]}>/</span>
      <img src={Study} alt="" css={[icon, { left: at(helpStudyX) }]} />
      <span css={[text, endOfGame]}>
        {t('master.end-of-game')} 1 <span css={[token, smallToken]}>L</span> = −1 {t('master.pp')}
      </span>
    </>
  )
}

/** A position in the band, from cm from its centre to % of its width (the texts have their own font size: no em). */
const at = (x: number) => `${50 + (x / masterWidth) * 100}%`

const centered = css`
  top: 50%;
  transform: translate(-50%, -50%);
`

const cost = css`
  position: absolute;
  left: 50%;
  top: calc(50% + ${costY}em);
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 0.25em;
`
const costNumber = css`
  color: #e3201b;
  font-weight: bold;
  font-size: 1.05em;
`
const costIcon = css`
  height: 0.9em;
`
const prestige = css`
  display: flex;
  gap: 0.1em;
  padding: 0 0.2em;
  background: linear-gradient(#d4231e, #d4231e) center / 100% 0.09em no-repeat;
  i {
    width: 0.38em;
    height: 0.38em;
    border-radius: 50%;
    background: #1a1a1a;
  }
`

const text = css`
  position: absolute;
  color: #f3e6cc;
  font-size: 0.55em;
  white-space: nowrap;
`
const token = css`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  background: #251a12;
  color: #f3e6cc;
  font-family: 'Brush Script MT', 'Segoe Script', cursive;
  font-size: 0.75em;
  box-shadow: 0 0 0 0.06em rgba(0, 0, 0, 0.4);
`
const smallToken = css`
  position: relative;
  top: auto;
  transform: none;
  vertical-align: middle;
  font-size: 0.9em;
`
const icon = css`
  position: absolute;
  top: 50%;
  height: 1.1em;
  transform: translate(-50%, -50%);
`
const endOfGame = css`
  left: 62%;
  top: 50%;
  transform: translateY(-50%);
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
`
