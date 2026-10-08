import { expect, test, type Page, type Locator } from '@playwright/test'

async function setup(page: Page) {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  await page.getByRole('tablist', { name: 'UI explorations' }).getByRole('tab', { name: 'Product usage', exact: true }).click()
  const root = page.locator('.product-usage-demo'), modal = root.locator('#manage-menu')
  await expect(root.locator('tbody tr')).toHaveCount(6)
  return { root, modal, manage: root.locator('#manage'), close: modal.getByRole('button', { name: 'Close Manage product' }) }
}
async function quota(modal: Locator, total: number, limit: number) {
  await expect(modal.locator('.manage-usage-total p')).toHaveText(`${total.toLocaleString('en-US')} / ${limit.toLocaleString('en-US')} actions this month`)
  await expect(modal.locator('.manage-usage-total > span')).toHaveText(`${(total / limit * 100).toFixed(1)}%`)
  const width = (await modal.locator('.manage-progress-fill').boundingBox())!.width
  expect(width).toBeCloseTo(Math.min(1, total / limit) * 500, 1)
}
async function proportional(root: Locator, counts: number[]) {
  const total = counts.reduce((sum, n) => sum + n, 0)
  await expect(root.locator('#summary dd').first()).toHaveText(total.toLocaleString('en-US'))
  await expect(root.locator('#activity-subtitle')).toContainText(`${total.toLocaleString('en-US')} total actions`)
  const bar = (await root.locator('#distribution').boundingBox())!
  const segments = await root.locator('[data-segment]').all()
  expect(segments).toHaveLength(counts.length)
  let width = 0
  for (const [i, segment] of segments.entries()) {
    const box = (await segment.boundingBox())!; width += box.width
    expect(box.width).toBeCloseTo(bar.width * counts[i] / total, 1)
    await expect(segment).toHaveAttribute('aria-label', new RegExp(`${counts[i].toLocaleString('en-US')} actions, ${(counts[i] / total * 100).toFixed(1)}%`))
  }
  expect(width).toBeCloseTo(bar.width, 1)
}

test('quota saves and feature enablement share one lifecycle state across table, chart, search and filter', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
  const { root, modal, manage, close } = await setup(page)
  const baselineMetrics = await root.locator('#summary .metric:not(:first-child)').allTextContents()
  await manage.click(); await quota(modal, 12500, 50000)
  const row = modal.locator('[data-manage-setting="actionLimit"]')
  await row.getByRole('button').click(); await expect(row.getByRole('button', { name: 'Save' })).toBeDisabled()
  await row.getByRole('textbox').fill('60000'); await row.getByRole('button', { name: 'Save' }).click()
  await expect(row).toContainText('60,000 actions'); await quota(modal, 12500, 60000)
  const settings = modal.getByRole('switch', { name: 'Settings', exact: true })
  await settings.click(); await expect(settings).toHaveAttribute('aria-checked', 'false')
  await expect(modal).toBeVisible(); await expect(root.locator('[data-feature="settings"], [data-info="settings"], [data-segment="settings"]')).toHaveCount(0)
  await quota(modal, 10610, 60000)
  await proportional(root, [3240, 2870, 2340, 2160])
  await expect(root.locator('[data-feature="ai"] td').last()).toHaveText('30.5%')
  expect(await root.locator('#summary .metric:not(:first-child)').allTextContents()).toEqual(baselineMetrics)
  await row.getByRole('button').click(); await row.getByRole('textbox').fill('70000')
  await close.click(); await manage.click(); await expect(row).toContainText('60,000 actions'); await quota(modal, 10610, 60000)
  await expect(settings).toHaveAttribute('aria-checked', 'false'); await close.click()
  await root.getByRole('searchbox').fill('Settings'); await expect(root.locator('tbody tr')).toHaveCount(0)
  await root.getByRole('button', { name: 'Clear search' }).click()
  await root.locator('#filter').click(); await root.getByRole('radio', { name: 'Settings', exact: true }).check()
  await expect(root.locator('tbody tr')).toHaveCount(0); await expect(root.locator('#no-results')).toBeVisible()
  await manage.click(); await settings.click(); await quota(modal, 12500, 60000); await close.click()
  await expect(root.locator('tbody tr')).toHaveCount(1); await expect(root.locator('[data-feature="settings"]')).toBeVisible()
  await root.getByRole('searchbox').fill('Settings'); await expect(root.locator('tbody tr')).toHaveCount(1)
  await page.reload(); await page.getByRole('tablist', { name: 'UI explorations' }).getByRole('tab', { name: 'Product usage', exact: true }).click()
  await expect(root.locator('tbody tr')).toHaveCount(6); await manage.click(); await quota(modal, 12500, 50000)
  for (const toggle of await modal.getByRole('switch').all()) await expect(toggle).toHaveAttribute('aria-checked', 'true')
  expect(errors).toEqual([])
})

