/** Placement bonus of a violin slot on a musician card (RULES p. 11). */
export enum SlotBonus {
  /** Play a Character card from your hand, respecting its prerequisites. */
  Place = 1,
  /** Draw a Character card. */
  Draw,
  /** Gain a study. */
  Study,
  /** +1 quality to the wood of the violin just placed. */
  Quality,
  /** Gain a ducat. */
  Ducat
}
