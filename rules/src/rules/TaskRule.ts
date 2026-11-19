import { CustomMove, isCustomMoveType, isMoveItemType, MaterialMove, MaterialRulesPart, PlayerTurnRule } from '@gamepark/rules-api'
import { apprentices, getPrestige, isApprentice, musicians } from '../material/CharacterCard'
import { CustomMoveType, Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from '../material/Memory'
import { Bank } from '../logic/Bank'
import { SheetMusic } from '../logic/SheetMusic'
import { MAX_APPRENTICES, MAX_QUALITY, Table } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { EffectType, Task, task } from './Task'

export type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

/** Any rule of the game: a player turn, a simultaneous rule… */
export type AnyRule = MaterialRulesPart<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * Prerequisites of a musician (RULES p. 17): "1-2-1-0 signifie que vous devez avoir minimum 1 violon de Prestige 1,
 * 2 de Prestige 2 et 1 de Prestige 3 […] Il peut y en avoir plus, que ce soit en nombre ou en Prestige."
 * [H13] a violin of a higher Prestige can stand for a violin of a lower Prestige (the example of the same page, the
 * Troubadour n°51), each violin counting once: for each Prestige k, the violins of Prestige ≥ k must cover the
 * prerequisites of Prestige ≥ k.
 */
export const prerequisitesMet = (violinsByPrestige: number[], required: number[]) => {
  let available = 0
  let needed = 0
  for (let prestige = 4; prestige >= 1; prestige--) {
    available += violinsByPrestige[prestige - 1]
    needed += required[prestige - 1]
    if (needed > available) return false
  }
  return true
}

/** Common tools of the rules: the table, the tokens, the cards a player can play. */
export abstract class PaneveggioTurnRule extends PlayerTurnRule<PlayerColor, MaterialType, LocationType, RuleId> {
  get table() {
    return new Table(this)
  }

  bank(player = this.player) {
    return new Bank(this, player)
  }

  sheetMusic(player = this.player) {
    return new SheetMusic(this, player)
  }

  apprenticesTrained(player = this.player): number {
    return this.remind<number | undefined>(Memory.ApprenticesTrained, player) ?? 0
  }

  /**
   * Can this card of the hand be played now: a musician whose prerequisites are met, an apprentice whose actions the
   * sheet music shows, within 6 apprentices trained during the game (RULES p. 16 and 17)?
   * Chapel Master n°21 ignores the prerequisites of the apprentice (RULES p. 20).
   */
  canPlace(card: number, player = this.player, ignorePrerequisites = false) {
    if (isApprentice(card)) {
      return this.apprenticesTrained(player) < MAX_APPRENTICES && (ignorePrerequisites || this.sheetMusic(player).hasPattern(apprentices[card].pattern))
    }
    return ignorePrerequisites || prerequisitesMet(this.table.madeViolinsByPrestige(player), musicians[card].prerequisites)
  }

  /** Move a card of the hand to the partners: musicians on the right of the board, apprentices under them. */
  placeCard(index: number): Move {
    const card = this.table.cards.getItem<number>(index)
    const type = isApprentice(card.id) ? LocationType.PartnerApprentices : LocationType.PartnerMusicians
    return this.table.cards.index(index).moveItem({ type, player: card.location.player })
  }

  /** An apprentice played from the hand counts among the 6 a player can train during the game. */
  countTrainedApprentice(move: Move) {
    if (isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === LocationType.PartnerApprentices) {
      this.memorize<number>(Memory.ApprenticesTrained, (count = 0) => count + 1, move.location.player)
    }
  }

  /**
   * Heritage of the violins on a musician (Conservation, musician taken back, Somis n°10): each violin goes to the
   * Heritage of its owner, on the space of the Prestige of the musician; its Lutherie tokens go back to their owners,
   * the top one first, waiting to become ducats or studies (D2). Optionally only the violins of one player.
   */
  heritageMoves(card: number, owner?: PlayerColor): Move[] {
    const moves: Move[] = []
    const prestige = getPrestige(this.table.cardId(card))
    for (const violin of this.table.violinsOnCard(card).getIndexes()) {
      const color = this.table.violins.getItem<PlayerColor>(violin).id
      if (owner !== undefined && color !== owner) continue
      for (const token of this.table.tokensOn(violin).getIndexes().reverse()) {
        const tokenOwner = this.table.lutheries.getItem<PlayerColor>(token).id
        moves.push(this.table.lutheries.index(token).moveItem({ type: LocationType.ReturnedTokens, player: tokenOwner }))
      }
      moves.push(this.table.violins.index(violin).moveItem({ type: LocationType.Heritage, player: color, id: prestige }))
    }
    return moves
  }
}

/**
 * A step of the queue of the turn (see Task). It starts by looking at the choices: none, the step is skipped; a single
 * one that is mandatory, or that is a pure gain, it is played at once. A player can always pass an optional step.
 */
export abstract class TaskRule extends PaneveggioTurnRule {
  /** The choices of the step, without "pass" and the help of the Master Luthier. */
  abstract getChoices(): Move[]

  /** A single choice is played at once even if the step is optional: it is a gain the player would never refuse. */
  get autoSingle(): boolean {
    return false
  }

  get tasks(): Task[] {
    return this.remind<Task[] | undefined>(Memory.Tasks) ?? []
  }

  get task(): Task {
    return this.tasks[0]
  }

  /** Change the parameters of the current task. */
  updateTask(changes: Partial<Task>) {
    this.memorize<Task[]>(Memory.Tasks, (tasks) => [{ ...tasks[0], ...changes }, ...tasks.slice(1)])
  }

  onRuleStart(): Move[] {
    const choices = this.getChoices()
    if (!choices.length) return this.next()
    if (choices.length === 1 && (this.task.mandatory || this.autoSingle)) return [choices[0]]
    return []
  }

  getPlayerMoves(): Move[] {
    const moves = [...this.getChoices()]
    if (!this.task.mandatory) moves.push(this.customMove(CustomMoveType.Pass))
    moves.push(...this.helpMoves())
    return moves
  }

  /**
   * Help of the Master Luthier, at any time of the turn (RULES p. 8), even with ducats or studies left [H21]: it needs
   * 2 tokens in reserve [H14].
   */
  helpMoves(): Move[] {
    if (this.table.reserve(this.player).length < 2) return []
    return [this.customMove(CustomMoveType.AskForHelp, Resource.Ducat), this.customMove(CustomMoveType.AskForHelp, Resource.Study)]
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.Pass)(move)) return this.next()
    if (isCustomMoveType(CustomMoveType.AskForHelp)(move)) return this.bank().askForHelp(move.data as Resource)
    return []
  }

  /** The current task is over: insert new tasks if any, then go to the next one. */
  next(...inserted: Task[]): Move[] {
    return goToTask(this, [...inserted, ...this.tasks.slice(1)])
  }

  /** Replace the current task by new tasks (it is not over: it comes back after them). */
  before(...inserted: Task[]): Move[] {
    return goToTask(this, [...inserted, ...this.tasks])
  }
}

