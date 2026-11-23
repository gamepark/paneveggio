import { MaterialMove } from '@gamepark/rules-api'
import { Resource } from '../material/CustomMoveType'
import { LocationType } from '../material/LocationType'
import { MaterialType } from '../material/MaterialType'
import { PlayerColor } from '../PlayerColor'
import { RuleId } from '../rules/RuleId'
import { GameMaterial, MAX_QUALITY, Table } from './Table'

type Move = MaterialMove<PlayerColor, MaterialType, LocationType, RuleId>

export const resourceLocation = (resource: Resource) => (resource === Resource.Ducat ? LocationType.Ducats : LocationType.Studies)

/**
 * Plans the moves of the Lutherie tokens of a player, several at a time. The moves are only played after they are all
 * computed: the bank remembers which token went where, so that a token is never used twice, and a token that has just
 * been paid back into the reserve can be used again.
 *
 * Every gain takes its tokens from the reserve, at most what it holds: "Les gains peuvent être perçus partiellement"
 * (RULES p. 8).
 */
export class Bank {
  private readonly table: Table
  private readonly pools: Map<LocationType, number[]>

  constructor(
    private readonly game: GameMaterial,
    readonly player: PlayerColor
  ) {
    this.table = new Table(game)
    this.pools = new Map([
      [LocationType.Reserve, this.table.reserve(player).getIndexes()],
      [LocationType.Ducats, this.table.ducats(player).getIndexes()],
      [LocationType.Studies, this.table.studies(player).getIndexes()],
      [LocationType.HelpArea, this.table.helpTokens(player).getIndexes()]
    ])
  }

  count(location: LocationType) {
    return this.pools.get(location)!.length
  }

  get reserve() {
    return this.count(LocationType.Reserve)
  }

  private move(from: LocationType, to: LocationType, n: number): Move[] {
    const source = this.pools.get(from)!
    const tokens = source.splice(0, Math.min(n, source.length))
    this.pools.get(to)!.push(...tokens)
    const location = to === LocationType.HelpArea ? { type: to } : { type: to, player: this.player }
    return tokens.map((index) => this.game.material(MaterialType.LutherieToken).index(index).moveItem(location))
  }

  /** Gain n ducats or n studies, at most what the reserve holds. */
  gain(resource: Resource, n: number): Move[] {
    return this.move(LocationType.Reserve, resourceLocation(resource), n)
  }

  /** Pay n ducats or n studies: the tokens go back into the reserve. */
  pay(resource: Resource, n: number): Move[] {
    return this.move(resourceLocation(resource), LocationType.Reserve, n)
  }

  /**
   * Help of the Master Luthier (RULES p. 8): a token of the reserve is blocked on the help area until the end of the
   * game, and the player gets a ducat or a study, that is to say a second token of their reserve [H14].
   */
  askForHelp(resource: Resource): Move[] {
    return [...this.move(LocationType.Reserve, LocationType.HelpArea, 1), ...this.gain(resource, 1)]
  }

  /** Cards n°5, 29, 40: take back up to n tokens blocked on the help area, into the reserve. */
  returnHelp(n: number): Move[] {
    return this.move(LocationType.HelpArea, LocationType.Reserve, n)
  }

  /** A token that comes back into a pool through a move planned elsewhere (the wear of the violins of Stradivarius). */
  deposit(location: LocationType, token: number) {
    this.pools.get(location)!.push(token)
  }

  /** Solo: Stradivarius blocks a token of his reserve on the help area (−1 PP), without any gain (RULES p. 22). */
  block(): Move[] {
    return this.move(LocationType.Reserve, LocationType.HelpArea, 1)
  }

  /**
   * Solo [S16]: with an empty reserve, Stradivarius takes back a token of his Ducats area, or else of his Studies area,
   * as a player who lacks tokens.
   */
  refill(): Move[] {
    if (this.reserve) return []
    return this.count(LocationType.Ducats) ? this.pay(Resource.Ducat, 1) : this.pay(Resource.Study, 1)
  }

  /** Put a token of the reserve on top of a pile (wood or violin). */
  stack(violin: number, quality: number): Move[] {
    if (quality >= MAX_QUALITY) return []
    const source = this.pools.get(LocationType.Reserve)!
    const token = source.shift()
    if (token === undefined) return []
    return [this.game.material(MaterialType.LutherieToken).index(token).moveItem({ type: LocationType.OnViolin, parent: violin })]
  }
}
