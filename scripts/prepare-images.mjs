// Prepares every game image from the publisher files (see app/src/images/README.md).
// sharp comes with the project's dependencies (node_modules/sharp). From the repo root:
//   node scripts/prepare-images.mjs <publisher "elements" folder>
// e.g. node scripts/prepare-images.mjs ../../Paneveggio/misc/sources/elements
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const src = process.argv[2]
if (!src) throw new Error('Usage: node scripts/prepare-images.mjs <publisher elements folder>')
const en = path.join(src, 'en anglais')
const dst = path.join(import.meta.dirname, '../app/src/images')
let total = 0

async function save(img, out) {
  const file = path.join(dst, out)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await img.webp({ lossless: true, effort: 6 }).toFile(file)
  total += fs.statSync(file).size
}

// Rectangular material: opaque, resized to 100 px per cm of the physical item.
const opaque = (file, width, height) =>
  sharp(file).flatten({ background: '#ffffff' }).resize(width, height, { fit: 'fill', kernel: 'lanczos3' })

// ---------------------------------------------------------------- Cards: 57 × 87 mm → 570 × 870 px
const CARD = [570, 870]
const pad = n => String(n).padStart(2, '0')
const starters = { 76: 'study', 77: 'wood', 78: 'relation', 79: 'crafting', 80: 'restoration' }
for (const [lang, folder, prefix] of [['fr', src, 'cartes-paneveggio_'], ['en', en, 'cartes-paneveggio-EN_']]) {
  for (let n = 1; n <= 80; n++) {
    const out = n <= 75 ? `cards/characters/${lang}/${pad(n)}.webp` : `cards/starters/${lang}/${starters[n]}.webp`
    await save(opaque(path.join(folder, `${prefix}${n}.png`), ...CARD), out)
  }
}
// 81 (first player) and 82 (back) are identical in both languages. 83 is the printer's template: not used.
await save(opaque(path.join(src, 'cartes-paneveggio_81.png'), ...CARD), 'cards/first-player.webp')
await save(opaque(path.join(src, 'cartes-paneveggio_82.png'), ...CARD), 'cards/back.webp')

// ---------------------------------------------------------------- Player boards: 290 × 210 mm → 2900 × 2100 px
const BOARD = [2900, 2100]
await save(opaque(path.join(src, 'plateau indiv.png'), ...BOARD), 'boards/player-fr.webp')
await save(opaque(path.join(en, 'plateau indiv EN.png'), ...BOARD), 'boards/player-en.webp')
// Stradivarius boards (solo mode, back of the player boards), from the easiest to the hardest level.
const solo = [
  ['pianissimo', 'plateau indiv mode solo.png', 'plateau indiv mode solo EN_1.png'],
  ['piano', 'plateau indiv mode solo2.png', 'plateau indiv mode solo EN_2.png'],
  ['forte', 'plateau indiv mode solo3.png', 'plateau indiv mode solo EN_3.png'],
  ['fortissimo', 'plateau indiv mode solo4.png', 'plateau indiv mode solo EN_4.png']
]
for (const [level, fr, enFile] of solo) {
  await save(opaque(path.join(src, fr), ...BOARD), `boards/solo/${level}-fr.webp`)
  await save(opaque(path.join(en, enFile), ...BOARD), `boards/solo/${level}-en.webp`)
}

// ---------------------------------------------------------------- Master Luthier board (from "Plateau general.pdf")
// In the print file, the original illustration (2907 × 1636, 16:9) is stretched by 16 % in height. We take the
// embedded image at its true proportions; costs, help area and end of game texts are drawn by the app (translated).
const pdf = fs.readFileSync(path.join(src, 'Plateau general.pdf'))
const pdfText = pdf.toString('latin1')
function pdfImage(width, filter) {
  const re = new RegExp(`<<[^<>]*/Subtype/Image/Width ${width}/Height (\\d+)/[^<>]*/Filter/${filter}[^<>]*>>`)
  const m = re.exec(pdfText)
  if (!m) throw new Error(`Image ${width} px (${filter}) not found in the PDF`)
  let start = pdfText.indexOf('stream', m.index + m[0].length) + 6
  if (pdfText[start] === '\r') start++
  if (pdfText[start] === '\n') start++
  const data = pdf.subarray(start, pdfText.indexOf('endstream', start))
  return { height: Number(m[1]), data: filter === 'FlateDecode' ? zlib.inflateSync(data) : data }
}
const master = pdfImage(2907, 'FlateDecode')
// 250 × 141 mm at 100 px/cm
await save(sharp(master.data, { raw: { width: 2907, height: master.height, channels: 3 } }).resize(2500, 1407, { kernel: 'lanczos3' }), 'boards/master.webp')

// Icons of the same PDF: JPEG colour + greyscale soft mask.
async function icon(width, out, crop) {
  const color = pdfImage(width, 'DCTDecode')
  const mask = pdfImage(width, 'FlateDecode')
  const rgb = await sharp(color.data).removeAlpha().raw().toBuffer()
  let img = sharp(rgb, { raw: { width, height: color.height, channels: 3 } }).joinChannel(mask.data, {
    raw: { width, height: mask.height, channels: 1 }
  })
  if (crop) img = sharp(await img.png().toBuffer()).extract(crop)
  await save(sharp(await img.png().toBuffer()).trim({ threshold: 0 }), out)
}
await icon(147, 'icons/study.webp')
await icon(229, 'icons/ducat.webp')
// The PDF's third icon (114 px) is a smaller copy of the study scroll: not used.

// ---------------------------------------------------------------- Tokens (drawn: no publisher file)
// Wooden discs, 15 mm → 150 px, colours of the BGA adaptation: Violin = dark colour with a white rim,
// Lutherie = matching light colour, Note = black. Shadow "wood" of the game-park skill (dilation 6 px,
// Gaussian σ 7 px, opacity 0.46, tint #1A1107), baked in with no offset.
const TOKEN = 150
const MARGIN = 27 // shadow: 6 px dilation + ~3σ
const SIZE = TOKEN + 2 * MARGIN
const c = SIZE / 2
const r = TOKEN / 2
const disc = (fill, rim, rimWidth) => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="light" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="#fff" stop-opacity=".28"/>
      <stop offset=".6" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".22"/>
    </radialGradient>
  </defs>
  <circle cx="${c}" cy="${c}" r="${r}" fill="${rim}"/>
  <circle cx="${c}" cy="${c}" r="${r - rimWidth}" fill="${fill}"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#light)"/>
</svg>`
const shadowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <circle cx="${c}" cy="${c}" r="${r + 6}" fill="#1A1107" fill-opacity=".46"/>
</svg>`
const shadow = await sharp(Buffer.from(shadowSvg)).blur(7).png().toBuffer()
const token = async (svg, out) =>
  save(sharp(shadow).composite([{ input: Buffer.from(svg) }]), out)
const darken = (hex, k) =>
  '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('')
const colors = {
  green: ['#1d6b38', '#5fcf8e'],
  orange: ['#b5581c', '#f3cd4a'],
  red: ['#b0222c', '#ec94c4'],
  blue: ['#17717a', '#86d4ec']
}
for (const [color, [dark, light]] of Object.entries(colors)) {
  await token(disc(dark, '#ffffff', 10), `tokens/violin-${color}.webp`)
  await token(disc(light, darken(light, 0.7), 4), `tokens/lutherie-${color}.webp`)
}
await token(disc('#141414', '#000000', 3), 'tokens/note.webp')

console.log(`${(total / 1024 / 1024).toFixed(1)} MB written to ${dst}`)
