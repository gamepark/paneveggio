import { CustomMoveType } from '@gamepark/paneveggio/material/CustomMoveType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { PlayMoveButton, useLegalMoves, usePlayerId, usePlayerName, useRules } from '@gamepark/react-game'
import { isCustomMoveType } from '@gamepark/rules-api'
import { ReactElement, ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { cardName, Move } from './HeaderUtils'

/** Buttons for the legal custom moves of a type, each with its label. */
export const MoveButtons = ({ type, label, filter }: { type: CustomMoveType; label: (move: Move) => ReactNode; filter?: (move: Move) => boolean }) => {
  const moves = useLegalMoves<Move>(isCustomMoveType(type)).filter((move) => !filter || filter(move))
  return (
    <>
      {moves.map((move, index) => (
        <PlayMoveButton key={index} move={move}>
          {label(move)}
        </PlayMoveButton>
      ))}
    </>
  )
}

/** Buttons to choose a card (custom move with the index of the card as data), labelled with the name of the card. */
export const CardButtons = ({ type }: { type: CustomMoveType }) => {
  const { t } = useTranslation()
  const rules = useRules<PaneveggioRules>()!
  return <MoveButtons type={type} label={(move) => cardName(t, rules.material(MaterialType.CharacterCard).getItem<number>((move as { data: number }).data).id)} />
}

type HeaderProps = {
  /** The key of the header: `header.<key>.you` for the active player, `header.<key>` for the others. */
  name: string
  /** The values of the texts. */
  values?: Record<string, unknown>
  /** The buttons inside the sentence of the active player. */
  components?: Record<string, ReactElement>
  /** What comes after the sentence of the active player (buttons). */
  after?: ReactNode
}

/**
 * The header of a step played by one player: what to do for the player whose turn it is, who does what for the others.
 * It branches on the active player, never on the legal moves (the tutorial filters them).
 */
export const PlayerHeader = ({ name, values = {}, components = {}, after }: HeaderProps) => {
  const { t } = useTranslation()
  const rules = useRules<PaneveggioRules>()!
  const me = usePlayerId<PlayerColor>()
  const active = rules.getActivePlayer()
  const player = usePlayerName(active)
  if (active === undefined || active !== me) return <>{t(`header.${name}`, { player, ...values })}</>
  return (
    <>
      <Trans i18nKey={`header.${name}.you`} values={values} components={components} />
      {after}
    </>
  )
}


/** The header of a simultaneous step: what to do, waiting for the others, or what the players do for a spectator. */
export const SimultaneousHeader = ({ name, values = {}, components = {} }: Omit<HeaderProps, 'after'>) => {
  const { t } = useTranslation()
  const rules = useRules<PaneveggioRules>()!
  const me = usePlayerId<PlayerColor>()
  if (me === undefined || !rules.game.players.includes(me)) return <>{t(`header.${name}`)}</>
  if (!rules.isTurnToPlay(me)) return <>{t('header.waiting')}</>
  return <Trans i18nKey={`header.${name}.you`} values={values} components={components} />
}
