import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { countSlots } from '@gamepark/paneveggio/material/CharacterCard'
import { DeckLocator, DropAreaDescription, ItemContext, ListLocator, Locator, PileLocator } from '@gamepark/react-game'
import { Location, MaterialItem } from '@gamepark/rules-api'
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
  SheetMusicLocator,
  studiesLocator,
  TurnDiscardLocator,
  WoodStockLocator
} from './PlayerAreaLocators'
import { cardHoverTransform } from './CardHover'
import { bandPosition, helpTokensX } from './MasterBoardLayout'
import { MasterBandDescription, MasterCostDescription } from './MasterBoardTexts'
import { cardPitch, deckCenter, masterBoardCenter, masterHeight, tokenDiameter } from './TableLayout'

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
  radius = { x: 1.6, y: 0.5 }
  locationDescription = new MasterBandDescription()

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const { x = 0, y = 0, z = 0 } = super.getItemCoordinates(item, context)
    return { x: x + helpTokensX, y, z }
  }
}

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
  placeOnShortClick = true
}

class MusicianSlotLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.CharacterCard
  locationDescription = new MusicianSlotDescription()

  getPositionOnParent(location: Location<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const total = countSlots(context.rules.material(MaterialType.CharacterCard).getItem<number>(location.parent!).id)
    return { x: 84.6, y: 88.65 - (total - 1 - (location.id as number)) * 17.56 }
  }
}

/** Rameau n°23: the token on its note, a little above it. */
class OnNoteLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.NoteToken
  coordinates = { y: -0.4, z: 0.1 }
}

/** A Lutherie token on a Violin token: each one a little higher, so that the pile shows its height. */
class OnViolinLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.ViolinToken

  getItemCoordinates(item: MaterialItem<PlayerColor, LocationType>, _context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const height = (item.location.x ?? 0) + 1
    return { y: -0.18 * height, z: 0.1 * height }
  }
}

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
  [LocationType.OnNote]: new OnNoteLocator()
}
