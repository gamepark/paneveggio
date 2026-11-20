import { css } from '@emotion/react'
import { useTranslation } from 'react-i18next'

/**
 * Shown on the right of a card selected with a click, when it can go to several piles of Contacts: the player then clicks the pile
 * (Ludo, 20/11/2026).
 */
export const CardMenu = () => {
  const { t } = useTranslation()
  return <div css={label}>{t('card.choose-pile')}</div>
}

const label = css`
  position: absolute;
  left: 3.2em;
  top: 0;
  transform: translateY(-50%);
  padding: 0.2em 0.5em;
  border-radius: 0.4em;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 0.6em;
  white-space: nowrap;
  pointer-events: none;
`
