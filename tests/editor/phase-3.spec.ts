import { test, expect } from '@playwright/test'
import { openEditor, selectText, documentJSON, stored } from './editor-helpers'
import { proposal } from '../../src/document-editor/content/proposal'
import { mkdir } from 'node:fs/promises'

const menuName = { name: 'Explain this', exact: true }
async function ask(page: import('@playwright/test').Page, text = proposal.summary) {
  await selectText(page, text)
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click()
  await expect(page.getByRole('dialog', menuName)).toBeVisible()
}
async function action(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('dialog', menuName).getByRole('button', { name: new RegExp(`^${name}`) }).first().click()
}
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1640, height: 1060 }); await openEditor(page) })

test('orb toggles mapped annotations; clause and paragraph triggers preserve pure prose', async ({ page }) => {
  const before = await documentJSON(page)
  const orb = page.getByRole('button', { name: 'Explain mode', exact: true })
  await expect(page.locator('[data-clause-marker]')).toHaveCount(0)
  await orb.click()
  await expect(orb).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-clause-marker]')).toHaveCount(3)
  await expect(page.getByTestId('explain-menu')).toHaveCount(0)
  expect(await documentJSON(page)).toEqual(before)
  await page.getByRole('button', { name: 'Explain investment', exact: true }).click()
  await action(page, 'Summary')
  await expect(page.getByText('Generating response…', { exact: true })).toBeVisible()
  await expect(page.getByTestId('explain-result')).toContainText('does not specify an amount')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Explain investment', exact: true })).toBeFocused()
  await page.locator('#executive-summary + p').hover()
  const hover = page.getByRole('button', { name: 'Explain paragraph', exact: true })
  const hoverBox = (await hover.boundingBox())!
  await page.mouse.move(hoverBox.x + 8, hoverBox.y + 8, { steps: 12 })
  await expect(hover).toBeVisible()
  await mkdir('docs/qa/document-editor/inherited-phase-3', { recursive: true })
  await page.screenshot({ path: 'docs/qa/document-editor/inherited-phase-3/paragraph-hover.png', animations: 'disabled' })
  await page.getByRole('button', { name: 'Explain paragraph', exact: true }).click()
  await action(page, 'Summary')
  await expect(page.getByTestId('explain-result')).toContainText('Acme Studio')
  await page.keyboard.press('Escape')
  await selectText(page, proposal.introduction)
  await page.keyboard.press('Meta+c')
  await selectText(page, 'Dear Alex,')
  await page.keyboard.press('Meta+v')
  await expect(page.getByTestId('document-editor').locator('p').nth(1)).toHaveText(proposal.introduction)
  await page.keyboard.press('Meta+z')
  expect(await documentJSON(page)).toEqual(before)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByTestId('save-status')).toHaveText('Saved')
  expect((await stored(page)).document).toEqual(before)
  await orb.click()
  await expect(page.locator('[data-clause-marker]')).toHaveCount(0)
})

test('selection to all five action results, question field, exact menu copy and Back', async ({ page }) => {
  await ask(page)
  await expect(page.getByText('Get a short, plan-language summary', { exact: true })).toBeVisible()
  for (const name of ['Summary', 'Key points', 'Simplify', 'Rewrite']) {
    await action(page, name)
    await expect(page.getByText('Generating response…', { exact: true })).toBeVisible()
    await expect(page.getByText('Prototype response', { exact: true })).toBeVisible()
    await expect(page.getByTestId('explain-result')).toContainText(name === 'Key points' ? 'Acme Studio proposes' : 'Acme Studio')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
  }
  await action(page, 'Ask a question')
  const input = page.getByRole('textbox', { name: 'Ask anything about this text', exact: true })
  await expect(input).toBeFocused()
  await expect(page.getByRole('button', { name: 'Ask question', exact: true })).toBeDisabled()
  await input.fill('What is the exact budget?')
  await page.getByRole('button', { name: 'Ask question', exact: true }).click()
  await expect(page.getByTestId('explain-result')).toHaveText('The selected passage does not supply the answer to that question.')
  await expect(page.locator('.preserved-selection')).not.toHaveCount(0)
})

test('all five suggestion chips route to matching actions or grounded questions', async ({ page }) => {
  await ask(page)
  for (const [chip, title] of [
    ['Explain this in simpler terms', 'Simplify'], ['What are the key points?', 'Key points'],
    ['Rewrite this to be more concise', 'Rewrite'], ['What does this mean for the project?', 'Ask a question'], ['What should I focus on here?', 'Ask a question'],
  ]) {
    await page.getByRole('button', { name: chip, exact: true }).click()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.getByTestId('explain-result')).toContainText('Acme Studio')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
  }
})

