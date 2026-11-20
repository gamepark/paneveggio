import { css, keyframes } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { countSlots } from '@gamepark/paneveggio/material/CharacterCard'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { Memory } from '@gamepark/paneveggio/material/Memory'
import { RuleId } from '@gamepark/paneveggio/rules/RuleId'
import { Task } from '@gamepark/paneveggio/rules/Task'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { BoardDescription, CardDescription, ItemContext, MaterialContext, MaterialDescription, SoundKit, TokenDescription } from '@gamepark/react-game'
import { CustomMoveType, NoteMove, NoteMoveType, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { isCustomMoveType, isMoveItemType, MaterialItem, MaterialMove, MaterialMoveBuilder } from '@gamepark/rules-api'
import { createElement } from 'react'
import { bandPosition, helpDucatX, helpStudyX } from '../locators/MasterBoardLayout'
import { HelpMenu } from './HelpMenu'
import { NoteMenu, ShiftMenu } from './NoteMenu'
import { WoodMenu } from './WoodMenu'
import {
  CardBack,
  characterImagesEn,
  characterImagesFr,
  FirstPlayerCard,
  lutherieImages,
  MasterBoard,
  Note,
  PlayerBoardEn,
  PlayerBoardFr,
  startingImagesEn,
  startingImagesFr,
  violinImages
} from '../images/Images'
import { boardHeight, boardWidth, cardHeight, cardRadius, cardWidth, getDisplayedPlayer, masterHeight, masterWidth, tokenImageSize } from '../locators/TableLayout'

/**
 * The English images are the default ones, shown in every language but French (decision of 09/11/2026 on BGA):
 * the publisher only made the cards and the player board in French and English.
 */

/** A Character card: 57 × 87 mm. */
class CharacterCardDescription extends CardDescription<PlayerColor, MaterialType, LocationType, number> {
  width = cardWidth
  height = cardHeight
  borderRadius = cardRadius
  images = characterImagesEn
  backImage = CardBack

  /**
   * The free slots of a musician in play (partner or on the Master Luthier board): the places where a wood can be put
   * when crafting a violin. The framework only shows the drop areas an item declares.
   */
  getLocations(item: MaterialItem<PlayerColor, LocationType, number>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (item.id === undefined || (item.location.type !== LocationType.PartnerMusicians && item.location.type !== LocationType.MasterMusician)) return []
    const taken = context.rules
      .material(MaterialType.ViolinToken)
      .location(LocationType.MusicianSlot)
      .parent(context.index)
      .getItems()
      .map((violin) => violin.location.id as number)
    return Array.from({ length: countSlots(item.id) }, (_, slot) => slot)
      .filter((slot) => !taken.includes(slot))
      .map((slot) => ({ type: LocationType.MusicianSlot, parent: context.index, id: slot }))
  }

  /**
   * A click on a card plays its move when it has only one (Ludo, 19/11/2026: "il faudrait simplement cliquer dessus et
   * elles se positionnent seules"): a card of the hand goes to the partners or to the discard, a partner is taken back,
   * a card is chosen. With several destinations (the piles of Contacts…), the card is dragged; the framework only plays
   * a click when one move matches. Without a move, a click opens the help of the card.
   */
  canShortClick(move: MaterialMove, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (isMoveItemType(MaterialType.CharacterCard)(move)) return move.itemIndex === context.index
    return (isCustomMoveType(CustomMoveType.TakeBack)(move) || isCustomMoveType(CustomMoveType.ChooseCard)(move)) && move.data === context.index
  }
}

class FrenchCharacterCardDescription extends CharacterCardDescription {
  images = characterImagesFr
}

/** A starting card (RULES p. 6), for the setup "Players choose". */
class StartingCardDescription extends CardDescription<PlayerColor, MaterialType, LocationType> {
  width = cardWidth
  height = cardHeight
  borderRadius = cardRadius
  images = startingImagesEn

  /** Choose a starting deck with a click on its card. */
  canShortClick(move: MaterialMove, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    return isMoveItemType(MaterialType.StartingCard)(move) && move.itemIndex === context.index
  }
}

class FrenchStartingCardDescription extends StartingCardDescription {
  images = startingImagesFr
}

class FirstPlayerCardDescription extends CardDescription<PlayerColor, MaterialType, LocationType> {
  width = cardWidth
  height = cardHeight
  borderRadius = cardRadius
  image = FirstPlayerCard
}

/** A player board, 29 × 21 cm: one for each player, it never moves. */
class PlayerBoardDescription extends BoardDescription<PlayerColor, MaterialType, LocationType> {
  width = boardWidth
  height = boardHeight
  image = PlayerBoardEn

  getStaticItems(context: MaterialContext<PlayerColor, MaterialType, LocationType>) {
    return context.rules.players.map((player) => ({ location: { type: LocationType.PlayerBoard, player } }))
  }

  isMenuAlwaysVisible() {
    return true
  }

  /** The shifts of the whole sheet music (RULES p. 9), on each side of the staff of the player. */
  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    if (item.location.player !== context.player) return undefined
    const moves = legalMoves.filter(isCustomMoveType<CustomMoveType, NoteMove>(CustomMoveType.MoveNote))
    const left = moves.find((move) => move.data?.type === NoteMoveType.ShiftLeft)
    const right = moves.find((move) => move.data?.type === NoteMoveType.ShiftRight)
    if (!left && !right) return undefined
    return createElement(ShiftMenu, { left, right })
  }

  /** A click on a small board displays that player area large (decision of 19/11/2026); on the large one, its help. */
  displayHelp(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const player = item.location.player!
    if (player !== getDisplayedPlayer(context.rules, context.player)) return MaterialMoveBuilder.changeView(player)
    return super.displayHelp(item, context)
  }
}

