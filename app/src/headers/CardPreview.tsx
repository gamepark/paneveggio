import { css } from '@emotion/react'
import { ReactNode, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { characterImagesEn, characterImagesFr } from '../images/Images'

/**
 * A text of the header that names a musician or an apprentice (a button, mostly): the card shows under it while the
 * pointer is over it (Ludo, 20/11/2026).
 */
export const CardPreview = ({ card, children }: { card: number; children: ReactNode }) => {
  const { i18n } = useTranslation()
  const [at, setAt] = useState<DOMRect>()
  const image = (i18n.language?.startsWith('fr') ? characterImagesFr : characterImagesEn)[card]
  // The card (45 % of the height of the window, 5.7 × 8.7 cm) stays inside the window.
  const half = (window.innerHeight * 0.45 * 5.7) / 8.7 / 2
  const left = at ? Math.min(Math.max(at.left + at.width / 2, half + 8), window.innerWidth - half - 8) : 0
  return (
    <span onMouseEnter={(event) => setAt(event.currentTarget.getBoundingClientRect())} onMouseLeave={() => setAt(undefined)}>
      {children}
      {at &&
        image &&
        createPortal(<img src={image} alt="" css={preview} style={{ left, top: at.bottom + 8 }} />, document.body)}
    </span>
  )
}

const preview = css`
  position: fixed;
  z-index: 1000;
  height: 45vh;
  transform: translateX(-50%);
  border-radius: 2.5vh;
  box-shadow: 0 0 1vh rgba(0, 0, 0, 0.8);
  pointer-events: none;
`
