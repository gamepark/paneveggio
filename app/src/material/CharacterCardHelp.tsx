import { css } from '@emotion/react'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { MaterialHelpProps, usePlayerName, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { lutherieImages, violinImages } from '../images/Images'

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>

/**
 * Help of a musician card: the violins crafted on it, each one as a pile seen from the side (as the tooltip of the card
 * on BGA, Ludo 20/11/2026): the Lutherie tokens on top in their order of arrival, the Violin token at the bottom, with
 * the name of their owner. The card itself is shown on the left with its violins and their tokens.
 */
export const CharacterCardHelp = ({ itemIndex }: MaterialHelpProps<PlayerColor, MaterialType, LocationType>) =>
  itemIndex === undefined ? null : <ViolinStacks card={itemIndex} />

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
    <div css={help}>
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
  min-width: 24em;
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
