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

/** On the player board (cm from its centre): left and right of the staff, at the height of its middle line. */
const staffY = 21 * (0.303 - 0.5)

/** Shift all the notes one beat left or right: the first note becomes the last one, or the reverse (RULES p. 9). */
export const ShiftMenu = ({ left, right }: { left?: CustomMove<CustomMoveType, NoteMove>; right?: CustomMove<CustomMoveType, NoteMove> }) => {
  const { t } = useTranslation()
  return (
    <>
      {left && (
        <ItemMenuButton move={left} label={t('note.shift-left')} labelPosition="left" x={29 * (0.31 - 0.5)} y={staffY}>
          ⇠
        </ItemMenuButton>
      )}
      {right && (
        <ItemMenuButton move={right} label={t('note.shift-right')} labelPosition="right" x={29 * (0.81 - 0.5)} y={staffY}>
          ⇢
        </ItemMenuButton>
      )}
    </>
  )
}
