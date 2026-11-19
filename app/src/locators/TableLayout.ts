import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { MaterialRules, XYCoordinates } from '@gamepark/rules-api'

/**
 * The whole table, in centimetres, at the scale of the real components (decision of 19/11/2026, like D6 on BGA):
 * - one player area full size, its board centred on the origin: the area of the player who looks at the table, or
 *   the one they chose to look at by clicking a panel or a board (decision of 19/11/2026);
 * - the Master Luthier board above the partner musicians of that area, the draw pile on its right;
 * - the areas of the other players in a column on the right, smaller.
 * Nothing is ever rotated: everyone reads the table the same way.
 */

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>

export const cardWidth = 5.7
export const cardHeight = 8.7
export const cardRadius = 0.3
export const boardWidth = 29
export const boardHeight = 21
/**
 * The Master Luthier board is drawn larger than the real one (25 cm), so that its 4 musicians, 21.45 % of its width
 * apart, do not overlap: 28.5 cm leaves the usual 0.4 cm between two cards (Ludo: "il faudrait les espacer", 19/11/2026).
 */
export const masterWidth = 28.5
/** Positions measured in cm on the 25 cm board are multiplied by this. */
export const masterScale = masterWidth / 25
export const masterHeight = (masterWidth * 1407) / 2500
/** Tokens are 1.3 cm discs (the cut-outs of the sheet music and the slots of the cards). */
export const tokenDiameter = 1.3
/** The token images have a shadow margin: the disc is 150 px in a 204 px image. */
export const tokenImageSize = (tokenDiameter * 204) / 150

/** Space between two areas of the table. */
const gap = 0.5
/** Space between two cards side by side. */
const cardGap = 0.4
export const cardPitch = cardWidth + cardGap
/** The areas of the other players are shown smaller. */
export const opponentScale = 0.4
/** Room always kept for this many partner musicians and apprentices, so that the table does not move at each card placed. */
const reservedPartners = 4
const margin = 0.5

// ------------------------------------------------------------------ inside a player area: cm from the centre of the board, full size

/** Contacts: the 4 piles above the board, each one centred on a tab of its top edge (BGA measures, % of the board width). */
const contactTabs = [13.7, 37.7, 62, 86.3]
export const contactX = (pile: number) => boardWidth * (contactTabs[pile - 1] / 100 - 0.5)
export const contactsY = -boardHeight / 2 - 0.3 - cardHeight / 2
/** The owner sees the banner of each card under the top one, like on BGA (decision D8). */
export const contactStep = 1.3

/** The first player card and the cards discarded during the turn, in a column on the left of the board. */
export const leftColumnX = -boardWidth / 2 - gap - cardWidth / 2

/**
 * Partner musicians on the right of the board, apprentices under them: each row in front of its label printed on the
 * right edge of the board, "Musiciens Partenaires" on the top half, "Apprentis Partenaires" on the bottom half.
 */
export const partnersX = boardWidth / 2 + gap + cardWidth / 2
/** Measured on the board: the centres of the two printed labels (Ludo: "encore descendre", 19/11/2026). */
export const musiciansY = -4.2
export const apprenticesY = 5.9

/** The hand under the board, the reserve of tokens on its left. */
export const handX = -boardWidth / 2 + cardWidth / 2
export const handY = boardHeight / 2 + gap + cardHeight / 2
/** The hand stays within the width of the board: the cards overlap beyond 5. */
export const handGap = (count: number) => (count <= 5 ? cardPitch : (boardWidth - cardWidth) / (count - 1))

const countCards = (rules: Rules, type: LocationType, player: PlayerColor) =>
  rules.material(MaterialType.CharacterCard).location(type).player(player).length

const deepestContacts = (rules: Rules, player: PlayerColor) =>
  Math.max(1, ...[1, 2, 3, 4].map((pile) => rules.material(MaterialType.CharacterCard).location(LocationType.Contacts).player(player).locationId(pile).length))

type Rect = { left: number; right: number; top: number; bottom: number }

/**
 * The rectangle covered by a player area, from the centre of its board, full size.
 * The Contacts are in steps only for their owner, when their area is the one displayed large.
 */
const playerArea = (rules: Rules, player: PlayerColor, viewer?: PlayerColor): Rect => {
  const partners = Math.max(reservedPartners, countCards(rules, LocationType.PartnerMusicians, player), countCards(rules, LocationType.PartnerApprentices, player))
  const depth = contactsInSteps(rules, player, viewer) ? deepestContacts(rules, player) - 1 : 0
  return {
    left: leftColumnX - cardWidth / 2,
    right: partnersX - cardWidth / 2 + partners * cardPitch - cardGap,
    top: contactsY - cardHeight / 2 - depth * contactStep,
    bottom: handY + cardHeight / 2
  }
}

