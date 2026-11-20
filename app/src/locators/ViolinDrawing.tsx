import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { useRules } from '@gamepark/react-game'
import { Location, MaterialRules } from '@gamepark/rules-api'
import { lutherieImages, violinImages } from '../images/Images'
import { tokenImageSize, tokenOnViolinPitch, tokenOnViolinScale, tokenOnViolinY, violinOnMusicianScale } from './TableLayout'

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>

/**
 * A drawing of the violin on a slot of a musician, with its quality and its Lutherie tokens, printed on the card itself.
 * On the table, the real violin lies on it and hides it. When the card grows under the pointer, it covers the real
 * violins: the drawing grows with it, so the enlarged card shows its violins too (Ludo, 20/11/2026).
 */
export const ViolinDrawing = ({ location }: { location: Location }) => {
  const rules = useRules<Rules>()!
  const violin = rules.material(MaterialType.ViolinToken).location(LocationType.MusicianSlot).parent(location.parent).locationId(location.id)
  if (!violin.length) return null
  const owner = violin.getItem<PlayerColor>()!.id
  const tokens = rules
    .material(MaterialType.LutherieToken)
    .location(LocationType.OnViolin)
    .parent(violin.getIndex())
    .sort((item) => item.location.x ?? 0)
    .getItems<PlayerColor>()
  const size = tokenImageSize * violinOnMusicianScale
  const tokenSize = size * tokenOnViolinScale
  return (
    <div css={center}>
      <img src={violinImages[owner]} alt="" css={image} style={{ width: `${size}em` }} />
      <span css={quality} style={{ fontSize: `${0.8 * violinOnMusicianScale}em` }}>
        {1 + tokens.length}
      </span>
      {tokens.map((token, index) => (
        <img
          key={index}
          src={lutherieImages[token.id]}
          alt=""
          css={image}
          style={{
            width: `${tokenSize}em`,
            left: `${(index - (tokens.length - 1) / 2) * tokenOnViolinPitch * violinOnMusicianScale}em`,
            top: `${tokenOnViolinY * violinOnMusicianScale}em`
          }}
        />
      ))}
    </div>
  )
}

const center = css`
  position: absolute;
  left: 50%;
  top: 50%;
  pointer-events: none;
`

const image = css`
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
`

const quality = css`
  position: absolute;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  text-shadow:
    0 0 0.1em black,
    0 0 0.25em black;
`
