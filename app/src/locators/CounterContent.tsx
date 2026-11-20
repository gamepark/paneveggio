import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { useRules } from '@gamepark/react-game'
import { Location, MaterialRules } from '@gamepark/rules-api'

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>

/** "×n" on the right of the pile of ducats or studies. */
export const ResourceCount = ({ location }: { location: Location }) => {
  const rules = useRules<Rules>()!
  const count = rules.material(MaterialType.LutherieToken).location(location.type).player(location.player).length
  return <span css={[badge, resourceBadge]}>×{count}</span>
}

/** The quality of a wood: its Violin token and the Lutherie tokens on it (RULES p. 10), under the pile. */
export const WoodQuality = ({ location }: { location: Location }) => {
  const rules = useRules<Rules>()!
  const quality = 1 + rules.material(MaterialType.LutherieToken).location(LocationType.OnViolin).parent(location.parent).length
  return <span css={[badge, woodBadge]}>{quality}</span>
}

const badge = css`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0.9em;
  height: 0.9em;
  padding: 0 0.2em;
  border-radius: 0.45em;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 0.7em;
  font-weight: bold;
  white-space: nowrap;
`

const resourceBadge = css`
  left: 100%;
  top: 50%;
  transform: translate(0.3em, -50%);
`

const woodBadge = css`
  left: 50%;
  top: 100%;
  transform: translate(-50%, 0.1em);
`
