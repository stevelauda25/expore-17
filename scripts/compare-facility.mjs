import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
const output = 'docs/qa/facility-app'
const actual = PNG.sync.read(fs.readFileSync(`${output}/canonical-dpr1.png`))
const results = []
for (const file of ['phase1-baseline.png', 'figma-reference.png']) {
  const reference = PNG.sync.read(fs.readFileSync(`${output}/source/${file}`))
  if (actual.width !== 1440 || actual.height !== 734) throw Error('Canonical app dimensions changed')
  const diff = new PNG({ width: 1440, height: 734 }), overlay = new PNG({ width: 1440, height: 734 })
  const pixels = pixelmatch(reference.data, actual.data, diff.data, 1440, 734, { threshold: .1, includeAA: false })
  let sum = 0, over16 = 0
  for (let i = 0; i < actual.data.length; i += 4) {
    let largest = 0
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(actual.data[i+c] - reference.data[i+c]); sum += delta; largest = Math.max(largest, delta)
      overlay.data[i+c] = Math.round((actual.data[i+c] + reference.data[i+c]) / 2)
    }
    overlay.data[i+3] = 255
    if (largest > 16) over16++
  }
  fs.writeFileSync(`${output}/${file}-diff.png`, PNG.sync.write(diff))
  fs.writeFileSync(`${output}/${file}-overlay.png`, PNG.sync.write(overlay))
  results.push({ reference: file, differentPixels: pixels, fraction: pixels / (1440*734), meanAbsoluteChannelDifference: sum / (1440*734*3), percentOver16: over16/(1440*734)*100 })
}
fs.writeFileSync(`${output}/comparison.json`, JSON.stringify({ results, note: 'Unmasked full app at equivalent dimensions. Source geometry gate remains 0.02px. Figma raster differences are diagnostic and require visual review, as in source closeout.' }, null, 2))
console.log(JSON.stringify(results, null, 2))
// Guard source preservation tightly; retain the source's diagnostic treatment of Figma.
if (results[0].fraction > .001) throw Error('Source visual regression exceeds 0.1%; inspect the unmasked difference')
