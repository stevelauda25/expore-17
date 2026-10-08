import { test, expect, type Page } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const source = 'docs/qa/facility-app/source'
const output = 'docs/qa/facility-app/phase2'
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
  // The original 734px app canvas now occupies the entire viewport.
  const context = await browser.newContext({ viewport: { width: 1440, height: 734 }, deviceScaleFactor: dpr })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  page.on('requestfailed', r => errors.push(r.url()))
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  await page.goto('/'); await activate(page); await page.mouse.move(1439, 1)
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
  const baseline = JSON.parse(await readFile(`${source}/gate-report.json`, 'utf8')).canonical
  // Compare Firefox to the untouched source rendered by the same engine.
  const cellBaseline = testInfo.project.name === 'firefox'
    ? JSON.parse(await readFile(`${source}/firefox-cell-geometry.json`, 'utf8')).cells
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
  const manifest = JSON.parse(await readFile(`${source}/asset-manifest.json`, 'utf8'))
  for (const asset of manifest.assets) {
    const path = asset.file.replace('public/', 'public/facility-app/')
    expect(createHash('sha256').update(await readFile(path)).digest('hex')).toBe(asset.sha256)
    const instances = actual.images.filter(i => i.path === path.replace('public', ''))
    expect(instances.length).toBeGreaterThan(0)
    expect(instances.every(i => i.loaded)).toBe(true)
    for (const slot of asset.expectedSlots) expect(instances.some(i => slot.every((v: number, n: number) => Math.abs(i.rect[n] - v) < .03))).toBe(true)
  }
  await page.keyboard.press('Meta+Shift+c')
  await expect(page.getByRole('tablist', { name: 'UI explorations' })).toHaveCount(0)
  await page.locator('.facility-app-scope').screenshot({ path: `${output}/canonical-dpr${dpr}${suffix}.png`, animations: 'disabled' })
  await page.keyboard.press('Meta+Shift+c')
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
  await expect(tab(page, 'Product usage')).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(tab(page, 'Facility app')).toBeFocused()
  await activate(page)
  expect(requests.length).toBeGreaterThan(0)
  const root = page.locator('.facility-app-scope'), panel = page.locator('#exploration-panel-facility-app')
  const node = await root.elementHandle()
  await root.evaluate(el => { el.scrollTop = 180; el.scrollLeft = 130 })
  const scroll = await root.evaluate(el => [el.scrollLeft, el.scrollTop])
  expect(scroll).toEqual([130, 94])
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
  // Phase 2 preserves selection while the host retains the inactive app.
  await expect(page.locator('.facility-app-scope .inspect-button')).not.toHaveAttribute('aria-disabled', 'true')
  await expect(page.locator('.facility-app-scope .runtime-row.is-selected')).toHaveAttribute('data-equipment', 'AHU-03')
  await page.reload(); await expect(tab(page, 'Header')).toHaveAttribute('aria-selected', 'true')
  await expect(root).toHaveCount(0)
})

for (const [width, height] of [[1280, 900], [1440, 900], [1640, 1060], [1920, 1080], [1280, 480]]) test(`Facility host ${width} × ${height}`, async ({ page }, testInfo) => {
  const suffix = testInfo.project.name === 'chromium' ? '' : `-${testInfo.project.name}`
  await page.setViewportSize({ width, height }); await page.goto('/'); await activate(page)
  const root = page.locator('.facility-app-scope')
  const panel = (await root.boundingBox())!, switcher = (await page.getByRole('tablist', { name: 'UI explorations' }).boundingBox())!
  expect(panel.y).toBe(0); expect(panel.height).toBe(height)
  expect(switcher.x).toBeGreaterThan(0); expect(switcher.x + switcher.width).toBeLessThan(width)
  const geometry = await root.evaluate(el => ({ client: [el.clientWidth, el.clientHeight], scroll: [el.scrollWidth, el.scrollHeight], body: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], shell: [el.firstElementChild!.clientWidth, el.firstElementChild!.clientHeight] }))
  expect(geometry.body).toEqual([width, height])
  expect(geometry.shell).toEqual([Math.max(1440, width), Math.max(734, height)])
  await page.mouse.move(1, height - 1)
  await page.screenshot({ path: `${output}/host-${width}-${height}${suffix}.png`, animations: 'disabled' })
  await page.locator('.facility-app-scope .inspect-button').scrollIntoViewIfNeeded()
  await expect(page.locator('.facility-app-scope .inspect-button')).toBeInViewport()
  await expect(tab(page, 'Facility app')).toBeInViewport()
  await writeFile(`${output}/host-${width}-${height}${suffix}.json`, JSON.stringify({ panel, switcher, geometry }, null, 2))
})

