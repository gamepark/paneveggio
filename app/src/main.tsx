import { PaneveggioOptionsSpecV2 } from '@gamepark/paneveggio/PaneveggioOptions'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PaneveggioSetup } from '@gamepark/paneveggio/PaneveggioSetup'
import { GameProvider } from '@gamepark/react-game'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { gameAnimations } from './animations/GameAnimations'
import { App } from './App'
import { Locators } from './locators/Locators'
import { Material } from './material/Material'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider
      game="paneveggio"
      Rules={PaneveggioRules}
      optionsSpec={PaneveggioOptionsSpecV2}
      GameSetup={PaneveggioSetup}
      material={Material}
      locators={Locators}
      animations={gameAnimations}
    >
      <App />
    </GameProvider>
  </StrictMode>
)
