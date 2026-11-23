import { css } from '@emotion/react'
import { computeScore, soloWon, stradivariusScore } from '@gamepark/paneveggio/logic/Scoring'
import { stradivarius } from '@gamepark/paneveggio/logic/Solo'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { useResultText, useRules } from '@gamepark/react-game'
import { useTranslation } from 'react-i18next'

/** The solo result: "Bravo, vous battez Stradivarius" or "Stradivarius l'emporte", with both scores. */
const useSoloResult = () => {
  const rules = useRules<PaneveggioRules>()
  const bot = rules ? stradivarius(rules.game) : undefined
  if (!rules || bot === undefined) return undefined
  const score = stradivariusScore(rules, bot)
  return { score, mine: computeScore(rules, rules.game.players[0]).total, won: soloWon(rules) }
}

/** The result text: in solo against Stradivarius, otherwise the one of the framework. */
export const SoloResult = () => {
  const { t } = useTranslation()
  const result = useSoloResult()
  const resultText = useResultText()
  if (!result) return <>{resultText}</>
  return <>{t(result.won ? 'scoring.result.won' : 'scoring.result.lost', { mine: result.mine, theirs: result.score.total })}</>
}

/** In the result dialog, under the result: the score of Stradivarius line by line (RULES p. 23). */
export const SoloResultDetail = () => {
  const { t } = useTranslation()
  const result = useSoloResult()
  if (!result) return <SoloResult />
  const { score } = result
  const apprentices = Object.values(score.apprentices).reduce((sum, value) => sum + value, 0)
  return (
    <>
      <SoloResult />
      <span css={detail}>
        {t('solo.stradivarius')} : {score.violins} ({t('scoring.violins')})
        {apprentices > 0 && ` + ${apprentices} (${t('scoring.bot-apprentices')})`} + {score.leftovers ?? 0} ({t('scoring.leftovers')})
        {score.help > 0 && ` − ${score.help} (${t('scoring.help')})`} = {score.total} PP
      </span>
    </>
  )
}

const detail = css`
  display: block;
  margin-top: 0.5em;
  font-size: 0.6em;
  font-weight: normal;
`
