import { Action } from '../material/Action'
import { Resource } from '../material/CustomMoveType'
import { SheetMusic } from '../logic/SheetMusic'
import { GameMaterial, Table } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { CopyMode, DiscardFilter, DiscardReward, effectTask, EffectType, Task, task, ValorizeCost } from './Task'

/**
 * The effects printed on the cards, as tasks (BGA: Rules/Engine/CardEffects.php; texts: ASSETS.md; details: RULES p. 19
 * and 20). `card` is the index of the card whose effect is applied, `context` the index of the card whose violins are
 * counted for "x violins on this card" (none for a card discarded from the hand, RULES p. 20 n°51).
 */

const gain = (player: PlayerColor, resource: Resource, n: number) => effectTask(player, { type: EffectType.Gain, resource, n })
const study = (player: PlayerColor, n: number) => gain(player, Resource.Study, n)
const ducats = (player: PlayerColor, n: number) => gain(player, Resource.Ducat, n)
const buyWood = (player: PlayerColor, quality: number) => effectTask(player, { type: EffectType.BuyWood, quality })
const returnHelp = (player: PlayerColor, n: number) => effectTask(player, { type: EffectType.ReturnHelp, n })
const crafting = (player: PlayerColor, time: number) => effectTask(player, { type: EffectType.Action, action: Action.Crafting, time })
const discard = (player: PlayerColor, reward: DiscardReward, params: Partial<Task> = {}) =>
  task(RuleId.DiscardFor, player, { count: 1, filter: DiscardFilter.Any, reward, ...params })

/**
 * The tasks of an action of x beats done by an effect (Troubadour n°50 "effectuez l'action associée pour 3 temps",
 * Collectors…): no card nor apprentice can boost it (RULES p. 19).
 */
export const actionTasks = (player: PlayerColor, action: Action, time: number): Task[] => {
  if (time < 1) return []
  switch (action) {
    case Action.Wood:
      return [buyWood(player, time)]
    case Action.Study:
      return [study(player, time)]
    case Action.Crafting:
      return [task(RuleId.Crafting, player, { time })]
    case Action.Relation:
      return [task(RuleId.Relation, player, { time })]
    case Action.Restoration:
      return [task(RuleId.Restoration, player, { count: time })]
  }
}

/** The Relation effect of a musician (cards with a Relation effect of 1 to 3 beats). */
export const relationEffect = (game: GameMaterial, player: PlayerColor, card: number, context?: number): Task[] => {
  const table = new Table(game)
  const violins = context === undefined ? 0 : table.violinsOnCard(context).length
  const woods = table.woods(player).length
  switch (table.cardId(card)) {
    // Wood: Nobles
    case 1:
      return [buyWood(player, 1)]
    case 2:
      return [buyWood(player, 2)]
    case 3:
      return violins > 0 ? [buyWood(player, violins)] : []
    case 4:
      return woods > 0 ? [task(RuleId.GainChoice, player, { n: woods })] : []
    case 5:
      return [returnHelp(player, 2), study(player, 1)]
    // Study: Chapel Masters
    case 16:
      return [study(player, 1)]
    case 17:
      return [study(player, 1), task(RuleId.Age, player)]
    case 18:
      return [study(player, 1), ducats(player, 1)]
    case 19:
      return violins > 0 ? [task(RuleId.GainChoice, player, { n: violins })] : []
    case 20:
      return [task(RuleId.Valorize, player, { n: 2, cost: ValorizeCost.Studies })]
    case 21:
      return [task(RuleId.PlaceCard, player, { apprenticeOnly: true, ignorePrerequisites: true })]
    // Crafting: Collectors (effects: no boost, RULES p. 19)
    case 31:
      return [crafting(player, 1)]
    case 32:
      return [crafting(player, 2)]
    case 33:
      return [task(RuleId.RecycleHeritage, player)]
    case 34:
      return violins > 0 ? [crafting(player, violins)] : []
    case 35:
      return [crafting(player, 3)]
    // Relation: Troubadours
    case 46:
      return [discard(player, DiscardReward.GainChoice, { n: 1 })]
    case 47:
      return [discard(player, DiscardReward.Valorize, { n: 1 })]
    case 48:
      return [discard(player, DiscardReward.Ducats, { n: 3 })]
    case 49:
      return [discard(player, DiscardReward.Valorize, { count: 2, n: 2 })]
    case 50:
      return [discard(player, DiscardReward.Affiliated, { time: 3 })]
    case 51:
      return [discard(player, DiscardReward.RelationOf, { filter: DiscardFilter.Relation })]
    case 52:
      return [task(RuleId.RepeatGain, player, { count: 3 })]
    // Restoration: Burghers
    case 61:
      return [task(RuleId.Restoration, player, { count: 1 })]
    case 62:
      return [ducats(player, 2)]
    case 63:
      return [discard(player, DiscardReward.PrestigeDucats, { filter: DiscardFilter.Musician })]
    case 64:
      return violins > 0 ? [task(RuleId.Restoration, player, { count: violins })] : []
    case 65:
      return [task(RuleId.Valorize, player, { n: 2, cost: ValorizeCost.Either })]
    case 67:
      return [task(RuleId.CopyRelation, player, { copy: CopyMode.Opponent })]
    default:
      return []
  }
}

