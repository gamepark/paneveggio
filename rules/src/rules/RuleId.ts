/** The phases of the game, as reviewed by the developer on 19/11/2026. */
export enum RuleId {
  // ------------------------------------------------------------------ setup (options)
  ChooseStartingDeck = 1,
  Mulligan,
  KeepSeven,
  Draft,
  ChooseStartingMusician,
  ArrangeStart,

  // ------------------------------------------------------------------ start of turn
  SpreadReturnedTokens,
  SheetMusic,

  // ------------------------------------------------------------------ Workshop: actions
  PlayAction,
  Crafting,
  Relation,
  Draw,
  Restoration,

  // ------------------------------------------------------------------ card effects with a choice
  PlaceCard,
  GainChoice,
  Age,
  Valorize,
  RecycleHeritage,
  DiscardFor,
  CopyRelation,
  Somis,
  DallAbaco,
  MoveNotes,
  Rameau,
  RepeatGain,
  LowerWood,
  ReclaimTokens,
  /** Effects without any choice (gains, wood bought, tokens taken back from the help area…), applied one after the other. */
  ApplyEffect,

  // ------------------------------------------------------------------ end of the Workshop
  EndOfTurnEffect,
  SpreadDiscards,
  Aging,
  HandLimit,

  // ------------------------------------------------------------------ Conservation
  Conservation,

  // ------------------------------------------------------------------ end of turn
  EndTurn,

  // ------------------------------------------------------------------ end of the game
  FinalSheetMusic,
  FinalApprentices,

  // ------------------------------------------------------------------ solo: Stradivarius, played automatically
  // At the end, after the other values: the games already started keep their numbers.

  /** His partners, his Contacts, then the first turn. */
  SetupStradivarius,
  /** His tokens given back go to his Studies, then a Conservation or a Workshop. */
  StradivariusTurn,
  /** Confection cards, Heritage, valorizations of the Piano. */
  StradivariusConservation,
  /** End of the Conservation: his level of activity, his musicians, an apprentice (Forte). */
  StradivariusActivity,
  /** Free crafting, then the bonus effects of his partners. */
  StradivariusWorkshop,
  /** Wear of his violins, restorations, valorization of the Fortissimo. */
  StradivariusEndOfTurn
}
