import { Action } from '../material/Action'
import { getAffiliation, getPrestige, isApprentice, isMusician, musicians } from '../material/CharacterCard'
import { Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { Memory } from '../material/Memory'
import { activityLevel, APPRENTICE_COST, DeckDraw, MAX_ACTIVITY, soloLevel, STRADIVARIUS_MUSICIANS, turnOrder } from '../logic/Solo'
import { MAX_APPRENTICES, MAX_QUALITY } from '../logic/Table'
import { SoloLevel } from '../PaneveggioOptions'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from './RuleId'
import { endTurn, startTurn } from './StartTurn'
import { Move, PaneveggioTurnRule, prerequisitesMet } from './TaskRule'

/** A violin of the Heritage while the moves of a step are computed: its index and its space. */
type HeritageViolin = { index: number; level: number }

/**
 * Stradivarius, the bot of the solo (RULES p. 21 to 24; misc/docs/SOLO.md, with the corrections of the publisher [C11]
 * and the rulings of Ludo [S1] to [S18], 11/11/2026; the BGA adaptation, Rules/Solo/Stradivarius.php, for the details).
 * His steps play on their own: each one computes its moves when it starts, then goes to the next one. A step starts
 * again from the table as it is, when the moves of the step before change what it reads.
 *
 * The rule player is Stradivarius: he has no seat, and no legal move.
 */
abstract class StradivariusRule extends PaneveggioTurnRule {
  getPlayerMoves(): Move[] {
    return []
  }

  get level() {
    return soloLevel(this)
  }

  get activity() {
    return activityLevel(this, this.player)
  }

  /** His partner musicians, from left to right. */
  get musicians(): number[] {
    return this.table
      .partnerMusicians(this.player)
      .sort((item) => item.location.x ?? 0)
      .getIndexes()
  }

  get apprentices(): number[] {
    return this.table
      .partnerApprentices(this.player)
      .sort((item) => item.location.x ?? 0)
      .getIndexes()
  }

  /** His line of Contacts, from left to right. */
  get contacts(): number[] {
    return this.table.cards
      .location(LocationType.StradivariusContacts)
      .player(this.player)
      .sort((item) => item.location.x ?? 0)
      .getIndexes()
  }

  affiliation(card: number): Action {
    return getAffiliation(this.table.cardId(card))
  }

  prestige(card: number): number {
    return getPrestige(this.table.cardId(card))
  }

  /** His prerequisites, counted as for a player (RULES p. 22): his violins in Heritage and on musicians. */
  canHire(card: number): boolean {
    return prerequisitesMet(this.table.madeViolinsByPrestige(this.player), musicians[this.table.cardId(card)].prerequisites)
  }

  /** A musician of this Prestige whose prerequisites he meets: among his partners, then in his line of Contacts. */
  reachableMusician(prestige: number): number | undefined {
    if (prestige > MAX_ACTIVITY) return undefined
    return [...this.musicians, ...this.contacts].find((card) => isMusician(this.table.cardId(card)) && this.prestige(card) === prestige && this.canHire(card))
  }

  /**
   * Where his free crafting goes: the leftmost partner of Prestige ≤ his level of activity with a free slot [S1], on its
   * lowest free slot [S2] (the slot 0 is the top one).
   */
  makingTarget(): { card: number; slot: number } | undefined {
    for (const card of this.musicians) {
      const free = this.table.freeSlots(card)
      if (this.prestige(card) <= this.activity && free.length) return { card, slot: Math.max(...free) }
    }
    return undefined
  }

  /** His violins on musicians without any Lutherie token. */
  get bareViolins(): number[] {
    return this.table.violins
      .id(this.player)
      .location(LocationType.MusicianSlot)
      .getIndexes()
      .filter((violin) => !this.table.tokensOn(violin).length)
  }

  /** His violin of the Heritage of the highest Prestige below 4, the first one at that Prestige. */
  static violinToValue(heritage: HeritageViolin[]): HeritageViolin | undefined {
    let best: HeritageViolin | undefined
    for (const violin of heritage) {
      if (violin.level < MAX_QUALITY && (!best || violin.level > best.level)) best = violin
    }
    return best
  }

  heritage(): HeritageViolin[] {
    return this.table
      .heritage(this.player)
      .getIndexes()
      .map((index) => ({ index, level: this.table.violins.getItem(index).location.id as number }))
  }

  valorize(violin: HeritageViolin): Move {
    violin.level++
    return this.table.violins.index(violin.index).moveItem({ type: LocationType.Heritage, player: this.player, id: violin.level })
  }
}

/**
 * Setup of Stradivarius (RULES p. 21), once the player is set up:
 * - "Attribuez-lui au hasard 1 musicien de Prestige 1 et placez-le dans sa ligne de musiciens Partenaires. Ajoutez depuis
 *   la pioche 2 autres musiciens. Les 3 cartes doivent être de types différents. Piochez jusqu'à obtenir cette
 *   configuration. (Triez de gauche à droite les musiciens par ordre décroissant de Prestige)": the musician of Prestige 1
 *   is the first one of the shuffled draw pile; the cards drawn before a musician that fits go under the pile [S15];
 * - [C11] 2 cards of the draw pile in his line of Contacts;
 * - Fortissimo, as on BGA (Ludo, 23/11/2026): one of his partners is a musician of Prestige 2, one of his Contacts an
 *   apprentice.
 */
export class SetupStradivariusRule extends StradivariusRule {
  onRuleStart(): Move[] {
    const bot = this.player
    const fortissimo = this.level === SoloLevel.Fortissimo
    const draw = new DeckDraw(this)
    const moves: Move[] = []
    const partners: number[] = []
    const first = draw.takeFirst((card) => isMusician(card) && getPrestige(card) === 1)
    if (first !== undefined) partners.push(first)
    let needsPrestige2 = fortissimo
    while (partners.length < STRADIVARIUS_MUSICIANS) {
      const affiliations = partners.map((card) => this.affiliation(card))
      const prestige2 = needsPrestige2
      const card = draw.drawMusician((id) => !affiliations.includes(getAffiliation(id)) && (!prestige2 || getPrestige(id) === 2))
      needsPrestige2 = false
      if (card === undefined) break
      moves.push(...draw.flush())
      partners.push(card)
    }
    const sorted = [...partners].sort((a, b) => this.prestige(b) - this.prestige(a))
    moves.push(...sorted.map((card) => this.table.cards.index(card).moveItem({ type: LocationType.PartnerMusicians, player: bot })))
    const contacts: number[] = []
    const top = draw.takeTop()
    if (top !== undefined) contacts.push(top)
    const second = fortissimo && !contacts.some((card) => isApprentice(this.table.cardId(card))) ? (draw.takeFirst(isApprentice) ?? draw.takeTop()) : draw.takeTop()
    if (second !== undefined) contacts.push(second)
    moves.push(...contacts.map((card) => this.table.cards.index(card).moveItem({ type: LocationType.StradivariusContacts, player: bot })))
    return [...moves, ...startTurn(this, turnOrder(this)[0])]
  }
}

/**
 * His turn (RULES p. 22). His tokens given back during the turn of the player (wear, Conservation, musician taken back)
 * go to his Studies area [C11, S7]. Then a Conservation "s'il remplit l'une des conditions suivantes :
 * 1. Il peut valider les prérequis d'un musicien de Prestige +1 par rapport à son niveau d'activité […] parmi ses
 *    Partenaires puis parmi ses Contacts.
 * 2. L'un de ses violons est de qualité 1, le violon n'a plus de jeton Lutherie.
 * 3. Il n'y a plus de place disponible pour confectionner un violon sur les musiciens Partenaires de Prestige égal ou
 *    inférieur au niveau d'activité." Otherwise a Workshop.
 */
export class StradivariusTurnRule extends StradivariusRule {
  onRuleStart(): Move[] {
    const bot = this.player
    const moves: Move[] = this.table
      .returnedTokens(bot)
      .getIndexes()
      .map((token) => this.table.lutheries.index(token).moveItem({ type: LocationType.Studies, player: bot }))
    const conservation = this.reachableMusician(this.activity + 1) !== undefined || this.bareViolins.length > 0 || !this.makingTarget()
    moves.push(this.startRule(conservation ? RuleId.StradivariusConservation : RuleId.StradivariusWorkshop))
    return moves
  }
}

/**
 * Conservation (RULES p. 22 and 23):
 * 1. "Si Stradivarius a au moins une carte de type Confection dans sa ligne Partenaires, il ajoute depuis sa réserve un
 *    jeton Violon à son patrimoine de Prestige égal au nombre de cartes de type Confection qu'il possède" (4 at most [S9]).
 * 2. "Déplacez les violons des musiciens Partenaires de Stradivarius en Patrimoine. Les jetons Lutherie de Stradivarius
 *    vont dans sa zone Ducats" (Fortissimo: in his Studies area); the tokens of the player go back to the player.
 * 3. Piano: "Repérez dans la ligne de Contacts de Stradivarius un couple de cartes de même affiliation et de Prestige
 *    strictement différent du niveau d'activité + 1. Identifiez le violon de plus fort Prestige inférieur à 4 dans sa zone
 *    Patrimoine. Défaussez le couple de cartes […]. Valorisez de 1 le Prestige du violon identifié. Répétez le processus
 *    tant qu'il reste des couples": the pairs from the left [S11], under the draw pile [S15]; without a violin to
 *    valorize, he keeps his cards [S10].
 */
export class StradivariusConservationRule extends StradivariusRule {
  onRuleStart(): Move[] {
    const bot = this.player
    const moves: Move[] = []
    const heritage = this.heritage()

    const making = [...this.musicians, ...this.apprentices].filter((card) => this.affiliation(card) === Action.Crafting).length
    const violin = this.table.violinReserve(bot).limit(1)
    if (making > 0 && violin.length) {
      const level = Math.min(making, MAX_ACTIVITY)
      moves.push(violin.moveItem({ type: LocationType.Heritage, player: bot, id: level }))
      heritage.push({ index: violin.getIndex(), level })
    }

    const tokensTo = this.level === SoloLevel.Fortissimo ? LocationType.Studies : LocationType.Ducats
    for (const violin of this.table.violins.id(bot).location(LocationType.MusicianSlot).getIndexes()) {
      for (const token of this.table.tokensOn(violin).getIndexes().reverse()) {
        const owner = this.table.lutheries.getItem<PlayerColor>(token).id
        moves.push(this.table.lutheries.index(token).moveItem(owner === bot ? { type: tokensTo, player: bot } : { type: LocationType.ReturnedTokens, player: owner }))
      }
      const level = this.table.prestige(violin)
      moves.push(this.table.violins.index(violin).moveItem({ type: LocationType.Heritage, player: bot, id: level }))
      heritage.push({ index: violin, level })
    }
    heritage.sort((a, b) => a.index - b.index)

    if (this.level >= SoloLevel.Piano) {
      const draw = new DeckDraw(this)
      const contacts = this.contacts
      for (let pair = this.valuablePair(contacts); pair; pair = this.valuablePair(contacts)) {
        const violin = StradivariusRule.violinToValue(heritage)
        if (!violin) break
        for (const card of pair) {
          draw.putUnder(card)
          contacts.splice(contacts.indexOf(card), 1)
        }
        moves.push(...draw.flush(), this.valorize(violin))
      }
    }
    return [...moves, this.startRule(RuleId.StradivariusActivity)]
  }

  /** The first pair of cards of his line of the same affiliation, none of Prestige "level of activity + 1", from the left. */
  valuablePair(contacts: number[]): [number, number] | undefined {
    const cards = contacts.filter((card) => isApprentice(this.table.cardId(card)) || this.prestige(card) !== this.activity + 1)
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (this.affiliation(cards[i]) === this.affiliation(cards[j])) return [cards[i], cards[j]]
      }
    }
    return undefined
  }
}

