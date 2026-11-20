import { css } from '@emotion/react'
import { useTranslation } from 'react-i18next'

/**
 * The help of a step of the turn (Ludo, 20/11/2026: the player chooses whether to open it): a title and paragraphs
 * after the rulebook, keys `rules.<name>.title` and `rules.<name>.1`, `.2`…
 */
export const RuleHelp = ({ name, paragraphs }: { name: string; paragraphs: number }) => {
  const { t } = useTranslation()
  return (
    <div css={help}>
      <h2>{t(`rules.${name}.title`)}</h2>
      {Array.from({ length: paragraphs }, (_, index) => (
        <p key={index}>{t(`rules.${name}.${index + 1}`)}</p>
      ))}
    </div>
  )
}

const help = css`
  font-size: 1.4em;
  max-width: 34em;
  h2 {
    margin: 0 1.5em 0.5em 0;
  }
  p {
    margin: 0.5em 0;
    line-height: 1.35;
  }
`
