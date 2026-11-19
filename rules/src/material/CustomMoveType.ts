export enum CustomMoveType {
  /** Skip an optional step, or say that you are done with a step. */
  Pass = 1,
  /** Start of turn: Workshop or Conservation. data: Sequence */
  ChooseSequence,
  /** Change the sheet music. data: NoteMove */
  MoveNote,
  /** Ask the Master Luthier for help: 1 token on the help area, 1 ducat or 1 study. data: Resource */
  AskForHelp,
  /** Use an apprentice during an action. data: { card: number, x?: number } */
  UseApprentice,
  /** Resolve the current action of the sheet music. data: { split?: number, payWithStudy?: boolean } */
  Resolve,
  /** Relation action: draw instead of activating a Relation effect. */
  DrawCards,
  /** Choose a musician card for an effect (Relation, end of turn, copy). data: the card number */
  ChooseCard,
  /** Take a partner card back into hand (Conservation, Somis n°10). data: the card number */
  TakeBack,
  /** Troubadour n°52: draw, or gain 1 study, or gain 1 ducat. data: Pick */
  Pick,
  /** Confirm the end of the turn. */
  EndTurn
}

export enum Sequence {
  Workshop = 1,
  Conservation
}

export enum Resource {
  Ducat = 1,
  Study
}

export enum NoteMoveType {
  /** One line up: Restoration is the line above Wood (RULES p. 9: "Considérez les lignes Bois et Restauration comme voisines"). */
  Up = 1,
  Down,
  /** Swap the notes of beats `beat` and `beat + 1`, the first and last beats being neighbours. */
  Swap,
  ShiftLeft,
  ShiftRight
}

export type NoteMove = { type: NoteMoveType; beat?: number }

export enum Pick {
  Draw = 1,
  Study,
  Ducat
}
