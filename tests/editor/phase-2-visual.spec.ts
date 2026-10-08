import { test, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { openEditor, selectText } from './editor-helpers'
import { proposal } from '../../src/document-editor/content/proposal'
const output = 'docs/qa/document-editor/inherited-phase-2'
const viewports = [{ width: 1640, height: 1060 }, { width: 1280, height: 900 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]
for (const viewport of viewports) {
  test(`live editor geometry and unclipped selections at ${viewport.width}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize(viewport)
    await openEditor(page, 120000)
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.getByTestId('save-status')).toHaveText('Saving...')
    const geometry = await page.evaluate(() => {
      const selectors = { shell: '[data-testid="app-shell"]', paper: '[data-testid="paper"]', text: '[data-testid="text-column"]', title: '.tiptap h1', date: '.tiptap > p', summary: '#executive-summary', background: '#project-background', objectives: '#objectives', workspace: '[data-testid="workspace"]' }
      return Object.fromEntries(Object.entries(selectors).map(([key, selector]) => { const { x, y, width, height } = document.querySelector(selector)!.getBoundingClientRect(); return [key, { x, y, width, height }] }))
    })
    if (viewport.width === 1640) {
      const anchors = { shell: [100, 0, 1440, 1060], paper: [412, 178, 816], text: [545, 258, 550], title: [545, 258, 550, 18], date: [545, 296, 550, 21], summary: [545, 466, 550, 21], background: [545, 603, 550, 21], objectives: [545, 740, 550, 21] }
      for (const [name, expected] of Object.entries(anchors)) for (const [i, dimension] of ['x', 'y', 'width', 'height'].entries()) {
        if (expected[i] !== undefined) expect(Math.abs(geometry[name][dimension as 'x'] - expected[i]), `${name}.${dimension}`).toBeLessThanOrEqual(1)
      }
    }
    await mkdir(output, { recursive: true })
    await page.screenshot({ path: `${output}/default-${viewport.width}.png`, animations: 'disabled' })
    await selectText(page, proposal.summary)
    const toolbar = page.getByTestId('formatting-toolbar')
    await expect(toolbar).toBeVisible()
    await expect(async () => {
      const rect = (await toolbar.boundingBox())!
      expect(rect.width).toBe(339)
      expect(rect.x).toBeGreaterThanOrEqual(12)
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width - 12)
      expect(rect.y).toBeGreaterThanOrEqual(12)
      expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height - 12)
    }).toPass()
    if (viewport.width === 1640) {
      const selection = await page.locator('#executive-summary + p').boundingBox()
      const rect = (await toolbar.boundingBox())!
      expect(Math.abs(rect.y + rect.height + 8 - selection!.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(rect.x + rect.width / 2 - (selection!.x + selection!.width / 2))).toBeLessThanOrEqual(1)
    }
    await page.screenshot({ path: `${output}/selection-${viewport.width}.png`, animations: 'disabled' })
    // Bring a selection to the top edge of the scroll container and exercise re-positioning.
    await page.getByTestId('workspace').evaluate(element => { element.scrollTop = 375 })
    await expect(async () => {
      const rect = (await toolbar.boundingBox())!
      const paragraph = (await page.locator('#executive-summary + p').boundingBox())!
      expect(Math.abs(rect.y + rect.height + 8 - paragraph.y)).toBeLessThanOrEqual(1)
    }).toPass({ timeout: 3000 })
    await page.getByRole('button', { name: 'Text color', exact: true }).click()
    const palette = page.getByRole('dialog', { name: 'Text color choices' })
    await expect(palette).toBeVisible()
    const p = (await palette.boundingBox())!
    expect(p.x).toBeGreaterThanOrEqual(12)
    expect(p.x + p.width).toBeLessThanOrEqual(viewport.width - 12)
    expect(p.y).toBeGreaterThanOrEqual(12)
    expect(p.y + p.height).toBeLessThanOrEqual(viewport.height - 12)
    await page.screenshot({ path: `${output}/edge-color-${viewport.width}.png`, animations: 'disabled' })
    const overflow = await page.evaluate(() => ({ body: document.documentElement.scrollWidth > innerWidth, workspace: (() => { const el = document.querySelector('[data-testid="workspace"]')!; return el.scrollWidth > el.clientWidth })() }))
    expect(overflow).toEqual({ body: false, workspace: false })
    expect(errors).toEqual([])
    await writeFile(`${output}/geometry-${viewport.width}.json`, JSON.stringify({ viewport, geometry, overflow, errors }, null, 2))
  })
}
