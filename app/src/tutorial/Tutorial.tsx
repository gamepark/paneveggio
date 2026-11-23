/** @jsxImportSource @emotion/react */
import { AccessoriesType, ClotheType, EyebrowType, EyeType, FacialHairType, MouthType, TopType } from '@gamepark/avataaars'
import { CustomMoveType, Sequence } from '@gamepark/paneveggio/material/CustomMoveType'
import { LocationType } from '@gamepark/paneveggio/material/LocationType'
import { MaterialType } from '@gamepark/paneveggio/material/MaterialType'
import { PlayerColor } from '@gamepark/paneveggio/PlayerColor'
import { MaterialTutorial, TutorialStep } from '@gamepark/react-game'
import { isCustomMoveType, isMoveItemType, MaterialGame, MaterialMove } from '@gamepark/rules-api'
import { Trans } from 'react-i18next'
import { lionel, me, TutorialSetup } from './TutorialSetup'

type Step = TutorialStep<PlayerColor, MaterialType, LocationType, PlayerColor>
type Game = MaterialGame<PlayerColor, MaterialType, LocationType>
type Move = MaterialMove<PlayerColor, MaterialType, LocationType>

const components = { bold: <strong />, italic: <em /> }

const popup = (key: string, position?: { x?: number; y?: number }) => ({
  text: () => <Trans i18nKey={`tuto.${key}`} components={components} />,
  position
})

/** The popup at the top of the screen, above what is focused. */
const top = { y: -25 }

/** Every focus leaves room at the top of the screen for its popup, unless it says otherwise (as in Greylune). */
const roomForPopup = (steps: Step[]): Step[] =>
  steps.map((step) => {
    const focus = step.focus
    return focus ? { ...step, focus: (game, context) => ({ margin: { top: 7, bottom: 0.5, left: 0.5, right: 0.5 }, ...focus(game, context) }) } : step
  })

const isCustom = (type: CustomMoveType, data?: unknown) => (move: Move) =>
  isCustomMoveType(type)(move) && (data === undefined || move.data === data)

/**
 * The tutorial (scenario of Ludo for BGA, misc/docs/TUTORIAL.md, played on Game Park): a first game with the starting
 * decks. The player plays a whole Workshop with the Wood deck, whose sheet music goes through every action, then
 * Lionel a Conservation, then the player a Conservation where they train an apprentice. Then the game goes on against
 * the AI.
 */
export class Tutorial extends MaterialTutorial<PlayerColor, MaterialType, LocationType, PlayerColor> {
  version = 1
  options = { players: [{ id: me }, { id: lionel }], setup: 1, decks: 1 }
  setup = new TutorialSetup()

  players = [
    { id: me },
    {
      id: lionel,
      name: 'Lionel',
      avatar: {
        topType: TopType.ShortHairShortFlat,
        accessoriesType: AccessoriesType.Prescription02,
        hairColor: 'BrownDark',
        facialHairType: FacialHairType.BeardLight,
        clotheType: ClotheType.BlazerSweater,
        clotheColor: 'Gray02',
        eyeType: EyeType.Happy,
        eyebrowType: EyebrowType.DefaultNatural,
        mouthType: MouthType.Smile,
        skinColor: 'Light'
      }
    }
  ]

  // ------------------------------------------------------------------ what the steps point at

  board(player: PlayerColor) {
    return { [MaterialType.PlayerBoard]: [{ location: { type: LocationType.PlayerBoard, player } }] }
  }

  /** The cards around the board of the player: Contacts, partners, hand. */
  area(game: Game) {
    const around = [LocationType.Contacts, LocationType.PartnerMusicians, LocationType.PartnerApprentices, LocationType.PlayerHand]
    return this.material(game, MaterialType.CharacterCard).location((location) => around.includes(location.type)).player(me)
  }

  notes(game: Game) {
    return this.material(game, MaterialType.NoteToken).location(LocationType.SheetMusic).player(me)
  }

  card(game: Game, id: number) {
    return this.material(game, MaterialType.CharacterCard).id(id)
  }

  tokens(game: Game, type: LocationType) {
    return this.material(game, MaterialType.LutherieToken).location(type).player(me)
  }

  woods(game: Game) {
    return this.material(game, MaterialType.ViolinToken).location(LocationType.WoodStock).player(me)
  }

  partners(game: Game, player = me) {
    return this.material(game, MaterialType.CharacterCard).location(LocationType.PartnerMusicians).player(player)
  }

  violins(game: Game) {
    return this.material(game, MaterialType.ViolinToken).id(me).location(LocationType.MusicianSlot)
  }

  // ------------------------------------------------------------------ what the steps let through

  isCard(id: number, to: LocationType) {
    return (move: Move, game: Game) =>
      isMoveItemType(MaterialType.CharacterCard)(move) && move.location.type === to && this.material(game, MaterialType.CharacterCard).getItem(move.itemIndex).id === id
  }

  /** The violin goes on the lowest slot of the Noble n°1, the partner of the player: its bonus is a ducat. */
  isCraftingOnNoble(move: Move, game: Game) {
    return (
      isMoveItemType(MaterialType.ViolinToken)(move) &&
      move.location.type === LocationType.MusicianSlot &&
      move.location.id === 2 &&
      this.material(game, MaterialType.CharacterCard).getItem(move.location.parent!).id === 1
    )
  }

  resolve(key: string, position?: { x?: number; y?: number }): Step {
    return { popup: popup(key, position), move: { filter: isCustom(CustomMoveType.Resolve) } }
  }

  endTurn(player?: PlayerColor): Step {
    return { move: { player, filter: isCustom(CustomMoveType.EndTurn), auto: true } }
  }

