import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { BoardDescription, CardDescription, ItemContext, MaterialContext, MaterialDescription, SoundKit, TokenDescription } from '@gamepark/react-game'
import { CustomMoveType, NoteMove, Resource } from '@gamepark/paneveggio/material/CustomMoveType'
import { isCustomMoveType, MaterialItem, MaterialMove, MaterialMoveBuilder } from '@gamepark/rules-api'
import { createElement } from 'react'
import { helpAreaPosition } from '../locators/TableLayout'
import { HelpMenu } from './HelpMenu'
import { NoteMenu } from './NoteMenu'
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

  isMenuAlwaysVisible() {
    return true
  }

  /** The help of the Master Luthier is asked on its help area (bottom left of the board, see Locators). */
  getItemMenu(_item: MaterialItem<PlayerColor, LocationType>, _context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    const moves = legalMoves.filter(isCustomMoveType<CustomMoveType, Resource>(CustomMoveType.AskForHelp))
    if (!moves.length) return undefined
    return createElement(HelpMenu, { moves, x: masterWidth * (helpAreaPosition.x / 100 - 0.5), y: masterHeight * (helpAreaPosition.y / 100 - 0.5) })
  }
}

/** The tokens are wooden discs drawn with their shadow (app/src/images/README.md). */
abstract class WoodenTokenDescription<Id = PlayerColor> extends TokenDescription<PlayerColor, MaterialType, LocationType, Id> {
  width = tokenImageSize
  height = tokenImageSize
  transparency = true
  soundKit = SoundKit.Wood
}

class NoteTokenDescription extends WoodenTokenDescription<undefined> {
  image = Note

  /** A click on a note of the player shows its moves (up, down, swap), when the sheet music can change. */
  getItemMenu(item: MaterialItem<PlayerColor, LocationType>, _context: ItemContext<PlayerColor, MaterialType, LocationType>, legalMoves: MaterialMove[]) {
    const moves = legalMoves
      .filter(isCustomMoveType<CustomMoveType, NoteMove>(CustomMoveType.MoveNote))
      .filter((move) => move.data?.beat === item.location.x && item.location.type === LocationType.SheetMusic)
    return moves.length ? createElement(NoteMenu, { moves }) : undefined
  }
}

class ViolinTokenDescription extends WoodenTokenDescription {
  images = violinImages
}

class LutherieTokenDescription extends WoodenTokenDescription {
  images = lutherieImages
}

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