/**
 * End of the Conservation (RULES p. 22 and 24). "Si son niveau d'Activité est inférieur à 4 :
 * - Augmentez son niveau d'activité de 1 […]
 * - Défaussez son musicien Partenaire de plus faible Prestige. En cas d'égalité, défaussez celui placé le plus à gauche
 * - Recherchez un musicien de Prestige égal au nouveau niveau d'activité en respectant les prérequis de pose […] :
 *   - Si le musicien recherché se trouve déjà dans la ligne Partenaires : Ajoutez alors au hasard 1 carte musicien depuis
 *     la pioche dans la ligne Partenaires afin qu'il s'y trouve toujours 3 musiciens.
 *   - Si le musicien recherché est dans sa ligne de Contacts : Déplacez-le dans ses Partenaires. Sinon, recherchez-le dans
 *     la pioche. Ne respectez pas dans ce cas les prérequis de pose. […] Placez alors depuis sa réserve un jeton Lutherie
 *     dans la zone d'aide du Maître Luthier […]
 *   Veillez enfin à classer les Musiciens Partenaires par ordre décroissant de Prestige."
 * The violins of the player on the musician discarded go to the Heritage of the player [S8]. His discards stay in a pile
 * of their own, never spread over his Contacts (BGA).
 * Forte: "ajoutez 1 apprenti : il doit être présent dans la ligne de Contacts de Stradivarius qui doit alors dépenser 2
 * études": the leftmost one [C11], if he has 2 studies [S5] and has trained less than 6 apprentices.
 */
