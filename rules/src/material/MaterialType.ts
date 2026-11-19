export enum MaterialType {
  /** The Master Luthier board, shared (static item: it never moves). */
  MasterBoard = 1,
  /** A player board (static item, one per player). */
  PlayerBoard,
  /** The 75 Character cards, musicians and apprentices. Id = the number printed on the card, 1 to 75. */
  CharacterCard,
  /** The first player card. */
  FirstPlayerCard,
  /** The 7 black Note tokens of each player, on their sheet music. */
  NoteToken,
  /**
   * The 12 Violin tokens of each player (dark color). Id = the PlayerColor of the owner.
   * A Violin token is the base of a pile: a wood in stock, or a violin once crafted on a musician.
   */
  ViolinToken,
  /**
   * The 14 Lutherie tokens of each player (light color). Id = the PlayerColor of the owner.
   * Their meaning depends on where they are: ducat, study, quality of a wood or a violin, help of the Master Luthier.
   */
  LutherieToken
}
