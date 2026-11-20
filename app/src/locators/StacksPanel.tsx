import { css } from '@emotion/react'
import { Location } from '@gamepark/rules-api'
import { ViolinStacks } from '../material/CharacterCardHelp'
import { stacksPanelClass } from './TableLayout'

/**
 * The white panel of the help dialog, on the right of a musician that grows under the pointer: its violins and the
 * piles of their Lutherie tokens, with the name of each owner (Ludo, 20/11/2026). It is printed on the card, hidden until
 * the card is hovered, so it grows with the card.
 */
export const StacksPanel = ({ location }: { location: Location }) => (
  <div className={stacksPanelClass} css={panel}>
    <ViolinStacks card={location.parent!} />
  </div>
)

const panel = css`
  display: none;
  position: absolute;
  left: calc(100% + 0.15em);
  top: 0;
  padding: 0.3em 0.4em;
  border-radius: 0.2em;
  background: #f0fbfc;
  color: #002448;
  font-size: 0.38em;
  white-space: nowrap;
  box-shadow: 0 0 0.3em rgba(0, 0, 0, 0.5);
  pointer-events: none;
  > div {
    font-size: 1em;
    min-width: 0;
  }
`
