import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { countSlots } from '@gamepark/paneveggio/material/CharacterCard'
import { DeckLocator, DropAreaDescription, ItemContext, ListLocator, LocationDescription, Locator, MaterialContext, PileLocator } from '@gamepark/react-game'
import { isMoveItemType, Location, MaterialItem, MaterialMove } from '@gamepark/rules-api'
import {
  ContactsLocator,
  DraftPacketLocator,
  ducatsLocator,
  FirstPlayerLocator,
  HeritageLocator,
  PartnerApprenticesLocator,
  PartnerMusiciansLocator,
  PlayerBoardLocator,
  PlayerHandLocator,
  ReserveLocator,
  ReturnedTokensLocator,
  StartingCardsLocator,
  ActivityTrackLocator,
  StradivariusContactsLocator,
  SheetMusicLocator,
  studiesLocator,
  TurnDiscardLocator,
  WoodStockLocator
} from './PlayerAreaLocators'
import { cardHoverTransform } from './CardHover'
import { bandPosition, helpTokensX } from './MasterBoardLayout'
import { MasterBandDescription, MasterCostDescription } from './MasterBoardTexts'
import {
  cardPitch,
  deckCenter,
  masterBoardCenter,
  masterHeight,
  tokenDiameter,
  tokenOnViolinPitch,
  tokenOnViolinScale,
  tokenOnViolinY,
  violinOnMusicianScale,
  cardHeight,
  cardWidth,
  isStacksPanelSlot,
  tablePlayers
} from './TableLayout'
import { StacksPanel } from './StacksPanel'
import { ViolinDrawing } from './ViolinDrawing'

/**
 * The 4 musicians of the Master Luthier board, on its illustration, each one above its column of the green band
 * (columns between the lines at 28.44, 49.89 and 71.33 % of the width, measured on BGA).
 */
const masterSlotX: Record<number, number> = { 1: 17.72, 2: 39.17, 3: 60.61, 4: 82.06 }

class MasterMusicianLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.MasterBoard
  /** The extra cost of the column, under the card (MasterBoardTexts). */
  locationDescription = new MasterCostDescription()

  getPositionOnParent(location: Location<PlayerColor, LocationType>) {
    return { x: masterSlotX[location.id], y: 32 }
  }

  getHoverTransform(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return cardHoverTransform(item, context)
  }
}

/**
 * The help area of the Master Luthier board: the brown band at the bottom, with its texts (MasterBoardTexts); the tokens
 * blocked there are piled on its left.
 */
class HelpAreaLocator extends PileLocator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.MasterBoard
  positionOnParent = bandPosition
  radius = 0.12
  maxAngle = 0
  locationDescription = new MasterBandDescription()

  /** One tidy pile per player, its number written on the top token, as the ducats and studies (Ludo, 20/11/2026). */
  getPileId(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return `${super.getPileId(item, context)}-${item.id}`
  }

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const { x = 0, y = 0, z = 0 } = super.getItemCoordinates(item, context)
    const players = tablePlayers(context.rules)
    const seat = players.indexOf(item.id as PlayerColor)
    return { x: x + helpTokensX + (seat - (players.length - 1) / 2) * helpPilePitch, y, z }
  }
}

const helpPilePitch = 1.6

/**
 * A violin on a musician card, on the circle of its slot: the slots are on the right edge of the card, the last one
 * centred at 88.65 % of its height, then every 17.56 % upwards (BGA measures, Game.slotTop).
 */
/**
 * A free slot where a wood can be placed (Crafting): a round drop area. With a single wood in stock, a click on the slot
 * is enough; with several, the wood is dragged onto it.
 */
class MusicianSlotDescription extends DropAreaDescription<PlayerColor, MaterialType, LocationType> {
  width = tokenDiameter
  height = tokenDiameter
  borderRadius = tokenDiameter / 2

  /**
   * A click on the slot puts the wood there: the only wood that can go, or the wood selected with a click on it (the
   * player chooses which wood they send, Ludo 20/11/2026). The framework plays the click only when one move matches.
   */
  canShortClick(move: MaterialMove, location: Location<PlayerColor, LocationType>, context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    if (!this.isMoveToLocation(move, location, context) || !isMoveItemType(MaterialType.ViolinToken)(move)) return false
    const selected = context.rules.material(MaterialType.ViolinToken).selected().getIndexes()
    return !selected.length || selected.includes(move.itemIndex)
  }
}

class MusicianSlotLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.CharacterCard
  locationDescription = new MusicianSlotDescription()

  getPositionOnParent(location: Location<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (isStacksPanelSlot(location.id)) return { x: 50, y: 50 }
    const total = countSlots(context.rules.material(MaterialType.CharacterCard).getItem<number>(location.parent!).id)
    return { x: 84.6, y: 88.65 - (total - 1 - (location.id as number)) * 17.56 }
  }

  /** A violin on a musician is drawn smaller than its slot (TableLayout); its tokens, placed on it, shrink with it. */
  placeItem(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return [...super.placeItem(item, context), `scale(${violinOnMusicianScale})`]
  }

  /**
   * A free slot is a drop area; a slot with a violin has a drawing of it printed on the card (ViolinDrawing). The panel
   * of the violins of the card (StacksPanel) is a pseudo slot, centred on the card.
   */
  getLocationDescription(location: Location<PlayerColor, LocationType>, context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    if (isStacksPanelSlot(location.id)) return stacksPanelDescription
    const taken = context.rules.material(MaterialType.ViolinToken).location(LocationType.MusicianSlot).parent(location.parent).locationId(location.id).length
    return taken ? violinDrawingDescription : this.locationDescription
  }
}

class ViolinDrawingDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = tokenDiameter
  height = tokenDiameter
  extraCss = css`
    pointer-events: none;
  `
  content = ViolinDrawing
}

const violinDrawingDescription = new ViolinDrawingDescription()

class OnViolinDropDescription extends DropAreaDescription<PlayerColor, MaterialType, LocationType> {
  width = tokenDiameter
  height = tokenDiameter
  borderRadius = tokenDiameter / 2
  /** It lies on the violin: a click on it puts the token, as a click on the violin would. */
  placeOnShortClick = true
}

class StacksPanelDescription extends LocationDescription<PlayerColor, MaterialType, LocationType> {
  width = cardWidth
  height = cardHeight
  extraCss = css`
    pointer-events: none;
  `
  content = StacksPanel
}

const stacksPanelDescription = new StacksPanelDescription()

/** Rameau n°23: the token on its note, a little above it. */
class OnNoteLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.NoteToken
  coordinates = { y: -0.4, z: 0.1 }
}

/** A Lutherie token on a Violin token: each one a little higher, so that the pile shows its height. */
class OnViolinLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.ViolinToken
  /** A violin on a musician is a drop area for a token of the reserve (Restoration); a click on the violin works too. */
  locationDescription = new OnViolinDropDescription()

  getLocations(context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const violin = context.rules.material(MaterialType.ViolinToken).getItem(context.index)
    return violin?.location.type === LocationType.MusicianSlot ? [{ type: LocationType.OnViolin, parent: context.index }] : []
  }

  /**
   * A wood of the stock: its Lutherie tokens are piled on it. A violin on a musician: as on BGA, its Lutherie tokens are
   * small discs in a row under it, in their order of arrival, so that the colour of each one can be seen (Ludo,
   * 20/11/2026); the violin shows its quality (ViolinTokenDescription).
   */
  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const x = item.location.x ?? 0
    if (onMusician(item, context)) {
      const count = context.rules.material(MaterialType.LutherieToken).location(LocationType.OnViolin).parent(item.location.parent).length
      return { x: (x - (count - 1) / 2) * tokenOnViolinPitch, y: tokenOnViolinY, z: 0.1 }
    }
    return { y: -0.18 * (x + 1), z: 0.1 * (x + 1) }
  }

  placeItem(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const transform = super.placeItem(item, context)
    return onMusician(item, context) ? [...transform, `scale(${tokenOnViolinScale})`] : transform
  }
}

const onMusician = (item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) =>
  context.rules.material(MaterialType.ViolinToken).getItem(item.location.parent!).location.type === LocationType.MusicianSlot

export const Locators: Partial<Record<LocationType, Locator<PlayerColor, MaterialType, LocationType>>> = {
  [LocationType.MasterBoard]: new Locator({ coordinates: masterBoardCenter }),
  [LocationType.MasterMusician]: new MasterMusicianLocator(),
  [LocationType.HelpArea]: new HelpAreaLocator(),
  [LocationType.Deck]: new DeckLocator({ coordinates: deckCenter }),
  // Setup only: the starting cards and the starting musicians, in a row on the Master Luthier board.
  [LocationType.StartingCards]: new StartingCardsLocator(),
  [LocationType.StartingMusicians]: new ListLocator({ coordinates: { x: masterBoardCenter.x - 2 * cardPitch, y: masterBoardCenter.y - masterHeight / 2 + 4.5 }, gap: { x: cardPitch } }),
  [LocationType.PlayerBoard]: new PlayerBoardLocator(),
  [LocationType.FirstPlayer]: new FirstPlayerLocator(),
  [LocationType.PlayerHand]: new PlayerHandLocator(),
  [LocationType.DraftPacket]: new DraftPacketLocator(),
  [LocationType.Contacts]: new ContactsLocator(),
  [LocationType.TurnDiscard]: new TurnDiscardLocator(),
  [LocationType.PartnerMusicians]: new PartnerMusiciansLocator(),
  [LocationType.PartnerApprentices]: new PartnerApprenticesLocator(),
  [LocationType.Reserve]: new ReserveLocator(),
  [LocationType.ReturnedTokens]: new ReturnedTokensLocator(),
  [LocationType.SheetMusic]: new SheetMusicLocator(),
  [LocationType.Ducats]: ducatsLocator,
  [LocationType.Studies]: studiesLocator,
  [LocationType.WoodStock]: new WoodStockLocator(),
  [LocationType.Heritage]: new HeritageLocator(),
  [LocationType.MusicianSlot]: new MusicianSlotLocator(),
  [LocationType.OnViolin]: new OnViolinLocator(),
  [LocationType.OnNote]: new OnNoteLocator(),
  [LocationType.ActivityTrack]: new ActivityTrackLocator(),
  [LocationType.StradivariusContacts]: new StradivariusContactsLocator()
}
