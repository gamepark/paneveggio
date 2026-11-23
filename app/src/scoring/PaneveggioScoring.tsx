import { computeScore } from '@gamepark/paneveggio/logic/Scoring'
import { Table } from '@gamepark/paneveggio/logic/Table'
import { Action } from '@gamepark/paneveggio/material/Action'
import { getAffiliation } from '@gamepark/paneveggio/material/CharacterCard'
import { PaneveggioRules } from '@gamepark/paneveggio/PaneveggioRules'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { ScoringDescription } from '@gamepark/react-game'
import { Trans } from 'react-i18next'

enum ScoringKey {
  Violins = 1,
  Wood,
  Study,
  Crafting,
  Relation,
  Restoration,
  Help,
  Total,
  MadeViolins,
  Apprentices
}

const apprenticeKeys: Partial<Record<ScoringKey, Action>> = {
  [ScoringKey.Wood]: Action.Wood,
  [ScoringKey.Study]: Action.Study,
  [ScoringKey.Crafting]: Action.Crafting,
  [ScoringKey.Relation]: Action.Relation,
  [ScoringKey.Restoration]: Action.Restoration
}

/**
 * The final scoring of the game over screen, line by line as the rulebook adds it up (RULES p. 18; Ludo, 23/11/2026:
 * "qu'on voit d'où viennent les points"): the Prestige of the violins, the points of the apprentices of each type, the
 * help of the Master Luthier, the total, then the tie breakers (violins crafted, apprentices). Everything is computed
 * from the table (computeScore), nothing is remembered.
 */
export class PaneveggioScoring implements ScoringDescription<PlayerColor, PaneveggioRules, ScoringKey> {
  getScoringKeys(): ScoringKey[] {
    return [
      ScoringKey.Violins,
      ScoringKey.Wood,
      ScoringKey.Study,
      ScoringKey.Crafting,
      ScoringKey.Relation,
      ScoringKey.Restoration,
      ScoringKey.Help,
      ScoringKey.Total,
      ScoringKey.MadeViolins,
      ScoringKey.Apprentices
    ]
  }

  getScoringHeader(key: ScoringKey) {
    const action = apprenticeKeys[key]
    if (action !== undefined) return <Trans i18nKey="scoring.apprentices-of" values={{ action }} />
    switch (key) {
      case ScoringKey.Violins:
        return <Trans i18nKey="scoring.violins" />
      case ScoringKey.Help:
        return <Trans i18nKey="scoring.help" />
      case ScoringKey.Total:
        return (
          <strong>
            <Trans i18nKey="scoring.total" />
          </strong>
        )
      case ScoringKey.MadeViolins:
        return <Trans i18nKey="scoring.made-violins" />
      default:
        return <Trans i18nKey="scoring.apprentices" />
    }
  }

  getScoringPlayerData(key: ScoringKey, player: PlayerColor, rules: PaneveggioRules) {
    const score = computeScore(rules, player)
    const action = apprenticeKeys[key]
    if (action !== undefined) {
      const points = Object.entries(score.apprentices).filter(([card]) => getAffiliation(Number(card)) === action)
      return points.length ? points.reduce((sum, [, value]) => sum + value, 0) : '–'
    }
    const table = new Table(rules)
    switch (key) {
      case ScoringKey.Violins:
        return score.violins
      case ScoringKey.Help:
        return score.help ? -score.help : 0
      case ScoringKey.Total:
        return <strong>{score.total}</strong>
      case ScoringKey.MadeViolins:
        return `${table.madeViolins(player).length}/12`
      default:
        return table.partnerApprentices(player).length
    }
  }
}
