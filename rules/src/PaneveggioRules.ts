import {
  CompetitiveScore,
  hideItemId,
  hideItemIdToOthers,
  isMoveItemType,
  isStartPlayerTurn,
  isStartRule,
  MaterialGame,
  MaterialMove,
  PositiveSequenceStrategy,
  SecretMaterialRules,
  TimeLimit
} from '@gamepark/rules-api'
import { computeScore, soloWon } from './logic/Scoring'
import { isSolo } from './logic/Solo'
import { Table } from './logic/Table'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'
import { PlayerColor } from './PlayerColor'
import { AgeRule } from './rules/AgeRule'
import { AgingRule } from './rules/AgingRule'
import { ApplyEffectRule } from './rules/ApplyEffectRule'
import { ConservationRule } from './rules/ConservationRule'
import { CopyRelationRule } from './rules/CopyRelationRule'
import { CraftingRule } from './rules/CraftingRule'
import { DallAbacoRule } from './rules/DallAbacoRule'
import { DiscardForRule } from './rules/DiscardForRule'
import { DrawRule } from './rules/DrawRule'
import { EndOfTurnEffectRule } from './rules/EndOfTurnEffectRule'
import { EndTurnRule } from './rules/EndTurnRule'
import { FinalApprenticesRule, FinalSheetMusicRule } from './rules/FinalRules'
import { GainChoiceRule } from './rules/GainChoiceRule'
import { HandLimitRule } from './rules/HandLimitRule'
import { LowerWoodRule } from './rules/LowerWoodRule'
import { MoveNotesRule } from './rules/MoveNotesRule'
import { PlaceCardRule } from './rules/PlaceCardRule'
import { PlayActionRule } from './rules/PlayActionRule'
import { RameauRule } from './rules/RameauRule'
import { ReclaimTokensRule } from './rules/ReclaimTokensRule'
import { RecycleHeritageRule } from './rules/RecycleHeritageRule'
import { RelationRule } from './rules/RelationRule'
import { RepeatGainRule } from './rules/RepeatGainRule'
import { RestorationRule } from './rules/RestorationRule'
import { RuleId } from './rules/RuleId'
import { ArrangeStartRule, ChooseStartingDeckRule, ChooseStartingMusicianRule, DraftRule, KeepSevenRule, MulliganRule } from './rules/SetupRules'
import { SheetMusicRule } from './rules/SheetMusicRule'
import { SomisRule } from './rules/SomisRule'
import { SpreadDiscardsRule } from './rules/SpreadDiscardsRule'
import { SpreadReturnedTokensRule } from './rules/SpreadReturnedTokensRule'
import {
  SetupStradivariusRule,
  StradivariusActivityRule,
  StradivariusConservationRule,
  StradivariusEndOfTurnRule,
  StradivariusTurnRule,
  StradivariusWorkshopRule
} from './rules/StradivariusRules'
import { ValorizeRule } from './rules/ValorizeRule'

/** Solo: the steps of Stradivarius, played by the server (they draw from the hidden draw pile). */
const stradivariusRules = [
  RuleId.SetupStradivarius,
  RuleId.StradivariusTurn,
  RuleId.StradivariusConservation,
  RuleId.StradivariusActivity,
  RuleId.StradivariusWorkshop,
  RuleId.StradivariusEndOfTurn
]

type Game = MaterialGame<PlayerColor, MaterialType, LocationType, RuleId>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

/**
 * This class implements the rules of the board game.
 * It must follow Game Park "Rules" API so that the Game Park server can enforce the rules.
 */
