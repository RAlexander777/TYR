import { readdir, rm } from 'node:fs/promises'
import { join, extname } from 'node:path'
import sharp from 'sharp'

const TARGETS = [
  { dir: 'puzzle/assets', maxWidth: 1280, quality: 78 },
  { dir: 'historia/assets', maxWidth: 1920, quality: 70 },
  { dir: 'morpag/assets', maxWidth: 1920, quality: 72 },
  { dir: 'morpag/assets/images', maxWidth: 1280, quality: 72 },
  { dir: 'morpag/assets/map_images', maxWidth: 900, quality: 72 },
  { dir: 'morpag/flow/img', maxWidth: 600, quality: 72 },
]

const RASTER = new Set(['.jpg', '.jpeg', '.png'])

const EXCLUDE = new Set(['morpag/flow/img/flowers.png'])

async function optimizeDir({ dir, maxWidth, quality }) {
  let files
  try {
    files = await readdir(dir, { withFileTypes: true })
  } catch {
    console.log(`  (sin carpeta) ${dir}`)
    return
  }

  for (const file of files) {
    if (!file.isFile()) continue
    const ext = extname(file.name).toLowerCase()
    if (!RASTER.has(ext)) continue

    const input = join(dir, file.name)
    const rel = `${dir}/${file.name}`
    if (EXCLUDE.has(rel)) {
      console.log(`  (omitido) ${rel}`)
      continue
    }
    const output = join(dir, file.name.replace(ext, '.webp'))
    const image = sharp(input)
    const meta = await image.metadata()
    if (meta.width > maxWidth) {
      image.resize({ width: maxWidth, withoutEnlargement: true })
    }
    await image.webp({ quality }).toFile(output)
    await rm(input)
    const before = meta.size
    const { size: after } = await sharp(output).metadata()
    const saved = before ? ((1 - after / before) * 100).toFixed(0) : '?'
    console.log(`  ✓ ${file.name} -> ${file.name.replace(ext, '.webp')} (${saved}% menos)`)
  }
}

console.log('Optimizando assets a WebP…')
for (const target of TARGETS) {
  console.log(`\n[${target.dir}]`)
  await optimizeDir(target)
}
console.log('\nListo.')