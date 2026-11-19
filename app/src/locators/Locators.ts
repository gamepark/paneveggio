import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { DeckLocator, ItemContext, Locator, PileLocator } from '@gamepark/react-game'
import { Location, MaterialItem } from '@gamepark/rules-api'
import {
  ContactsLocator,
  ducatsLocator,
  FirstPlayerLocator,
  HeritageLocator,
  PartnerApprenticesLocator,
  PartnerMusiciansLocator,
  PlayerBoardLocator,
  PlayerHandLocator,
  ReserveLocator,
  SheetMusicLocator,
  studiesLocator,
  TurnDiscardLocator,
  WoodStockLocator
} from './PlayerAreaLocators'
import { deckCenter, masterBoardCenter } from './TableLayout'

/**
 * The 4 musicians of the Master Luthier board, on its illustration, each one above its column of the green band
 * (columns between the lines at 28.44, 49.89 and 71.33 % of the width, measured on BGA).
 */
const masterSlotX: Record<number, number> = { 1: 17.72, 2: 39.17, 3: 60.61, 4: 82.06 }

class MasterMusicianLocator extends Locator<PlayerColor, MaterialType, LocationType> {
  parentItemType = MaterialType.MasterBoard

  getPositionOnParent(location: Location<PlayerColor, LocationType>) {
    return { x: masterSlotX[location.id], y: 32 }
  }
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
  [LocationType.HelpArea]: new PileLocator({ parentItemType: MaterialType.MasterBoard, positionOnParent: { x: 25, y: 87 }, radius: { x: 3, y: 0.8 } }),
  [LocationType.Deck]: new DeckLocator({ coordinates: deckCenter }),
  [LocationType.PlayerBoard]: new PlayerBoardLocator(),
  [LocationType.FirstPlayer]: new FirstPlayerLocator(),
  [LocationType.PlayerHand]: new PlayerHandLocator(),
  [LocationType.Contacts]: new ContactsLocator(),
  [LocationType.TurnDiscard]: new TurnDiscardLocator(),
  [LocationType.PartnerMusicians]: new PartnerMusiciansLocator(),
  [LocationType.PartnerApprentices]: new PartnerApprenticesLocator(),
  [LocationType.Reserve]: new ReserveLocator(),
  [LocationType.SheetMusic]: new SheetMusicLocator(),
  [LocationType.Ducats]: ducatsLocator,
  [LocationType.Studies]: studiesLocator,
  [LocationType.WoodStock]: new WoodStockLocator(),
  [LocationType.Heritage]: new HeritageLocator(),
  // MusicianSlot (violins on the cards) comes with the rules: the position of a slot depends on the slots printed on the card.
  [LocationType.OnViolin]: new OnViolinLocator()
}