// ------------------------------------------------------------------ players

/**
 * The player whose area is displayed large: the one whose panel or board was clicked last, which the framework keeps
 * in `game.view` (a local move, never sent to the server), or else the player who looks at the table, or else the
 * first player for a spectator (as in Greylune).
 */
export const getDisplayedPlayer = (rules: Rules, viewer?: PlayerColor): PlayerColor =>
  (rules.game.view as PlayerColor | undefined) ?? viewer ?? rules.players[0]

/** The players in the order of the table, starting with the one displayed large. */
export const playersFromDisplayed = (rules: Rules, viewer?: PlayerColor): PlayerColor[] => {
  const start = Math.max(0, rules.players.indexOf(getDisplayedPlayer(rules, viewer)))
  return [...rules.players.slice(start), ...rules.players.slice(0, start)]
}

/** 0 for the player displayed large, then 1, 2… for the others in the order of play. */
export const getSeat = (rules: Rules, player: PlayerColor, viewer?: PlayerColor) => playersFromDisplayed(rules, viewer).indexOf(player)

/** The owner of the Contacts sees the banner of each card under the top one, when their area is displayed large. */
export const contactsInSteps = (rules: Rules, player: PlayerColor, viewer?: PlayerColor) =>
  player === viewer && getSeat(rules, player, viewer) === 0

export const seatScale = (seat: number) => (seat === 0 ? 1 : opponentScale)

// ------------------------------------------------------------------ shared area

/** The Master Luthier board, above the partner musicians of the viewer. */
export const masterBoardCenter: XYCoordinates = {
  x: partnersX - cardWidth / 2 + masterWidth / 2,
  y: -boardHeight / 2 - gap - masterHeight / 2
}
const masterTop = masterBoardCenter.y - masterHeight / 2

/** The draw pile, on the right of the Master Luthier board. */
export const deckCenter: XYCoordinates = { x: masterBoardCenter.x + masterWidth / 2 + gap + cardWidth / 2, y: masterBoardCenter.y }

// ------------------------------------------------------------------ boards on the table

/** Left edge of the column of the other players: on the right of the large area and of the draw pile. */
const othersLeft = (rules: Rules, viewer?: PlayerColor) =>
  Math.max(playerArea(rules, getDisplayedPlayer(rules, viewer), viewer).right, deckCenter.x + cardWidth / 2) + 2 * gap

/** Centre of the board of a player on the table: the one displayed large on the origin, the others in the column. */
export const boardCenter = (rules: Rules, player: PlayerColor, viewer?: PlayerColor): XYCoordinates => {
  const players = playersFromDisplayed(rules, viewer)
  const seat = players.indexOf(player)
  if (seat <= 0) return { x: 0, y: 0 }
  const left = othersLeft(rules, viewer)
  let top = Math.min(masterTop, playerArea(rules, players[0], viewer).top)
  for (const other of players.slice(1, seat)) {
    const area = playerArea(rules, other, viewer)
    top += (area.bottom - area.top) * opponentScale + 2 * gap
  }
  const area = playerArea(rules, player, viewer)
  return { x: left - area.left * opponentScale, y: top - area.top * opponentScale }
}

/** The table is exactly as large as what lies on it. */
export const tableBoundaries = (rules: Rules, viewer?: PlayerColor) => {
  const players = playersFromDisplayed(rules, viewer)
  const large = playerArea(rules, players[0], viewer)
  const { left } = large
  let { right, top, bottom } = large
  right = Math.max(right, deckCenter.x + cardWidth / 2)
  top = Math.min(top, masterTop)
  for (const player of players.slice(1)) {
    const area = playerArea(rules, player, viewer)
    const center = boardCenter(rules, player, viewer)
    right = Math.max(right, center.x + area.right * opponentScale)
    bottom = Math.max(bottom, center.y + area.bottom * opponentScale)
  }
  return { xMin: left - margin, xMax: right + margin, yMin: top - margin, yMax: bottom + margin }
}

/** What moves the boards: the number of partners and the depth of the Contacts of each player. */
export const layoutDependencies = (rules: Rules) =>
  rules.players.map((player) => [
    countCards(rules, LocationType.PartnerMusicians, player),
    countCards(rules, LocationType.PartnerApprentices, player),
    deepestContacts(rules, player)
  ])
