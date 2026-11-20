import { isCustomMoveType, isMoveItem } from '@gamepark/rules-api'
import { Table } from '../logic/Table'
import { CustomMoveType } from '../material/CustomMoveType'
import { MaterialType } from '../material/MaterialType'
import { PaneveggioRules } from '../PaneveggioRules'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'
import { evaluate, evaluationSettings } from './Evaluation'
import { isDeckDraw, PaneveggioGame, PaneveggioMove, simulate } from './Simulation'

/**
 * `budget`: how many moves the bot plays out on copies of the game for one decision.
 * `branches`: how many of the most promising moves are followed further, while the budget allows.
 * `rolloutSteps`: once the budget is spent, how many more decisions of the turn a line is played out, greedily.
 * `playOuts`: how many moves of a decision are first played out to the end of the turn.
 */
export const searchSettings = { budget: 100, branches: 4, rolloutSteps: 30, playOuts: 12 }

/** The steps of the setup: there, the bot does not search, it picks a legal move (setups are balanced, RULES p. 5 and 6). */
const setupRules = [RuleId.ChooseStartingDeck, RuleId.Mulligan, RuleId.KeepSeven, RuleId.Draft, RuleId.ChooseStartingMusician, RuleId.ArrangeStart]

/**
 * An automatic player for Paneveggio.
 *
 * A turn is a long chain of decisions: the sheet music, then each action and what it brings (a wood to buy, a slot to
 * craft on, a card to draw, a violin to restore…), the end of turn effect, the discards to spread. The first link is only
 * worth what the last ones bring, so the bot plays every move out on a copy of the game, follows the most promising ones
 * until its turn is over, and plays the move that leads to the best position, priced by {@link evaluate}.
 *
 * It never reads what its player could not: a line stops before a card is dealt from the draw pile, and the evaluation only
 * reads the hand of its player and the table.
 */
export const PaneveggioAI = async (game: PaneveggioGame, player: PlayerColor): Promise<PaneveggioMove[]> => {
  const move = chooseMove(game, player)
  return move ? [move] : []
}

/** The move the bot would play, exposed on its own so that it can be tested without a promise. */
export const chooseMove = (game: PaneveggioGame, player: PlayerColor): PaneveggioMove | undefined => rankMoves(game, player)[0]?.move

export type RankedMove = { move: PaneveggioMove; value: number; line: PaneveggioMove[] }

/** Every distinct legal move with what the search found it worth, the best first. */
export const rankMoves = (game: PaneveggioGame, player: PlayerColor): RankedMove[] => {
  const rules = new PaneveggioRules(game)
  const legal = rules.getLegalMoves(player)
  if (game.rule && setupRules.includes(game.rule.id)) {
    const move = legal[hash(game) % Math.max(1, legal.length)]
    return move ? [{ move, value: 0, line: [move] }] : []
  }
  const moves = candidateMoves(game, player, legal)
  if (moves.length <= 1) return moves.map((move) => ({ move, value: 0, line: [move] }))
  const search = new TurnSearch(player)
  const nodes = search.children(game, moves)
  // Every move first gets a price at the end of the turn, so that a change of the sheet music is compared with what the
  // Workshop it prepares brings; then the best ones are searched further with what is left of the budget.
  // At most `playOuts` of them, the most promising as they stand: the time of a decision stays bounded.
  const spent = [...nodes]
    .sort((a, b) => b.value - a.value)
    .slice(0, searchSettings.playOuts)
    .reduce((sum, node) => sum + search.playOut(node), nodes.length)
  search.deepen(nodes, searchSettings.budget - spent)
  // On a tie, the move that does something rather than passing: the bot never waits for nothing.
  const passing = (move: PaneveggioMove) => (isCustomMoveType(CustomMoveType.Pass)(move) ? 1 : 0)
  return nodes.map(({ move, value, line }) => ({ move, value, line })).sort((a, b) => b.value - a.value || passing(a.move) - passing(b.move))
}

type SearchNode = { move: PaneveggioMove; game?: PaneveggioGame; open: boolean; value: number; line: PaneveggioMove[]; playedOut?: boolean }

class TurnSearch {
  constructor(readonly player: PlayerColor) {}

  /** Every move played out, and the position it reaches priced as it stands. */
  children(game: PaneveggioGame, moves: PaneveggioMove[]): SearchNode[] {
    return moves.map((move) => {
      try {
        const { game: next, turnOver, blind, drawn } = simulate(game, move)
        const value = evaluate(next, this.player) + drawn * evaluationSettings.drawnCard
        return { move, game: next, open: !turnOver && !blind, value, line: [move] }
      } catch {
        // A move the rules cannot play out is a move the bot has no business playing.
        return { move, open: false, value: -Infinity, line: [move] }
      }
    })
  }

