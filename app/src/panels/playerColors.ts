import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'

/** The colour of each player (the Violin tokens): their name on their board, their entries of the journal. */
export const playerColors: Record<PlayerColor, string> = {
  [PlayerColor.Blue]: '#1f6f7a',
  [PlayerColor.Red]: '#b3262c',
  [PlayerColor.Green]: '#3c7d3a',
  [PlayerColor.Orange]: '#b5651d'
}
