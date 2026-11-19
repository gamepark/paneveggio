import { getSheetMusicLine } from '@gamepark/paneveggio/material/Action'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { ItemContext, ListLocator, Locator, MaterialContext, PileLocator } from '@gamepark/react-game'
import { Location, MaterialItem } from '@gamepark/rules-api'
import {
  apprenticesY,
  boardCenter,
  cardPitch,
  contactsY,
  contactStep,
  contactsInSteps,
  contactX,
  getSeat,
  handGap,
  handX,
  handY,
  layoutDependencies,
  leftColumnX,
  musiciansY,
  partnersX,
  seatScale
} from './TableLayout'
import { cardHoverTransform } from './CardHover'

type Context = MaterialContext<PlayerColor, MaterialType, LocationType>
type ItemCtx = ItemContext<PlayerColor, MaterialType, LocationType>
type Loc = Location<PlayerColor, LocationType>

/** The owner of the cards sees their faces. */
const isOwner = (location: Loc, context: Context) => location.player === context.player

/** The board of a player, smaller for the other players. Everything in a player area is placed on it, so it follows. */
export class PlayerBoardLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  getCoordinates(location: Loc, context: Context) {
    return boardCenter(context.rules, location.player!, context.player)
  }

  getPositionDependencies(_location: Loc, context: Context) {
    return layoutDependencies(context.rules)
  }

  placeItem(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx): string[] {
    const scale = seatScale(getSeat(context.rules, item.location.player!, context.player))
    return scale === 1 ? super.placeItem(item, context) : [...super.placeItem(item, context), `scale(${scale})`]
  }
}

/** The static board item of the player who owns the location. */
const playerBoard = (location: Loc): MaterialItem<PlayerColor, LocationType> => ({
  location: { type: LocationType.PlayerBoard, player: location.player }
})

// ------------------------------------------------------------------ around the board (cm from the centre of the board)

export class FirstPlayerLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: leftColumnX, y: contactsY }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return cardHoverTransform(item, context)
  }
}

/** The 4 piles of Contacts. Their owner sees them in steps (the banner of each card under the top one), the others a pile. */
export class ContactsLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard

  getCoordinates(location: Loc) {
    return { x: contactX(location.id), y: contactsY }
  }

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    const { x = 0, y = 0 } = this.getCoordinates(item.location)
    const depth = item.location.x ?? 0
    const step = contactsInSteps(context.rules, item.location.player!, context.player) ? contactStep : 0.05
    return { x, y: y - depth * step, z: (10 - depth) * 0.05 }
  }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return cardHoverTransform(item, context)
  }
}

export class TurnDiscardLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: leftColumnX, y: musiciansY }
  gap = { y: 1.5 }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return cardHoverTransform(item, context)
  }
}

export class PartnerMusiciansLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: partnersX, y: musiciansY }
  gap = { x: cardPitch }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return cardHoverTransform(item, context)
  }
}

export class PartnerApprenticesLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: partnersX, y: apprenticesY }
  gap = { x: cardPitch }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return cardHoverTransform(item, context)
  }
}

/** A hand is spread under the board for its owner. The hands of the others are face-down piles. */
export class PlayerHandLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: handX, y: handY }

  getGap(location: Loc, context: Context) {
    if (!isOwner(location, context)) return { x: 0.05, y: -0.05 }
    return { x: handGap(this.countListItems(location, context)) }
  }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return cardHoverTransform(item, context)
  }
}

/** Draft: the packet to choose from, in a row where the Contacts will be (they are laid out after the draft). */
export class DraftPacketLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: handX, y: contactsY }

  getGap(location: Loc, context: Context) {
    return isOwner(location, context) ? { x: cardPitch * 0.75 } : { x: 0.05, y: -0.05 }
  }
}

/** The tokens given back by another player, waiting to become ducats or studies (D2): under the frame of the resources. */
export class ReturnedTokensLocator extends PileLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  positionOnParent = { x: 45, y: 67 }
  radius = { x: 2, y: 0.3 }
}

/** The tokens not used yet, on the left of the hand: the Violin tokens above, the Lutherie tokens under them. */
export class ReserveLocator extends PileLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  coordinates = { x: leftColumnX, y: handY }
  radius = { x: 2, y: 1.3 }

  getPileId(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    return `${super.getPileId(item, context)}-${context.type}`
  }

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemCtx) {
    const { x = 0, y = 0, z = 0 } = super.getItemCoordinates(item, context)
    return { x, y: y + (context.type === MaterialType.ViolinToken ? -2 : 2), z }
  }
}

// ------------------------------------------------------------------ on the board (% of the board, measured on BGA)

/** The 7 beats (x) and the 5 action lines of the sheet music: the notes go on the intersections. */
export class SheetMusicLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard

  getPositionOnParent(location: Loc) {
    return { x: 35.9 + (location.x ?? 0) * 6.9, y: 14.8 + getSheetMusicLine(location.id) * 7.76 }
  }
}

/** Ducats and Studies areas, in the frame under the sheet music. */
class BoardAreaLocator extends PileLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
}

export const ducatsLocator = new BoardAreaLocator({ positionOnParent: { x: 17.8, y: 59.7 }, radius: { x: 1.6, y: 0.25 } })
export const studiesLocator = new BoardAreaLocator({ positionOnParent: { x: 72.5, y: 59.7 }, radius: { x: 2, y: 0.25 } })

/** The wood stock: one pile per wood, from the left of its frame. */
export class WoodStockLocator extends ListLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  positionOnParent = { x: 35, y: 59.7 }
  gap = { x: 1.5 }
}

/** Heritage: a cut-out under each mark 4, 3, 2, 1, on the right edge of the board. */
const heritageY: Record<number, number> = { 4: 21.5, 3: 34.6, 2: 48.0, 1: 61.1 }

export class HeritageLocator extends PileLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.PlayerBoard
  getParentItem = playerBoard
  radius = { x: 0.7, y: 0.1 }

  getPositionOnParent(location: Loc) {
    return { x: 88.4, y: heritageY[location.id] }
  }
}
