import { CustomMove, isCustomMoveType } from '@gamepark/rules-api'
import { range } from 'es-toolkit'
import { musicians } from '../material/CharacterCard'
import { CustomMoveType } from '../material/CustomMoveType'
import { RuleId } from './RuleId'
import { effectTask, EffectType, task } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * Relation action (RULES p. 12): "Soit PIOCHER autant de cartes Personnage que le temps de l'action. Soit ACTIVER l'effet
 * Relation d'une carte Musicien qui possède un de vos violons, qu'elle soit sur votre zone Partenaires, sur le plateau
 * Maître Luthier ou sur la zone Partenaires d'un joueur adverse." The effect asks for at most the time of the action.
 * Apprentice n°58: also the partner musicians without a violin (RULES p. 20).
 */
export class RelationRule extends TaskRule {
  getChoices(): Move[] {
    const player = this.player
    const time = this.task.time!
    const table = this.table
    const cards = table.musiciansInPlay.getIndexes().filter((card) => {
      const relation = musicians[table.cardId(card)].relation
      if (relation === undefined || relation > time) return false
      if (table.violinsOnCard(card).id(player).length) return true
      return this.task.partnerWithoutViolin === true && table.cards.getItem(card).location.player === player
    })
    return [this.customMove(CustomMoveType.DrawCards), ...cards.map((card) => this.customMove(CustomMoveType.ChooseCard, card))]
  }

  onCustomMove(move: CustomMove): Move[] {
    if (isCustomMoveType(CustomMoveType.DrawCards)(move)) {
      return this.next(...range(this.task.time!).map(() => task(RuleId.Draw, this.player)))
    }
    if (isCustomMoveType(CustomMoveType.ChooseCard)(move)) {
      const card = move.data as number
      return this.next(effectTask(this.player, { type: EffectType.RelationEffect, card, context: card }))
    }
    return super.onCustomMove(move)
  }
}