  // ------------------------------------------------------------------ the scenario

  steps: Step[] = roomForPopup([
    { popup: popup('welcome') },
    { popup: popup('theme') },
    {
      popup: popup('board', top),
      focus: (game) => ({ staticItems: this.board(me), materials: [this.area(game)], margin: { top: 7, bottom: 0.5, left: 0.5, right: 0.5 } })
    },
    {
      popup: popup('sheet-music', top),
      focus: (game) => ({ materials: [this.notes(game)] })
    },
    {
      popup: popup('change-sheet-music', top),
      focus: (game) => ({ materials: [this.notes(game)] })
    },
    {
      popup: popup('tokens', top),
      focus: (game) => ({ materials: [this.tokens(game, LocationType.Ducats), this.tokens(game, LocationType.Reserve)] })
    },
    {
      popup: popup('sequence'),
      move: { filter: isCustom(CustomMoveType.ChooseSequence, Sequence.Workshop) }
    },

    // ---------------------------------------------------------------- Workshop: Wood, boosted by a card
    {
      popup: popup('wood', top),
      focus: (game) => ({ materials: [this.notes(game).location((location) => location.x! <= 1)] })
    },
    {
      popup: popup('boost', top),
      focus: (game) => ({ materials: [this.card(game, 4)] }),
      move: { filter: this.isCard(4, LocationType.TurnDiscard) }
    },
    this.resolve('resolve-wood'),
    {
      popup: popup('wood-stock', top),
      focus: (game) => ({ materials: [this.woods(game)] })
    },

    // ---------------------------------------------------------------- Study, Crafting
    this.resolve('study'),
    this.resolve('crafting'),
    {
      popup: popup('crafting-slot', top),
      focus: (game) => ({ materials: [this.woods(game), this.partners(game)] }),
      move: { filter: (move, game) => this.isCraftingOnNoble(move, game) }
    },
    {
      popup: popup('violin', top),
      focus: (game) => ({ materials: [this.partners(game), this.violins(game)] })
    },
    {
      popup: popup('master-luthier', top),
      focus: (game) => ({ materials: [this.material(game, MaterialType.CharacterCard).location(LocationType.MasterMusician)] })
    },

    // ---------------------------------------------------------------- Wood again, Relation, Restoration
    this.resolve('wood-again'),
    this.resolve('relation'),
    {
      popup: popup('draw'),
      move: { filter: isCustom(CustomMoveType.DrawCards) }
    },
    {
      popup: popup('contacts', top),
      focus: (game) => ({ materials: [this.material(game, MaterialType.CharacterCard).location(LocationType.Contacts).player(me)] }),
      move: { filter: this.isCard(9, LocationType.PlayerHand) }
    },
    this.resolve('restoration'),
    {
      popup: popup('restore', top),
      focus: (game) => ({ materials: [this.violins(game)] }),
      move: { filter: (move) => isMoveItemType(MaterialType.LutherieToken)(move) && move.location.type === LocationType.OnViolin }
    },

    // ---------------------------------------------------------------- end of the Workshop
    {
      popup: popup('spread', top),
      focus: (game) => ({
        materials: [this.card(game, 4), this.material(game, MaterialType.CharacterCard).location(LocationType.Contacts).player(me)]
      }),
      move: { filter: this.isCard(4, LocationType.Contacts) }
    },
    {
      popup: popup('wear', top),
      focus: (game) => ({ materials: [this.violins(game), this.woods(game)] })
    },
    {
      popup: popup('help-area', top),
      focus: () => ({ staticItems: { [MaterialType.MasterBoard]: [{ location: { type: LocationType.MasterBoard } }] } })
    },
    this.endTurn(),

    // ---------------------------------------------------------------- Lionel: a Conservation
    { popup: popup('opponent') },
    { move: { player: lionel, filter: isCustom(CustomMoveType.ChooseSequence, Sequence.Conservation) } },
    { view: lionel, move: { player: lionel, filter: this.isCard(26, LocationType.PartnerApprentices) } },
    { move: { player: lionel, filter: isCustom(CustomMoveType.Pass) } },
    this.endTurn(lionel),

    // ---------------------------------------------------------------- the player: a Conservation
    {
      popup: popup('conservation'),
      move: { filter: isCustom(CustomMoveType.ChooseSequence, Sequence.Conservation) }
    },
    {
      popup: popup('heritage', top),
      focus: (game) => ({
        materials: [
          this.material(game, MaterialType.ViolinToken).location(LocationType.Heritage).player(me),
          this.material(game, MaterialType.LutherieToken).location(LocationType.ReturnedTokens).player(me)
        ]
      })
    },
    {
      popup: popup('returned-tokens', top),
      focus: (game) => ({ materials: [this.material(game, MaterialType.LutherieToken).location(LocationType.ReturnedTokens).player(me)] }),
      move: { filter: (move) => isMoveItemType(MaterialType.LutherieToken)(move) && move.location.type === LocationType.Ducats }
    },
    { move: { filter: (move) => isMoveItemType(MaterialType.LutherieToken)(move) && move.location.type === LocationType.Studies } },
    {
      popup: popup('apprentice', top),
      focus: (game) => ({ materials: [this.card(game, 15), this.notes(game).location((location) => location.x! >= 3 && location.x! <= 5)] }),
      move: { filter: this.isCard(15, LocationType.PartnerApprentices) }
    },
    {
      popup: popup('musicians'),
      move: { filter: isCustom(CustomMoveType.Pass) }
    },
    this.endTurn(),
    { popup: popup('end-of-game') },
    { popup: popup('good-luck') }
  ])
}
