import { getEnumValues } from '@gamepark/rules-api'

/**
 * The 5 actions of the game, in the order of the card numbers (Wood 01–15, Study 16–30, Crafting 31–45,
 * Relation 46–60, Restoration 61–75). A card is affiliated to one action, and each line of the sheet music is an action.
 */
export enum Action {
  Wood = 1,
  Study,
  Crafting,
  Relation,
  Restoration
}

export const actions = getEnumValues(Action)

/** Line of the action on the sheet music, from the top: Restoration (0), Relation, Crafting, Study, Wood (4). */
export const getSheetMusicLine = (action: Action) => Action.Restoration - action