  /** The most promising lines that do not end the turn yet are followed further, sharing the budget. */
  deepen(nodes: SearchNode[], budget: number): number {
    const followed = nodes
      .filter((node) => node.open && node.game)
      .sort((a, b) => b.value - a.value)
      .slice(0, searchSettings.branches)
    let left = budget
    followed.forEach((node, rank) => {
      left -= this.follow(node, Math.floor(left / (followed.length - rank)))
    })
    return budget - left
  }

  /** Goes on with the decisions the move leaves to the same player, and returns how much of the budget it spent. */
  private follow(node: SearchNode, budget: number): number {
    const game = node.game!
    const rules = new PaneveggioRules(game)
    if (rules.getActivePlayer() !== this.player) return 0
    const moves = candidateMoves(game, this.player, rules.getLegalMoves(this.player))
    if (!moves.length) return 0
    if (budget <= 0) return 0
    if (moves.length > budget) {
      // Not enough budget to search: the turn is still played out to its end, the best move at once each time, so that a
      // line is rarely priced halfway (the Workshop only pays once its actions are played). It is paid from the budget.
      const { value, spent } = this.rollout(game, node.value)
      node.value = value
      return spent
    }
    const children = this.children(game, moves)
    const spent = moves.length + this.deepen(children, budget - moves.length)
    const best = children.reduce<SearchNode | undefined>((best, child) => (!best || child.value > best.value ? child : best), undefined)
    // The played-out value is a line the player can play: the search keeps it unless it finds better.
    if (best && (!node.playedOut || best.value > node.value)) {
      node.value = best.value
      node.line = [node.move, ...best.line]
    }
    return spent
  }

  /** Prices an open node at the end of the turn, greedily, and returns what it cost. */
  playOut(node: SearchNode): number {
    if (!node.open || !node.game) return 0
    const { value, spent } = this.rollout(node.game, node.value)
    node.playedOut = true
    node.value = value
    return spent
  }

  /** The value at the end of the turn when the best move is played at once at each decision, within a number of decisions. */
  private rollout(game: PaneveggioGame, value: number): { value: number; spent: number } {
    let spent = 0
    for (let step = 0; step < searchSettings.rolloutSteps; step++) {
      const rules = new PaneveggioRules(game)
      if (rules.getActivePlayer() !== this.player) break
      const moves = candidateMoves(game, this.player, rules.getLegalMoves(this.player))
      if (!moves.length) break
      spent += moves.length
      const best = this.children(game, moves).reduce<SearchNode | undefined>((best, child) => (!best || child.value > best.value ? child : best), undefined)
      if (!best || best.value === -Infinity) break
      value = best.value
      if (!best.open || !best.game) break
      game = best.game
    }
    return { value, spent }
  }
}

/**
 * The legal moves worth playing out: never twice the same (any token of the reserve does the same), and the help of the
 * Master Luthier only when the player has neither ducat nor study (it costs 1 PP for good, RULES p. 8, and its token stays
 * on the help area: asked more often, the bot runs short of Lutherie tokens and crafts less, as measured).
 */
const candidateMoves = (game: PaneveggioGame, player: PlayerColor, moves: PaneveggioMove[]): PaneveggioMove[] => {
  const table = new Table(new PaneveggioRules(game))
  const broke = table.ducats(player).length + table.studies(player).length === 0
  const seen = new Set<string>()
  const result: PaneveggioMove[] = []
  for (const move of moves) {
    if (!broke && isCustomMoveType(CustomMoveType.AskForHelp)(move)) continue
    // In a Conservation, a partner is never taken back: placed and taken back again, the bot would turn in circles.
    if (game.rule?.id === RuleId.Conservation && isCustomMoveType(CustomMoveType.TakeBack)(move)) continue
    if (isDeckDraw(game, move) && result.some((other) => isDeckDraw(game, other))) continue
    const key = moveKey(game, move)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(move)
  }
  return result.length ? result : moves
}

/** What makes a move different from another: for a token, where it comes from and where it goes, not which one it is. */
const moveKey = (game: PaneveggioGame, move: PaneveggioMove): string => {
  if (isMoveItem(move) && (move.itemType === MaterialType.LutherieToken || move.itemType === MaterialType.ViolinToken || move.itemType === MaterialType.NoteToken)) {
    const item = game.items[move.itemType]?.[move.itemIndex]
    if (item && move.itemType !== MaterialType.NoteToken) {
      // Two tokens of the same player in the same place are the same, unless something lies on them (a wood, a violin).
      const carries = move.itemType === MaterialType.ViolinToken
      return JSON.stringify([move.itemType, item.id, item.location, carries ? move.itemIndex : 0, move.location])
    }
  }
  return JSON.stringify(move)
}

/** A number drawn from the position, so that the same position always gets the same move. */
const hash = (game: PaneveggioGame): number => {
  const text = JSON.stringify(game.items)
  let value = 0
  for (let index = 0; index < text.length; index += 7) value = (value * 31 + text.charCodeAt(index)) >>> 0
  return value
}
