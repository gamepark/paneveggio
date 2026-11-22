import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { useHoveredItems, usePlayerName, useRules } from '@gamepark/react-game'
import { MaterialItem, MaterialRules } from '@gamepark/rules-api'
import { useMemo } from 'react'
import { boardHeight, boardWidth } from '../locators/TableLayout'

/** The colour of each player (the Violin tokens). */
const colors: Record<PlayerColor, string> = {
  [PlayerColor.Blue]: '#1f6f7a',
  [PlayerColor.Red]: '#b3262c',
  [PlayerColor.Green]: '#3c7d3a',
  [PlayerColor.Orange]: '#b5651d'
}

/**
 * The name of the owner of a board, on its top left corner, in their colour: when a click on a board shows it large,
 * everyone sees at once whose board it is (Ludo, 20/11/2026). The menu is scaled down with a small board: the name is
 * written bigger there to stay readable. A small board under the pointer is shown at full size (CardHover): its name is
 * then the size of the name of the large board (Ludo, 22/11/2026).
 */
export const BoardOwner = ({ player, large }: { player: PlayerColor; large: boolean }) => {
  const name = usePlayerName(player)
  const rules = useRules<MaterialRules<PlayerColor, MaterialType, LocationType>>()
  // The boards are static items, one per player in the order of the players (PlayerBoardDescription.getStaticItems)
  const board = useMemo<MaterialItem>(() => ({ location: { type: LocationType.PlayerBoard, player } }), [player])
  const { hovered } = useHoveredItems(MaterialType.PlayerBoard, rules?.players.indexOf(player) ?? -1, board)
  const fullSize = large || !!hovered?.length
  return (
    <div css={corner}>
      <span css={[label, { background: colors[player], fontSize: fullSize ? '1em' : '2em' }]}>{name}</span>
    </div>
  )
}

const corner = css`
  position: absolute;
  left: ${-boardWidth / 2 + 0.6}em;
  top: ${-boardHeight / 2 + 0.6}em;
  pointer-events: none;
`

const label = css`
  display: inline-block;
  padding: 0.15em 0.6em;
  border-radius: 0.3em;
  color: white;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 0.05em 0.2em rgba(0, 0, 0, 0.6);
`
