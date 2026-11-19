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
  FinalApprentices
}
