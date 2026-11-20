import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { LocationDescription } from '@gamepark/react-game'
import { ResourceCount, WoodQuality } from './CounterContent'
import { tokenDiameter } from './TableLayout'

/**
 * Counters drawn on the player boards (Ludo, 20/11/2026): the number of ducats and studies next to their pile, the
 * quality of each wood of the stock under it. They are locations that are only drawn: they catch no click.
 */

const notClickable = css`
  pointer-events: none;
`

export class ResourceCountDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = tokenDiameter
  height = tokenDiameter
  extraCss = notClickable
  content = ResourceCount
}

export class WoodQualityDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = tokenDiameter
  height = tokenDiameter
  extraCss = notClickable
  content = WoodQuality
}
