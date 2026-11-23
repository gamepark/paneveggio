import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { RuleId } from '@gamepark/paneveggio/rules/RuleId'
import { wrapRulesWithTutorial } from '../../../node_modules/@gamepark/react-game/dist/components/tutorial/TutorialRulesWrapper.js'
import { applyAutomaticMoves, LocalMoveType, Material, MaterialGame, MaterialMove, MoveKind } from '@gamepark/rules-api'
import { describe, expect, it, vi } from 'vitest'
import { Tutorial } from './Tutorial'
import { lionel, me } from './TutorialSetup'

/**
 * The display is not loaded: it needs a browser. The tutorial only takes its base class from it, rebuilt here from what
 * it does; everything else it exports is a stand-in nobody calls (as in Greylune).
 */
vi.mock('@gamepark/react-game', () => {
  class MaterialTutorial {
    declare setup: { setup(options: unknown, tutorial: unknown): MaterialGame }
    declare options: unknown
    declare players: unknown[]
    material(game: MaterialGame, type: number) {
      return new Material(type, game.items[type])
    }
    setupTutorial() {
      return [this.setup.setup(this.options, { step: 0, stepComplete: false, popupClosed: false }), this.players]
    }
  }
  const exports: Record<string | symbol, unknown> = { MaterialTutorial }
  const isExport = (key: string | symbol) => typeof key === 'string' && /^[A-Za-z]/.test(key) && key !== 'then'
  return new Proxy(exports, { get: (target, key) => (isExport(key) ? (target[key] ??= function () {}) : target[key]) })
})

/**
 * The tutorial is a script played on the real rules: a step that lets nothing through leaves the player stuck. The whole
 * script is played here, every step taking the first move it lets through, as the opponent does.
 */
describe('Tutorial', () => {
  it('can be played to its last step', () => {
    const tutorial = new Tutorial()
    wrapRulesWithTutorial(tutorial, PaneveggioRules)
    const [game] = tutorial.setupTutorial()
    const rules = new PaneveggioRules(game as MaterialGame)
    const play = (move: MaterialMove) => applyAutomaticMoves(rules, [move])
    const local = (type: LocalMoveType, step?: number) => ({ kind: MoveKind.LocalMove, type, step }) as MaterialMove

    applyAutomaticMoves(rules)
    let guard = 0
    while (game.tutorial!.step < tutorial.steps.length) {
      expect(guard++).toBeLessThan(500)
      const step = tutorial.steps[game.tutorial!.step]
      if (!step.move) {
        play(local(LocalMoveType.SetTutorialStep, game.tutorial!.step + 1))
        continue
      }
      const player = step.move.player ?? me
      const moves = rules.getLegalMoves(player).filter((move) => move.kind !== MoveKind.LocalMove)
      expect(moves.length, `step ${game.tutorial!.step} lets nothing through (rule ${RuleId[game.rule!.id]})`).toBeGreaterThan(0)
      play(moves[0])
    }

    // The turns went the way the texts tell them.
    const cards = (location: LocationType, player: number) =>
      game.items[MaterialType.CharacterCard]!.filter((item) => item.location.type === location && item.location.player === player).map((item) => item.id)
    expect(cards(LocationType.PartnerApprentices, me)).toEqual([15])
    expect(cards(LocationType.PartnerApprentices, lionel)).toEqual([26])
    expect(game.items[MaterialType.ViolinToken]!.filter((item) => item.id === me && item.location.type === LocationType.Heritage)).toHaveLength(1)
    expect(game.rule).toMatchObject({ id: RuleId.SheetMusic, player: lionel })
  })
})
