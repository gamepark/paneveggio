import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { ItemContext } from '@gamepark/react-game'
import { isMoveItemType, MaterialItem } from '@gamepark/rules-api'
import { boardCenter, boardHeight, boardWidth, cardHeight, cardWidth, getSeat, masterBoardCenter, masterHeight, masterWidth, playerArea, seatScale, tableBoundaries } from './TableLayout'

type Item = MaterialItem<PlayerColor, LocationType>
type ItemCtx = ItemContext<PlayerColor, MaterialType, LocationType>

/** A card under the pointer is seen up close: 4 times the size of a real card, whatever its size on the table, so that its texts can be read when the whole table is shown (Ludo, 19/11/2026). */
const hoverScale = 4

/**
 * The board of another player under the pointer: their whole area (everything in it is placed on the board) is shown at
 * the size of the area displayed large, pushed back inside the table (Ludo, 22/11/2026). The board displayed large does
 * not grow. The shift is in cm of the table.
 */
const boardHover = (context: ItemCtx, player: PlayerColor) => {
  const scale = seatScale(getSeat(context.rules, player, context.player))
  if (scale === 1) return undefined
  const center = boardCenter(context.rules, player, context.player)
  const area = playerArea(context.rules, player, context.player)
  const table = tableBoundaries(context.rules, context.player)
  return {
    dx: pushRangeInside(center.x + area.left, center.x + area.right, table.xMin, table.xMax),
    dy: pushRangeInside(center.y + area.top, center.y + area.bottom, table.yMin, table.yMax),
    scale
  }
}

/** How far a span from `start` to `end` has to move to lie between `min` and `max`; a span too long is aligned on `min`. */
const pushRangeInside = (start: number, end: number, min: number, max: number) => Math.max(min - start, Math.min(0, max - end))

/** The transform of a hovered board, inside the board, after its own scale: everything is divided by that scale. */
export const boardHoverTransform = (item: Item, context: ItemCtx): string[] => {
  const hover = boardHover(context, item.location.player!)
  if (!hover) return []
  const { dx, dy, scale } = hover
  return [`translate3d(${dx / scale}em, ${dy / scale}em, ${hoverHeight / scale}em)`, `scale(${1 / scale})`]
}

/** The board of the player is under the pointer, and the items placed on it follow it (ItemContext.hovered). */
const isBoardHovered = (context: ItemCtx, player: PlayerColor) =>
  !!context.hovered?.some((hovered) => hovered.type === MaterialType.PlayerBoard && hovered.item.location.player === player)

/** Where the card is on the table, and at which scale it is shown there (the cards of the other players are smaller). */
const cardOnTable = (item: Item, context: ItemCtx) => {
  const locator = context.locators[item.location.type]!
  const { x = 0, y = 0 } = locator.getItemCoordinates(item, context)
  const onParent = locator.getPositionOnParent(item.location, context)
  if (locator.parentItemType === MaterialType.PlayerBoard) {
    const player = item.location.player!
    const center = boardCenter(context.rules, player, context.player)
    const hover = isBoardHovered(context, player) ? boardHover(context, player) : undefined
    const scale = hover ? 1 : seatScale(getSeat(context.rules, player, context.player))
    const board = hover ? { x: center.x + hover.dx, y: center.y + hover.dy } : center
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
 * A musician where the player can put a wood now (Crafting), or one of whose violins the player can restore now
 * (Restoration), does not grow under the pointer: its free slots and its violins would be hidden under the enlarged card,
 * which only shows drawings of them, and the click or the drop would land on the card (its help) instead (Ludo,
 * 22/11/2026: "je ne peux toujours pas cliquer sur les violons de mon adversaire").
 */
export const isMusicianTarget = (context: ItemCtx) => {
  if (context.player === undefined || !context.rules.isTurnToPlay(context.player)) return false
  const violins = context.rules.material(MaterialType.ViolinToken)
  return context.rules
    .getLegalMoves(context.player)
    .some(
      (move) =>
        (isMoveItemType(MaterialType.ViolinToken)(move) && move.location.type === LocationType.MusicianSlot && move.location.parent === context.index) ||
        (isMoveItemType(MaterialType.LutherieToken)(move) &&
          move.location.type === LocationType.OnViolin &&
          violins.getItem(move.location.parent!)?.location.type === LocationType.MusicianSlot &&
          violins.getItem(move.location.parent!)?.location.parent === context.index)
    )
}

/** The card is in the right half of the table, where it is shown now (on a hovered board, at its enlarged place). */
export const isOnRightOfTable = (item: Item, context: ItemCtx) => {
  const table = tableBoundaries(context.rules, context.player)
  return cardOnTable(item, context).x > (table.xMin + table.xMax) / 2
}

/** How far a span has to move along one axis to lie between `min` and `max`: nothing when it already does. */
const pushInside = (center: number, half: number, min: number, max: number): number => Math.min(Math.max(center, min + half), max - half) - center

/**
 * The transform of a hovered card. It applies inside the card, after its own scale, so everything is divided by that
 * scale. A card near the edge of the table is pushed back inside it. A face-down card is not enlarged: it would only
 * show a bigger back.
 */
export const cardHoverTransform = (item: Item, context: ItemCtx): string[] => {
  if (context.type === MaterialType.CharacterCard && item.id === undefined) return []
  if (isMusicianTarget(context)) return []
  const { x, y, scale } = cardOnTable(item, context)
  const table = tableBoundaries(context.rules, context.player)
  const dx = pushInside(x, (cardWidth * hoverScale) / 2, table.xMin, table.xMax)
  const dy = pushInside(y, (cardHeight * hoverScale) / 2, table.yMin, table.yMax)
  return [`translate3d(${dx / scale}em, ${dy / scale}em, ${hoverHeight / scale}em)`, `scale(${hoverScale / scale})`]
}

/**
 * How high a hovered card rises above the table: above the item menus too (the help buttons of the Master Luthier, the
 * shifts of the sheet music…), that the framework raises about 15 cm.
 */
const hoverHeight = 20
