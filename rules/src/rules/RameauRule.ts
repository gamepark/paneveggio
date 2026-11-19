import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { Move, TaskRule } from './TaskRule'

/**
 * Rameau n°23 (RULES p. 20): "Le joueur place 1 jeton Lutherie sur un jeton Note. À la prochaine séquence Atelier, cette
 * action vaudra 3 temps." The card says "Placez 1 jeton Étude sur 1 note": the token comes from the Studies area.
 * The token sits on the note (parent): "Si le jeton Note est déplacé, le jeton Lutherie le suit."
 * The next turn it goes back to the reserve, after its action in a Workshop, at once in a Conservation (Ludo, 19/11/2026).
 */
export class RameauRule extends TaskRule {
  getChoices(): Move[] {
    const sheetMusic = this.sheetMusic()
    const study = this.table.studies(this.player).limit(1)
    if (sheetMusic.rameauBeat !== undefined || !study.length) return []
    return sheetMusic.notes.getIndexes().map((note) => study.moveItem({ type: LocationType.OnNote, parent: note }))
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    return isMoveItemType(MaterialType.LutherieToken)(move) ? this.next() : []
  }
}
