import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { BoardDescription, CardDescription, MaterialContext, MaterialDescription, SoundKit, TokenDescription } from '@gamepark/react-game'
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
  violinImages
} from '../images/Images'
import { boardHeight, boardWidth, cardHeight, cardRadius, cardWidth, masterHeight, masterWidth, tokenImageSize } from '../locators/TableLayout'

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
  [MaterialType.FirstPlayerCard]: new FirstPlayerCardDescription(),
  [MaterialType.NoteToken]: new NoteTokenDescription(),
  [MaterialType.ViolinToken]: new ViolinTokenDescription(),
  [MaterialType.LutherieToken]: new LutherieTokenDescription()
}

export const materialI18n: Record<string, Partial<Record<MaterialType, MaterialDescription>>> = {
  fr: {
    [MaterialType.PlayerBoard]: new FrenchPlayerBoardDescription(),
    [MaterialType.CharacterCard]: new FrenchCharacterCardDescription()
  }
}
