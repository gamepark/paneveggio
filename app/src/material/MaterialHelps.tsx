import { css } from '@emotion/react'
import { Table } from '@gamepark/paneveggio/logic/Table'
import { Action } from '@gamepark/paneveggio/material/Action'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { startingDecks } from '@gamepark/paneveggio/material/StartingDeck'
import { soloLevel, stradivarius } from '@gamepark/paneveggio/logic/Solo'
import { SoloLevel } from '@gamepark/paneveggio/PaneveggioOptions'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { MaterialHelpProps, usePlayerName, useRules } from '@gamepark/react-game'
import { MaterialRules } from '@gamepark/rules-api'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cardName } from '../headers/HeaderUtils'

/**
 * The help dialogs of the boards, the tokens and the starting and first player cards (step 8). Their texts follow the
 * wording of the rulebook (RULES p. 4 to 18); a paragraph that explains a token is shared by the board and the token.
 */

type Rules = MaterialRules<PlayerColor, MaterialType, LocationType>
type Props = MaterialHelpProps<PlayerColor, MaterialType, LocationType>

/** A section: its title in bold, then its text. */
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <p>
    <b>{title}</b> — {children}
  </p>
)

/** Player board (RULES p. 5 and 7): every area, and the two sequences of a turn. */
export const PlayerBoardHelp = ({ item }: Props) => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()
  const player = usePlayerName(item.location?.player)
  if (rules && item.location?.player === stradivarius(rules.game)) return <StradivariusBoardHelp />
  return (
    <div css={help}>
      <h2>{t('help.board.title', { player })}</h2>
      <Section title={t('help.sheet-music')}>{t('help.sheet-music.text')}</Section>
      <Section title={t('help.ducats')}>{t('help.ducats.text')}</Section>
      <Section title={t('help.wood-stock')}>{t('help.wood-stock.text')}</Section>
      <Section title={t('help.studies')}>{t('help.studies.text')}</Section>
      <Section title={t('help.heritage')}>{t('help.heritage.text')}</Section>
      <Section title={t('help.contacts')}>{t('help.contacts.text')}</Section>
      <Section title={t('help.turn-discard')}>{t('help.turn-discard.text')}</Section>
      <Section title={t('help.partners')}>{t('help.partners.text')}</Section>
      <Section title={t('help.workshop')}>{t('help.workshop.text')}</Section>
      <Section title={t('help.conservation')}>{t('help.conservation.text')}</Section>
    </div>
  )
}

/**
 * Solo: the board of Stradivarius (RULES p. 21 to 24, misc/docs/SOLO.md): how he plays, the rules of his level and of the
 * levels before it, his score, and the swap with his line of Contacts.
 */
const StradivariusBoardHelp = () => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()!
  const level = soloLevel(rules)
  return (
    <div css={help}>
      <h2>{t('help.solo.title', { level: t(`help.solo.level.${level}`) })}</h2>
      <p>{t('help.solo.text')}</p>
      <Section title={t('help.solo.activity')}>{t('help.solo.activity.text')}</Section>
      <Section title={t('help.solo.turn')}>{t('help.solo.turn.text')}</Section>
      <Section title={t('help.conservation')}>{t('help.solo.conservation.text')}</Section>
      <Section title={t('help.workshop')}>{t('help.solo.workshop.text')}</Section>
      <Section title={t('help.solo.end-of-turn')}>{t('help.solo.end-of-turn.text')}</Section>
      {level >= SoloLevel.Piano && <Section title={t('help.solo.level.2')}>{t('help.solo.piano.text')}</Section>}
      {level >= SoloLevel.Forte && <Section title={t('help.solo.level.3')}>{t('help.solo.forte.text')}</Section>}
      {level >= SoloLevel.Fortissimo && <Section title={t('help.solo.level.4')}>{t('help.solo.fortissimo.text')}</Section>}
      <Section title={t('help.contacts')}>{t('help.solo.contacts.text')}</Section>
      <Section title={t('help.solo.score')}>{t('help.solo.score.text')}</Section>
    </div>
  )
}

/** Master Luthier board (RULES p. 6 and 8): its musicians and their extra cost, the help area. */
export const MasterBoardHelp = () => {
  const { t } = useTranslation()
  return (
    <div css={help}>
      <h2>{t('help.master.title')}</h2>
      <p>{t('help.master.text')}</p>
      <Section title={t('master.help-area')}>{t('help.help-area.text')}</Section>
    </div>
  )
}

