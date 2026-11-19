# Images

Every image is produced by `scripts/prepare-images.mjs` from the publisher's files. Re-run it rather than
editing an image by hand, so every image keeps the same framing:

```
node scripts/prepare-images.mjs <publisher folder>/misc/sources/elements
```

## Sources (publisher folder `misc/sources/elements`, not in this repo)

| File | Content |
|------|---------|
| `cartes-paneveggio_1.png` … `_80.png` | French card faces, 674 × 1028 px (57 × 87 mm at 300 dpi, no bleed) |
| `en anglais/cartes-paneveggio-EN_1.png` … `_80.png` | English card faces, same numbers and framing |
| `cartes-paneveggio_81.png`, `_82.png` | First player card and card back (identical in English) |
| `cartes-paneveggio_83.png` | Printer's template: not used |
| `plateau indiv.png`, `en anglais/plateau indiv EN.png` | Player board, 3426 × 2481 px (290 × 210 mm) |
| `plateau indiv mode solo{,2,3,4}.png`, `en anglais/plateau indiv mode solo EN_{1..4}.png` | Stradivarius boards (solo), Pianissimo, Piano, Forte, Fortissimo |
| `Plateau general.pdf` | Master Luthier board print file: illustration and icons are extracted from it |

## Recipe

- **100 px per cm**, lossless WebP. Rectangular material is opaque.
- Cards: resized to **570 × 870 px**. The card numbers 01–75 are the printed numbers.
- Player and Stradivarius boards: resized to **2900 × 2100 px**.
- Master Luthier board: in the print file, the original illustration (2907 × 1636, 16:9) is stretched by 16 %
  in height. We take the embedded image at its true proportions, resized to **2500 × 1407 px**. As on BGA, the
  costs, the help area and the end of game texts are drawn by the app, so they are translated.
- Study and ducat icons: the PDF's JPEG + soft mask, trimmed on alpha. The PDF's third icon (114 px) is a
  smaller copy of the study scroll and is not used.
- Tokens: no publisher file, drawn by the script. Wooden discs of 15 mm (**150 px**), BGA colours, with the
  "wood" shadow of the game-park skill (dilation 6 px, σ 7 px, opacity 0.46, `#1A1107`), which adds a 27 px
  margin: the image is **204 × 204 px** for a 150 px disc.

## Layout

| Folder / file | Content |
|---------------|---------|
| `cards/characters/{fr,en}/<nn>.webp` | 75 character cards, `nn` = printed number 01–75: per affiliation, 10 musicians then 5 apprentices (Wood 01–15, Study 16–30, Crafting 31–45, Relation 46–60, Restoration 61–75) |
| `cards/starters/{fr,en}/<deck>.webp` | 5 starting cards: `study` (file 76), `wood` (77), `relation` (78), `crafting` (79), `restoration` (80) |
| `cards/first-player.webp` | First player card |
| `cards/back.webp` | Card back (draw pile) |
| `boards/player-{fr,en}.webp` | Player board |
| `boards/solo/<level>-{fr,en}.webp` | Stradivarius boards: `pianissimo`, `piano`, `forte`, `fortissimo` |
| `boards/master.webp` | Master Luthier board illustration (no text) |
| `icons/study.webp`, `icons/ducat.webp` | Study and ducat icons |
| `tokens/violin-<color>.webp` | Violin tokens: dark colour, white rim |
| `tokens/lutherie-<color>.webp` | Lutherie tokens: light colour |
| `tokens/note.webp` | Note token (black) |

Token colours (`<color>`): `green` (#1d6b38 / #5fcf8e), `orange` (#b5581c / #f3cd4a), `red` (#b0222c / #ec94c4),
`blue` (#17717a / #86d4ec).

The app shows the French images in French and the English images in every other language.
