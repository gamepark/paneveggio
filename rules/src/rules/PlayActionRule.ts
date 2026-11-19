import { CustomMove, isCustomMoveType, isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { Action } from '../material/Action'
import { getAffiliation } from '../material/CharacterCard'
import { CustomMoveType, Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { MAX_QUALITY } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { DiscardFilter, DiscardReward, effectTask, EffectType, task, Task } from './Task'
import { Move, TaskRule } from './TaskRule'

/** Apprentices that add 1 beat to their action against a cost (BGA ScoreAction::TIME_BOOSTS). */
const timeBoosts: Record<number, 'ducat' | 'study' | 'card'> = { 11: 'ducat', 12: 'card', 14: 'study', 43: 'ducat', 44: 'card', 57: 'study', 71: 'card' }
/** Apprentices used "at any time" of the resolution of their action, without changing its time (RULES p. 8, p. 20 n°29). */
const anytime = [26, 27, 28, 29, 30, 56, 60, 75]
/** Apprentices that ignore the Restoration action for a gain: "On considère que l'action n'est pas présente" (RULES p. 19). */
const ignore = [72, 73, 74]

export type UseApprentice = { card: number; x?: number }
export type Resolve = { split?: number; payWithStudy?: boolean }

/**
 * An action of the sheet music (RULES p. 8 "Notion de temps de l'action", p. 9 to 13).
 *
 * Before it is resolved, the player may boost it: discard cards of the same affiliation (+1 beat each), use partner
 * apprentices of the same affiliation (each one once per action). Then the player resolves it, or skips it ("Vous
 * pouvez ignorer ou résoudre pour moins de temps une action"). Once resolved, the apprentices usable "at any time of
 * its resolution" that were not used yet can still be used (BGA: phase "after").
 */
export class PlayActionRule extends TaskRule {
  get action(): Action {
    return this.task.action!
  }

  get time(): number {
    return this.task.time!
  }

  onRuleStart(): Move[] {
    if (this.task.resolved) return this.getChoices().length ? [] : this.next()
    if (this.task.resolved !== undefined) return []
    // The token of Rameau n°23 is used: it goes back to the reserve ("Le jeton sera retiré après avoir résolu cette
    // action", RULES p. 20; removed as soon as the action starts, which changes nothing to its time).
    this.updateTask({ resolved: false, used: [] })
    const notes = this.sheetMusic()
      .notes.filter((note) => this.task.beats!.includes(note.location.x!))
      .getIndexes()
    const rameau = this.material(MaterialType.LutherieToken).location(LocationType.OnNote).parent((parent) => notes.includes(parent!))
    return rameau.length ? [rameau.moveItem({ type: LocationType.Reserve, player: this.player })] : []
  }

  /** The partner apprentices of the player affiliated to the action. */
  get apprentices(): number[] {
    return this.table
      .partnerApprentices(this.player)
      .getItems<number>()
      .map((card) => card.id)
      .filter((card) => getAffiliation(card) === this.action)
  }

  get unusedApprentices(): number[] {
    return this.apprentices.filter((card) => !this.task.used!.includes(card))
  }

  getChoices(): Move[] {
    const player = this.player
    const resolved = this.task.resolved
    const moves: Move[] = []
    const hand = this.table.hand(player)
    const ducats = this.table.ducats(player).length
    const studies = this.table.studies(player).length
    const use = (card: number, x?: number) => this.customMove(CustomMoveType.UseApprentice, x === undefined ? { card } : { card, x })
    if (!resolved) {
      moves.push(...hand.id<number>((card) => getAffiliation(card) === this.action).moveItems({ type: LocationType.TurnDiscard, player }))
    }
    for (const card of this.unusedApprentices) {
      if (anytime.includes(card)) {
        moves.push(...this.anytimeChoices(card).map((x) => use(card, x)))
      } else if (resolved) {
        continue
      } else if (timeBoosts[card]) {
        const cost = timeBoosts[card]
        if ((cost === 'ducat' && ducats) || (cost === 'study' && studies) || (cost === 'card' && hand.length)) moves.push(use(card))
      } else if (card === 42 && hand.length) {
        moves.push(use(card))
      } else if (card === 45 && this.woodsToLower.length) {
        moves.push(use(card))
      } else if (card === 59) {
        moves.push(...range(1, ducats + 1).map((x) => use(card, x)))
      } else if (ignore.includes(card)) {
        moves.push(use(card))
      }
    }
    if (!resolved) {
      moves.push(this.customMove(CustomMoveType.Resolve, {}))
      if (this.action === Action.Wood && this.apprentices.includes(15) && studies) {
        moves.push(this.customMove(CustomMoveType.Resolve, { payWithStudy: true }))
      }
      const splitter = this.action === Action.Wood ? 13 : this.action === Action.Crafting ? 41 : undefined
      if (splitter && this.apprentices.includes(splitter)) {
        moves.push(...range(1, this.time).map((split) => this.customMove(CustomMoveType.Resolve, { split })))
      }
    }
    return moves
  }

  /** The woods of the stock of quality 2 or more: their quality can be lowered (n°45, n°60). */
  get woodsToLower() {
    return this.table
      .woods(this.player)
      .getIndexes()
      .filter((wood) => this.table.quality(wood) >= 2)
  }

  /** The ways to use an apprentice "at any time": [undefined] if it can be used, x for each amount, [] if not. */
  anytimeChoices(card: number): (number | undefined)[] {
    const player = this.player
    const studies = this.table.studies(player).length
    const ducats = this.table.ducats(player).length
    switch (card) {
      case 26:
      case 27:
      case 28:
      case 30:
        return studies >= 1 ? [undefined] : []
      case 29:
        return studies >= 2 && this.table.helpTokens(player).length ? [undefined] : []
      case 56:
        return ducats >= 1 ? [undefined] : []
      case 60:
        return this.woodsToLower.length ? [undefined] : []
      case 75:
        return range(1, ducats + 1)
      default:
        return []
    }
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    // A card of the same affiliation discarded: +1 beat.
    if (isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === LocationType.TurnDiscard) {
      this.updateTask({ time: this.time + 1 })
    }
    return []
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.UseApprentice)(move)) return this.useApprentice(move.data as UseApprentice)
    if (isCustomMoveType(CustomMoveType.Resolve)(move)) return this.resolve(move.data as Resolve)
    return super.onCustomMove(move)
  }

  useApprentice({ card, x = 0 }: UseApprentice): Move[] {
    const player = this.player
    const bank = this.bank()
    const used = [...this.task.used!, card]
    const discardAny = task(RuleId.DiscardFor, player, { count: 1, filter: DiscardFilter.Any, reward: DiscardReward.Nothing }, true)
    switch (timeBoosts[card]) {
      case 'ducat':
        this.updateTask({ time: this.time + 1, used })
        return bank.pay(Resource.Ducat, 1)
      case 'study':
        this.updateTask({ time: this.time + 1, used })
        return bank.pay(Resource.Study, 1)
      case 'card':
        this.updateTask({ time: this.time + 1, used })
        return this.before(discardAny)
    }
    switch (card) {
      case 42: // +1 quality to the wood used for the crafting, for 1 card discarded
        this.updateTask({ qualityPlus: (this.task.qualityPlus ?? 0) + 1, used })
        return this.before(discardAny)
      case 45: // −1 quality to the wood used, +1 beat
        this.updateTask({ qualityMinus: true, time: this.time + 1, used })
        return []
      case 59: // x beats for x ducats
        this.updateTask({ time: this.time + x, used })
        return bank.pay(Resource.Ducat, x)
      case 72: // Ignore the Restoration action: the action is over
        return this.next(effectTask(player, { type: EffectType.Gain, resource: Resource.Ducat, n: 1 }))
      case 73:
        return this.next(effectTask(player, { type: EffectType.Gain, resource: Resource.Study, n: 1 }))
      case 74:
        return this.next(task(RuleId.Age, player))
    }
    this.updateTask({ used })
    switch (card) {
      case 26: // 1 study to play a card, respecting its prerequisites
        return this.before(task(RuleId.PlaceCard, player, { studies: 1 }))
      case 27: // 1 study for a Restoration of 1 beat
        return [...bank.pay(Resource.Study, 1), ...this.before(task(RuleId.Restoration, player, { count: 1 }))]
      case 28: // 1 study to age a wood of the stock
        return [...bank.pay(Resource.Study, 1), ...this.before(task(RuleId.Age, player))]
      case 29: // 2 studies to take back a token of the help area (RULES p. 20)
        return [...bank.pay(Resource.Study, 2), ...bank.returnHelp(1)]
      case 30: // 1 study for 1 ducat
        return [...bank.pay(Resource.Study, 1), ...bank.gain(Resource.Ducat, 1)]
      case 56: // 1 ducat to draw a card
        return [...bank.pay(Resource.Ducat, 1), ...this.before(task(RuleId.Draw, player))]
      case 60: // Lower a wood by 1 quality and draw a card
        return this.before(task(RuleId.LowerWood, player, {}, true), task(RuleId.Draw, player))
      case 75: // x ducats for x Restorations of 1 beat
        return [...bank.pay(Resource.Ducat, x), ...this.before(task(RuleId.Restoration, player, { count: x }))]
    }
    return []
  }

  /** Resolve the action with its time, maybe split in 2 (n°13, n°41) or paid with a study (n°15). */
  resolve({ split, payWithStudy }: Resolve): Move[] {
    const player = this.player
    const times = split ? [split, this.time - split] : [this.time]
    let tasks: Task[]
    switch (this.action) {
      case Action.Wood:
        tasks = times.map((quality) => effectTask(player, { type: EffectType.BuyWood, quality: Math.min(quality, MAX_QUALITY), payWithStudy }))
        break
      case Action.Study:
        tasks = [effectTask(player, { type: EffectType.Gain, resource: Resource.Study, n: this.time })]
        break
      case Action.Crafting:
        // [H17] the quality modifiers (n°42, n°45) apply to the first crafting; each crafting keeps its own slot bonus.
        tasks = times.map((time, index) =>
          task(RuleId.Crafting, player, index === 0 ? { time, qualityPlus: this.task.qualityPlus, qualityMinus: this.task.qualityMinus } : { time })
        )
        break
      case Action.Relation:
        tasks = [task(RuleId.Relation, player, { time: this.time, partnerWithoutViolin: this.apprentices.includes(58) })]
        break
      case Action.Restoration:
        tasks = [task(RuleId.Restoration, player, { count: this.time })]
        break
    }
    const anytimeLeft = this.unusedApprentices.some((card) => anytime.includes(card))
    return this.next(...tasks, ...(anytimeLeft ? [{ ...this.task, resolved: true }] : []))
  }
}