/** A Note token (RULES p. 5 and 9). */
export const NoteTokenHelp = ({ item }: Props) => {
  const { t } = useTranslation()
  if (item.location?.type === LocationType.ActivityTrack) {
    return (
      <div css={help}>
        <h2>{t('help.solo.activity')}</h2>
        <p>{t('help.solo.activity.text')}</p>
      </div>
    )
  }
  return (
    <div css={help}>
      <h2>{t('help.note.title')}</h2>
      <p>{t('help.sheet-music.text')}</p>
      <ul>
        <li>{t('help.note.move')}</li>
        <li>{t('help.note.swap')}</li>
        <li>{t('help.note.shift')}</li>
      </ul>
    </div>
  )
}

/** A Violin token: a wood in stock, a violin on a musician or in Heritage, or in the reserve (RULES p. 7, 11, 14). */
export const ViolinTokenHelp = ({ item, itemIndex }: Props) => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()!
  const player = usePlayerName(item.id as PlayerColor)
  const table = new Table(rules)
  const quality = itemIndex === undefined ? 1 : table.quality(itemIndex)
  const location = item.location!
  return (
    <div css={help}>
      <h2>{t('help.violin.title', { player })}</h2>
      {location.type === LocationType.WoodStock && <Section title={t('help.wood', { quality })}>{t('help.wood-stock.text')}</Section>}
      {location.type === LocationType.MusicianSlot && itemIndex !== undefined && (
        <Section title={t('help.violin', { quality, prestige: table.prestige(itemIndex) })}>{t('help.violin.text')}</Section>
      )}
      {location.type === LocationType.Heritage && <Section title={t('help.heritage.level', { level: location.id })}>{t('help.heritage.text')}</Section>}
      {location.type === LocationType.Reserve && <p>{t('help.reserve.text')}</p>}
    </div>
  )
}

/** A Lutherie token, whose use depends on where it lies (RULES p. 7). */
export const LutherieTokenHelp = ({ item }: Props) => {
  const { t } = useTranslation()
  const rules = useRules<Rules>()!
  const player = usePlayerName(item.id as PlayerColor)
  const type = item.location?.type
  // The number of tokens of the player in the area (ducats, studies, help area).
  const tokens = rules.material(MaterialType.LutherieToken).location(type!).id(item.id)
  const count = type === LocationType.HelpArea ? tokens.length : tokens.player(item.location?.player).length
  return (
    <div css={help}>
      <h2>{t('help.lutherie.title', { player })}</h2>
      {type === LocationType.Ducats && <Section title={t('help.ducats.count', { count })}>{t('help.ducats.text')}</Section>}
      {type === LocationType.Studies && <Section title={t('help.studies.count', { count })}>{t('help.studies.text')}</Section>}
      {type === LocationType.OnViolin && <p>{t('help.lutherie.quality')}</p>}
      {type === LocationType.HelpArea && <Section title={t('help.help-area.count', { count })}>{t('help.help-area.text')}</Section>}
      {type === LocationType.ReturnedTokens && <p>{t('help.lutherie.returned')}</p>}
      {type === LocationType.OnNote && <p>{t('card.effect.23')}</p>}
      {type === LocationType.Reserve && <p>{t('help.reserve.text')}</p>}
    </div>
  )
}

/** A starting card (RULES p. 6): what it gives. */
export const StartingCardHelp = ({ item }: Props) => {
  const { t } = useTranslation()
  const deck = startingDecks[item.id as Action]
  if (!deck) return null
  return (
    <div css={help}>
      <h2>{t('help.starting.title', { action: item.id })}</h2>
      <p>{t('help.starting.text')}</p>
      <ul>
        <li>{t('help.starting.notes', { notes: deck.sheetMusic.map((action) => t('action.name', { action })).join(', ') })}</li>
        <li>{t('help.starting.musician', { card: cardName(t, deck.musician) })}</li>
        <li>{t('help.starting.hand', { cards: deck.hand.map((card) => cardName(t, card)).join(', ') })}</li>
        <li>{t('help.starting.contacts', { cards: deck.contacts.map((card) => cardName(t, card)).join(', ') })}</li>
      </ul>
    </div>
  )
}

/** The first player card (RULES p. 9 and 18). */
export const FirstPlayerCardHelp = ({ item }: Props) => {
  const { t } = useTranslation()
  const player = usePlayerName(item.location?.player)
  return (
    <div css={help}>
      <h2>{t('help.first-player.title')}</h2>
      <p>{t('help.first-player.text', { player })}</p>
    </div>
  )
}

const help = css`
  font-size: 1.4em;
  max-width: 32em;
  h2 {
    margin: 0 1.5em 0.5em 0;
  }
  p,
  li {
    margin: 0.4em 0;
    line-height: 1.35;
  }
`