export class StradivariusActivityRule extends StradivariusRule {
  onRuleStart(): Move[] {
    const bot = this.player
    const moves: Move[] = []
    const bank = this.bank()
    const activity = this.activity
    if (activity < MAX_ACTIVITY) {
      const level = activity + 1
      const note = this.material(MaterialType.NoteToken).location(LocationType.ActivityTrack).player(bot)
      moves.push(note.moveItem({ type: LocationType.ActivityTrack, player: bot, x: level }))

      const musicians = this.musicians
      const weakest = musicians.reduce<number | undefined>((weakest, card) => (weakest === undefined || this.prestige(card) < this.prestige(weakest) ? card : weakest), undefined)
      const remaining = musicians.filter((card) => card !== weakest)
      if (weakest !== undefined) {
        moves.push(...this.heritageMoves(weakest))
        moves.push(this.table.cards.index(weakest).moveItem({ type: LocationType.TurnDiscard, player: bot }))
      }

      const draw = new DeckDraw(this)
      let hired: number | undefined
      if (remaining.some((card) => this.prestige(card) === level)) {
        hired = draw.drawMusician(() => true)
      } else {
        hired = this.contacts.find((card) => isMusician(this.table.cardId(card)) && this.prestige(card) === level && this.canHire(card))
        if (hired === undefined) {
          hired = draw.drawMusician((card) => getPrestige(card) === level)
          if (hired !== undefined) moves.push(...draw.flush(), ...bank.refill(), ...bank.block())
        }
      }
      moves.push(...draw.flush())
      if (hired !== undefined) moves.push(this.table.cards.index(hired).moveItem({ type: LocationType.PartnerMusicians, player: bot }))

      // Sorted by decreasing Prestige, the order kept between equals.
      const current = hired === undefined ? remaining : [...remaining, hired]
      const sorted = [...current].sort((a, b) => this.prestige(b) - this.prestige(a))
      sorted.forEach((card, x) => {
        if (current[x] === card) return
        moves.push(this.table.cards.index(card).moveItem({ type: LocationType.PartnerMusicians, player: bot, x }))
        current.splice(current.indexOf(card), 1)
        current.splice(x, 0, card)
      })
    }

    if (this.level >= SoloLevel.Forte && bank.count(LocationType.Studies) >= APPRENTICE_COST && this.apprenticesTrained() < MAX_APPRENTICES) {
      const apprentice = this.contacts.find((card) => isApprentice(this.table.cardId(card)))
      if (apprentice !== undefined) {
        moves.push(...bank.pay(Resource.Study, APPRENTICE_COST))
        moves.push(this.table.cards.index(apprentice).moveItem({ type: LocationType.PartnerApprentices, player: bot }))
        this.memorize<number>(Memory.ApprenticesTrained, (count = 0) => count + 1, bot)
      }
    }
    return [...moves, ...endTurn(this, bot)]
  }
}

