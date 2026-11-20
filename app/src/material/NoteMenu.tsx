import { css } from '@emotion/react'
import { BEATS } from '@gamepark/paneveggio/logic/SheetMusic'
import { CustomMoveType, NoteMove, NoteMoveType } from '@gamepark/paneveggio/material/CustomMoveType'
import { ItemMenuButton } from '@gamepark/react-game'
import { CustomMove } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'

type Move = CustomMove<CustomMoveType, NoteMove>

/**
 * The moves of a note of the sheet music (RULES p. 9), around the note once it is clicked: one line up, one line down,
 * swap with the note before or the note after ("La première et la dernière note sont considérées comme des notes qui se
 * suivent"). Icons only, their label is a tooltip: the labels overlapped (Ludo, 20/11/2026).
 */
export const NoteMenu = ({ beat, moves }: { beat: number; moves: Move[] }) => {
  const { t } = useTranslation()
  const find = (type: NoteMoveType, at = beat) => moves.find((move) => move.data?.type === type && move.data.beat === at)
  const up = find(NoteMoveType.Up)
  const down = find(NoteMoveType.Down)
  const swapNext = find(NoteMoveType.Swap)
  const swapPrevious = find(NoteMoveType.Swap, (beat + BEATS - 1) % BEATS)
  return (
    <>
      {up && (
        <ItemMenuButton move={up} title={t('note.up')} x={0} y={-1.5}>
          <span css={arrow}>↑</span>
        </ItemMenuButton>
      )}
      {down && (
        <ItemMenuButton move={down} title={t('note.down')} x={0} y={1.5}>
          <span css={arrow}>↓</span>
        </ItemMenuButton>
      )}
      {swapPrevious && (
        <ItemMenuButton move={swapPrevious} title={t('note.swap-previous')} x={-1.5} y={0}>
          <span css={arrow}>⇆</span>
        </ItemMenuButton>
      )}
      {swapNext && (
        <ItemMenuButton move={swapNext} title={t('note.swap-next')} x={1.5} y={0}>
          <span css={arrow}>⇄</span>
        </ItemMenuButton>
      )}
    </>
  )
}

/** On the player board (cm from its centre): left and right of the staff, at the height of its middle line. */
const staffY = 21 * (0.303 - 0.5)

/** Shift all the notes one beat left or right: the first note becomes the last one, or the reverse (RULES p. 9). */
export const ShiftMenu = ({ left, right }: { left?: Move; right?: Move }) => {
  const { t } = useTranslation()
  return (
    <>
      {left && (
        <ItemMenuButton move={left} title={t('note.shift-left')} x={29 * (0.31 - 0.5)} y={staffY}>
          <span css={arrow}>⇠</span>
        </ItemMenuButton>
      )}
      {right && (
        <ItemMenuButton move={right} title={t('note.shift-right')} x={29 * (0.81 - 0.5)} y={staffY}>
          <span css={arrow}>⇢</span>
        </ItemMenuButton>
      )}
    </>
  )
}

const arrow = css`
  font-weight: bold;
`
