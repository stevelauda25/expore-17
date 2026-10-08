import { test, expect, type Page } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const output = 'docs/qa/facility-app'
const tab = (page: Page, name: string) => page.getByRole('tablist', { name: 'UI explorations' }).getByRole('tab', { name, exact: true })
async function activate(page: Page) {
  await tab(page, 'Facility app').click()
  await expect(page.locator('.facility-app-scope')).toBeVisible()
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.querySelectorAll<HTMLImageElement>('.facility-app-scope img')].map(img => img.decode()))
  })
}
for (const dpr of [1, 2]) test(`Facility source geometry, assets, typography and DPR ${dpr}`, async ({ browser }, testInfo) => {
  const suffix = testInfo.project.name === 'chromium' ? '' : `-${testInfo.project.name}`
  // 734px of actual app plus the separate 118px shared-switcher reservation.
  const context = await browser.newContext({ viewport: { width: 1440, height: 852 }, deviceScaleFactor: dpr })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  page.on('requestfailed', r => errors.push(r.url()))
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  await page.goto('/'); await activate(page); await page.mouse.move(1439, 851)
  const actual = await page.locator('.facility-app-scope').evaluate(root => {
    const rect = (el: Element) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height] }
    return {
      geometry: Object.fromEntries([...root.querySelectorAll<HTMLElement>('[data-geometry]')].map(el => [el.dataset.geometry, rect(el)])),
      rows: [...root.querySelectorAll('.runtime-row')].map(rect),
      cells: [...root.querySelectorAll<HTMLElement>('.runtime-cell')].map(el => ({ rect: rect(el), hours: el.dataset.runtime, color: getComputedStyle(el).backgroundColor })),
      images: [...root.querySelectorAll<HTMLImageElement>('img')].map(el => ({ path: new URL(el.src).pathname, rect: rect(el), loaded: el.complete && el.naturalWidth > 0 })),
      wraps: [...root.querySelectorAll('.booked-hours, .review-item p')].map(el => rect(el)[3]),
      font: getComputedStyle(root).fontFamily,
      fontLoaded: [...document.fonts].some(f => f.family.replaceAll('"', '') === 'Facility Inter' && f.status === 'loaded'),
      scroll: [root.scrollWidth, root.scrollHeight],
    }
  })
  const baseline = JSON.parse(await readFile(`${output}/source/gate-report.json`, 'utf8')).canonical
  // Compare Firefox to the untouched source rendered by the same engine.
  const cellBaseline = testInfo.project.name === 'firefox'
    ? JSON.parse(await readFile(`${output}/source/firefox-cell-geometry.json`, 'utf8')).cells
    : baseline.cells
  for (const [name, bounds] of Object.entries(actual.geometry as Record<string, number[]>)) {
    bounds.forEach((value, i) => expect(Math.abs(value - baseline.geometry[name][i]), `${name}[${i}]`).toBeLessThanOrEqual(.02))
  }
  actual.rows.forEach((row, n) => row.forEach((v, i) => expect(Math.abs(v - baseline.rows[n][i])).toBeLessThanOrEqual(.02)))
  actual.cells.forEach((cell, n) => {
    cell.rect.forEach((v, i) => expect(Math.abs(v - cellBaseline[n].rect[i])).toBeLessThanOrEqual(.02))
    expect(cell.hours).toBe(cellBaseline[n].hours)
    expect(cell.color).toBe(cellBaseline[n].color)
  })
  expect(actual.wraps).toEqual([36, 36, 36])
  expect(actual.font.replaceAll('"', '')).toBe('Facility Inter, sans-serif')
  expect(actual.fontLoaded).toBe(true)
  expect(actual.scroll).toEqual([1440, 734])
  await expect(page.locator('.facility-app-scope .runtime-row.is-selected')).toHaveAttribute('data-equipment', 'AHU-03')
  await expect(page.locator('.facility-app-scope .nav-item[aria-current="page"]')).toHaveText('Sites')
  const manifest = JSON.parse(await readFile(`${output}/source/asset-manifest.json`, 'utf8'))
  for (const asset of manifest.assets) {
    const path = asset.file.replace('public/', 'public/facility-app/')
    expect(createHash('sha256').update(await readFile(path)).digest('hex')).toBe(asset.sha256)
    const instances = actual.images.filter(i => i.path === path.replace('public', ''))
    expect(instances.length).toBeGreaterThan(0)
    expect(instances.every(i => i.loaded)).toBe(true)
    for (const slot of asset.expectedSlots) expect(instances.some(i => slot.every((v: number, n: number) => Math.abs(i.rect[n] - v) < .03))).toBe(true)
  }
  await page.locator('.facility-app-scope').screenshot({ path: `${output}/canonical-dpr${dpr}${suffix}.png`, animations: 'disabled' })
  await page.screenshot({ path: `${output}/canonical-host-dpr${dpr}${suffix}.png`, animations: 'disabled' })
  expect(errors).toEqual([])
  await writeFile(`${output}/canonical-dpr${dpr}${suffix}.json`, JSON.stringify({ ...actual, errors }, null, 2))
  await context.close()
})

