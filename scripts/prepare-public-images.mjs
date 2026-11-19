// Prepares the cover, box, avatar and favicon images of app/public (see app/src/images/README.md).
// From the repo root:
//   node scripts/prepare-public-images.mjs <publisher "misc" folder>
// e.g. node scripts/prepare-public-images.mjs ../../Paneveggio/misc
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const misc = process.argv[2]
if (!misc) throw new Error('Usage: node scripts/prepare-public-images.mjs <publisher misc folder>')
const pub = path.join(import.meta.dirname, '../app/public')
const out = file => path.join(pub, file)

// ---------------------------------------------------------------- Cover 1920 × 1080: the box front
// The front panel (866 × 622) at full height in the middle; the sides are the same image stretched, blurred
// and darkened.
const frontFile = path.join(misc, 'meta/box-faces/pv_front.jpg')
const front = await sharp(frontFile).resize({ height: 1080, kernel: 'lanczos3' }).toBuffer()
const { width: frontWidth } = await sharp(front).metadata()
const sides = await sharp(frontFile).resize(1920, 1080, { fit: 'cover' }).blur(40).modulate({ brightness: 0.7 }).toBuffer()
const cover = await sharp(sides)
  .composite([{ input: front, left: Math.round((1920 - frontWidth) / 2), top: 0 }])
  .toBuffer()
await sharp(cover).jpeg({ quality: 88, mozjpeg: true }).toFile(out('cover-1920.jpg'))
await sharp(cover).webp({ quality: 90 }).toFile(out('cover-1920.webp'))

// ---------------------------------------------------------------- Box 640 × 640: 3D view of the real box
// misc/meta/box-1120.png is the BGA perspective render (315 × 227 × 50 mm box, transparent background).
// Light cardboard shadow of the game-park skill (dilation 2 px, σ 7 px, opacity 0.36, #1A1107).
const box = await sharp(path.join(misc, 'meta/box-1120.png')).trim({ threshold: 0 }).resize(600, 600, { fit: 'inside' })
  .extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize(640, 640, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
const alpha = await sharp(box).extractChannel(3).dilate(2).toBuffer()
const shadowAlpha = await sharp(alpha).linear(0.36, 0).blur(7).toBuffer()
const shadow = await sharp({ create: { width: 640, height: 640, channels: 3, background: '#1A1107' } })
  .joinChannel(shadowAlpha).png().toBuffer()
const boxWithShadow = await sharp(shadow).composite([{ input: box }]).png().toBuffer()
await sharp(boxWithShadow).png({ compressionLevel: 9 }).toFile(out('box-640.png'))
await sharp(boxWithShadow).webp({ quality: 90, alphaQuality: 100 }).toFile(out('box-640.webp'))

// ---------------------------------------------------------------- Avatar and favicons: the violin of the card back
// Same framing as the BGA icon: square 440 × 440 at (80, 455) of card 82.
const violin = await sharp(path.join(misc, 'sources/elements/cartes-paneveggio_82.png'))
  .extract({ left: 80, top: 455, width: 440, height: 440 }).removeAlpha().toBuffer()
const square = size => sharp(violin).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 })
for (const size of [320, 96, 64]) await square(size).toFile(out(`avatar-${size}.png`))
await square(96).toFile(out('favicon-96x96.png'))

const png320 = await square(320).toBuffer()
fs.writeFileSync(out('favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="320" height="320" viewBox="0 0 320 320"><image width="320" height="320" xlink:href="data:image/png;base64,${png320.toString('base64')}"/></svg>\n`)

// favicon.ico: 16, 32 and 48 px PNG entries in an ICO container.
const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map(size => square(size).toBuffer()))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4) // colour planes
  header.writeUInt16LE(32, entry + 6) // bits per pixel
  header.writeUInt32LE(pngs[i].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += pngs[i].length
})
fs.writeFileSync(out('favicon.ico'), Buffer.concat([header, ...pngs]))

for (const file of ['cover-1920.jpg', 'cover-1920.webp', 'box-640.png', 'box-640.webp', 'avatar-320.png', 'avatar-96.png',
  'avatar-64.png', 'favicon-96x96.png', 'favicon.svg', 'favicon.ico']) {
  console.log(file, Math.round(fs.statSync(out(file)).size / 1024), 'KB')
}
