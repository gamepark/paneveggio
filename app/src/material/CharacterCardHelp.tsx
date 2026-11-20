import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { MaterialHelpProps, usePlayerName, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { apprentices, getAffiliation, musicians } from '@gamepark/paneveggio/material/CharacterCard'
import { cardName } from '../headers/HeaderUtils'
import { lutherieImages, violinImages } from '../images/Images'

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>

/**
 * Help of a Character card (RULES p. 4): everything printed on it, since the card images are not in every language
 * (texts validated on BGA): its type and affiliated action; for a musician, its Prestige, prerequisites (p. 17), effect
 * and violin slots; for an apprentice, its condition on the sheet music (p. 16), effect and end of game scoring. Then the
 * violins crafted on it, each one as a pile seen from the side (as the tooltip of the card on BGA, Ludo 20/11/2026).
 * A face down card: the draw pile.
 */
export const CharacterCardHelp = ({ item, itemIndex }: MaterialHelpProps<PlayerColor, MaterialType, LocationType>) => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()!
  const card = item.id as number | undefined
  if (card === undefined) {
    const count = rules.material(MaterialType.CharacterCard).location(LocationType.Deck).length
    return (
      <div css={help}>
        <h2>{t('help.deck')}</h2>
        <p>{t('help.deck.text', { count })}</p>
      </div>
    )
  }
  const action = getAffiliation(card)
  const musician = musicians[card]
  const apprentice = apprentices[card]
  return (
    <div css={help}>
      <h2>{cardName(t, card)}</h2>
      {musician ? (
        <>
          <p>{t('help.card.musician', { prestige: musician.prestige, action })}</p>
          <p>
            <b>{t('help.card.prerequisites')}</b> — <Prerequisites prerequisites={musician.prerequisites} />
          </p>
          <p>
            <b>{musician.relation ? t('help.card.relation', { time: musician.relation }) : t('help.card.end-of-turn')}</b> — {t(`card.effect.${card}`)}
          </p>
          <p>
            <b>{t('help.card.slots')}</b> — {musician.slots.map((slot) => t(`help.slot.${slot}`)).join(', ')}
          </p>
        </>
      ) : (
        <>
          <p>{t('help.card.apprentice', { action })}</p>
          <p>
            <b>{t('help.card.condition')}</b> — {t('help.card.pattern', { a: apprentice.pattern[0], b: apprentice.pattern[1], c: apprentice.pattern[2] })}
          </p>
          <p>
            <b>{t('help.card.effect', { action })}</b> — {t(`card.effect.${card}`)}
          </p>
          <p>
            <b>{t('help.card.end-game')}</b> — {t(`card.end-game.${card}`)}
          </p>
        </>
      )}
      {itemIndex !== undefined && <ViolinStacks card={itemIndex} />}
    </div>
  )
}

/** "2 violons de Prestige 1, 1 violon de Prestige 2", or "aucun". */
const Prerequisites = ({ prerequisites }: { prerequisites: number[] }) => {
  const { t } = useTranslation()
  const needed = prerequisites.map((count, index) => ({ count, prestige: index + 1 })).filter(({ count }) => count > 0)
  if (!needed.length) return <>{t('help.card.prerequisites.none')}</>
  return (
    <>
      {needed.map((values) => t('help.card.prerequisite', values)).join(', ')} {t('help.card.prerequisites.where')}
    </>
  )
}

/** The violins on a musician card and their piles: in its help dialog, and next to it when it grows under the pointer. */
export const ViolinStacks = ({ card: itemIndex }: { card: number }) => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()!
  const violins = rules
    .material(MaterialType.ViolinToken)
    .location(LocationType.MusicianSlot)
    .parent(itemIndex)
    .sort((item) => item.location.id as number)
    .getIndexes()
  if (!violins.length) return null
  return (
    <div css={violinsCss}>
      <h3>{t('help.violins-on-card')}</h3>
      <div css={stacks}>
        {violins.map((violin) => (
          <ViolinStack key={violin} violin={violin} />
        ))}
      </div>
    </div>
  )
}

const ViolinStack = ({ violin }: { violin: number }) => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()!
  const owner = rules.material(MaterialType.ViolinToken).getItem<PlayerColor>(violin).id
  const tokens = rules
    .material(MaterialType.LutherieToken)
    .location(LocationType.OnViolin)
    .parent(violin)
    .sort((item) => -(item.location.x ?? 0))
    .getItems<PlayerColor>()
  return (
    <div>
      <b>{t('help.violin-quality', { quality: 1 + tokens.length })}</b>
      <div css={stack}>
        {tokens.map((token, index) => (
          <Row key={index} image={lutherieImages[token.id]} player={token.id} label={t('help.lutherie-token', { n: tokens.length - index })} />
        ))}
        <Row image={violinImages[owner]} player={owner} label={t('help.violin-token')} />
      </div>
    </div>
  )
}

const Row = ({ image, player, label }: { image: string; player: PlayerColor; label: string }) => {
  const name = usePlayerName(player)
  return (
    <div css={row}>
      <img src={image} alt="" />
      <span>
        {label} — <b>{name}</b>
      </span>
    </div>
  )
}

const help = css`
  font-size: 1.4em;
  max-width: 30em;
  h2 {
    margin: 0 1.5em 0.5em 0;
  }
  p {
    margin: 0.4em 0;
    line-height: 1.35;
  }
`

const violinsCss = css`
  min-width: 24em;
  margin-top: 0.8em;
  h3 {
    font-size: 1.2em;
    margin: 0 0 0.5em;
  }
`

/** Up to 5 violins (Ludo, 20/11/2026: the texts were too big): the piles side by side, 2 per line. */
const stacks = css`
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 1em 2em;
`

const stack = css`
  display: flex;
  flex-direction: column;
  margin-top: 0.3em;
`

const row = css`
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-top: -0.4em;
  img {
    width: 1.8em;
  }
`