test('Facility loads only on activation, remains mounted and retains controlled scroll; hidden panel is inert', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  const requests: string[] = []
  page.on('request', r => { if (r.url().includes('/src/facility-app/') || r.url().includes('/facility-app/assets/')) requests.push(r.url()) })
  await page.goto('/')
  await expect(tab(page, 'Header')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.facility-app-scope')).toHaveCount(0)
  expect(requests).toEqual([])
  await tab(page, 'Header').focus(); await page.keyboard.press('ArrowLeft')
  await expect(tab(page, 'Facility app')).toBeFocused()
  await activate(page)
  expect(requests.length).toBeGreaterThan(0)
  const root = page.locator('.facility-app-scope'), panel = page.locator('#exploration-panel-facility-app')
  const node = await root.elementHandle()
  await root.evaluate(el => { el.scrollTop = 180; el.scrollLeft = 130 })
  const scroll = await root.evaluate(el => [el.scrollLeft, el.scrollTop])
  expect(scroll).toEqual([130, 180])
  await tab(page, 'Document editor').click()
  await expect(panel).toBeHidden(); await expect(panel).toHaveAttribute('inert', '')
  await panel.locator('button').first().evaluate(el => el.focus())
  await expect(tab(page, 'Document editor')).toBeFocused()
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    expect(await panel.evaluate(el => el.contains(document.activeElement))).toBe(false)
  }
  await tab(page, 'Facility app').click()
  expect(await node!.evaluate(el => el === document.querySelector('.facility-app-scope'))).toBe(true)
  expect(await root.evaluate(el => [el.scrollLeft, el.scrollTop])).toEqual(scroll)
  // Phase 1 remains static: no accidental selection, navigation or inspection behavior.
  await expect(page.locator('.facility-app-scope .inspect-button')).toHaveAttribute('aria-disabled', 'true')
  await page.locator('.facility-app-scope .inspect-button').click({ force: true })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.facility-app-scope .runtime-row.is-selected')).toHaveAttribute('data-equipment', 'AHU-03')
  await page.reload(); await expect(tab(page, 'Header')).toHaveAttribute('aria-selected', 'true')
  await expect(root).toHaveCount(0)
})

for (const [width, height] of [[1280, 900], [1440, 900], [1640, 1060], [1920, 1080], [1280, 480]]) test(`Facility host ${width} × ${height}`, async ({ page }, testInfo) => {
  const suffix = testInfo.project.name === 'chromium' ? '' : `-${testInfo.project.name}`
  await page.setViewportSize({ width, height }); await page.goto('/'); await activate(page)
  const root = page.locator('.facility-app-scope')
  const panel = (await root.boundingBox())!, switcher = (await page.getByRole('tablist', { name: 'UI explorations' }).boundingBox())!
  expect(panel.y + panel.height + 12).toBeLessThanOrEqual(switcher.y)
  expect(switcher.x).toBeGreaterThan(0); expect(switcher.x + switcher.width).toBeLessThan(width)
  const geometry = await root.evaluate(el => ({ client: [el.clientWidth, el.clientHeight], scroll: [el.scrollWidth, el.scrollHeight], body: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], shell: [el.firstElementChild!.clientWidth, el.firstElementChild!.clientHeight] }))
  expect(geometry.body).toEqual([width, height])
  expect(geometry.shell).toEqual([Math.max(1440, width), Math.max(734, height - (height <= 500 ? 86 : 118))])
  await page.mouse.move(1, height - 1)
  await page.screenshot({ path: `${output}/host-${width}-${height}${suffix}.png`, animations: 'disabled' })
  await page.locator('.facility-app-scope .inspect-button').scrollIntoViewIfNeeded()
  await expect(page.locator('.facility-app-scope .inspect-button')).toBeInViewport()
  await expect(tab(page, 'Facility app')).toBeInViewport()
  await writeFile(`${output}/host-${width}-${height}${suffix}.json`, JSON.stringify({ panel, switcher, geometry }, null, 2))
})
