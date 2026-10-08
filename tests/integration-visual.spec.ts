import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { openEditor, selectText } from './editor/editor-helpers'
const output = 'docs/qa/document-editor'
for (const width of [1280, 1440, 1640, 1920]) test(`playground isolation and editor framing at ${width}`, async ({ page }) => {
  const height = width === 1640 ? 1060 : width === 1920 ? 1080 : 900
  await page.setViewportSize({ width, height })
  await page.clock.install({ time: new Date('2026-10-08T08:00:00Z') })
  await openEditor(page)
  await mkdir(output, { recursive: true })
  const shell = (await page.getByTestId('app-shell').boundingBox())!
  const switcher = (await page.getByRole('tablist', { name: 'UI explorations' }).boundingBox())!
  expect(shell.y + shell.height + 12).toBeLessThanOrEqual(switcher.y)
  expect(shell.height).toBe(Math.min(860, height - 118))
  expect(shell.width).toBe(Math.min(1440, width - 32))
  const framing = await page.evaluate(() => ({ background: getComputedStyle(document.querySelector('.exploration-page')!).backgroundColor, bodyOverflow: document.documentElement.scrollHeight > innerHeight, horizontalOverflow: document.documentElement.scrollWidth > innerWidth }))
  expect(framing).toEqual({ background: 'rgb(235, 235, 235)', bodyOverflow: false, horizontalOverflow: false })
  await page.mouse.move(4, 4)
  await page.screenshot({ path: `${output}/editor-live-${width}.png`, animations: 'disabled' })
  for (const [id, name] of [['header', 'Header'], ['date-picker', 'Date picker'], ['profile', 'Profile']]) {
    await page.getByRole('tab', { name, exact: true }).click()
    if (id === 'header') await page.getByRole('button', { name: 'Products', exact: true }).hover()
    await page.mouse.move(3, 600)
    if (id === 'header') await page.getByRole('button', { name: 'Products', exact: true }).click()
    await page.locator(`#exploration-panel-${id}`).screenshot({ path: `${output}/integrated-${id}-${width}.png`, animations: 'disabled' })
  }
  await writeFile(`${output}/integration-geometry-${width}.json`, JSON.stringify({ shell, switcher, framing }, null, 2))
})

test('resizing a live floating surface reserves the switcher and scrolls the editor internally', async ({ page }) => {
  await page.setViewportSize({ width: 1640, height: 1060 })
  await openEditor(page)
  await selectText(page, 'Acme Studio')
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click()
  for (const height of [900, 640, 480, 1060]) {
    await page.setViewportSize({ width: 1280, height })
    const menu = page.getByTestId('explain-menu')
    await expect(async () => {
      const box = (await menu.boundingBox())!, switcher = (await page.getByRole('tablist', { name: 'UI explorations' }).boundingBox())!
      expect(box.y).toBeGreaterThanOrEqual(12)
      expect(box.y + box.height).toBeLessThanOrEqual(height < 1032 ? switcher.y - 12 : height - 12)
      expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(false)
    }).toPass()
    await expect(page.getByRole('tab', { name: 'Document editor', exact: true })).toBeInViewport()
  }
})
