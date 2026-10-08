import { expect, test, type Page } from '@playwright/test'

const names = ['Header', 'Date picker', 'Profile', 'Document editor', 'Facility app', 'Product usage']
const tabs = (page: Page) => page.getByRole('tablist', { name: 'UI explorations' })
const tab = (page: Page, name: string) => tabs(page).getByRole('tab', { name, exact: true })
async function open(page: Page) {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  await tab(page, 'Product usage').click()
  await expect(page.locator('.product-usage-demo tbody tr')).toHaveCount(6)
  await page.evaluate(() => document.fonts.ready)
}

test('six tabs traverse forward/backward without reload, share one measured pill and preserve lazy Product Usage state', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  const requests: string[] = [], errors: string[] = []
  page.on('request', r => { if (r.url().includes('/product-usage/')) requests.push(r.url()) })
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => {
    // Verified on the unchanged five-page host before Product Usage is loaded.
    const baselineWarning = e.type() === 'warning' && /Window.fullScreen attribute is deprecated|InstallTrigger is deprecated|You have Reduced Motion enabled on your device/.test(e.text())
    if (!baselineWarning && (e.type() === 'error' || e.type() === 'warning')) errors.push(e.text())
  })
  await page.goto('/')
  await expect(tabs(page).getByRole('tab')).toHaveText(names)
  expect(requests).toEqual([])
  await expect(page.locator('.product-usage-demo')).toHaveCount(0)
  const document = await page.locator('html').elementHandle()
  for (const name of [...names, ...[...names].reverse()]) {
    await tab(page, name).click()
    const id = await tab(page, name).getAttribute('aria-controls')
    await expect(page.locator(`#${id}`)).toBeVisible()
    await expect(page.locator('.exploration-panel:not([hidden])')).toHaveCount(1)
    await expect(tabs(page).locator('[aria-selected="true"]')).toHaveText(name)
    await expect(page.locator('.exploration-switcher__indicator')).toHaveCount(1)
    await expect(async () => {
      const indicator = (await page.locator('.exploration-switcher__indicator').boundingBox())!
      const selected = (await tab(page, name).boundingBox())!
      // offsetLeft is integer-rounded by the existing switcher implementation.
      expect(Math.abs(indicator.x - selected.x)).toBeLessThanOrEqual(.5)
      expect(indicator.width).toBe(selected.width)
      expect(indicator.y).toBe(selected.y)
      expect(indicator.height).toBe(selected.height)
    }).toPass()
  }
  expect(await document!.evaluate(node => node === window.document.documentElement)).toBe(true)
  await tab(page, 'Header').focus()
  await page.keyboard.press('End'); await expect(tab(page, 'Product usage')).toBeFocused()
  await page.keyboard.press('ArrowRight'); await expect(tab(page, 'Header')).toBeFocused()
  await page.keyboard.press('ArrowLeft'); await expect(tab(page, 'Product usage')).toBeFocused()
  for (const name of [...names].reverse().slice(1)) {
    await page.keyboard.press('ArrowLeft'); await expect(tab(page, name)).toBeFocused()
  }
  await page.keyboard.press('End'); await page.keyboard.press('Home'); await expect(tab(page, 'Header')).toBeFocused()
  await tab(page, 'Product usage').click()
  const root = page.locator('.product-usage-demo'), panel = page.locator('#exploration-panel-product-usage')
  const node = await root.elementHandle()
  await root.getByRole('button', { name: 'Week', exact: true }).click()
  await root.getByRole('searchbox').fill('document')
  await root.getByRole('button', { name: 'Filter', exact: true }).click()
  await root.getByRole('radio', { name: 'Productivity', exact: true }).check()
  await root.getByRole('tab', { name: 'User segments', exact: true }).click()
  await tab(page, 'Profile').click()
  await expect(panel).toBeHidden(); await expect(panel).toHaveAttribute('inert', '')
  await root.locator('#search').evaluate(el => el.focus())
  await expect(tab(page, 'Profile')).toBeFocused()
  await page.keyboard.press('Escape'); await expect(tab(page, 'Profile')).toBeFocused()
  await tab(page, 'Product usage').click()
  expect(await node!.evaluate(el => el === window.document.querySelector('.product-usage-demo'))).toBe(true)
  await expect(root.getByRole('button', { name: 'Week', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(root.getByRole('tab', { name: 'User segments', exact: true })).toHaveAttribute('aria-selected', 'true')
  await root.getByRole('tab', { name: 'Features', exact: true }).click()
  await expect(root.getByRole('searchbox')).toHaveValue('document')
  await expect(root.locator('tbody tr')).toHaveCount(1)
  await expect(root.locator('tbody tr td').nth(2)).toHaveText('718')
  await root.getByRole('searchbox').fill(''); await expect(root.locator('tbody tr')).toHaveCount(1)
  expect(requests.length).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('source layout, font, proportional chart, all tooltip connectors, ranges and segmented controls survive integration', async ({ page }) => {
  await open(page)
  const root = page.locator('.product-usage-demo')
  expect(await root.locator('table').boundingBox()).toEqual({ x: 170, y: 425, width: 860, height: 266 })
  expect(await root.locator('.activity-card').boundingBox()).toEqual({ x: 170, y: 150, width: 860, height: 194 })
  expect(await root.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Prototype SF Pro')
  expect(await page.evaluate(() => [...document.fonts].some(f => f.family.replaceAll('"', '') === 'Prototype SF Pro' && f.status === 'loaded'))).toBe(true)
  for (const [range, counts] of [['Day', [108, 96, 78, 63, 72]], ['Week', [810, 718, 585, 473, 540]], ['Month', [3240, 2870, 2340, 1890, 2160]]] as const) {
    await root.getByRole('button', { name: range, exact: true }).click()
    const total = counts.reduce((a: number, b: number) => a + b, 0)
    await expect(root.locator('#summary dd').first()).toHaveText(total.toLocaleString('en-US'))
    expect(await root.locator('.time-range .selection-indicator').boundingBox()).toEqual(await root.locator(`[data-range="${range}"]`).boundingBox())
    const bar = (await root.locator('#distribution').boundingBox())!
    for (const [index, id] of ['ai', 'editor', 'analytics', 'settings', 'other'].entries()) {
      const segment = root.locator(`[data-segment="${id}"]`), box = (await segment.boundingBox())!
      expect(Math.abs(box.width - bar.width * counts[index] / total)).toBeLessThan(.03)
      await segment.hover()
      const tooltip = root.locator('#tooltip')
      await expect(tooltip).toContainText(`${counts[index].toLocaleString('en-US')} actions · ${(counts[index] / total * 100).toFixed(1)}% of total`)
      const dot = (await tooltip.locator('.tooltip-endpoint').boundingBox())!, line = (await tooltip.locator('.tooltip-line img').boundingBox())!
      expect([dot.width, dot.height]).toEqual([4, 4]); expect([line.width, line.height]).toEqual([1, 20])
      expect(Math.abs(dot.x + 2 - (box.x + box.width - 5))).toBeLessThan(.02)
      expect(dot.y + 2).toBe(box.y + 5); expect(dot.x + 2).toBe(line.x + .5)
    }
  }
  await page.keyboard.press('Escape'); await expect(root.locator('#tooltip')).toBeHidden()
  await root.getByRole('tab', { name: 'User segments', exact: true }).click()
  await expect(root.locator('#segments-empty')).toBeVisible()
  await expect(root.getByRole('searchbox')).toBeDisabled()
  await page.keyboard.press('ArrowLeft'); await expect(root.locator('#features-tab')).toBeFocused()
  expect(await root.locator('.view-tabs .selection-indicator').boundingBox()).toEqual(await root.locator('#features-tab').boundingBox())
})

test('search styling, six hover-only detail variants, menus, filtered CSV and Escape retain source behavior', async ({ page, browserName }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  await open(page)
  const root = page.locator('.product-usage-demo'), popup = root.locator('#feature-detail')
  const field = root.locator('.search-field'), input = root.getByRole('searchbox')
  await page.mouse.move(0, 0)
  const shadow = await field.evaluate(el => getComputedStyle(el).boxShadow)
  await field.hover()
  const hovered = await field.evaluate(el => getComputedStyle(el).boxShadow)
  expect(hovered).toBe(shadow.replace('rgba(0, 0, 0, 0.1) 0px 0px 0px 0.5px inset', 'rgba(0, 0, 0, 0.6) 0px 0px 0px 0.5px inset'))
  await input.focus(); await page.mouse.move(0, 0)
  expect(await field.evaluate(el => getComputedStyle(el).boxShadow)).toBe(hovered)
  // Hide the navigation overlay while auditing the unobscured source popovers.
  await page.keyboard.press('Meta+Shift+c')
  await expect(tabs(page)).toHaveCount(0)
  const titles = ['AI Assistant', 'Document Editor', 'Analytics Dashboard', 'Settings', 'Help & Support', 'Other']
  for (const [i, id] of ['ai', 'editor', 'analytics', 'settings', 'support', 'other'].entries()) {
    await root.locator(`[data-feature="${id}"] .feature-name > span`).hover()
    await expect(popup).toBeHidden()
    const trigger = root.locator(`[data-info="${id}"]`)
    await trigger.focus(); await page.keyboard.press('Enter'); await expect(popup).toBeHidden()
    await trigger.hover(); await expect(popup.locator('h2')).toHaveText(titles[i])
    // WebKit wraps the AI description onto three lines in the untouched source too.
    expect(await popup.boundingBox()).toMatchObject({ width: 450, height: browserName === 'webkit' && id === 'ai' ? 353 : 332 })
    expect(await popup.evaluate(el => {
      const r = el.getBoundingClientRect()
      return [[r.left + 20, r.top + 20], [r.right - 20, r.bottom - 20]].every(([x, y]) => el.contains(document.elementFromPoint(x, y)))
    })).toBe(true)
    await expect(popup.locator('.action-row')).toHaveCount(4)
    await popup.locator('img').evaluateAll(images => Promise.all(images.map(img => (img as HTMLImageElement).decode())))
    await page.keyboard.press('Escape'); await expect(popup).toBeHidden(); await expect(trigger).toBeFocused()
  }
  await root.locator('[data-info="ai"]').hover()
  await root.locator('[data-info="settings"]').hover(); await expect(popup.locator('h2')).toHaveText('Settings')
  await root.locator('h1').click(); await expect(popup).toBeHidden()
  await input.fill('missing'); await expect(root.locator('#no-results')).toBeVisible()
  await input.fill('document'); await expect(root.locator('tbody tr')).toHaveCount(1)
  await input.fill('')
  await root.getByRole('button', { name: 'Filter', exact: true }).click()
  await root.getByRole('radio', { name: 'Productivity', exact: true }).check()
  await expect(root.locator('tbody tr')).toHaveCount(1)
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export', exact: true }).click()
  const csv = await download
  expect(csv.suggestedFilename()).toBe('product-usage-month.csv')
  const stream = await csv.createReadStream(), chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8')
  expect(text).toContain('Document Editor'); expect(text).not.toContain('AI Assistant')
  await root.getByRole('button', { name: 'Manage product', exact: true }).click()
  await root.getByRole('dialog', { name: 'Manage product', exact: true }).getByRole('button', { name: 'Close Manage product' }).click()
  // The modal no longer resets the current category selection.
  await expect(root.locator('tbody tr')).toHaveCount(1)
  expect(errors).toEqual([])
})

for (const width of [360, 390, 560, 680, 700, 1200]) test(`six original-size tabs fit at ${width}px; Product Usage scroll stays separate`, async ({ page }) => {
  await open(page); await page.setViewportSize({ width, height: 844 })
  const switcher = (await tabs(page).boundingBox())!
  expect(switcher.x).toBeGreaterThanOrEqual(0); expect(switcher.x + switcher.width).toBeLessThanOrEqual(width)
  const boxes = await tabs(page).getByRole('tab').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom} }))
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => expect(a.right <= b.x + .02 || b.right <= a.x + .02 || a.bottom <= b.y + .02 || b.bottom <= a.y + .02).toBe(true)))
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  for (const name of names) {
    await tab(page, name).click(); await expect(tab(page, name)).toBeInViewport()
  }
  const root = page.locator('.product-usage-demo'), bounds = (await root.boundingBox())!
  expect(bounds.y).toBe(0); expect(bounds.height).toBe(844)
  await root.evaluate(el => { el.scrollTop = el.scrollHeight })
  await expect(root.locator('[data-feature="other"] .feature-name')).toBeInViewport()
})