/**
 * Workshop (RULES p. 22, [C11]):
 * 1. "Stradivarius confectionne un violon gratuitement avec un bois de qualité 2 sur un musicien Partenaire de Prestige
 *    égal ou inférieur à son niveau d'activité. […] Stradivarius ne gagne pas de bonus de pose."
 * 2. Bonus effects of each card of his partners, musicians then apprentices: Wood "Ajoutez 1 jeton Lutherie au bois du
 *    violon posé par carte affiliée (qualité max 4)"; Study "Gagnez une étude par carte affiliée"; Relation: 1 card of the
 *    draw pile on the right of his line of Contacts [C11]; Crafting and Restoration: see the Conservation and the end of
 *    the turn. An empty reserve: his Ducats, then his Studies [S16]; nothing left, the effect is lost [S4]; an empty draw
 *    pile, nothing [S6].
 */
export class StradivariusWorkshopRule extends StradivariusRule {
  onRuleStart(): Move[] {
    const bot = this.player
    const moves: Move[] = []
    const bank = this.bank()
    const target = this.makingTarget()
    const wood = this.table.violinReserve(bot).limit(1)
    let made: number | undefined
    let quality = 1
    const stack = () => {
      if (made === undefined || quality >= MAX_QUALITY) return
      moves.push(...bank.refill())
      const token = bank.stack(made, quality)
      if (token.length) quality++
      moves.push(...token)
    }
    if (target && wood.length) {
      made = wood.getIndex()
      moves.push(wood.moveItem({ type: LocationType.MusicianSlot, parent: target.card, id: target.slot }))
      stack()
    }
    const draw = new DeckDraw(this)
    for (const card of [...this.musicians, ...this.apprentices]) {
      switch (this.affiliation(card)) {
        case Action.Wood:
          stack()
          break
        case Action.Study:
          if (bank.reserve > 0) moves.push(...bank.gain(Resource.Study, 1))
          break
        case Action.Relation: {
          const top = draw.takeTop()
          if (top !== undefined) moves.push(this.table.cards.index(top).moveItem({ type: LocationType.StradivariusContacts, player: bot }))
          break
        }
      }
    }
    return [...moves, this.startRule(RuleId.StradivariusEndOfTurn)]
  }
}

