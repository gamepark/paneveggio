import { getAffiliation, isApprentice } from '@gamepark/paneveggio/material/CharacterCard'
import { CustomMoveType } from '@gamepark/paneveggio/material/CustomMoveType'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { Memory } from '@gamepark/paneveggio/material/Memory'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { Task } from '@gamepark/paneveggio/rules/Task'
import { useLegalMove, useRules } from '@gamepark/react-game'
import { isCustomMoveType, MaterialMove } from '@gamepark/rules-api'
import { TFunction } from 'i18next'

export type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

/** A custom move of a type, and with this data if given. */
export const isCustom =
  (type: CustomMoveType, data?: unknown) =>
  (move: Move): boolean =>
    isCustomMoveType(type)(move) && (data === undefined || JSON.stringify(move.data) === JSON.stringify(data))

/** The current task of the queue of the turn, with its parameters. */
export const useTask = (): Task | undefined => useRules<PaneveggioRules>()?.remind<Task[] | undefined>(Memory.Tasks)?.[0]

/** The 3 Prestige 4 musicians of each action have a name; the others are named after their family. */
const famousNames: Record<number, string> = {
  8: 'Vivaldi',
  9: 'Tessarini',
  10: 'Somis',
  23: 'Rameau',
  24: 'Tartini',
  25: 'Bach',
  38: 'Veracini',
  39: 'Senaillé',
  40: 'Leclair',
  53: 'Bonporti',
  54: 'Mascitti',
  55: 'Pisendel',
  68: "Dall'Abaco",
  69: 'Albinoni',
  70: 'Geminiani'
}

/** The name of a Character card and its number: "Noble n°01". */
export const cardName = (t: TFunction, card: number) => {
  const name = famousNames[card] ?? (isApprentice(card) ? t('card.apprentice') : t('card.family', { action: getAffiliation(card) }))
  return t('card.name', { name, number: String(card).padStart(2, '0') })
}

/** The "pass" button of a step. */
export const usePass = () => useLegalMove(isCustomMoveType(CustomMoveType.Pass))