test('aggregation, range changes and all-off preserve unmanaged Other and restore original output', async ({ page }) => {
  const { root, modal, manage, close } = await setup(page)
  const initialTable = await root.locator('table').innerHTML()
  await manage.click()
  for (const name of ['Document Editor', 'Analytics', 'Settings']) await modal.getByRole('switch', { name, exact: true }).click()
  await proportional(root, [3240, 2160]); await quota(modal, 5400, 50000)
  await modal.getByRole('switch', { name: 'Help & Support' }).click()
  await proportional(root, [3240, 1020]); await quota(modal, 4260, 50000)
  await expect(root.locator('[data-feature="other"]')).toHaveCount(1)
  await close.click()
  for (const [range, counts] of [['Day', [108, 34]], ['Week', [810, 255]], ['Month', [3240, 1020]]] as const) {
    await root.getByRole('button', { name: range, exact: true }).click()
    await proportional(root, [...counts]); await expect(root.locator('tbody tr')).toHaveCount(2)
    await expect(root.locator('[data-feature="settings"]')).toHaveCount(0)
  }
  await manage.click(); await modal.getByRole('switch', { name: 'AI Assistant' }).click()
  await proportional(root, [1020]); await quota(modal, 1020, 50000)
  await expect(root.locator('tbody tr')).toHaveCount(1); await expect(root.locator('[data-feature="other"] td').last()).toHaveText('100.0%')
  for (const toggle of await modal.getByRole('switch').all()) await toggle.click()
  await quota(modal, 12500, 50000); await proportional(root, [3240, 2870, 2340, 1890, 2160])
  expect(await root.locator('table').innerHTML()).toBe(initialTable)
  const cycle = modal.locator('[data-manage-setting="resetCycle"]')
  await cycle.getByRole('button').click(); await cycle.getByRole('radio', { name: 'Weekly' }).click(); await cycle.getByRole('button', { name: 'Save' }).click()
  await expect(root.locator('[data-range="Month"]')).toHaveAttribute('aria-pressed', 'true')
  await quota(modal, 12500, 50000)
})

async function escapeRestored(page: Page, root: Locator, target: Locator, tabKey: string) {
  await page.keyboard.press('Escape')
  await expect(target).toBeFocused()
  await expect(target).toHaveCSS('outline-style', 'none')
  await expect(target).toHaveAttribute('data-suppress-focus-ring', 'true')
  await page.keyboard.press(tabKey)
  await expect(root.locator('[data-suppress-focus-ring]')).toHaveCount(0)
  expect(await page.evaluate(() => {
    const el = document.activeElement!
    return el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'
  })).toBe(true)
}

test('Escape restores focus without a ring and subsequent keyboard navigation restores normal focus indication', async ({ page, browserName }) => {
  // Safari on macOS uses Option-Tab to include buttons in sequential navigation.
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
  const { root, modal, manage } = await setup(page)
  for (const motion of ['reduce', 'no-preference'] as const) {
    await page.emulateMedia({ reducedMotion: motion })
    await manage.click(); await escapeRestored(page, root, manage, tabKey)
    await root.locator('#filter').click(); await escapeRestored(page, root, root.locator('#filter'), tabKey)
    await manage.click()
    for (const key of ['actionLimit', 'alerts', 'resetCycle']) {
      const row = modal.locator(`[data-manage-setting="${key}"]`)
      await row.getByRole('button', { name: /^Edit/ }).click()
      await escapeRestored(page, root, row.getByRole('button', { name: /^Edit/ }), tabKey)
      await expect(modal).toBeVisible()
    }
    await page.keyboard.press('Escape'); await expect(modal).toBeHidden()
    const trigger = root.locator('[data-info="ai"]')
    await trigger.hover(); await expect(root.locator('#feature-detail')).toBeVisible()
    await escapeRestored(page, root, trigger, tabKey)
    await expect(root.locator('#feature-detail')).toBeHidden()
    await manage.click(); await page.keyboard.press('Escape'); await expect(manage).toHaveAttribute('data-suppress-focus-ring', 'true')
    await page.keyboard.press('Escape'); await expect(manage).toHaveCSS('outline-style', 'none')
    await expect(manage).toHaveAttribute('data-suppress-focus-ring', 'true')
    await page.mouse.click(10, 10); await expect(root.locator('[data-suppress-focus-ring]')).toHaveCount(0)
    await manage.click(); await page.keyboard.press('Escape'); await expect(manage).toHaveAttribute('data-suppress-focus-ring', 'true')
    await manage.press('ArrowRight')
    await expect(root.locator('[data-suppress-focus-ring]')).toHaveCount(0)
  }
})

test('Search clear reuses the modal close asset, clears results and preserves the search container', async ({ page, browserName }) => {
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
  const { root, modal } = await setup(page)
  const input = root.getByRole('searchbox'), clear = root.getByRole('button', { name: 'Clear search' })
  const bounds = await root.locator('.search-field').boundingBox()
  await expect(clear).toBeHidden(); await root.locator('#search-icon').click(); await expect(input).toBeFocused(); await input.fill('document'); await expect(clear).toBeVisible()
  await expect(root.locator('tbody tr')).toHaveCount(1)
  expect(await clear.locator('img').getAttribute('src')).toBe(await modal.locator('.manage-close img').getAttribute('src'))
  expect(await clear.locator('img').boundingBox()).toMatchObject({ width: 14, height: 14 })
  expect(await root.locator('.search-field').boundingBox()).toEqual(bounds)
  await clear.click(); await expect(input).toHaveValue(''); await expect(input).toBeFocused(); await expect(clear).toBeHidden()
  await expect(root.locator('tbody tr')).toHaveCount(6)
  await input.fill('settings'); await input.press(tabKey); await expect(clear).toBeFocused()
  await clear.press('Enter'); await expect(input).toBeFocused(); await expect(input).toHaveValue('')
  await input.fill('document'); await input.press(tabKey); await clear.press('Space'); await expect(input).toHaveValue('')
  expect(await root.locator('.search-field').boundingBox()).toEqual(bounds)
})
