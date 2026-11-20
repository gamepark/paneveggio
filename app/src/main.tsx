import { PaneveggioAI } from '@gamepark/paneveggio/ai/PaneveggioAI'
import { PaneveggioOptionsSpecV2 } from '@gamepark/paneveggio/PaneveggioOptions'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PaneveggioSetup } from '@gamepark/paneveggio/PaneveggioSetup'
import { css } from '@emotion/react'
import { GameProvider } from '@gamepark/react-game'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { gameAnimations } from './animations/GameAnimations'
import { App } from './App'
import { RulesHelp } from './headers/RulesHelp'
import { Locators } from './locators/Locators'
import { Material, materialI18n } from './material/Material'

/** The texts of the header are long (many choices): smaller than the default 4.5em (Ludo, 19/11/2026). */
const theme = {
  header: {
    bar: css`
      h1 {
        font-size: 3.4em;
        margin-top: 0.45em;
      }
    `
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider
      game="paneveggio"
      Rules={PaneveggioRules}
      optionsSpec={PaneveggioOptionsSpecV2}
      GameSetup={PaneveggioSetup}
      material={Material}
      materialI18n={materialI18n}
      locators={Locators}
      animations={gameAnimations}
      theme={theme}
      rulesHelp={RulesHelp}
      ai={PaneveggioAI}
    >
      <App />
    </GameProvider>
  </StrictMode>
)
