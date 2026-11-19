import { Action } from '../material/Action'
import { Resource } from '../material/CustomMoveType'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'

/**
 * A step waiting to be played, in the queue of the turn (Memory.Tasks): the equivalent of the task stack of the BGA
 * adaptation (DESIGN § 4.2). A chain of choices (an action, then the bonus of a slot, then a card to play…) is a queue
 * of tasks; a task can insert other tasks before the next ones.
 *
 * Every effect is optional (RULES p. 8 "Tous les effets et bonus sont optionnels"): a task can be passed unless it
 * is the cost of something already gained (`mandatory`).
 */
export type Task = {
  rule: RuleId
  player: PlayerColor
  mandatory?: boolean
  /** Lack of tokens: the player was already offered to take some back before this task (RULES p. 7). */
  reclaimOffered?: boolean
} & TaskParams

export type TaskParams = {
  /** PlayAction: the action; ApplyEffect Action: the action done by an effect. */
  action?: Action
  /** Time of an action. */
  time?: number
  /** PlayAction: the beats of the notes of the action. */
  beats?: number[]
  /** PlayAction: the apprentices already used during this action, each one once per action (RULES p. 8). */
  used?: number[]
  /** PlayAction: the action is resolved, only the apprentices "at any time of its resolution" are left. */
  resolved?: boolean
  /** Crafting: +1 quality per apprentice n°42 used; −1 quality with n°45 [H17]. */
  qualityPlus?: number
  qualityMinus?: boolean
  /** Crafting: the only musician allowed (Veracini n°38). */
  onlyCard?: number
  /** Relation: the partners without violin can be activated (apprentice n°58). */
  partnerWithoutViolin?: boolean
  /** Number of things left to do: tokens to place (Restoration), cards to discard, gains, notes to move, tokens to take. */
  count?: number
  /** Amount of a gain or of a valorization. */
  n?: number
  /** A card number. */
  card?: number
  /** PlaceCard: the conditions. */
  apprenticeOnly?: boolean
  ignorePrerequisites?: boolean
  studies?: number
  /** DiscardFor: which cards and what for. */
  filter?: DiscardFilter
  reward?: DiscardReward
  /** DiscardFor Bonporti n°53: the cards discarded so far. */
  discarded?: number
  /** Valorize: the cost. */
  cost?: ValorizeCost
  /** CopyRelation: whose effect. */
  copy?: CopyMode
  /** ReclaimTokens: only from the Ducats and Studies areas [H15]. */
  resourcesOnly?: boolean
  /** ApplyEffect: what to apply. */
  effect?: Effect
}

export enum DiscardFilter {
  Any = 1,
  Musician,
  /** A musician with a Relation effect (Troubadour n°51). */
  Relation
}

export enum DiscardReward {
  /** A cost already paid: nothing more. */
  Nothing = 1,
  GainChoice,
  Valorize,
  Ducats,
  /** Troubadour n°50: the action the discarded card is affiliated to, for `time` beats. */
  Affiliated,
  /** Troubadour n°51: the Relation effect of the discarded card. */
  RelationOf,
  /** Burgher n°63: as many ducats as the Prestige of the discarded musician. */
  PrestigeDucats,
  /** Bonporti n°53: discard 1 to 3 cards, then valorize by as many. */
  ValorizeByCount
}

export enum ValorizeCost {
  None = 1,
  Studies,
  /** Ducats and/or studies, as the player likes. */
  Either,
  /** Geminiani n°70: x ducats to valorize by x. */
  DucatsX
}

export enum CopyMode {
  /** Mascitti n°54: a partner musician of Prestige 1 or 2, even without violin. */
  PartnerUpTo2 = 1,
  /** Burgher n°67: a musician of an opponent, even without violin. */
  Opponent
}

export enum EffectType {
  Gain = 1,
  BuyWood,
  ReturnHelp,
  /** The +1 quality bonus of a slot. */
  SlotQuality,
  RelationEffect,
  EndOfTurnEffect,
  /** An action done by an effect (Collector n°31…): no card nor apprentice can boost it (RULES p. 19). */
  Action,
  /** End of the Workshop: each empty pile of Contacts gets the top card of the draw pile. */
  RefillContacts
}

export type Effect =
  | { type: EffectType.Gain; resource: Resource; n: number }
  | { type: EffectType.BuyWood; quality: number; payWithStudy?: boolean }
  | { type: EffectType.ReturnHelp; n: number }
  | { type: EffectType.SlotQuality; violin: number }
  /** context: the card whose violins are counted for "x violins on this card"; undefined for a discarded card. */
  | { type: EffectType.RelationEffect; card: number; context?: number }
  | { type: EffectType.EndOfTurnEffect; card: number; context?: number }
  | { type: EffectType.Action; action: Action; time: number }
  | { type: EffectType.RefillContacts }

export const task = (rule: RuleId, player: PlayerColor, params: TaskParams = {}, mandatory = false): Task => ({
  rule,
  player,
  ...params,
  ...(mandatory ? { mandatory } : {})
})

export const effectTask = (player: PlayerColor, effect: Effect): Task => task(RuleId.ApplyEffect, player, { effect }, true)
