export enum LocationType {
  // ------------------------------------------------------------------ shared area

  /** Spot of the Master Luthier board on the table. */
  MasterBoard = 1,
  /** The 4 musicians of the Master Luthier board. id = the slot, 1 to 4 = its Prestige and its extra cost in studies. */
  MasterMusician,
  /** Help area of the Master Luthier board: Lutherie tokens blocked until the end of the game (−1 PP each). */
  HelpArea,
  /** The face-down central draw pile. */
  Deck,

  // ------------------------------------------------------------------ player area (player = owner)

  /** Spot of a player board on the table. */
  PlayerBoard,
  /** The first player card, next to the board of the first player. */
  FirstPlayer,
  /** The hand of a player, hidden from the others. */
  PlayerHand,
  /**
   * Contacts area, above the board: 4 piles, id = the pile, 1 to 4 from left to right.
   * x = depth in the pile: 0 is the top card, the only one the other players can see (decision D8).
   */
  Contacts,
  /** The cards discarded during the turn, on the left of the board, spread over the Contacts at the end of the Workshop. */
  TurnDiscard,
  /** Partner musicians, on the right of the board, in the order they were placed. */
  PartnerMusicians,
  /** Partner apprentices, under the musicians, in the order they were trained. */
  PartnerApprentices,
  /** Tokens next to the board, not used yet (Violin and Lutherie tokens). */
  Reserve,
  /** Note tokens on the sheet music: id = the action of the line, x = the beat, 0 to 6 from left to right. */
  SheetMusic,
  /** Ducats area of the board (Lutherie tokens). */
  Ducats,
  /** Studies area of the board (Lutherie tokens). */
  Studies,
  /** Wood stock area of the board: one Violin token per wood, x = its place in the stock from left to right. */
  WoodStock,
  /** Heritage area of the board: id = the Prestige of the space, 1 to 4. */
  Heritage,

  // ------------------------------------------------------------------ on other items (parent = index of the item)

  /** A violin crafted on a musician card. parent = the card, id = the slot, 0 for the top one. */
  MusicianSlot,
  /** A Lutherie token on a Violin token (wood or violin): its quality. parent = the Violin token, x = 0 for the lowest. */
  OnViolin
}