test('cancel, injected error, retry, Back and dismissal abort obsolete requests', async ({ page }) => {
  await ask(page)
  await action(page, 'Summary')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Response cancelled.', { exact: true })).toBeVisible()
  await page.waitForTimeout(700)
  await expect(page.getByTestId('explain-result')).toHaveCount(0)
  await page.evaluate(() => { window.__phase2Test!.explainFailures = 1 })
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('could not be generated')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByText('Prototype response', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await action(page, 'Rewrite')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await action(page, 'Key points')
  await expect(page.getByTestId('explain-result').locator('li')).toHaveCount(2)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await action(page, 'Summary')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(700)
  await expect(page.getByTestId('explain-menu')).toHaveCount(0)
})

test('stale source cancels loading, blocks Apply after result, and requires regeneration', async ({ page }) => {
  await ask(page)
  await action(page, 'Rewrite')
  await page.evaluate(() => {
    const editor = window.__phase2Test!.editor!
    editor.view.dispatch(editor.state.tr.insertText('Updated ', editor.state.selection.from))
  })
  await expect(page.getByRole('alert')).toContainText('selected text changed')
  await page.waitForTimeout(700)
  await expect(page.getByTestId('explain-result')).toHaveCount(0)
  await page.getByRole('button', { name: 'Regenerate', exact: true }).click()
  await expect(page.getByTestId('explain-result')).toContainText('Updated')
  await page.evaluate(() => {
    const editor = window.__phase2Test!.editor!
    editor.view.dispatch(editor.state.tr.insertText('Revised ', editor.state.selection.from + 2))
  })
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Regenerate', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled()
})

test('outside-source edits map the range; Apply is explicit and one undoable transaction', async ({ page }) => {
  await ask(page)
  const initial = await documentJSON(page)
  await action(page, 'Rewrite')
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled()
  expect(await documentJSON(page)).toEqual(initial)
  await page.evaluate(() => {
    const editor = window.__phase2Test!.editor!
    editor.view.dispatch(editor.state.tr.insertText('Earlier edit: ', 1))
  })
  const beforeApply = await documentJSON(page)
  const replacement = await page.getByTestId('explain-result').innerText()
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page.getByTestId('explain-menu')).toHaveCount(0)
  await expect(page.locator('#executive-summary + p')).toHaveText(replacement)
  await expect(page.getByTestId('document-editor')).toBeFocused()
  await page.keyboard.press('Meta+z')
  expect(await documentJSON(page)).toEqual(beforeApply)
  await page.keyboard.press('Meta+Shift+z')
  await expect(page.locator('#executive-summary + p')).toHaveText(replacement)
})

test('keyboard navigation, Escape restoration, outside dismissal and source switching', async ({ page }) => {
  await selectText(page, proposal.summary)
  await page.keyboard.press('F10')
  await page.keyboard.press('Home')
  await expect(page.getByRole('button', { name: 'Ask AI', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('dialog', menuName)
  await expect(menu.getByRole('button').first()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('button', { name: /^Key points/ })).toBeFocused()
  await page.keyboard.press('End')
  await expect(menu.getByRole('button', { name: 'What should I focus on here?', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('Tab')
  await expect(menu.getByRole('button', { name: /^Key points/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ask AI', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await action(page, 'Summary')
  await selectText(page, proposal.background)
  await expect(menu).toHaveCount(0)
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click()
  await action(page, 'Summary')
  await expect(page.getByTestId('explain-result')).toContainText('Bloom has grown')
  await page.getByRole('textbox', { name: 'Search document', exact: true }).click()
  await expect(menu).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Search document', exact: true })).toBeFocused()
})

test('deleted sources cannot apply, and a new selection replaces a stale context', async ({ page }) => {
  await ask(page)
  await action(page, 'Rewrite')
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled()
  // Dispatch and click before React can rerender: commit-time validation must still reject it.
  const afterDeletion = await page.evaluate(() => {
    const editor = window.__phase2Test!.editor!
    const { from, to } = editor.state.selection
    editor.view.dispatch(editor.state.tr.delete(from, to))
    const snapshot = editor.getJSON()
    Array.from(document.querySelectorAll<HTMLButtonElement>('[data-testid="explain-menu"] button')).find(button => button.textContent === 'Apply')!.click()
    return snapshot
  })
  expect(await documentJSON(page)).toEqual(afterDeletion)
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Regenerate', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('select new text')
  await selectText(page, proposal.background)
  await expect(page.getByTestId('explain-menu')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ask AI', exact: true }).click()
  await action(page, 'Summary')
  await expect(page.getByTestId('explain-result')).toContainText('Bloom has grown')
})

test('orb opens existing selection, mode exit cancels generation, and subsequent typing has its own undo', async ({ page }) => {
  await selectText(page, proposal.summary)
  const orb = page.getByRole('button', { name: 'Explain mode', exact: true })
  await orb.click()
  await action(page, 'Summary')
  await orb.click()
  await expect(page.getByTestId('explain-menu')).toHaveCount(0)
  await expect(page.locator('[data-clause-marker]')).toHaveCount(0)
  await ask(page)
  await action(page, 'Rewrite')
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled()
  const replacement = await page.getByTestId('explain-result').innerText()
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await page.keyboard.type('Following edit')
  await page.keyboard.press('Meta+z')
  await expect(page.locator('#executive-summary + p')).toHaveText(replacement)
  await page.keyboard.press('Meta+z')
  await expect(page.locator('#executive-summary + p')).toHaveText(proposal.summary)
})

test('Tab leaves the menu cleanly and Back restores the action-list focus', async ({ page }) => {
  await ask(page)
  await expect(page.getByTestId('explain-menu').getByRole('button').first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Prototype response', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  const menu = page.getByTestId('explain-menu')
  await expect(menu.getByRole('button').first()).toBeFocused()
  await page.keyboard.press('End')
  await page.keyboard.press('Tab')
  await expect(menu).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ask AI', exact: true })).toBeFocused()
})
