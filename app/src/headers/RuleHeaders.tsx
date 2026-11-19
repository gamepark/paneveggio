import { CustomMoveType, Pick, Sequence } from '@gamepark/paneveggio/material/CustomMoveType'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { UseApprentice } from '@gamepark/paneveggio/rules/PlayActionRule'
import { CopyMode, DiscardReward } from '@gamepark/paneveggio/rules/Task'
import { PlayMoveButton, useLegalMove, useLegalMoves, usePlayerId, useRules } from '@gamepark/react-game'
import { isCustomMoveType, isMoveItemType } from '@gamepark/rules-api'
import { useTranslation } from 'react-i18next'
import { CardButtons, MoveButtons, PlayerHeader, SimultaneousHeader } from './HeaderTools'
import { cardName, isCustom, Move, usePass, useTask } from './HeaderUtils'

const useActive = () => useRules<PaneveggioRules>()!.getActivePlayer()!

/** A ducat / a study: the two moves of the first token, from the reserve or from the returned tokens. */
const useDucatOrStudy = () => {
  const moves = useLegalMoves<Move>(isMoveItemType(MaterialType.LutherieToken))
  const to = (type: LocationType) => moves.find((move) => isMoveItemType(MaterialType.LutherieToken)(move) && move.location.type === type)
  return { ducat: to(LocationType.Ducats), study: to(LocationType.Studies) }
}

// ------------------------------------------------------------------ setup

export const ChooseStartingDeckHeader = () => <PlayerHeader name="choose-starting-deck" />

export const MulliganHeader = () => {
  const rules = useRules<PaneveggioRules>()!
  const me = usePlayerId<PlayerColor>()
  const draw = useLegalMove(isCustomMoveType(CustomMoveType.DrawCards))
  const returned = me === undefined ? 0 : 10 - rules.material(MaterialType.CharacterCard).location(LocationType.PlayerHand).player(me).length
  return <SimultaneousHeader name="mulligan" values={{ n: returned }} components={{ draw: <PlayMoveButton move={draw} /> }} />
}

export const KeepSevenHeader = () => {
  const rules = useRules<PaneveggioRules>()!
  const me = usePlayerId<PlayerColor>()
  const extra = me === undefined ? 0 : rules.material(MaterialType.CharacterCard).location(LocationType.PlayerHand).player(me).length - 7
  return <SimultaneousHeader name="keep-seven" values={{ n: extra }} />
}

export const DraftHeader = () => <SimultaneousHeader name="draft" />

export const ChooseStartingMusicianHeader = () => <PlayerHeader name="choose-starting-musician" />

export const ArrangeStartHeader = () => {
  const rules = useRules<PaneveggioRules>()!
  const me = usePlayerId<PlayerColor>()
  const contacts = me === undefined ? 0 : rules.material(MaterialType.CharacterCard).location(LocationType.Contacts).player(me).length
  const notes = me === undefined ? 0 : rules.material(MaterialType.NoteToken).player(me).length
  return <SimultaneousHeader name="arrange-start" values={{ contacts, notes }} />
}

// ------------------------------------------------------------------ start of turn

export const SpreadReturnedTokensHeader = () => {
  const rules = useRules<PaneveggioRules>()!
  const n = rules.material(MaterialType.LutherieToken).location(LocationType.ReturnedTokens).player(useActive()).length
  const { ducat, study } = useDucatOrStudy()
  return <PlayerHeader name="spread-returned-tokens" values={{ n }} components={{ ducat: <PlayMoveButton move={ducat} />, study: <PlayMoveButton move={study} /> }} />
}

export const SheetMusicHeader = () => {
  const workshop = useLegalMove(isCustom(CustomMoveType.ChooseSequence, Sequence.Workshop))
  const conservation = useLegalMove(isCustom(CustomMoveType.ChooseSequence, Sequence.Conservation))
  return <PlayerHeader name="sheet-music" components={{ workshop: <PlayMoveButton move={workshop} />, conservation: <PlayMoveButton move={conservation} /> }} />
}

// ------------------------------------------------------------------ Workshop