export class PaneveggioRules
  extends SecretMaterialRules<PlayerColor, MaterialType, LocationType, RuleId>
  implements TimeLimit<Game, Move, PlayerColor>, CompetitiveScore<Game, Move, PlayerColor>
{
  rules = {
    [RuleId.ChooseStartingDeck]: ChooseStartingDeckRule,
    [RuleId.Mulligan]: MulliganRule,
    [RuleId.KeepSeven]: KeepSevenRule,
    [RuleId.Draft]: DraftRule,
    [RuleId.ChooseStartingMusician]: ChooseStartingMusicianRule,
    [RuleId.ArrangeStart]: ArrangeStartRule,
    [RuleId.SpreadReturnedTokens]: SpreadReturnedTokensRule,
    [RuleId.SheetMusic]: SheetMusicRule,
    [RuleId.PlayAction]: PlayActionRule,
    [RuleId.Crafting]: CraftingRule,
    [RuleId.Relation]: RelationRule,
    [RuleId.Draw]: DrawRule,
    [RuleId.Restoration]: RestorationRule,
    [RuleId.PlaceCard]: PlaceCardRule,
    [RuleId.GainChoice]: GainChoiceRule,
    [RuleId.Age]: AgeRule,
    [RuleId.Valorize]: ValorizeRule,
    [RuleId.RecycleHeritage]: RecycleHeritageRule,
    [RuleId.DiscardFor]: DiscardForRule,
    [RuleId.CopyRelation]: CopyRelationRule,
    [RuleId.Somis]: SomisRule,
    [RuleId.DallAbaco]: DallAbacoRule,
    [RuleId.MoveNotes]: MoveNotesRule,
    [RuleId.Rameau]: RameauRule,
    [RuleId.RepeatGain]: RepeatGainRule,
    [RuleId.LowerWood]: LowerWoodRule,
    [RuleId.ReclaimTokens]: ReclaimTokensRule,
    [RuleId.ApplyEffect]: ApplyEffectRule,
    [RuleId.EndOfTurnEffect]: EndOfTurnEffectRule,
    [RuleId.SpreadDiscards]: SpreadDiscardsRule,
    [RuleId.Aging]: AgingRule,
    [RuleId.HandLimit]: HandLimitRule,
    [RuleId.Conservation]: ConservationRule,
    [RuleId.EndTurn]: EndTurnRule,
    [RuleId.FinalSheetMusic]: FinalSheetMusicRule,
    [RuleId.FinalApprentices]: FinalApprenticesRule,
    [RuleId.SetupStradivarius]: SetupStradivariusRule,
    [RuleId.StradivariusTurn]: StradivariusTurnRule,
    [RuleId.StradivariusConservation]: StradivariusConservationRule,
    [RuleId.StradivariusActivity]: StradivariusActivityRule,
    [RuleId.StradivariusWorkshop]: StradivariusWorkshopRule,
    [RuleId.StradivariusEndOfTurn]: StradivariusEndOfTurnRule
  }

  locationsStrategies = {
    [MaterialType.CharacterCard]: {
      [LocationType.Deck]: new PositiveSequenceStrategy(),
      [LocationType.PlayerHand]: new PositiveSequenceStrategy(),
      [LocationType.DraftPacket]: new PositiveSequenceStrategy(),
      [LocationType.Contacts]: new PositiveSequenceStrategy(),
      [LocationType.TurnDiscard]: new PositiveSequenceStrategy(),
      [LocationType.PartnerMusicians]: new PositiveSequenceStrategy(),
      [LocationType.PartnerApprentices]: new PositiveSequenceStrategy(),
      [LocationType.StartingMusicians]: new PositiveSequenceStrategy(),
      [LocationType.StradivariusContacts]: new PositiveSequenceStrategy()
    },
    [MaterialType.StartingCard]: {
      [LocationType.StartingCards]: new PositiveSequenceStrategy()
    },
    [MaterialType.ViolinToken]: {
      [LocationType.WoodStock]: new PositiveSequenceStrategy()
    },
    [MaterialType.LutherieToken]: {
      [LocationType.OnViolin]: new PositiveSequenceStrategy()
    }
  }

  hidingStrategies = {
    [MaterialType.CharacterCard]: {
      [LocationType.Deck]: hideItemId,
      [LocationType.PlayerHand]: hideItemIdToOthers,
      [LocationType.DraftPacket]: hideItemIdToOthers
      // The Contacts are not hidden: every card reaches them face up (drawn, or discarded during a turn), so everyone has
      // seen them. Hiding the cards under the top one broke the views (20/11/2026): when a card covers another one, the
      // framework cannot hide again the one that is covered. Only the owner sees them in steps (decision D8, app).
    }
  }

  /**
   * Moves whose consequences the client cannot compute: the starting decks are taken from the draw pile, and the
   * Master Luthier board of the Mulligan and Draft setups is drawn from it. In solo, the turn of Stradivarius looks for
   * cards in the draw pile.
   */
  isUnpredictableMove(move: Move, player: PlayerColor): boolean {
    if ((isStartRule(move) || isStartPlayerTurn(move)) && stradivariusRules.includes(move.id)) return true
    if (isMoveItemType(MaterialType.StartingCard)(move)) return true
    if (isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === LocationType.PartnerMusicians && this.game.rule?.id === RuleId.ChooseStartingMusician) {
      return true
    }
    return super.isUnpredictableMove(move, player)
  }

  /**
   * Every token is an item of its own, never merged with the identical ones: a Lutherie token goes on a precise pile,
   * and a pile sits on a precise Violin token (parent).
   */
  itemsCanMerge(): boolean {
    return false
  }

  /**
   * In solo, the player scores their points only if they beat Stradivarius (as in Djeser): "gagné" or "perdu" [S13, S17].
   */
  getScore(player: PlayerColor): number {
    const score = computeScore(this, player).total
    if (isSolo(this.game) && !soloWon(this)) return 0
    return score
  }

  /**
   * "En cas d'égalité, le joueur ayant confectionné le plus de violons l'emporte. Si l'égalité persiste, le joueur ayant le
   * plus de cartes Apprenti Partenaire est déclaré vainqueur. Sinon les joueurs se partagent la victoire." (RULES p. 18)
   */
  getTieBreaker(tieBreaker: number, player: PlayerColor): number | undefined {
    const table = new Table(this)
    if (tieBreaker === 1) return table.madeViolins(player).length
    if (tieBreaker === 2) return table.partnerApprentices(player).length
    return undefined
  }

  giveTime(): number {
    return 60
  }
}
