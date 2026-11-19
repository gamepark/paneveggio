import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { DevToolsHub, GameTable, GameTableNavigation, usePlayerId, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { tableBoundaries } from './locators/TableLayout'
import { PlayerPanels } from './panels/PlayerPanels'

export function GameDisplay() {
  const rules = useRules<MaterialRules<PlayerColor, MaterialType, LocationType>>()
  const player = usePlayerId<PlayerColor>()
  if (!rules) return null
  const margin = { top: 7, left: 0, right: 30, bottom: 0 }
  return (
    <>
      <GameTable {...tableBoundaries(rules, player)} margin={margin} css={process.env.NODE_ENV === 'development' && tableBorder}>
        <GameTableNavigation />
        <PlayerPanels />
        {process.env.NODE_ENV === 'development' && <DevToolsHub fabBottom="calc(5em)" />}
      </GameTable>
    </>
  )
}

const tableBorder = css`
  border: 1px solid white;
`
