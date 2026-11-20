import { css } from '@emotion/react'
import { useTranslation } from 'react-i18next'

/**
 * Shown above a wood selected with a click, during a Crafting with several woods in stock: the player chooses which
 * wood they send, then clicks a free slot of a musician (Ludo, 20/11/2026).
 */
export const WoodMenu = () => {
  const { t } = useTranslation()
  return <div css={label}>{t('wood.choose-slot')}</div>
}

const label = css`
  position: absolute;
  left: 50%;
  bottom: 1.2em;
  transform: translateX(-50%);
  padding: 0.2em 0.5em;
  border-radius: 0.4em;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 0.6em;
  white-space: nowrap;
  pointer-events: none;
`