// Phase 2 functional gate: independent visible outcomes, keyboard paths and lifecycle.
import { equipment, days } from '../src/facility-app/data/equipment'
const interactionErrors = new WeakMap<Page, string[]>()
const dependencyWarnings = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }, info) => {
  if (!info.title.startsWith('Phase 2:')) return
  const errors: string[] = []
  interactionErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (!['error', 'warning'].includes(message.type())) return
    // Floating UI 0.27.20 probes Firefox's deprecated compatibility property.
    // Record this known dependency warning; fail on any other warning/error.
    if (message.type() === 'warning' && message.text().includes('MouseEvent.mozInputSource is deprecated') && message.text().includes('@floating-ui_react')) {
      dependencyWarnings.set(page, [...(dependencyWarnings.get(page) ?? []), message.text()])
    } else errors.push(message.text())
  })
  page.on('requestfailed', request => errors.push(request.url()))
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
})
test.afterEach(async ({ page }, info) => {
  if (dependencyWarnings.has(page)) await writeFile(`${output}/dependency-warnings-${info.project.name}.json`, JSON.stringify(dependencyWarnings.get(page), null, 2))
  expect(interactionErrors.get(page) ?? []).toEqual([])
})
async function openFacility(page: Page) {
  await page.setViewportSize({ width: 1440, height: 734 })
  await page.goto('/'); await activate(page)
  await page.keyboard.press('Meta+Shift+c')
}
async function expectSelection(page: Page, item: typeof equipment[number]) {
  await expect(page.locator('.runtime-row.is-selected')).toHaveCount(1)
  const row = page.locator(`[data-equipment="${item.id}"]`)
  await expect(row).toHaveClass(/is-selected/)
  await expect(row.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  expect(await row.evaluate(el => getComputedStyle(el, '::after').width)).toBe('2px')
  expect(await row.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(247, 247, 247)')
  await expect(page.locator('.equipment-context')).toContainText(`Selected: ${item.area}`)
  await expect(page.locator('.equipment-context')).toContainText(`${item.id} · ${item.equipmentType}`)
  await expect(page.locator('.booked-hours')).toHaveText(`Booked hours: ${item.bookedHours}`)
  await expect(page.locator('.coverage')).toContainText(`${item.coverage}% of intervals`)
  await expect(page.locator('.bottom-bar p')).toHaveText(`Selected: ${item.id} · ${item.area}`)
  await expect(page.getByRole('button', { name: `Inspect ${item.id}`, exact: true })).toBeVisible()
  await expect(page.locator('.finding-description')).toContainText('AHU-03 is the largest outlier. Event override OV-882')
}

test('Phase 2: every row selects by pointer, Enter and Space; state and geometry stay synchronized', async ({ page }) => {
  await openFacility(page)
  const initial = await page.locator('.runtime-card').boundingBox()
  for (const item of equipment) {
    await page.locator(`[data-equipment="${item.id}"] .area-cell`).click()
    await expectSelection(page, item)
    expect(await page.locator('.equipment-context').evaluate(el => el.getBoundingClientRect().height)).toBe(148)
    expect(await page.locator('.runtime-card').boundingBox()).toEqual(initial)
  }
  for (const key of ['Enter', 'Space']) for (const item of equipment) {
    const target = page.getByRole('button', { name: `Select ${item.id} · ${item.area}`, exact: true })
    await page.keyboard.press('Tab'); await target.focus(); await page.keyboard.press(key)
    await expectSelection(page, item)
    expect(await target.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
  }
})

test('Phase 2: heatmap tooltips expose all 56 correct values without clipping or layout shift', async ({ page }) => {
  await openFacility(page)
  const initial = await page.locator('.runtime-card').boundingBox()
  for (const item of equipment) for (const [index, hours] of item.dailyRuntime.entries()) {
    const cell = page.locator(`[data-equipment="${item.id}"] .runtime-cell`).nth(index)
    await cell.hover()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toHaveText(`${item.id} / ${days[index]} / ${hours} ${hours === 1 ? 'hr' : 'hrs'} after schedule`)
    const box = (await tooltip.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(1440)
    expect(box.y + box.height).toBeLessThanOrEqual(734)
    expect(await page.locator('.runtime-card').boundingBox()).toEqual(initial)
    await page.mouse.move(1439, 1); await expect(tooltip).toHaveCount(0)
  }
  const cell = page.locator('[data-equipment="AHU-06"] .runtime-cell').first()
  await cell.focus(); await expect(page.getByRole('tooltip')).toContainText('0.5 hrs after schedule')
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0)
  await page.keyboard.press('Tab'); await expect(page.getByRole('tooltip')).toHaveCount(1)
  await page.getByRole('button', { name: 'Select AHU-06 · Lecture Hall' }).focus()
  await expect(page.getByRole('tooltip')).toHaveCount(0)
})

test('Phase 2: inspection data, modal focus containment and restoration for every selection', async ({ page }, info) => {
  await openFacility(page)
  for (const item of equipment) {
    await page.locator(`[data-equipment="${item.id}"] .area-cell`).click()
    const trigger = page.getByRole('button', { name: `Inspect ${item.id}`, exact: true })
    await trigger.click()
    const drawer = page.getByRole('dialog', { name: `${item.id} · ${item.area}` })
    await expect(drawer).toBeVisible()
    if (info.project.name === 'chromium' && ['AHU-03', 'AHU-07'].includes(item.id)) await page.screenshot({ path: `${output}/inspect-${item.id}.png` })
    await expect(drawer).toContainText(item.equipmentType)
    await expect(drawer).toContainText(item.bookedHours)
    await expect(drawer).toContainText(item.suspectedIssue)
    await expect(drawer).toContainText(`${item.coverage}% of intervals`)
    await expect(drawer).toContainText(String(item.excessKwh))
    await expect(drawer.locator('.inspection-runtime > div')).toHaveCount(7)
    expect(await drawer.evaluate(el => el.contains(document.activeElement))).toBe(true)
    for (const key of ['Tab', 'Shift+Tab', 'Tab']) { await page.keyboard.press(key); expect(await drawer.evaluate(el => el.contains(document.activeElement))).toBe(true) }
    if (item.id === 'AHU-03') { await expect(drawer).toContainText('CL-203'); await expect(drawer).toContainText('OV-882') }
    else { await expect(drawer).not.toContainText('CL-203'); await expect(drawer).toContainText('Local prototype context') }
    await page.keyboard.press('Escape'); await expect(drawer).toHaveCount(0); await expect(trigger).toBeFocused()
    await trigger.click(); await page.getByRole('button', { name: 'Close inspection' }).click()
    await expect(drawer).toHaveCount(0); await expect(trigger).toBeFocused()
  }
})

test('Phase 2: compact surfaces coordinate, dismiss, restore focus and support keyboard menus', async ({ page }) => {
  await openFacility(page)
  const definitions = [
    ['Afterhours workspace', 'Afterhours workspace', 'menu'], ['Notifications', 'Notifications', 'dialog'],
    ['Andrew account', 'Andrew account', 'menu'], ['Control log CL-203', 'Control log CL-203', 'dialog'],
  ] as const
  for (const [triggerName, surfaceName, role] of definitions) {
    const trigger = page.getByRole('button', { name: triggerName, exact: true })
    await trigger.focus(); await page.keyboard.press('Enter')
    const surface = page.getByRole(role, { name: surfaceName, exact: true })
    await expect(surface).toBeVisible(); await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(await trigger.getAttribute('aria-controls')).toBeTruthy()
    if (role === 'menu') {
      const items = surface.getByRole('menuitem')
      await expect(items.first()).toBeFocused()
      await page.keyboard.press('ArrowDown'); await expect(items.nth(1)).toBeFocused()
      await page.keyboard.press('End'); await expect(items.last()).toBeFocused()
      await page.keyboard.press('Home'); await expect(items.first()).toBeFocused()
    }
    if (triggerName === 'Notifications') await expect(surface).toHaveText('1 unresolved findingAHU-03 override may still be active.')
    if (triggerName === 'Control log CL-203') for (const value of ['AHU-03', 'CL-203', 'OV-882', '22 Sep', 'None', 'Manual override']) await expect(surface).toContainText(value)
    await page.keyboard.press('Escape'); await expect(surface).toHaveCount(0); await expect(trigger).toBeFocused()
    await trigger.click(); await page.locator('.page-heading h1').click()
    await expect(surface).toHaveCount(0); await expect(trigger).toBeFocused()
  }
  await page.getByRole('button', { name: 'Afterhours workspace' }).click()
  await page.getByRole('button', { name: 'Notifications', exact: true }).click()
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Notifications', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Inspect AHU-03' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Andrew account' }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page.getByRole('status')).toContainText('prototype only; no account changes made')
  await expect(page.getByRole('button', { name: 'Andrew account' })).toBeFocused()
})

test('Phase 2: sidebar, breadcrumbs and host lifecycle preserve selection and close floating UI', async ({ page }) => {
  await openFacility(page)
  await page.locator('[data-equipment="AHU-07"] .area-cell').click()
  for (const name of ['Faults', 'Plans', 'Logs']) {
    const target = page.getByRole('button', { name, exact: true })
    await target.focus(); await page.keyboard.press('Space')
    await expect(target).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('.facility-placeholder h1')).toHaveText(name)
    await page.getByRole('button', { name: 'Return to Sites' }).click()
    await expectSelection(page, equipment[2])
  }
  for (const label of ['Afterhours', 'Cedar Campus']) {
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('status')).toHaveText(`${label} · Facilities overview×`)
    await expect(page.locator('.breadcrumb-bar [aria-current="page"]')).toHaveText('Facilities')
  }
  await page.keyboard.press('Meta+Shift+c')
  await page.getByRole('button', { name: 'Afterhours workspace' }).click()
  await tab(page, 'Header').click()
  await expect(page.locator('#exploration-panel-facility-app')).toHaveAttribute('inert', '')
  await expect(tab(page, 'Header')).toBeFocused()
  await tab(page, 'Facility app').click()
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expectSelection(page, equipment[2])
})

test('Phase 2: motion is restrained and reduced motion removes animation without disabling controls', async ({ page }) => {
  await openFacility(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Inspect AHU-03' }).click()
  expect(await page.locator('.inspection-drawer').evaluate(el => getComputedStyle(el).animationDuration)).toBe('0.21s')
  await page.keyboard.press('Escape')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Inspect AHU-03' }).click()
  expect(await page.locator('.inspection-drawer').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Afterhours workspace' }).click()
  expect(await page.locator('.facility-motion').evaluate(el => getComputedStyle(el).transform)).toBe('none')
  await page.keyboard.press('Escape')
  expect(await page.locator('.runtime-row').last().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s')
})

test('Phase 2: hover, pressed, visible focus and floating bounds remain restrained', async ({ page }, info) => {
  await openFacility(page)
  const nav = page.getByRole('button', { name: 'Faults', exact: true })
  await nav.hover()
  expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(1, 128, 47, 0.05)')
  await page.mouse.down()
  expect(await nav.evaluate(el => getComputedStyle(el).filter)).toBe('brightness(0.94)')
  await page.mouse.up()
  await page.keyboard.press('Tab'); await nav.focus()
  expect(await nav.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
  await page.getByRole('button', { name: 'Return to Sites' }).click()
  const otherRow = page.locator('[data-equipment="AHU-01"]')
  await otherRow.locator('.area-cell').hover()
  expect(await otherRow.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(250, 250, 250)')
  const selectedRow = page.locator('[data-equipment="AHU-03"]')
  await selectedRow.locator('.area-cell').hover()
  expect(await selectedRow.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(247, 247, 247)')
  for (const name of ['Afterhours workspace', 'Notifications', 'Andrew account', 'Control log CL-203']) {
    await page.getByRole('button', { name, exact: true }).click()
    const surface = page.locator('.facility-popover')
    await expect(surface).toHaveCount(1)
    const bounds = (await surface.boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(1440); expect(bounds.y + bounds.height).toBeLessThanOrEqual(734)
    expect(await surface.evaluate(el => {
      const bounds = el.getBoundingClientRect()
      return el.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
    })).toBe(true)
    if (info.project.name === 'chromium') await page.screenshot({ path: `${output}/surface-${name.replaceAll(' ', '-')}.png` })
    await page.keyboard.press('Escape'); await expect(surface).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Inspect AHU-03' }).click()
  const lastFact = page.locator('.inspection-facts > div').last()
  await lastFact.scrollIntoViewIfNeeded(); await expect(lastFact).toBeInViewport()
  await expect(lastFact).toHaveText('SourceManual override')
  await page.keyboard.press('Escape')
})