/** A violin on a musician while the moves of the end of the turn are computed: its Lutherie tokens, broken or not. */
type ViolinOnCard = { index: number; owner: PlayerColor; prestige: number; slot: number; tokens: number; broken: boolean }

/**
 * End of his turn (RULES p. 22):
 * - "Appliquez la règle d'usure de ses violons": as for a player, the top token of each of his violins on a musician;
 * - "Pour chaque carte affiliée à Restauration, Stradivarius restaure dans l'ordre de priorité : Un de ses violons qui n'a
 *   plus de jeton Lutherie ; Un de vos violons" [C11]: the musician of the lowest Prestige, then the wood of the highest
 *   quality, then the lowest slot of the card [S3 for his own violins];
 * - Fortissimo (RULES p. 24): "si Stradivarius possède un musicien de prestige 4 avec un violon, il valorise de +1 un
 *   violon en Patrimoine. Utilisez le violon de Prestige le plus fort inférieur à 4."
 * Then the next turn; he triggers the end of the game as a player (RULES p. 23).
 */
export class StradivariusEndOfTurnRule extends StradivariusRule {
  onRuleStart(): Move[] {
    const bot = this.player
    const moves: Move[] = []
    const bank = this.bank()
    const violins: ViolinOnCard[] = this.table.violinsOnCards.getIndexes().map((index) => {
      const item = this.table.violins.getItem<PlayerColor>(index)
      return {
        index,
        owner: item.id,
        prestige: this.table.prestige(index),
        slot: item.location.id as number,
        tokens: this.table.tokensOn(index).length,
        broken: false
      }
    })

    for (const violin of violins.filter((violin) => violin.owner === bot)) {
      const top = this.table.topToken(violin.index)
      if (!top.length) {
        moves.push(this.table.violins.index(violin.index).moveItem({ type: LocationType.Reserve, player: bot }))
        violin.broken = true
        continue
      }
      const owner = top.getItem<PlayerColor>()!.id
      moves.push(top.moveItem(owner === bot ? { type: LocationType.Reserve, player: bot } : { type: LocationType.ReturnedTokens, player: owner }))
      if (owner === bot) bank.deposit(LocationType.Reserve, top.getIndex())
      violin.tokens--
    }

    const restorations = [...this.musicians, ...this.apprentices].filter((card) => this.affiliation(card) === Action.Restoration).length
    for (let i = 0; i < restorations; i++) {
      const target = this.restorationTarget(violins)
      if (!target || bank.reserve + bank.count(LocationType.Ducats) + bank.count(LocationType.Studies) < 1) break
      moves.push(...bank.refill())
      const token = bank.stack(target.index, 1 + target.tokens)
      if (!token.length) break
      moves.push(...token)
      target.tokens++
    }

    if (this.level === SoloLevel.Fortissimo) {
      const fourWithViolin = this.musicians.some(
        (card) => this.prestige(card) === 4 && violins.some((violin) => !violin.broken && this.table.violins.getItem(violin.index).location.parent === card)
      )
      const violin = fourWithViolin ? StradivariusRule.violinToValue(this.heritage()) : undefined
      if (violin) moves.push(this.valorize(violin))
    }
    return [...moves, ...endTurn(this, bot)]
  }

  restorationTarget(violins: ViolinOnCard[]): ViolinOnCard | undefined {
    const bot = this.player
    const order = (list: ViolinOnCard[]) =>
      [...list].sort((a, b) => a.prestige - b.prestige || b.tokens - a.tokens || b.slot - a.slot || a.index - b.index)
    const bare = violins.filter((violin) => violin.owner === bot && !violin.broken && violin.tokens === 0)
    if (bare.length) return order(bare)[0]
    return order(violins.filter((violin) => violin.owner !== bot && 1 + violin.tokens < MAX_QUALITY))[0]
  }
}
