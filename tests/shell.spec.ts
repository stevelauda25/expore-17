import { expect, test, type Page } from '@playwright/test'

const names = ['Header', 'Date picker', 'Profile', 'Document editor', 'Facility app', 'Product usage']
const nav = (page: Page) => page.getByRole('tablist', { name: 'UI explorations' })
const tab = (page: Page, name: string) => nav(page).getByRole('tab', { name, exact: true })
const toggle = (page: Page) => page.keyboard.press('Meta+Shift+c')

async function aligned(page: Page, name: string) {
  await expect(async () => {
    const selected = (await tab(page, name).boundingBox())!
    const indicator = (await page.locator('.exploration-switcher__indicator').boundingBox())!
    expect(Math.abs(selected.x - indicator.x)).toBeLessThanOrEqual(.5)
    expect(indicator.y).toBe(selected.y)
    expect(indicator.width).toBe(selected.width)
    expect(indicator.height).toBe(selected.height)
  }).toPass()
}

test('all six panels fill the viewport under a fixed overlay, including short screens and scrolling', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  for (const height of [900, 480]) {
    await page.setViewportSize({ width: 1200, height })
    for (const name of names) {
      await tab(page, name).click()
      const panel = page.locator(`#${await tab(page, name).getAttribute('aria-controls')}`)
      await expect(panel).toBeVisible()
      expect(await panel.boundingBox()).toEqual({ x: 0, y: 0, width: 1200, height })
      await expect(nav(page)).toHaveCSS('position', 'fixed')
      const bounds = (await nav(page).boundingBox())!
      // WebKit rounds transformed bounds to fractional CSS pixels.
      expect(Math.abs(bounds.x + bounds.width / 2 - 600)).toBeLessThan(.1)
      expect(height - bounds.y - bounds.height).toBe(height <= 500 ? 16 : 48)
      await aligned(page, name)
      const scroller = name === 'Document editor' ? page.getByTestId('workspace')
        : name === 'Facility app' ? page.locator('.facility-app-scope')
        : name === 'Product usage' ? page.locator('.product-usage-demo') : null
      if (scroller) {
        await expect(scroller).toBeVisible()
        const scroll = await scroller.evaluate(el => {
          el.scrollTop = 250
          return { top: el.scrollTop, overflows: el.scrollHeight > el.clientHeight }
        })
        if (scroll.overflows) expect(scroll.top).toBeGreaterThan(0)
        expect(await nav(page).boundingBox()).toEqual(bounds)
      }
      // The overlay wins hit testing wherever it overlaps exploration UI.
      expect(await nav(page).evaluate(el => {
        const r = el.getBoundingClientRect()
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
      })).toBe(true)
    }
  }
  expect(errors).toEqual([])
})

test('shortcut toggles once, ignores repeats, removes all targets and always resets visible on refresh', async ({ page }) => {
  await page.goto('/')
  await expect(nav(page)).toBeVisible()
  for (const key of ['c', 'Shift+c', 'Meta+c', 'Control+Shift+c']) {
    await page.keyboard.press(key)
    await expect(nav(page)).toBeVisible()
  }
  const repeatCancelled = await page.evaluate(() => !window.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'C', metaKey: true, shiftKey: true, repeat: true, cancelable: true,
  })))
  expect(repeatCancelled).toBe(false)
  await expect(nav(page)).toBeVisible()
  const bounds = (await nav(page).boundingBox())!
  await tab(page, 'Header').focus()
  for (let i = 0; i < 3; i++) {
    await toggle(page)
    await expect(nav(page)).toHaveCount(0)
    await expect(page.locator('.exploration-switcher__tab, .exploration-switcher__indicator')).toHaveCount(0)
    expect(await page.evaluate(() => document.activeElement?.closest('.exploration-switcher') != null)).toBe(false)
    expect(await page.evaluate(({ x, y, width, height }) => document.elementFromPoint(x + width / 2, y + height / 2)?.closest('.exploration-switcher') != null, bounds)).toBe(false)
    await toggle(page)
    await expect(nav(page)).toBeVisible()
    expect(await nav(page).boundingBox()).toEqual(bounds)
    await aligned(page, 'Header')
  }
  const cancelled = await page.evaluate(() => !window.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'C', metaKey: true, shiftKey: true, cancelable: true,
  })))
  expect(cancelled).toBe(true)
  await expect(nav(page)).toHaveCount(0)
  await page.reload()
  await expect(nav(page)).toBeVisible()
  await expect(tab(page, 'Header')).toHaveAttribute('aria-selected', 'true')
})

test('hide/show preserves every active panel and component, plus editor draft, facility scroll and Product Usage controls', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 640 })
  await page.goto('/')
  for (const name of names) {
    await tab(page, name).click()
    const panel = page.locator(`#${await tab(page, name).getAttribute('aria-controls')}`)
    if (name === 'Document editor') {
      await expect(page.getByTestId('document-editor')).toBeVisible()
      await page.getByRole('tab', { name: 'Comments', exact: true }).click()
      await page.getByLabel('New comment').fill('Retained shell test draft')
    }
    if (name === 'Facility app') {
      await expect(page.locator('.facility-app-scope')).toBeVisible()
      await page.locator('.facility-app-scope').evaluate(el => { el.scrollTop = 60; el.scrollLeft = 80 })
    }
    if (name === 'Product usage') {
      await page.locator('.product-usage-demo').getByRole('button', { name: 'Week', exact: true }).click()
      await page.locator('.product-usage-demo').getByRole('searchbox').fill('document')
    }
    const node = await panel.locator(':scope > *').first().elementHandle()
    const before = await panel.boundingBox()
    await toggle(page)
    await expect(nav(page)).toHaveCount(0)
    await expect(panel).toBeVisible()
    expect(await panel.boundingBox()).toEqual(before)
    expect(await node!.evaluate(el => el.isConnected)).toBe(true)
    await toggle(page)
    await expect(tab(page, name)).toHaveAttribute('aria-selected', 'true')
    expect(await node!.evaluate(el => el.isConnected)).toBe(true)
    expect(await panel.boundingBox()).toEqual(before)
    await aligned(page, name)
    if (name === 'Document editor') await expect(page.getByLabel('New comment')).toHaveValue('Retained shell test draft')
    if (name === 'Facility app') expect(await page.locator('.facility-app-scope').evaluate(el => [el.scrollTop, el.scrollLeft])).toEqual([60, 80])
    if (name === 'Product usage') {
      await expect(page.locator('.product-usage-demo').getByRole('searchbox')).toHaveValue('document')
      await expect(page.locator('.product-usage-demo').getByRole('button', { name: 'Week', exact: true })).toHaveAttribute('aria-pressed', 'true')
    }
  }
})

test('editor recovery action stays above the overlay, including wrapped tabs and the short-screen offset', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('proposal-editor:document:v1', '{malformed'))
  for (const viewport of [{ width: 1200, height: 900 }, { width: 390, height: 480 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await tab(page, 'Document editor').click()
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(async () => {
      const notice = (await alert.boundingBox())!, overlay = (await nav(page).boundingBox())!
      expect(overlay.y - notice.y - notice.height).toBe(12)
    }).toPass()
    await toggle(page)
    await expect(nav(page)).toHaveCount(0)
    const hiddenNotice = (await alert.boundingBox())!
    expect(viewport.height - hiddenNotice.y - hiddenNotice.height).toBe(24)
    await toggle(page)
    await expect(nav(page)).toBeVisible()
    await alert.getByRole('button', { name: 'Back up and retry' }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Saved')
  }
})