export const PlayActionHeader = () => {
  const { t } = useTranslation()
  const task = useTask()
  const resolve = useLegalMove((move: Move) => isCustom(CustomMoveType.Resolve, {})(move))
  const pass = usePass()
  const values = { action: task?.action, time: task?.time }
  const apprentice = (move: Move) => {
    const { card, x } = (move as { data: UseApprentice }).data
    const name = cardName(t, card)
    if ([72, 73, 74].includes(card)) return t('button.ignore-action', { card: name })
    return x === undefined ? name : t('button.apprentice-x', { card: name, x })
  }
  const resolveLabel = (move: Move) => {
    const data = (move as { data: { split?: number; payWithStudy?: boolean } }).data
    if (data.split) return t('button.resolve-split', { a: data.split, b: (task?.time ?? 0) - data.split })
    if (data.payWithStudy) return t('button.resolve-study', { time: task?.time })
    return null
  }
  const after = (
    <>
      {' '}
      <MoveButtons type={CustomMoveType.UseApprentice} label={apprentice} />
      <MoveButtons type={CustomMoveType.Resolve} filter={(move) => resolveLabel(move) !== null} label={(move) => resolveLabel(move)} />
    </>
  )
  if (task?.resolved) return <PlayerHeader name="play-action.resolved" values={values} components={{ done: <PlayMoveButton move={pass} /> }} after={after} />
  return <PlayerHeader name="play-action" values={values} components={{ resolve: <PlayMoveButton move={resolve} />, skip: <PlayMoveButton move={pass} /> }} after={after} />
}

export const CraftingHeader = () => {
  const task = useTask()
  return <PlayerHeader name="crafting" values={{ time: task?.time }} components={{ pass: <PlayMoveButton move={usePass()} /> }} />
}

export const RelationHeader = () => {
  const task = useTask()
  const draw = useLegalMove(isCustomMoveType(CustomMoveType.DrawCards))
  return (
    <PlayerHeader
      name="relation"
      values={{ time: task?.time }}
      components={{ draw: <PlayMoveButton move={draw} />, pass: <PlayMoveButton move={usePass()} /> }}
      after={
        <>
          {' '}
          <CardButtons type={CustomMoveType.ChooseCard} />
        </>
      }
    />
  )
}

export const DrawHeader = () => <PlayerHeader name="draw" components={{ pass: <PlayMoveButton move={usePass()} /> }} />

export const RestorationHeader = () => {
  const task = useTask()
  return <PlayerHeader name="restoration" values={{ count: task?.count }} components={{ pass: <PlayMoveButton move={usePass()} /> }} />
}

// ------------------------------------------------------------------ card effects

export const PlaceCardHeader = () => <PlayerHeader name="place-card" components={{ pass: <PlayMoveButton move={usePass()} /> }} />

export const GainChoiceHeader = () => {
  const task = useTask()
  const { ducat, study } = useDucatOrStudy()
  return (
    <PlayerHeader
      name="gain-choice"
      values={{ n: task?.n }}
      components={{ ducat: <PlayMoveButton move={ducat} />, study: <PlayMoveButton move={study} />, pass: <PlayMoveButton move={usePass()} /> }}
    />
  )
}

export const AgeHeader = () => <PlayerHeader name="age" components={{ pass: <PlayMoveButton move={usePass()} /> }} />

export const ValorizeHeader = () => {
  const task = useTask()
  const rules = useRules<PaneveggioRules>()!
  const pass = usePass()
  const payments = useLegalMoves<Move>(isMoveItemType(MaterialType.LutherieToken))
  if (task?.count) {
    const from = (type: LocationType) =>
      payments.find((move) => isMoveItemType(MaterialType.LutherieToken)(move) && rules.material(MaterialType.LutherieToken).getItem(move.itemIndex).location.type === type)
    return (
      <PlayerHeader
        name="valorize.pay"
        values={{ count: task.count }}
        components={{ ducat: <PlayMoveButton move={from(LocationType.Ducats)} />, study: <PlayMoveButton move={from(LocationType.Studies)} /> }}
      />
    )
  }
  return <PlayerHeader name="valorize" values={{ n: task?.n, cost: task?.cost ?? 1 }} components={{ pass: <PlayMoveButton move={pass} /> }} />
}

export const RecycleHeritageHeader = () => <PlayerHeader name="recycle-heritage" components={{ pass: <PlayMoveButton move={usePass()} /> }} />

export const DiscardForHeader = () => {
  const task = useTask()
  const pass = usePass()
  if (task?.reward === DiscardReward.ValorizeByCount) {
    return <PlayerHeader name="discard-for.bonporti" values={{ discarded: task.discarded }} components={{ pass: <PlayMoveButton move={pass} /> }} />
  }
  return (
    <PlayerHeader
      name={task?.mandatory ? 'discard-for.mandatory' : 'discard-for'}
      values={{ count: task?.count, reward: task?.reward, n: task?.n, time: task?.time }}
      components={{ pass: <PlayMoveButton move={pass} /> }}
    />
  )
}

