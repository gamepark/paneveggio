import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { LocationDescription } from '@gamepark/react-game'
import { Band, Cost } from './MasterBoardContent'
import { bandHeight } from './MasterBoardLayout'
import { cardHeight, cardWidth, masterWidth } from './TableLayout'

/**
 * The texts printed on the Master Luthier board, drawn by the app so that they are translated (decision of 19/11/2026,
 * as on BGA): the extra cost of each column in the green band, the help area and the end of game penalty in the brown
 * band. They are locations of the board that are only drawn: they catch no click.
 */

const notClickable = css`
  pointer-events: none;
`

export class MasterCostDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = cardWidth
  height = cardHeight
  extraCss = notClickable
  displayInParentItemHelp = true
  content = Cost
}

export class MasterBandDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = masterWidth
  height = bandHeight
  extraCss = notClickable
  displayInParentItemHelp = true
  content = Band
}
