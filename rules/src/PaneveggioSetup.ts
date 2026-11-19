import { MaterialGameSetup } from '@gamepark/rules-api'
import { PaneveggioOptions } from './PaneveggioOptions'
import { PaneveggioRules } from './PaneveggioRules'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { RuleId } from './rules/RuleId'

/**
 * This class creates a new Game based on the game options
 */
export class PaneveggioSetup extends MaterialGameSetup<PlayerColor, MaterialType, LocationType, PaneveggioOptions> {
  Rules = PaneveggioRules

  setupMaterial(_options: PaneveggioOptions) {
    // TODO
  }

  start() {
    this.startPlayerTurn(RuleId.TheFirstStep, this.players[0])
  }
}
