import { isEndGame, isMoveItemType, isStartPlayerTurn, isStartRule, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PaneveggioRules } from '../PaneveggioRules'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'

export type PaneveggioGame = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
export type PaneveggioMove = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * A move played out on a copy of the game: the position reached, whether the turn of the player is over, and how many
 * cards it would draw from the draw pile, whose faces nobody may read.
 */
export type Simulation = { game: PaneveggioGame; turnOver: boolean; blind: boolean; drawn: number }

/** Is it a card dealt from the draw pile? Its face is hidden: the bot must not play it out. */
export const isDeckDraw = (game: PaneveggioGame, move: PaneveggioMove) =>
  isMoveItemType(MaterialType.CharacterCard)(move) &&
  move.itemIndex !== undefined &&
  game.items[MaterialType.CharacterCard]?.[move.itemIndex]?.location.type === LocationType.Deck

/**
 * Plays a move on a copy of the game, with everything that follows from it, up to the next decision.
 *
 * It stops short of the turn passing to somebody, of the end of the game and of the confirmation of the end of the turn:
 * past those, the position no longer belongs to the turn being weighed. It also stops before a card is dealt from the
 * draw pile: the card would be the real one, that the player cannot know (the line is "blind" from there, and the cards
 * it would have drawn are counted).
 */
export const simulate = (game: PaneveggioGame, move: PaneveggioMove): Simulation => {
  const next: PaneveggioGame = JSON.parse(JSON.stringify(game))
  const rules = new PaneveggioRules(next)
  const queue: PaneveggioMove[] = [move]
  let played = 0
  while (queue.length) {
    const current = queue.shift()!
    if (isStartPlayerTurn(current) || isEndGame(current) || (isStartRule(current) && current.id === RuleId.EndTurn)) {
      return { game: next, turnOver: true, blind: false, drawn: 0 }
    }
    if (isDeckDraw(next, current)) {
      return { game: next, turnOver: false, blind: true, drawn: 1 + queue.filter((other) => isDeckDraw(next, other)).length }
    }
    if (++played > 2000) throw new Error('Infinite loop detected while simulating a move')
    queue.unshift(...(rules.play(JSON.parse(JSON.stringify(current))) ?? []))
  }
  return { game: next, turnOver: false, blind: false, drawn: 0 }
}
