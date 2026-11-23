import * as ReactGame from '@gamepark/react-game'
import { ItemContext } from '@gamepark/react-game'
import { MaterialItem } from '@gamepark/rules-api'

/**
 * The board of another player that grows under the pointer with everything placed on it (CardHover, BoardOwner) needs
 * the hover that carries the items placed on an item: `MaterialDescription.hoverCarriesChildren`, `useHoveredItems` and
 * `ItemContext.hovered`, proposed to react-game (gamepark/react-game PR #164). Until a published version of react-game
 * has them, the game builds and plays without that hover: the boards simply do not grow. Once it is published, they grow
 * with nothing to change here.
 */

type HoveredItem = { type: number; index: number; item: MaterialItem }
type UseHoveredItems = (type: number, index: number, item: MaterialItem) => { hovered?: HoveredItem[] }

const reactGame = ReactGame as unknown as { useHoveredItems?: UseHoveredItems }

/** Does the version of react-game in use carry the hover of an item to the items placed on it? */
export const supportsCarriedHover = typeof reactGame.useHoveredItems === 'function'

const noHover: UseHoveredItems = () => ({ hovered: undefined })

/** The items hovered among an item and the items it is placed on (react-game `useHoveredItems`), or none. */
export const useHoveredItems: UseHoveredItems = reactGame.useHoveredItems ?? noHover

/** The items hovered that carry their hover to this item (react-game `ItemContext.hovered`), or none. */
export const hoveredItems = (context: ItemContext): HoveredItem[] | undefined => (context as { hovered?: HoveredItem[] }).hovered
