import { expect, type Page } from '@playwright/test'
export const key = 'proposal-editor:document:v1'
export async function openEditor(page: Page, delay = 0) {
  await page.addInitScript(delay => { window.__phase2Test = { saveDelay: delay } }, delay)
  await page.goto('/')
  await activateEditor(page)
  await expect(page.getByTestId('document-editor')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}
export async function selectText(page: Page, text: string) {
  await page.evaluate(text => {
    const editor = window.__phase2Test!.editor!
    let found = false
    editor.state.doc.descendants((node, pos) => {
      if (found || !node.isTextblock) return
      const index = node.textContent.indexOf(text)
      if (index >= 0) {
        editor.commands.setTextSelection({ from: pos + 1 + index, to: pos + 1 + index + text.length })
        editor.view.focus(); found = true
      }
    })
    if (!found) throw new Error(`Missing selection text: ${text}`)
  }, text)
  await expect(page.getByTestId('formatting-toolbar')).toBeVisible()
}
export async function stored(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key) }
export async function documentJSON(page: Page) { return page.evaluate(() => window.__phase2Test!.editor!.getJSON()) }

export async function activateEditor(page: Page) {
  await page.getByRole('tab', { name: 'Document editor', exact: true }).click()
  await expect(page.getByTestId('document-editor')).toBeVisible()
}
export async function reloadEditor(page: Page) { await page.reload(); await activateEditor(page) }
