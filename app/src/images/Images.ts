import { Action } from '@gamepark/paneveggio/material/Action'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import PlayerBoardEn from './boards/player-en.webp'
import PlayerBoardFr from './boards/player-fr.webp'
import ForteEn from './boards/solo/forte-en.webp'
import ForteFr from './boards/solo/forte-fr.webp'
import FortissimoEn from './boards/solo/fortissimo-en.webp'
import FortissimoFr from './boards/solo/fortissimo-fr.webp'
import PianissimoEn from './boards/solo/pianissimo-en.webp'
import PianissimoFr from './boards/solo/pianissimo-fr.webp'
import PianoEn from './boards/solo/piano-en.webp'
import PianoFr from './boards/solo/piano-fr.webp'
import { SoloLevel } from '@gamepark/paneveggio/PaneveggioOptions'
import MasterBoard from './boards/master.webp'
import CardBack from './cards/back.webp'
import FirstPlayerCard from './cards/first-player.webp'
import Ducat from './icons/ducat.webp'
import Star from './icons/star.svg?no-inline'
import Study from './icons/study.webp'
import Wood from './icons/wood.svg?no-inline'
import LutherieBlue from './tokens/lutherie-blue.webp'
import LutherieGreen from './tokens/lutherie-green.webp'
import LutherieOrange from './tokens/lutherie-orange.webp'
import LutherieRed from './tokens/lutherie-red.webp'
import Note from './tokens/note.webp'
import ViolinBlue from './tokens/violin-blue.webp'
import ViolinGreen from './tokens/violin-green.webp'
import ViolinOrange from './tokens/violin-orange.webp'
import ViolinRed from './tokens/violin-red.webp'

export { CardBack, Ducat, FirstPlayerCard, MasterBoard, Note, PlayerBoardEn, PlayerBoardFr, Star, Study, Wood }

/** Solo: the board of Stradivarius of each level, the back of a player board (RULES p. 21). */
export const soloBoardsEn: Record<SoloLevel, string> = {
  [SoloLevel.Pianissimo]: PianissimoEn,
  [SoloLevel.Piano]: PianoEn,
  [SoloLevel.Forte]: ForteEn,
  [SoloLevel.Fortissimo]: FortissimoEn
}
export const soloBoardsFr: Record<SoloLevel, string> = {
  [SoloLevel.Pianissimo]: PianissimoFr,
  [SoloLevel.Piano]: PianoFr,
  [SoloLevel.Forte]: ForteFr,
  [SoloLevel.Fortissimo]: FortissimoFr
}

/** Card number -> image, from the file name (`<nn>.webp`). */
const byNumber = (files: Record<string, string>): Record<number, string> =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [Number(/\/(\d+)\.webp$/.exec(path)![1]), url]))

export const characterImagesEn = byNumber(import.meta.glob<string>('./cards/characters/en/*.webp', { eager: true, import: 'default' }))
export const characterImagesFr = byNumber(import.meta.glob<string>('./cards/characters/fr/*.webp', { eager: true, import: 'default' }))

/** Starting card -> image, from the file name (`<deck>.webp`), deck named after its action. */
const byDeck = (files: Record<string, string>): Record<Action, string> => {
  const names: Record<string, Action> = { wood: Action.Wood, study: Action.Study, crafting: Action.Crafting, relation: Action.Relation, restoration: Action.Restoration }
  return Object.fromEntries(Object.entries(files).map(([path, url]) => [names[/\/(\w+)\.webp$/.exec(path)![1]], url])) as Record<Action, string>
}

export const startingImagesEn = byDeck(import.meta.glob<string>('./cards/starters/en/*.webp', { eager: true, import: 'default' }))
export const startingImagesFr = byDeck(import.meta.glob<string>('./cards/starters/fr/*.webp', { eager: true, import: 'default' }))

export const violinImages: Record<PlayerColor, string> = {
  [PlayerColor.Blue]: ViolinBlue,
  [PlayerColor.Red]: ViolinRed,
  [PlayerColor.Green]: ViolinGreen,
  [PlayerColor.Orange]: ViolinOrange
}

export const lutherieImages: Record<PlayerColor, string> = {
  [PlayerColor.Blue]: LutherieBlue,
  [PlayerColor.Red]: LutherieRed,
  [PlayerColor.Green]: LutherieGreen,
  [PlayerColor.Orange]: LutherieOrange
}