/**
 * Start the first task of the queue. Lack of tokens (RULES p. 7, decided by Ludo on 10/11/2026): when the task would
 * take more tokens than the reserve holds, and the player has some to take back, a step to take them back comes first,
 * offered once.
 */
export const goToTask = (rule: AnyRule, tasks: Task[]): Move[] => {
  let [head, ...rest] = tasks
  if (!head) throw new Error('The queue of the turn is empty')
  const table = new Table(rule)
  if (!head.reclaimOffered) {
    const missing = tokensNeeded(table, head) - table.reserve(head.player).length
    if (missing > 0 && reclaimableTokens(table, head.player) > 0) {
      rest = [{ ...head, reclaimOffered: true }, ...rest]
      head = task(RuleId.ReclaimTokens, head.player, { count: missing })
    }
  }
  rule.memorize(Memory.Tasks, [head, ...rest])
  if (head.player !== rule.game.rule?.player) return [rule.startPlayerTurn(head.rule, head.player)]
  return [rule.startRule(head.rule)]
}

/** How many tokens of the reserve a task would take at most, if it were played now. */
const tokensNeeded = (table: Table, task: Task): number => {
  switch (task.rule) {
    case RuleId.ApplyEffect:
      switch (task.effect?.type) {
        case EffectType.Gain:
          return task.effect.n
        case EffectType.BuyWood:
          // The tokens on the wood, minus the ducat paid that goes back to the reserve.
          return table.ducats(task.player).length > 0 && table.violinReserve(task.player).length > 0 ? Math.min(task.effect.quality, MAX_QUALITY) - 2 : 0
        case EffectType.SlotQuality:
          return table.quality(task.effect.violin) < MAX_QUALITY ? 1 : 0
        default:
          return 0
      }
    case RuleId.Age:
      return table.woods(task.player).getIndexes().some((wood) => table.quality(wood) < MAX_QUALITY) ? 1 : 0
    case RuleId.Restoration:
      return table.violinsOnCards.getIndexes().some((violin) => table.quality(violin) < MAX_QUALITY) ? (task.count ?? 1) : 0
    case RuleId.GainChoice:
      return task.n ?? 1
    case RuleId.RepeatGain:
      return 1
    default:
      return 0
  }
}

/** The tokens a player can take back into their reserve: in Ducats, in Studies, or on top of a pile. */
export const reclaimableTokens = (table: Table, player: PlayerColor, resourcesOnly = false) =>
  table.ducats(player).length + table.studies(player).length + (resourcesOnly ? 0 : reclaimableStacks(table, player).length)

/** The tokens of a player on top of a pile (wood in stock or violin on any musician): the only ones of a pile that can be taken. */
export const reclaimableStacks = (table: Table, player: PlayerColor): number[] => {
  const tokens: number[] = []
  for (const violin of table.violins.location((l) => l.type === LocationType.WoodStock || l.type === LocationType.MusicianSlot).getIndexes()) {
    const top = table.topToken(violin)
    if (top.length && top.getItem()!.id === player) tokens.push(top.getIndex())
  }
  return tokens
}