class FrenchPlayerBoardDescription extends PlayerBoardDescription {
  image = PlayerBoardFr
}

/** The Master Luthier board: its illustration without text, at its true proportions (decision of 19/11/2026). */
class MasterBoardDescription extends BoardDescription<PlayerColor, MaterialType, LocationType> {
  width = masterWidth
  height = masterHeight
  image = MasterBoard
  staticItem = { location: { type: LocationType.MasterBoard } }
  /** The extra costs and the texts of the help area are drawn on the board (MasterBoardTexts). */
  locations = [1, 2, 3, 4].map((id) => ({ type: LocationType.MasterMusician, id })).concat({ type: LocationType.HelpArea, id: 0 })

  isMenuAlwaysVisible() {
    return true
  }

  /** The help of the Master Luthier is asked on its help area (bottom left of the board, see Locators). */
  getItemMenu(_item: MaterialItem<PlayerColor, LocationType>, _context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    const moves = legalMoves.filter(isCustomMoveType<CustomMoveType, Resource>(CustomMoveType.AskForHelp))
    if (!moves.length) return undefined
    const y = masterHeight * (bandPosition.y / 100 - 0.5)
    return createElement(HelpMenu, { moves, ducat: { x: helpDucatX, y }, study: { x: helpStudyX, y } })
  }
}

/** The tokens are wooden discs drawn with their shadow (app/src/images/README.md). */
abstract class WoodenTokenDescription<Id = PlayerColor> extends TokenDescription<PlayerColor, MaterialType, LocationType, Id> {
  width = tokenImageSize
  height = tokenImageSize
  transparency = true
  soundKit = SoundKit.Wood
}

const pulse = keyframes`
  from {
    filter: drop-shadow(0 0 0.1em #ffd84a) drop-shadow(0 0 0.1em #ffd84a);
  }
  to {
    filter: drop-shadow(0 0 0.35em #ffd84a) drop-shadow(0 0 0.2em #ffd84a);
  }
`
const noteGlow = css`
  animation: ${pulse} 0.8s ease-in-out infinite alternate;
`

class NoteTokenDescription extends WoodenTokenDescription<undefined> {
  image = Note

  /** A click on a note of the player shows its moves (up, down, swap), when the sheet music can change. */
  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, _context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    const moves = legalMoves
      .filter(isCustomMoveType<CustomMoveType, NoteMove>(CustomMoveType.MoveNote))
      .filter((move) => move.data?.beat === item.location.x && item.location.type === LocationType.SheetMusic)
    return moves.length ? createElement(NoteMenu, { moves }) : undefined
  }

  /** The notes of the action being played shine, so that everyone sees where the turn is on the sheet music. */
  highlight(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    const task = context.rules.remind<Task[] | undefined>(Memory.Tasks)?.[0]
    if (task?.rule !== RuleId.PlayAction || item.location.type !== LocationType.SheetMusic || item.location.player !== task.player) return undefined
    return task.beats?.includes(item.location.x!) || undefined
  }

  /** A black disc hardly shows the default shine: a golden halo pulses around it. */
  getHighlightCss(itemId: undefined, image?: string) {
    return [super.getHighlightCss(itemId, image), noteGlow]
  }
}

/**
 * A number written inside a token (Ludo, 20/11/2026): the size of the pile of ducats or studies, the quality of a wood.
 * It is written on the token on top of the pile only, so it moves with the pile and nothing hides it.
 */
