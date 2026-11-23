import { stradivarius } from '@gamepark/paneveggio/logic/Solo'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { usePlayerName, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'

/** The name of the owner of an area: a player, or in solo Stradivarius, who has no seat. */
export const useAreaName = (player: PlayerColor) => {
  const { t } = useTranslation()
  const rules = useRules<MaterialRules<PlayerColor, MaterialType, LocationType>>()
  const name = usePlayerName(player)
  return rules && player === stradivarius(rules.game) ? t('solo.stradivarius') : name
}
