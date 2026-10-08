import { test, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { openEditor, selectText } from './editor-helpers'
import { proposal } from '../../src/document-editor/content/proposal'
const output = 'docs/qa/document-editor/inherited-phase-3'
const viewports = [{ width: 1640, height: 1060 }, { width: 1280, height: 900 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]
for (const viewport of viewports) test(`Explain visual and edge positioning at ${viewport.width}`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize(viewport)
  await openEditor(page, 120000)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByTestId('save-status')).toHaveText('Saving...')
  await page.mouse.move(4, 4)
  await mkdir(output, { recursive: true })
  await page.screenshot({ path: `${output}/default-${viewport.width}.png`, animations: 'disabled' })
  await page.getByRole('button', { name: 'Explain mode', exact: true }).click()
  await expect(page.locator('[data-clause-marker]')).toHaveCount(3)
  await page.mouse.move(4, 4)
  await page.screenshot({ path: `${output}/annotated-${viewport.width}.png`, animations: 'disabled' })
  await selectText(page, proposal.summary)
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click()
  const menu = page.getByTestId('explain-menu')
  await expect(menu).toBeVisible()
  await page.mouse.move(4, 4)
  const assertVisible = async () => {
    const rect = (await menu.boundingBox())!
    expect(rect.width).toBe(382)
    expect(rect.height).toBe(Math.min(758, page.viewportSize()!.height - 24))
    expect(rect.x).toBeGreaterThanOrEqual(12)
    expect(rect.y).toBeGreaterThanOrEqual(12)
    expect(rect.x + rect.width).toBeLessThanOrEqual(page.viewportSize()!.width - 12)
    expect(rect.y + rect.height).toBeLessThanOrEqual(page.viewportSize()!.height - 12)
    return rect
  }
  await expect(assertVisible).toPass()
  const geometry = await assertVisible()
  if (viewport.width === 1640) { expect(geometry.x).toBe(1199); expect(geometry.y).toBe(140) }
  await page.screenshot({ path: `${output}/selection-explain-${viewport.width}.png`, animations: 'disabled' })
  const assets = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLImageElement>('[data-clause-marker] img, [data-testid="explain-menu"] img')).map(img => ({ src: img.getAttribute('src'), natural: [img.naturalWidth, img.naturalHeight], width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height })))
  expect(assets.length).toBeGreaterThanOrEqual(9)
  expect(assets.every(asset => asset.natural[0] > 0 && asset.width > 0)).toBe(true)
  await page.getByTestId('workspace').evaluate(element => { element.scrollTop = 390 })
  await expect(assertVisible).toPass()
  await page.screenshot({ path: `${output}/edge-scroll-${viewport.width}.png`, animations: 'disabled' })
  await menu.getByRole('button', { name: /^Summary/ }).click()
  await expect(page.getByText('Generating response…', { exact: true })).toBeVisible()
  await page.screenshot({ path: `${output}/loading-${viewport.width}.png`, animations: 'disabled' })
  await expect(page.getByText('Prototype response', { exact: true })).toBeVisible()
  await page.screenshot({ path: `${output}/result-${viewport.width}.png`, animations: 'disabled' })
  const overflow = await page.evaluate(() => ({ body: document.documentElement.scrollWidth > innerWidth, workspace: (() => { const el = document.querySelector('[data-testid="workspace"]')!; return el.scrollWidth > el.clientWidth })() }))
  expect(overflow).toEqual({ body: false, workspace: false })
  expect(errors).toEqual([])
  await writeFile(`${output}/geometry-${viewport.width}.json`, JSON.stringify({ viewport, menu: geometry, assets, overflow, errors }, null, 2))
})

test('short viewport menu scrolls internally and keyboard focus reveals edge chips', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await openEditor(page)
  await selectText(page, proposal.summary)
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click()
  const menu = page.getByTestId('explain-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('button').first()).toBeFocused()
  await page.keyboard.press('End')
  const last = menu.getByRole('button', { name: 'What should I focus on here?', exact: true })
  await expect(last).toBeFocused()
  await expect(last).toBeInViewport()
  expect(await menu.evaluate(el => el.scrollTop)).toBeGreaterThan(100)
  const box = (await menu.boundingBox())!
  expect(box.y).toBe(12); expect(box.height).toBe(616)
  await page.screenshot({ path: `${output}/short-viewport-keyboard.png`, animations: 'disabled' })
  await page.keyboard.press('Enter')
  await expect(page.getByText('Prototype response', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Ask AI', exact: true })).toBeFocused()
})
