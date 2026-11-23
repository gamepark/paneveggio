export enum Memory {
  /** The queue of the steps left to play in the turn (see rules/Task.ts). */
  Tasks = 1,
  /** Number of apprentices a player trained during the game: 6 at most (RULES p. 16). Per player. */
  ApprenticesTrained,
  /** The player who triggered the end of the game [H4]. */
  EndTriggeredBy,
  /** Solo: the level of Stradivarius (SoloLevel), an option only known at the setup. */
  SoloLevel
}