const tokenNumber = (value: number) => css`
  &::after {
    content: '${value}';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8em;
    font-weight: bold;
    text-shadow:
      0 0 0.1em black,
      0 0 0.25em black;
    pointer-events: none;
  }
`

type TokenContext = ItemContext<PlayerColor, MaterialType, LocationType>

/** The quality of a wood of the stock: its Violin token and the Lutherie tokens on it (RULES p. 10). */
const woodQuality = (context: TokenContext, violin: number) =>
  1 + context.rules.material(MaterialType.LutherieToken).location(LocationType.OnViolin).parent(violin).length

const isInStock = (context: TokenContext, violin: number) =>
  context.rules.material(MaterialType.ViolinToken).getItem(violin).location.type === LocationType.WoodStock

class ViolinTokenDescription extends WoodenTokenDescription {
  images = violinImages

  /**
   * A wood without Lutherie token shows its quality, 1. A violin on a musician always shows its quality: its Lutherie
   * tokens are small discs under it (OnViolinLocator), as on BGA. A selected wood shines.
   */
  getItemExtraCss(item: MaterialItem<PlayerColor, LocationType>, context: TokenContext) {
    const quality = woodQuality(context, context.index)
    const number =
      (item.location.type === LocationType.WoodStock && quality === 1) || item.location.type === LocationType.MusicianSlot ? tokenNumber(quality) : undefined
    return [number, item.selected && selectedGlow]
  }

  /**
   * During a Crafting with several woods that can go, a click on a wood selects it (the framework selects an item that
   * has a menu); then a click on a free slot sends it there (MusicianSlotDescription).
   */
  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, context: TokenContext, legalMoves: MaterialMove[]) {
    if (item.location.type !== LocationType.WoodStock) return undefined
    const woods = new Set(
      legalMoves.filter((move) => isMoveItemType(MaterialType.ViolinToken)(move) && move.location.type === LocationType.MusicianSlot).map((move) => (move as { itemIndex: number }).itemIndex)
    )
    return woods.size > 1 && woods.has(context.index) ? createElement(WoodMenu) : undefined
  }
}

const selectedGlow = css`
  filter: drop-shadow(0 0 0.15em #ffd84a) drop-shadow(0 0 0.15em #ffd84a);
`

class LutherieTokenDescription extends WoodenTokenDescription {
  images = lutherieImages

  /** The top token of the ducats or the studies shows their number; the top token of a wood shows its quality. */
  getItemExtraCss(item: MaterialItem<PlayerColor, LocationType>, context: TokenContext) {
    const { type, player, parent, x } = item.location
    const tokens = context.rules.material(MaterialType.LutherieToken)
    if (type === LocationType.Ducats || type === LocationType.Studies) {
      const pile = tokens.location(type).player(player).getIndexes()
      return context.index === Math.max(...pile) ? tokenNumber(pile.length) : undefined
    }
    if (type === LocationType.OnViolin) {
      const quality = woodQuality(context, parent!)
      const number = isInStock(context, parent!) && x === quality - 2 ? tokenNumber(quality) : undefined
      return [number, !canMove(context) && clickThrough]
    }
    return undefined
  }
}

/**
 * A Lutherie token on a wood or a violin lets the clicks through to its Violin token (to choose the wood to craft with,
 * to drag it), unless it can be moved itself (taken back when the player lacks tokens, RULES p. 7).
 */
const canMove = (context: TokenContext) =>
  context.player !== undefined &&
  context.rules.isTurnToPlay(context.player) &&
  context.rules.getLegalMoves(context.player).some((move) => isMoveItemType(MaterialType.LutherieToken)(move) && move.itemIndex === context.index)

const clickThrough = css`
  pointer-events: none;
`

export const Material: Partial<Record<MaterialType, MaterialDescription>> = {
  [MaterialType.MasterBoard]: new MasterBoardDescription(),
  [MaterialType.PlayerBoard]: new PlayerBoardDescription(),
  [MaterialType.CharacterCard]: new CharacterCardDescription(),
  [MaterialType.StartingCard]: new StartingCardDescription(),
  [MaterialType.FirstPlayerCard]: new FirstPlayerCardDescription(),
  [MaterialType.NoteToken]: new NoteTokenDescription(),
  [MaterialType.ViolinToken]: new ViolinTokenDescription(),
  [MaterialType.LutherieToken]: new LutherieTokenDescription()
}

export const materialI18n: Record<string, Partial<Record<MaterialType, MaterialDescription>>> = {
  fr: {
    [MaterialType.PlayerBoard]: new FrenchPlayerBoardDescription(),
    [MaterialType.CharacterCard]: new FrenchCharacterCardDescription(),
    [MaterialType.StartingCard]: new FrenchStartingCardDescription()
  }
}
