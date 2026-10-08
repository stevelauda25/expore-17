import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
const output = 'docs/qa/document-editor'
const results = []
const read = path => PNG.sync.read(fs.readFileSync(path))
function difference(a, b, name, ceiling, masks = [], regions = {}) {
  if (a.width !== b.width || a.height !== b.height) throw Error(`Dimensions differ: ${name}`)
  const raw = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: .1, includeAA: false })
  for (const [x, y, w, h] of masks) for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
    const i = (row * a.width + col) * 4; a.data.copy(b.data, i, i, i + 4)
  }
  const diff = new PNG({ width: a.width, height: a.height })
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: .1, includeAA: false })
  fs.writeFileSync(`${output}/${name}-diff.png`, PNG.sync.write(diff))
  const crops = {}
  for (const [region, [x, y, width, height]] of Object.entries(regions)) {
    const aa = new PNG({ width, height }), bb = new PNG({ width, height }), dd = new PNG({ width, height })
    PNG.bitblt(a, aa, x, y, width, height, 0, 0); PNG.bitblt(b, bb, x, y, width, height, 0, 0)
    const pixels = pixelmatch(aa.data, bb.data, dd.data, width, height, { threshold: .1, includeAA: false })
    for (const [kind, png] of [['reference', aa], ['actual', bb], ['diff', dd]]) fs.writeFileSync(`${output}/${name}-${region}-${kind}.png`, PNG.sync.write(png))
    crops[region] = { differentPixels: pixels, fraction: pixels / (width * height), ceiling: .04 }
  }
  const result = { name, rawFullFrameFraction: raw / (a.width * a.height), fraction: n / (a.width * a.height), ceiling, masks, crops }
  results.push(result)
}
for (const width of [1280, 1440, 1640, 1920]) for (const id of ['header', 'date-picker', 'profile']) difference(read(`${output}/baseline-${id}-${width}.png`), read(`${output}/integrated-${id}-${width}.png`), `isolation-${id}-${width}`, .001, [[width / 2 - 300, (width === 1640 ? 1060 : width === 1920 ? 1080 : 900) - 92, 600, 56]])
for (const state of ['default', 'annotated', 'selection-explain']) {
  const regions = { header: [100, 100, 1440, 108], document: [412, 278, 816, 682], empty: [1240, 208, 300, 752], ...(state === 'selection-explain' ? { menu: [1194, 235, 394, 770], toolbar: [645, 556, 355, 45] } : {}) }
  // The expanded five-tab switcher is an intentional integration addition in the gray margin.
  // Keep the original Figma ceilings and cursor mask; report raw full-frame differences too.
  const masks = [[520, 968, 600, 56], ...(state === 'selection-explain' ? [[794, 651, 26, 25]] : [])]
  difference(read(`${output}/reference/figma/${state}.png`), read(`${output}/inherited-phase-3/${state}-1640.png`), `figma-${state}`, .02, masks, regions)
  for (const width of [1640, 1920]) {
    const height = width === 1640 ? 1060 : 1080
    difference(read(`${output}/reference/phase4/${state}-${width}.png`), read(`${output}/inherited-phase-3/${state}-${width}.png`), `source-${state}-${width}`, .001, [[width / 2 - 300, height - 92, 600, 56]])
  }
}
fs.writeFileSync(`${output}/comparison.json`, JSON.stringify({ threshold: .1, includeAA: false, results, shorterViewportNote: 'At 900px height, the shell is deliberately reduced from 860 to 782px and moved to y=16 to reserve the existing switcher. Full screenshots and geometry are reviewed without a misleading same-frame pixel gate.' }, null, 2))
console.log(JSON.stringify(results, null, 2))
if (results.some(r => r.fraction > r.ceiling || Object.values(r.crops).some(c => c.fraction > c.ceiling))) process.exitCode = 1
