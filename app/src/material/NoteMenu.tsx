import { CustomMoveType, NoteMove, NoteMoveType } from '@gamepark/paneveggio/material/CustomMoveType'
import { ItemMenuButton } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'

/**
 * The moves of a note of the sheet music (RULES p. 9), around the note once it is clicked: one line up, one line down,
 * swap with the next note. The shifts of the whole sheet music are in the header.
 */
export const NoteMenu = ({ moves }: { moves: CustomMove<CustomMoveType, NoteMove>[] }) => {
  const { t } = useTranslation()
  const find = (type: NoteMoveType) => moves.find((move) => move.data?.type === type)
  const up = find(NoteMoveType.Up)
  const down = find(NoteMoveType.Down)
  const swap = find(NoteMoveType.Swap)
  return (
    <>
      {up && (
        <ItemMenuButton move={up} label={t('note.up')} labelPosition="right" y={-1.4}>
          ↑
        </ItemMenuButton>
      )}
      {down && (
        <ItemMenuButton move={down} label={t('note.down')} labelPosition="right" y={1.4}>
          ↓
        </ItemMenuButton>
      )}
      {swap && (
        <ItemMenuButton move={swap} label={t('note.swap')} labelPosition="right" x={1.4}>
          ⇄
        </ItemMenuButton>
      )}
    </>
  )
}
