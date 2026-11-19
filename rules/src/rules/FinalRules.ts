import { CustomMove, isCustomMoveType, ItemMove } from '@gamepark/rules-api'
import { isApprentice } from '../material/CharacterCard'
import { CustomMoveType, NoteMove } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { NoteMovesRule } from './SheetMusicRule'
import { startFinalTurn } from './StartTurn'
import { Move, TaskRule } from './TaskRule'

/**
 * End of the game (RULES p. 18): "On laisse les violons actuellement sur les musiciens, avec tous leurs jetons Lutherie.
 * Chaque joueur a une dernière occasion de poser des apprentis afin de valoriser leurs PP :
 * 1. Il peut d'abord modifier sa partition, en dépensant les études nécessaires."
 */
export class FinalSheetMusicRule extends NoteMovesRule {
  getChoices(): Move[] {
    return this.noteMoves()
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.MoveNote)(move)) return this.moveNotes(move.data as NoteMove)
    return super.onCustomMove(move)
  }
}

/**
 * "2. Il peut ensuite poser un ou plusieurs apprentis si la configuration de la partition le permet. Il n'est pas
 * autorisé de reprendre en main des cartes de sa zone Partenaires à ce moment de la partie."
 * Then the next player, from the first one; after the last one, the final scoring.
 */
export class FinalApprenticesRule extends TaskRule {
  getChoices(): Move[] {
    return this.table
      .hand(this.player)
      .getIndexes()
      .filter((card) => isApprentice(this.table.cardId(card)) && this.canPlace(this.table.cardId(card)))
      .map((card) => this.placeCard(card))
  }

  onRuleStart(): Move[] {
    return []
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    this.countTrainedApprentice(move)
    return []
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.Pass)(move)) {
      const players = this.game.players
      const index = players.indexOf(this.player)
      if (index === players.length - 1) return [this.endGame()]
      return startFinalTurn(this, players[index + 1])
    }
    return super.onCustomMove(move)
  }
}
