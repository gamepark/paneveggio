import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { ItemContext } from '@gamepark/react-game'
import { isMoveItemType, MaterialItem } from '@gamepark/rules-api'
import { boardCenter, boardHeight, boardWidth, cardHeight, cardWidth, getSeat, masterBoardCenter, masterHeight, masterWidth, seatScale, tableBoundaries } from './TableLayout'

type Item = MaterialItem<PlayerColor, LocationType>
type ItemCtx = ItemContext<PlayerColor, MaterialType, LocationType>

/** A card under the pointer is seen up close: 4 times the size of a real card, whatever its size on the table, so that its texts can be read when the whole table is shown (Ludo, 19/11/2026). */
const hoverScale = 4

/** Where the card is on the table, and at which scale it is shown there (the cards of the other players are smaller). */
const cardOnTable = (item: Item, context: ItemCtx) => {
  const locator = context.locators[item.location.type]!
  const { x = 0, y = 0 } = locator.getItemCoordinates(item, context)
  const onParent = locator.getPositionOnParent(item.location, context)
  if (locator.parentItemType === MaterialType.PlayerBoard) {
    const scale = seatScale(getSeat(context.rules, item.location.player!, context.player))
    const board = boardCenter(context.rules, item.location.player!, context.player)
    const dx = ((onParent.x - 50) / 100) * boardWidth + x
    const dy = ((onParent.y - 50) / 100) * boardHeight + y
    return { x: board.x + dx * scale, y: board.y + dy * scale, scale }
  }
  if (locator.parentItemType === MaterialType.MasterBoard) {
    return {
      x: masterBoardCenter.x + ((onParent.x - 50) / 100) * masterWidth + x,
      y: masterBoardCenter.y + ((onParent.y - 50) / 100) * masterHeight + y,
      scale: 1
    }
  }
  return { x, y, scale: 1 }
}

/**
 * A musician where the player can put a wood now does not grow under the pointer: its free slots would move away from
 * the pointer, and the click or the drop would land on the card (its help) instead of the slot.
 */
const isCraftingTarget = (context: ItemCtx) =>
  context.player !== undefined &&
  context.rules.isTurnToPlay(context.player) &&
  context.rules
    .getLegalMoves(context.player)
    .some((move) => isMoveItemType(MaterialType.ViolinToken)(move) && move.location.type === LocationType.MusicianSlot && move.location.parent === context.index)

/** How far a span has to move along one axis to lie between `min` and `max`: nothing when it already does. */
const pushInside = (center: number, half: number, min: number, max: number): number => Math.min(Math.max(center, min + half), max - half) - center

/**
 * The transform of a hovered card. It applies inside the card, after its own scale, so everything is divided by that
 * scale. A card near the edge of the table is pushed back inside it. A face-down card is not enlarged: it would only
 * show a bigger back.
 */
export const cardHoverTransform = (item: Item, context: ItemCtx): string[] => {
  if (context.type === MaterialType.CharacterCard && item.id === undefined) return []
  if (isCraftingTarget(context)) return []
  const { x, y, scale } = cardOnTable(item, context)
  const table = tableBoundaries(context.rules, context.player)
  const dx = pushInside(x, (cardWidth * hoverScale) / 2, table.xMin, table.xMax)
  const dy = pushInside(y, (cardHeight * hoverScale) / 2, table.yMin, table.yMax)
  return [`translate3d(${dx / scale}em, ${dy / scale}em, ${10 / scale}em)`, `scale(${hoverScale / scale})`]
}