export const CopyRelationHeader = () => {
  const task = useTask()
  return (
    <PlayerHeader
      name={task?.copy === CopyMode.Opponent ? 'copy-relation.opponent' : 'copy-relation.partner'}
      components={{ pass: <PlayMoveButton move={usePass()} /> }}
      after={
        <>
          {' '}
          <CardButtons type={CustomMoveType.ChooseCard} />
        </>
      }
    />
  )
}

export const SomisHeader = () => (
  <PlayerHeader
    name="somis"
    components={{ pass: <PlayMoveButton move={usePass()} /> }}
    after={
      <>
        {' '}
        <CardButtons type={CustomMoveType.TakeBack} />
      </>
    }
  />
)

export const DallAbacoHeader = () => <PlayerHeader name="dall-abaco" components={{ pass: <PlayMoveButton move={usePass()} /> }} />

export const MoveNotesHeader = () => {
  const task = useTask()
  return <PlayerHeader name="move-notes" values={{ count: task?.count }} components={{ pass: <PlayMoveButton move={usePass()} /> }} />
}

export const RameauHeader = () => <PlayerHeader name="rameau" components={{ pass: <PlayMoveButton move={usePass()} /> }} />

export const RepeatGainHeader = () => {
  const task = useTask()
  const draw = useLegalMove(isCustom(CustomMoveType.Pick, Pick.Draw))
  const study = useLegalMove(isCustom(CustomMoveType.Pick, Pick.Study))
  const ducat = useLegalMove(isCustom(CustomMoveType.Pick, Pick.Ducat))
  return (
    <PlayerHeader
      name="repeat-gain"
      values={{ count: task?.count }}
      components={{ draw: <PlayMoveButton move={draw} />, study: <PlayMoveButton move={study} />, ducat: <PlayMoveButton move={ducat} />, pass: <PlayMoveButton move={usePass()} /> }}
    />
  )
}

export const LowerWoodHeader = () => <PlayerHeader name="lower-wood" />

export const ReclaimTokensHeader = () => {
  const task = useTask()
  return (
    <PlayerHeader
      name={task?.resourcesOnly ? 'reclaim-tokens.aging' : 'reclaim-tokens'}
      values={{ count: task?.count }}
      components={{ pass: <PlayMoveButton move={usePass()} /> }}
    />
  )
}

export const ApplyEffectHeader = () => <PlayerHeader name="apply-effect" />

// ------------------------------------------------------------------ end of the Workshop, Conservation, end of turn

export const EndOfTurnEffectHeader = () => (
  <PlayerHeader
    name="end-of-turn-effect"
    components={{ pass: <PlayMoveButton move={usePass()} /> }}
    after={
      <>
        {' '}
        <CardButtons type={CustomMoveType.ChooseCard} />
      </>
    }
  />
)

export const SpreadDiscardsHeader = () => <PlayerHeader name="spread-discards" />

export const AgingHeader = () => {
  const task = useTask()
  return <PlayerHeader name="aging" values={{ count: task?.count }} />
}

export const HandLimitHeader = () => {
  const rules = useRules<PaneveggioRules>()!
  const n = rules.material(MaterialType.CharacterCard).location(LocationType.PlayerHand).player(useActive()).length - 10
  return <PlayerHeader name="hand-limit" values={{ n }} />
}

export const ConservationHeader = () => (
  <PlayerHeader
    name="conservation"
    components={{ done: <PlayMoveButton move={usePass()} /> }}
    after={
      <>
        {' '}
        <CardButtons type={CustomMoveType.TakeBack} />
      </>
    }
  />
)

/** The turn ends by itself after 10 seconds: until then, the player can still undo (game-park skill). */
export const EndTurnHeader = () => {
  const end = useLegalMove(isCustomMoveType(CustomMoveType.EndTurn))
  return <PlayerHeader name="end-turn" components={{ end: <PlayMoveButton move={end} auto={10} /> }} />
}

export const FinalSheetMusicHeader = () => <PlayerHeader name="final-sheet-music" components={{ done: <PlayMoveButton move={usePass()} /> }} />

export const FinalApprenticesHeader = () => <PlayerHeader name="final-apprentices" components={{ done: <PlayMoveButton move={usePass()} /> }} />
