import {
  hideItemId,
  hideItemIdToOthers,
  MaterialGame,
  MaterialItem,
  MaterialMove,
  PositiveSequenceStrategy,
  SecretMaterialRules,
  TimeLimit
} from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'
import { TheFirstStepRule } from './rules/TheFirstStepRule'

/**
 * Contacts (decision D8): the top card of each pile (x = 0) is seen by everyone, the cards under it only by their owner.
 */
const hideContactsUnderTheTop = (item: MaterialItem<PlayerColor, LocationType>, player?: PlayerColor) =>
  item.location.player === player || item.location.x === 0 ? [] : ['id']

/**
 * This class implements the rules of the board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class PaneveggioRules
  extends SecretMaterialRules<PlayerColor, MaterialType, LocationType>
  implements TimeLimit<MaterialGame<PlayerColor, MaterialType, LocationType>, MaterialMove<PlayerColor, MaterialType, LocationType>, PlayerColor>
{
  rules = {
    [RuleId.TheFirstStep]: TheFirstStepRule
  }

  locationsStrategies = {
    [MaterialType.CharacterCard]: {
      [LocationType.Deck]: new PositiveSequenceStrategy(),
      [LocationType.PlayerHand]: new PositiveSequenceStrategy(),
      [LocationType.Contacts]: new PositiveSequenceStrategy(),
      [LocationType.TurnDiscard]: new PositiveSequenceStrategy(),
      [LocationType.PartnerMusicians]: new PositiveSequenceStrategy(),
      [LocationType.PartnerApprentices]: new PositiveSequenceStrategy()
    },
    [MaterialType.ViolinToken]: {
      [LocationType.WoodStock]: new PositiveSequenceStrategy()
    },
    [MaterialType.LutherieToken]: {
      [LocationType.OnViolin]: new PositiveSequenceStrategy()
    }
  }

  hidingStrategies = {
    [MaterialType.CharacterCard]: {
      [LocationType.Deck]: hideItemId,
      [LocationType.PlayerHand]: hideItemIdToOthers,
      [LocationType.Contacts]: hideContactsUnderTheTop
    }
  }

  giveTime(): number {
    return 60
  }
}
