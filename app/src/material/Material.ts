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
import { createElement, Fragment } from 'react'
import { bandPosition, helpDucatX, helpStudyX } from '../locators/MasterBoardLayout'
import { BoardOwner } from './BoardOwner'
import { CardMenu } from './CardMenu'
import { CharacterCardHelp } from './CharacterCardHelp'
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
import { isCraftingTarget } from '../locators/CardHover'
import {
  boardHeight,
  boardWidth,
  cardHeight,
  cardRadius,
  cardWidth,
  getDisplayedPlayer,
  masterHeight,
  masterWidth,
  stacksPanelClass,
  stacksPanelSlot,
  tokenImageSize
} from '../locators/TableLayout'

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
  /** The violins on a musician and the piles of their Lutherie tokens (as on BGA). */
  help = CharacterCardHelp

  /**
   * The slots of a musician in play (partner or on the Master Luthier board): a free slot is where a wood can be put when
   * crafting (the framework only shows the drop areas an item declares); a slot with a violin has a drawing of it printed
   * on the card, so that the card shows its violins when it grows under the pointer (MusicianSlotLocator).
   */
  getLocations(item: MaterialItem<PlayerColor, LocationType, number>, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (item.id === undefined || (item.location.type !== LocationType.PartnerMusicians && item.location.type !== LocationType.MasterMusician)) return []
    const slots = Array.from({ length: countSlots(item.id) }, (_, slot) => ({ type: LocationType.MusicianSlot, parent: context.index, id: slot }))
    const violins = context.rules.material(MaterialType.ViolinToken).location(LocationType.MusicianSlot).parent(context.index).length
    // The panel of its violins, shown next to the card when it grows under the pointer (StacksPanel).
    if (violins && !isCraftingTarget(context)) slots.push({ type: LocationType.MusicianSlot, parent: context.index, id: stacksPanelSlot })
    return slots
  }

  /**
   * The panel of the violins of the card shows while the card is under the pointer: the framework detects the hover on
   * the wrapper of the item, its parent.
   */
  getItemExtraCss(item: MaterialItem<PlayerColor, LocationType, number>) {
    return [
      css`
        *:hover > & .${stacksPanelClass} {
          display: block;
        }
      `,
      item.selected && selectedGlow
    ]
  }

  /**
   * A card with several destinations (a discard to spread on a pile of Contacts, a card of the hand to swap with a
   * Contact of an opponent): a click selects it (the framework selects an item that has a menu), then a click on a pile
   * puts it there (Ludo, 20/11/2026).
   */
  getItemMenu(_item: MaterialItem<PlayerColor, LocationType, number>, context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    const moves = legalMoves.filter((move) => isMoveItemType(MaterialType.CharacterCard)(move) && move.itemIndex === context.index)
    return moves.length > 1 ? createElement(CardMenu) : undefined
  }

  /**
   * A click on a card plays its move when it has only one (Ludo, 19/11/2026: "il faudrait simplement cliquer dessus et
   * elles se positionnent seules"): a card of the hand goes to the partners or to the discard, a partner is taken back,
   * a card is chosen. With several destinations (the piles of Contacts…), the card is dragged; the framework only plays
   * a click when one move matches. Without a move, a click opens the help of the card.
   */
  canShortClick(move: MaterialMove, context: ItemContext<PlayerColor, MaterialType, LocationType>) {
    if (isMoveItemType(MaterialType.CharacterCard)(move)) {
      if (move.itemIndex === context.index) return true
      // The top card of a pile of Contacts: a click on it puts there the card selected before, or the only card that can go
      // (the framework plays the click only when one move matches).
      if (!isOnTopOfPile(move, context)) return false
      const selected = context.rules.material(MaterialType.CharacterCard).selected().getIndexes()
      return !selected.length || selected.includes(move.itemIndex)
    }
    // Relation, Mulligan: a click on the draw pile draws, as the button of the header does (Ludo, 20/11/2026).
    if (isCustomMoveType(CustomMoveType.DrawCards)(move)) return context.rules.material(MaterialType.CharacterCard).getItem(context.index).location.type === LocationType.Deck
    return (isCustomMoveType(CustomMoveType.TakeBack)(move) || isCustomMoveType(CustomMoveType.ChooseCard)(move)) && move.data === context.index
  }
}

/** Is the card clicked the top card of the pile of Contacts where the move puts a card? */
const isOnTopOfPile = (move: MaterialMove, context: ItemContext<PlayerColor, MaterialType, LocationType>) => {
  if (!isMoveItemType(MaterialType.CharacterCard)(move) || move.location.type !== LocationType.Contacts) return false
  const { location } = context.rules.material(MaterialType.CharacterCard).getItem(context.index)
  return location.type === LocationType.Contacts && location.player === move.location.player && location.id === move.location.id && location.x === 0
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

  /** The 4 piles of Contacts above the board: drop areas for a discard or a swapped card (ContactsLocator). */
  getLocations(item: MaterialItem<PlayerColor, LocationType>) {
    return [1, 2, 3, 4].map((id) => ({ type: LocationType.Contacts, player: item.location.player, id }))
  }

  /**
   * The name of the owner on every board, to know at once whose board is shown large (Ludo, 20/11/2026); on the board of
   * the player, the shifts of the whole sheet music (RULES p. 9), on each side of the staff.
   */
  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    const player = item.location.player!
    const name = createElement(BoardOwner, { player, large: player === getDisplayedPlayer(context.rules, context.player) })
    if (player !== context.player) return name
    const moves = legalMoves.filter(isCustomMoveType<CustomMoveType, NoteMove>(CustomMoveType.MoveNote))
    const left = moves.find((move) => move.data?.type === NoteMoveType.ShiftLeft)
    const right = moves.find((move) => move.data?.type === NoteMoveType.ShiftRight)
    return createElement(Fragment, null, name, (left || right) && createElement(ShiftMenu, { left, right }))
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

/** A token put on this violin: a Restoration. */
const isRestoration = (move: MaterialMove, violin: number) =>
  isMoveItemType(MaterialType.LutherieToken)(move) && move.location.type === LocationType.OnViolin && move.location.parent === violin

const isInStock =(context: TokenContext, violin: number) =>
  context.rules.material(MaterialType.ViolinToken).getItem(violin).location.type === LocationType.WoodStock

class ViolinTokenDescription extends WoodenTokenDescription {
  images = violinImages
  /** Shown on the card in the help of a musician, with their Lutherie tokens. */
  displayInParentItemHelp = true

  /** Restoration (RULES p. 13): a click on a violin puts a token of the reserve on it. */
  canShortClick(move: MaterialMove, context: TokenContext) {
    return isRestoration(move, context.index)
  }

  /** The violins that can be restored now shine. */
  highlight(_item: MaterialItem<PlayerColor, LocationType>, context: TokenContext) {
    if (context.player === undefined || !context.rules.isTurnToPlay(context.player)) return undefined
    return context.rules.getLegalMoves(context.player).some((move) => isRestoration(move, context.index)) || undefined
  }

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
  displayInParentItemHelp = true

  /** The top token of the ducats or the studies shows their number; the top token of a wood shows its quality. */
  getItemExtraCss(item: MaterialItem<PlayerColor, LocationType>, context: TokenContext) {
    const { type, player, parent, x } = item.location
    const tokens = context.rules.material(MaterialType.LutherieToken)
    if (type === LocationType.Ducats || type === LocationType.Studies || type === LocationType.HelpArea) {
      const pile = (type === LocationType.HelpArea ? tokens.location(type).id(item.id) : tokens.location(type).player(player)).getIndexes()
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
