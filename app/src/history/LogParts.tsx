import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { Trans, useTranslation } from 'react-i18next'
import { cardName } from '../headers/HeaderUtils'
import { CardPreview } from '../headers/CardPreview'
import { useAreaName } from '../material/useAreaName'
import { describeMove, LogContext } from './describeMove'

/** The name of a player, or of Stradivarius, in a sentence of the journal. */
export const PlayerText = ({ player }: { player?: PlayerColor }) => {
  const name = useAreaName(player as PlayerColor)
  return <>{name}</>
}

/** The name of a card in a sentence of the journal: the card shows under the pointer. */
export const CardText = ({ card }: { card: number }) => {
  const { t } = useTranslation()
  return <CardPreview card={card}>{cardName(t, card)}</CardPreview>
}

/** An entry of the journal (see describeMove). */
export const MoveLog = ({ move, context }: { move: Parameters<typeof describeMove>[0]; context: LogContext }) => {
  const description = describeMove(move, context)
  if (!description) return null
  return <Trans i18nKey={description.code} values={description.values} components={description.components} />
}
