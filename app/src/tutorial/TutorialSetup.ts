import { firstGameMasterMoves, startingDeckMoves } from '@gamepark/paneveggio/logic/StartingDecks'
import { Action } from '@gamepark/paneveggio/material/Action'
import { startingDecks } from '@gamepark/paneveggio/material/StartingDeck'
import { PaneveggioSetup } from '@gamepark/paneveggio/PaneveggioSetup'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'

export const me = PlayerColor.Blue
/** The opponent bears the name of the author of the game (Lionel Graveleau). */
export const lionel = PlayerColor.Red

/**
 * The setup of a first game (RULES p. 6, "Decks de démarrage"), with the decks the scenario is written for: the player
 * gets the Wood deck, whose sheet music plays every action in its first Workshop; Lionel the Study deck; the Master
 * Luthier the musician of the Crafting deck. Everything else (the draw pile) is left to chance.
 */
export class TutorialSetup extends PaneveggioSetup {
  setupRandomDecks() {
    startingDeckMoves(this, me, startingDecks[Action.Wood])
    startingDeckMoves(this, lionel, startingDecks[Action.Study])
    firstGameMasterMoves(this, startingDecks[Action.Crafting].musician)
  }
}