/** The end of turn effect of a musician (cards marked ‖), after the sheet music (RULES p. 14). */
export const endOfTurnEffect = (game: GameMaterial, player: PlayerColor, card: number, context?: number): Task[] => {
  const table = new Table(game)
  const violins = context === undefined ? 0 : table.violinsOnCard(context).length
  const woods = table.woods(player).length
  switch (table.cardId(card)) {
    // Wood
    case 6:
      return violins > 0 ? [buyWood(player, violins)] : []
    case 7:
      return [task(RuleId.Age, player)]
    case 8: // Vivaldi
      return [task(RuleId.PlaceCard, player, { studies: 1 })]
    case 9: // Tessarini
      return woods > 0 ? [task(RuleId.Valorize, player, { n: woods })] : []
    case 10:
      return [task(RuleId.Somis, player)]
    // Study
    case 22: // RULES p. 20: free note moves, as many as violins on this card
      return violins > 0 ? [task(RuleId.MoveNotes, player, { count: violins })] : []
    case 23:
      return [task(RuleId.Rameau, player)]
    case 24: // Tartini
      return new SheetMusic(game, player).hasNoteOnEveryLine() ? [task(RuleId.Valorize, player, { n: 1 })] : []
    case 25: // Bach
      return [study(player, 1)]
    // Crafting
    case 36:
      return [task(RuleId.RecycleHeritage, player)]
    case 37:
      return violins > 0 ? [crafting(player, violins)] : []
    case 38: // Veracini, RULES p. 20: only on Veracini, on a free slot
      return [task(RuleId.Crafting, player, { time: 4, onlyCard: card })]
    case 39: // Senaillé
      return [task(RuleId.Valorize, player, { n: 1 })]
    case 40: // Leclair
      return [returnHelp(player, 1), study(player, 1)]
    // Relation
    case 53: // Bonporti
      return [discard(player, DiscardReward.ValorizeByCount, { count: 3, discarded: 0 })]
    case 54:
      return [task(RuleId.CopyRelation, player, { copy: CopyMode.PartnerUpTo2 })]
    case 55: // Pisendel
      return [task(RuleId.Draw, player)]
    // Restoration
    case 66:
      return [task(RuleId.Restoration, player, { count: 1 })]
    case 68:
      return [task(RuleId.DallAbaco, player)]
    case 69: // Albinoni
      return [ducats(player, 1)]
    case 70: // Geminiani
      return [task(RuleId.Valorize, player, { cost: ValorizeCost.DucatsX })]
    default:
      return []
  }
}
