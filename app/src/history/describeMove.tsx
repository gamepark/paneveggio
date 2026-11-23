import { stradivarius } from '@gamepark/paneveggio/logic/Solo'
import { Table } from '@gamepark/paneveggio/logic/Table'
import { CustomMoveType, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { Memory } from '@gamepark/paneveggio/material/Memory'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { RuleId } from '@gamepark/paneveggio/rules/RuleId'
import { VIOLINS_TO_END } from '@gamepark/paneveggio/rules/StartTurn'
import { Task } from '@gamepark/paneveggio/rules/Task'
import { MoveComponentContext } from '@gamepark/react-game'
import { isCustomMove, isMoveItem, isStartRule, MaterialGame, MaterialMove, MoveItem } from '@gamepark/rules-api'
import { ReactElement } from 'react'
import { CardText, PlayerText } from './LogParts'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>
type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
export type LogContext = MoveComponentContext<Move, PlayerColor, Game>

/**
 * One entry of the journal: its text (a key of the translations, its values and the pieces it names), its level (0: a
 * decision of a player, with their avatar; 1: what it came to, indented under it) and whose it is (its colour).
 */
export type MoveDescription = {
  code: string
  values?: Record<string, unknown>
  components?: Record<string, ReactElement>
  depth: number
  player?: PlayerColor
}

/**
 * What the journal writes down for a move, read off the move and off the state it was played on (context.game), never
 * off anything kept for the journal (references/front.md). The moves that only follow from a decision already written
 * down (a pile spread, a token worn away, the woods aging) say nothing.
 */
export const describeMove = (move: Move, context: LogContext): MoveDescription | undefined => {
  const rules = new PaneveggioRules(context.game)
  const rule = context.game.rule
  const player = rule?.player
  const task = rules.remind<Task[] | undefined>(Memory.Tasks)?.[0]
  const bot = stradivarius(context.game)

  if (isStartRule(move)) {
    if (move.id === RuleId.StradivariusConservation) return { code: 'log.stradivarius.conservation', depth: 0, player: bot }
    if (move.id === RuleId.StradivariusWorkshop) return { code: 'log.stradivarius.workshop', depth: 0, player: bot }
    return undefined
  }

  if (isCustomMove(move)) {
    const who = { player: <PlayerText player={player} /> }
    switch (move.type) {
      case CustomMoveType.ChooseSequence:
        return { code: `log.sequence.${move.data}`, components: who, depth: 0, player }
      case CustomMoveType.MoveNote:
        return { code: 'log.move-note', components: who, depth: 0, player }
      case CustomMoveType.Resolve:
        if (rule?.id !== RuleId.PlayAction || !task) return undefined
        return { code: 'log.action', values: { action: task.action, time: task.time }, components: who, depth: 0, player }
      case CustomMoveType.Pass:
        if (rule?.id !== RuleId.PlayAction || task?.resolved) return undefined
        return { code: 'log.skip-action', values: { action: task?.action }, components: who, depth: 0, player }
      case CustomMoveType.UseApprentice:
        return { code: 'log.use-apprentice', components: { ...who, card: card(rules, (move.data as { card: number }).card) }, depth: 1 }
      case CustomMoveType.AskForHelp:
        return { code: 'log.help', values: { resource: move.data as Resource }, components: who, depth: 0, player }
      case CustomMoveType.DrawCards:
        return rule?.id === RuleId.Relation ? { code: 'log.draw-cards', components: who, depth: 1 } : undefined
      case CustomMoveType.ChooseCard:
        return { code: rule?.id === RuleId.EndOfTurnEffect ? 'log.end-of-turn-effect' : 'log.relation-effect', components: { ...who, card: card(rules, move.data as number) }, depth: 1 }
      case CustomMoveType.TakeBack:
        return { code: 'log.take-back', components: { ...who, card: card(rules, move.data as number) }, depth: 1 }
      case CustomMoveType.EndTurn:
        if (player === undefined || rules.remind(Memory.EndTriggeredBy) !== undefined) return undefined
        if (new Table(rules).madeViolins(player).length < VIOLINS_TO_END) return undefined
        return { code: 'log.end-triggered', components: who, depth: 0, player }
      default:
        return undefined
    }
  }

  if (!isMoveItem(move)) return undefined
  switch (move.itemType) {
    case MaterialType.CharacterCard:
      return cardMove(move, rules, context)
    case MaterialType.ViolinToken:
      return violinMove(move, rules, context)
    case MaterialType.LutherieToken:
      return lutherieMove(move, rules, context)
    case MaterialType.NoteToken:
      if (move.location.type !== LocationType.ActivityTrack) return undefined
      return { code: 'log.stradivarius.activity', values: { level: move.location.x }, depth: 1, player: bot }
    default:
      return undefined
  }
}

const card = (rules: PaneveggioRules, index: number) => <CardText card={rules.material(MaterialType.CharacterCard).getItem<number>(index).id} />

const setupRules = [RuleId.ChooseStartingDeck, RuleId.Mulligan, RuleId.KeepSeven, RuleId.Draft, RuleId.ArrangeStart]

const cardMove = (move: MoveItem<PlayerColor, MaterialType, LocationType>, rules: PaneveggioRules, context: LogContext): MoveDescription | undefined => {
  const rule = context.game.rule?.id
  if (rule === undefined || setupRules.includes(rule)) return undefined
  const item = rules.material(MaterialType.CharacterCard).getItem<number>(move.itemIndex)
  const from = item.location
  const to = move.location
  const name = <CardText card={item.id} />
  const owner = (color?: PlayerColor) => <PlayerText player={color} />
  const bot = stradivarius(context.game)
  switch (to.type) {
    case LocationType.PartnerMusicians:
    case LocationType.PartnerApprentices:
      if (from.type === LocationType.StartingMusicians) {
        return { code: 'log.starting-musician', components: { player: owner(to.player), card: name }, depth: 0, player: to.player }
      }
      if (to.player === bot && from.type !== LocationType.PartnerMusicians) {
        return { code: to.type === LocationType.PartnerApprentices ? 'log.stradivarius.apprentice' : 'log.stradivarius.hire', components: { card: name }, depth: 1, player: bot }
      }
      return from.type === LocationType.PlayerHand ? { code: 'log.place-card', components: { player: owner(to.player), card: name }, depth: 1 } : undefined
    case LocationType.TurnDiscard:
      if (from.type === LocationType.PartnerMusicians) return { code: 'log.stradivarius.discard', components: { card: name }, depth: 1, player: bot }
      return { code: rule === RuleId.PlayAction ? 'log.boost' : 'log.discard', components: { player: owner(to.player), card: name }, depth: 1 }
    case LocationType.PlayerHand:
      if (from.type === LocationType.Deck) return { code: 'log.draw-deck', components: { player: owner(to.player) }, depth: 1 }
      if ((from.type === LocationType.Contacts || from.type === LocationType.StradivariusContacts) && from.player !== to.player) {
        return { code: 'log.swap-take', components: { player: owner(to.player), card: name, owner: owner(from.player) }, depth: 1 }
      }
      return from.type === LocationType.Contacts ? { code: 'log.draw-contact', components: { player: owner(to.player), card: name }, depth: 1 } : undefined
    case LocationType.Contacts:
    case LocationType.StradivariusContacts:
      if (from.type === LocationType.PlayerHand && from.player !== to.player) {
        return { code: 'log.swap-give', components: { player: owner(from.player), card: name, owner: owner(to.player) }, depth: 1 }
      }
      if (from.type === LocationType.Deck && to.type === LocationType.StradivariusContacts) {
        return { code: 'log.stradivarius.contact', components: { card: name }, depth: 1, player: bot }
      }
      return undefined
    case LocationType.Deck:
      return from.type === LocationType.StradivariusContacts ? { code: 'log.stradivarius.pair', components: { card: name }, depth: 1, player: bot } : undefined
    default:
      return undefined
  }
}

const violinMove = (move: MoveItem<PlayerColor, MaterialType, LocationType>, rules: PaneveggioRules, context: LogContext): MoveDescription | undefined => {
  const violin = rules.material(MaterialType.ViolinToken).getItem<PlayerColor>(move.itemIndex)
  const owner = <PlayerText player={violin.id} />
  const from = violin.location.type
  const to = move.location
  const table = new Table(rules)
  switch (to.type) {
    case LocationType.WoodStock:
      return from === LocationType.Reserve ? { code: 'log.buy-wood', values: { quality: 1 + tokensStacked(move.itemIndex, context) }, components: { player: owner }, depth: 1 } : undefined
    case LocationType.MusicianSlot: {
      const quality = from === LocationType.Reserve ? 1 + tokensStacked(move.itemIndex, context) : table.quality(move.itemIndex)
      return { code: 'log.craft', values: { quality }, components: { player: owner, card: card(rules, to.parent!) }, depth: 1 }
    }
    case LocationType.Heritage:
      if (from === LocationType.MusicianSlot) return { code: 'log.heritage', values: { level: to.id }, components: { player: owner }, depth: 1 }
      if (from === LocationType.Heritage) return { code: 'log.valorize', values: { level: to.id }, components: { player: owner }, depth: 1 }
      return { code: 'log.heritage-new', values: { level: to.id }, components: { player: owner }, depth: 1 }
    case LocationType.Reserve:
      if (from === LocationType.MusicianSlot) return { code: 'log.broken', components: { player: owner }, depth: 1 }
      if (from === LocationType.Heritage) return { code: 'log.recycle', components: { player: owner }, depth: 1 }
      return undefined
    default:
      return undefined
  }
}

const restorations = [RuleId.Restoration, RuleId.DallAbaco, RuleId.StradivariusEndOfTurn]

const lutherieMove = (move: MoveItem<PlayerColor, MaterialType, LocationType>, rules: PaneveggioRules, context: LogContext): MoveDescription | undefined => {
  const token = rules.material(MaterialType.LutherieToken).getItem<PlayerColor>(move.itemIndex)
  const from = token.location.type
  const to = move.location
  const rule = context.game.rule?.id
  const owner = <PlayerText player={token.id} />
  if (to.type === LocationType.OnViolin) {
    const violin = rules.material(MaterialType.ViolinToken).getItem<PlayerColor>(to.parent!)
    if (!rule || !restorations.includes(rule) || violin.location.type !== LocationType.MusicianSlot) return undefined
    return {
      code: 'log.restore',
      components: { player: owner, owner: <PlayerText player={violin.id} />, card: card(rules, violin.location.parent!) },
      depth: 1
    }
  }
  if (to.type === LocationType.OnNote) return { code: 'log.rameau', components: { player: owner }, depth: 1 }
  if (to.type === LocationType.HelpArea) {
    return rule === RuleId.StradivariusActivity ? { code: 'log.stradivarius.aid', depth: 1, player: token.id } : undefined
  }
  // A row of tokens moved together (a gain, a payment): written down once, on its first move, with its number.
  const resourceOf = (type?: LocationType) => (type === LocationType.Ducats ? Resource.Ducat : type === LocationType.Studies ? Resource.Study : undefined)
  const sameRow = (other: Move) =>
    isMoveItem(other) &&
    other.itemType === MaterialType.LutherieToken &&
    other.location.type === to.type &&
    rules.material(MaterialType.LutherieToken).getItem(other.itemIndex).location.type === from
  if (!isFirstOfRow(context, sameRow)) return undefined
  const n = rowLength(context, sameRow)
  if (to.type === LocationType.Ducats || to.type === LocationType.Studies) {
    if (from !== LocationType.Reserve && from !== LocationType.ReturnedTokens) return undefined
    return { code: 'log.gain', values: { n, resource: resourceOf(to.type) }, components: { player: owner }, depth: 1 }
  }
  if (to.type === LocationType.Reserve && (from === LocationType.Ducats || from === LocationType.Studies)) {
    if (rule === RuleId.ReclaimTokens) return { code: 'log.reclaim', values: { n }, components: { player: owner }, depth: 1 }
    return { code: 'log.pay', values: { n, resource: resourceOf(from) }, components: { player: owner }, depth: 1 }
  }
  if (to.type === LocationType.Reserve && from === LocationType.HelpArea) {
    return { code: 'log.return-help', values: { n }, components: { player: owner }, depth: 1 }
  }
  return undefined
}

/** The moves of the action, from this one on. */
const movesFromHere = (context: LogContext): Move[] => {
  const index = context.consequenceIndex
  return index === undefined ? [context.action.move, ...context.action.consequences] : context.action.consequences.slice(index)
}

const isFirstOfRow = (context: LogContext, belongs: (move: Move) => boolean) => {
  const index = context.consequenceIndex
  if (index === undefined) return true
  const previous = index === 0 ? context.action.move : context.action.consequences[index - 1]
  return !belongs(previous)
}

const rowLength = (context: LogContext, belongs: (move: Move) => boolean) => {
  let n = 0
  for (const next of movesFromHere(context)) {
    if (!belongs(next)) break
    n++
  }
  return n
}

/** The Lutherie tokens put on a Violin token right after it moves: the quality it gets (a wood bought, a free violin). */
const tokensStacked = (violin: number, context: LogContext) => {
  let n = 0
  for (const next of movesFromHere(context).slice(1)) {
    if (isMoveItem(next) && next.itemType === MaterialType.LutherieToken && next.location.type === LocationType.OnViolin && next.location.parent === violin) n++
    else if (n > 0 || !(isMoveItem(next) && next.itemType === MaterialType.LutherieToken)) break
  }
  return n
}
