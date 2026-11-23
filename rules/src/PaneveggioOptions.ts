import { getEnumValues, OptionsSpecV2 } from '@gamepark/rules-api'
import { PlayerColor } from './PlayerColor'

/** The setup (RULES p. 5 and 6, decision D1 on BGA). */
export enum SetupMode {
  /** First game: each player gets a starting deck, with a ready sheet music (RULES p. 6). */
  StartingDecks = 1,
  /** 10 cards, return some under the draw pile once and draw as many, keep 7 (RULES p. 5). */
  Mulligan,
  /** 8 cards, keep 1 and pass the rest to the next player, until 7 cards (RULES p. 5). */
  Draft
}

/** [H19] how the starting decks are given, with the setup "Starting decks". */
export enum DeckDistribution {
  /** A different deck drawn at random for each player. */
  Random = 1,
  /** Each player chooses in turn, counterclockwise from the last player: the first player chooses last. */
  PlayersChoose
}

/**
 * Solo (RULES p. 21 to 24, misc/docs/SOLO.md): the 4 levels of Stradivarius, each one adding rules to the one before.
 */
export enum SoloLevel {
  Pianissimo = 1,
  Piano,
  Forte,
  Fortissimo
}

/**
 * This is the options for each player in the game.
 */
type PlayerOptions = { id: PlayerColor }

/**
 * This is the type of object that the game receives when a new game is started.
 */
export type PaneveggioOptions = {
  players: PlayerOptions[]
  setup?: SetupMode
  decks?: DeckDistribution
  /** Solo: the level of Stradivarius. */
  level?: SoloLevel
}

/**
 * The structure of everything a host can choose before the game starts — and nothing else.
 *
 * Two things are deliberately absent, both because they change without the game changing:
 *
 * - **Text.** No labels, no help. They live in `app/public/options/<locale>.json`, published beside the
 *   game's translations and keyed by convention: `option.<option>`, `option.<option>.<value>`,
 *   `identities.<value>`, plus optional `.help` variants. See the files in that folder.
 * - **Subscription and competitive gates.** Which options require a subscription, and which are allowed
 *   in ranked play, are the platform's decisions. They live in its database and are edited there.
 *
 * The declaration is plain JSON on purpose: the platform snapshots it when the bundle is prepared, so
 * every screen reads the option space without downloading and running a game bundle.
 *
 * `players` must match the range declared for the game on the platform — it is the root that every other
 * range narrows, and a disagreement silently changes which tables exist.
 */
export const PaneveggioOptionsSpecV2: OptionsSpecV2 = {
  specVersion: 2,
  players: { min: 1, max: 4 },
  identities: { values: getEnumValues(PlayerColor) },
  options: {
    // "Pas de draft" in solo (RULES p. 21).
    setup: { kind: 'enum', values: [SetupMode.StartingDecks, SetupMode.Mulligan, { value: SetupMode.Draft, playerCount: { min: 2 } }] },
    decks: {
      kind: 'enum',
      values: getEnumValues(DeckDistribution),
      requires: [{ option: 'setup', values: [SetupMode.StartingDecks] }]
    },
    level: { kind: 'enum', values: getEnumValues(SoloLevel), playerCount: { max: 1 } }
  }
}
