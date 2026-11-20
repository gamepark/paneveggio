import { RuleId } from '@gamepark/paneveggio/rules/RuleId'
import { ComponentType, createElement } from 'react'
import { RuleHelp } from './RuleHelp'

/** A help page: the name of its texts and its number of paragraphs (see RuleHelp). */
const page = (name: string, paragraphs: number): ComponentType<{ close: () => void }> => {
  const Page = () => createElement(RuleHelp, { name, paragraphs })
  Page.displayName = `RuleHelp(${name})`
  return Page
}

const setupDecks = page('starting-decks', 2)
const mulligan = page('mulligan', 1)
const draft = page('draft', 1)
const startingMusician = page('starting-musician', 1)
const arrange = page('arrange', 2)
const sheetMusic = page('sheet-music', 5)
const playAction = page('play-action', 5)
const crafting = page('crafting', 4)
const relation = page('relation', 2)
const draw = page('draw', 2)
const restoration = page('restoration', 2)
const effect = page('effect', 2)
const reclaim = page('reclaim', 1)
const returned = page('returned', 1)
const endOfTurn = page('end-of-turn', 1)
const spread = page('spread', 2)
const aging = page('aging', 2)
const handLimit = page('hand-limit', 1)
const conservation = page('conservation', 3)
const turn = page('turn', 2)
const final = page('final', 2)

/**
 * The help of each step of the turn, opened with the "?" the framework adds to the header. The steps of the card effects share the help of
 * the effects (RULES p. 8): the help of the card tells the effect itself.
 */
export const RulesHelp: Record<number, ComponentType<{ close: () => void }>> = {
  [RuleId.ChooseStartingDeck]: setupDecks,
  [RuleId.Mulligan]: mulligan,
  [RuleId.KeepSeven]: mulligan,
  [RuleId.Draft]: draft,
  [RuleId.ChooseStartingMusician]: startingMusician,
  [RuleId.ArrangeStart]: arrange,
  [RuleId.SpreadReturnedTokens]: returned,
  [RuleId.SheetMusic]: sheetMusic,
  [RuleId.PlayAction]: playAction,
  [RuleId.Crafting]: crafting,
  [RuleId.Relation]: relation,
  [RuleId.Draw]: draw,
  [RuleId.Restoration]: restoration,
  [RuleId.PlaceCard]: effect,
  [RuleId.GainChoice]: effect,
  [RuleId.Age]: effect,
  [RuleId.Valorize]: effect,
  [RuleId.RecycleHeritage]: effect,
  [RuleId.DiscardFor]: effect,
  [RuleId.CopyRelation]: effect,
  [RuleId.Somis]: effect,
  [RuleId.DallAbaco]: effect,
  [RuleId.MoveNotes]: effect,
  [RuleId.Rameau]: effect,
  [RuleId.RepeatGain]: effect,
  [RuleId.LowerWood]: effect,
  [RuleId.ApplyEffect]: effect,
  [RuleId.ReclaimTokens]: reclaim,
  [RuleId.EndOfTurnEffect]: endOfTurn,
  [RuleId.SpreadDiscards]: spread,
  [RuleId.Aging]: aging,
  [RuleId.HandLimit]: handLimit,
  [RuleId.Conservation]: conservation,
  [RuleId.EndTurn]: turn,
  [RuleId.FinalSheetMusic]: final,
  [RuleId.FinalApprentices]: final
}
