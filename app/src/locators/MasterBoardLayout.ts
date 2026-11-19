import { masterHeight, masterScale } from './TableLayout'

/** The brown band at the bottom of the board, from 74.4 % of its height: its centre, in % of the board. */
export const bandPosition = { x: 50, y: 87.2 }
export const bandHeight = masterHeight * 0.256
/** In the band, in cm from its centre: the help tokens pile, and the ducat and study icons of the help. */
export const helpTokensX = -9.3 * masterScale
export const helpDucatX = -2.5 * masterScale
export const helpStudyX = -0.7 * masterScale
/** The green band of the costs, from 64.1 % to 74.4 % of the height: its centre from the centre of a card (at 32 %). */
export const costY = masterHeight * (0.6925 - 0.32)
