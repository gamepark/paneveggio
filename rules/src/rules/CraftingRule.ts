import { isMoveItemType, ItemMove } from '@gamepark/rules-api'
import { getPrestige, musicians } from '../material/CharacterCard'
import { Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { SlotBonus } from '../material/SlotBonus'
import { MAX_QUALITY } from '../logic/Table'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { effectTask, EffectType, task, Task } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * Crafting action (RULES p. 11): "Prenez un bois de votre stock quel que soit sa qualité. Puis placez-le sur un
 * emplacement libre d'un musicien de Prestige égal ou inférieur au temps de l'action." On a partner musician, on a
 * musician of an opponent where the player has a token, or on a musician of the Master Luthier for as many extra
 * studies as its Prestige. Then the bonus of the slot.
 */
export class CraftingRule extends TaskRule {
  get autoSingle() {
    return true
  }

  getChoices(): Move[] {
    const player = this.player
    const table = this.table
    const woods = table
      .woods(player)
      .filter((_, index) => !this.task.qualityMinus || table.quality(index) >= 2)
      .getIndexes()
    if (!woods.length) return []
    const studies = table.studies(player).length
    const moves: Move[] = []
    for (const card of table.musiciansInPlay.getIndexes()) {
      const item = table.cards.getItem<number>(card)
      if (this.task.onlyCard !== undefined && card !== this.task.onlyCard) continue
      if (getPrestige(item.id) > this.task.time!) continue
      if (item.location.type === LocationType.MasterMusician) {
        if (studies < getPrestige(item.id)) continue
      } else if (item.location.player !== player && !table.hasTokenOnCard(player, card)) {
        continue
      }
      for (const slot of table.freeSlots(card)) {
        for (const wood of woods) {
          moves.push(table.violins.index(wood).moveItem({ type: LocationType.MusicianSlot, parent: card, id: slot }))
        }
      }
    }
    return moves
  }

  afterItemMove(move: ItemMove<PlayerColor, MaterialType, LocationType>): Move[] {
    if (!isMoveItemType(MaterialType.ViolinToken)(move) || move.location.type !== LocationType.MusicianSlot) return []
    const player = this.player
    const violin = move.itemIndex
    const card = this.table.cards.getItem<number>(move.location.parent!)
    const bank = this.bank()
    const moves: Move[] = []
    if (card.location.type === LocationType.MasterMusician) moves.push(...bank.pay(Resource.Study, getPrestige(card.id)))
    let quality = this.table.quality(violin)
    if (this.task.qualityMinus) {
      // n°45: the quality of the wood used is lowered by 1 (only the Lutherie tokens, never the Violin token, RULES p. 19).
      moves.push(this.table.topToken(violin).moveItem({ type: LocationType.Reserve, player }))
      quality--
    }
    for (let i = 0; i < (this.task.qualityPlus ?? 0); i++) {
      moves.push(...bank.stack(violin, quality))
      quality = Math.min(quality + 1, MAX_QUALITY)
    }
    return [...moves, ...this.next(...this.slotBonus(musicians[card.id].slots[move.location.id as number], violin))]
  }

  /** Placement bonus (RULES p. 11), right after the violin is placed. */
  slotBonus(bonus: SlotBonus, violin: number): Task[] {
    const player = this.player
    switch (bonus) {
      case SlotBonus.Place:
        return [task(RuleId.PlaceCard, player)]
      case SlotBonus.Draw:
        return [task(RuleId.Draw, player)]
      case SlotBonus.Study:
        return [effectTask(player, { type: EffectType.Gain, resource: Resource.Study, n: 1 })]
      case SlotBonus.Ducat:
        return [effectTask(player, { type: EffectType.Gain, resource: Resource.Ducat, n: 1 })]
      case SlotBonus.Quality:
        return [effectTask(player, { type: EffectType.SlotQuality, violin })]
    }
  }
}
