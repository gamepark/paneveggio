import { Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MAX_QUALITY } from '../logic/Table'
import { actionTasks, endOfTurnEffect, relationEffect } from './CardEffects'
import { Effect, EffectType } from './Task'
import { Move, TaskRule } from './TaskRule'

/**
 * Effects without any choice, applied one after the other, each one on the table as it is after the previous one:
 * gains (at most what the reserve holds, RULES p. 8, [H16]), wood bought, tokens taken back from the help area, +1
 * quality of a slot; and the effects of the cards, that turn into their own tasks.
 */
export class ApplyEffectRule extends TaskRule {
  getChoices(): Move[] {
    return []
  }

  onRuleStart(): Move[] {
    const effect = this.task.effect!
    const player = this.player
    switch (effect.type) {
      case EffectType.Gain:
        return [...this.bank().gain(effect.resource, effect.n), ...this.next()]
      case EffectType.BuyWood:
        return [...this.buyWood(effect), ...this.next()]
      case EffectType.ReturnHelp:
        // Always the most: it avoids the end of game penalty and frees tokens [H16].
        return [...this.bank().returnHelp(effect.n), ...this.next()]
      case EffectType.SlotQuality:
        return [...this.bank().stack(effect.violin, this.table.quality(effect.violin)), ...this.next()]
      case EffectType.RelationEffect:
        return this.next(...relationEffect(this, player, effect.card, effect.context))
      case EffectType.EndOfTurnEffect:
        return this.next(...endOfTurnEffect(this, player, effect.card, effect.context))
      case EffectType.Action:
        return this.next(...actionTasks(player, effect.action, effect.time))
      case EffectType.RefillContacts:
        return [...this.refillContacts(), ...this.next()]
    }
  }

  /**
   * "Pour chaque pile vide de votre zone de Contacts, piochez une carte de la pioche pour combler ces emplacements"
   * (RULES p. 14). [H10] an empty draw pile leaves the piles empty.
   */
  refillContacts(): Move[] {
    const deck = this.table.deck.deck()
    const empty = [1, 2, 3, 4].filter((pile) => !this.table.contactPile(this.player, pile).length)
    return empty.slice(0, deck.length).map((pile) => deck.dealOne({ type: LocationType.Contacts, player: this.player, id: pile, x: 0 }))
  }

  /**
   * Wood action (RULES p. 10): "Payez 1 Ducat pour ajouter 1 bois à votre stock. Prenez alors 1 jeton Violon de votre
   * réserve pour le placer dans votre stock de bois, empilez dessus les jetons Lutherie. Le nombre total de jetons
   * (Violon+Lutherie) est égal au temps de l'action." Always paid, even by an effect (RULES p. 19); apprentice n°15 pays
   * with a study. With too few tokens in reserve, the wood is of a lower quality (partial gain, RULES p. 8).
   */
  buyWood(effect: Extract<Effect, { type: EffectType.BuyWood }>): Move[] {
    const player = this.player
    const price = effect.payWithStudy ? Resource.Study : Resource.Ducat
    const money = effect.payWithStudy ? this.table.studies(player) : this.table.ducats(player)
    const violin = this.table.violinReserve(player).limit(1)
    if (effect.quality < 1 || !money.length || !violin.length) return []
    const bank = this.bank()
    const moves: Move[] = [...bank.pay(price, 1), violin.moveItem({ type: LocationType.WoodStock, player })]
    const index = violin.getIndex()
    for (let quality = 1; quality < Math.min(effect.quality, MAX_QUALITY); quality++) {
      moves.push(...bank.stack(index, quality))
    }
    return moves
  }
}
