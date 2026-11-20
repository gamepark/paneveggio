import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { useRules } from '@gamepark/react-game'
import { Location, MaterialRules } from '@gamepark/rules-api'

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>

/** The number of ducats or studies, inside the token on top of their pile (Ludo, 20/11/2026). Nothing on an empty pile. */
export const ResourceCount = ({ location }: { location: Location }) => {
  const rules = useRules<Rules>()!
  const count = rules.material(MaterialType.LutherieToken).location(location.type).player(location.player).length
  return count ? <TokenNumber value={count} /> : null
}

/**
 * The quality of a wood: its Violin token and the Lutherie tokens on it (RULES p. 10), inside the token on top of it
 * (the Lutherie tokens are stacked 0.18 cm higher each, see OnViolinLocator).
 */
export const WoodQuality = ({ location }: { location: Location }) => {
  const rules = useRules<Rules>()!
  const tokens = rules.material(MaterialType.LutherieToken).location(LocationType.OnViolin).parent(location.parent).length
  return <TokenNumber value={1 + tokens} y={-0.18 * tokens} />
}

/** A number in the middle of the location, above the tokens piled there (in cm, like the location). */
const TokenNumber = ({ value, y = 0 }: { value: number; y?: number }) => (
  <div css={[onTop, { transform: `translate3d(-50%, calc(-50% + ${y}em), 1.5em)` }]}>
    <span css={number}>{value}</span>
  </div>
)

const onTop = css`
  position: absolute;
  left: 50%;
  top: 50%;
`

const number = css`
  display: block;
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  line-height: 1;
  text-shadow:
    0 0 0.15em black,
    0 0 0.3em black;
`
