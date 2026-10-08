import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'no-preference' })

test('feature switches slide continuously with persistent thumbs and respect reduced motion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('tablist', { name: 'UI explorations' }).getByRole('tab', { name: 'Product usage', exact: true }).click()
  const root = page.locator('.product-usage-demo')
  await root.locator('#manage').click()
  await root.locator('#manage-menu').evaluate(async node => {
    await Promise.all(node.getAnimations().map(animation => animation.finished))
  })
  const switches = root.getByRole('switch')
  await expect(switches).toHaveCount(5)
  const indicator = await root.locator('.selection-indicator').first().evaluate(node => {
    const style = getComputedStyle(node)
    return { duration: style.transitionDuration.split(',')[0], easing: style.transitionTimingFunction }
  })

  for (const toggle of await switches.all()) {
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    const before = await toggle.boundingBox()
    for (let i = 0; i < 4; i++) {
      const result = await toggle.evaluate(node => {
        const button = node as HTMLButtonElement
        const thumb = button.querySelector('.manage-switch-thumb') as HTMLElement
        const on = button.getAttribute('aria-checked') === 'true'
        const snapshot = () => {
          const trackStyle = getComputedStyle(button), thumbStyle = getComputedStyle(thumb)
          return { x: new DOMMatrixReadOnly(thumbStyle.transform).m41, color: trackStyle.backgroundColor,
            opacity: [trackStyle.opacity, thumbStyle.opacity], width: thumb.getBoundingClientRect().width,
            height: thumb.getBoundingClientRect().height }
        }
        const start = snapshot()
        button.click()
        void getComputedStyle(thumb).transform // Flush styles to create both CSS transitions.
        const animations = [...button.getAnimations(), ...thumb.getAnimations()]
        const properties = animations.map(animation => (animation as CSSTransition).transitionProperty).sort()
        animations.forEach(animation => { animation.pause(); animation.currentTime = 65 })
        const quarter = snapshot()
        animations.forEach(animation => { animation.currentTime = 130 })
        const middle = snapshot()
        animations.forEach(animation => animation.finish())
        const end = snapshot()
        return { on, start, quarter, middle, end, properties,
          sameThumb: thumb === button.firstElementChild && button.childElementCount === 1,
          duration: getComputedStyle(thumb).transitionDuration,
          easing: getComputedStyle(thumb).transitionTimingFunction }
      })
      expect(result.properties).toEqual(['background-color', 'transform'])
      expect(result.duration).toBe(indicator.duration)
      expect(indicator.easing).toContain(result.easing)
      expect(result.sameThumb).toBe(true)
      expect(result.start.x).toBe(result.on ? 16 : 0)
      expect(result.end.x).toBe(result.on ? 0 : 16)
      expect(result.end.color).toBe(result.on ? 'rgb(229, 229, 229)' : 'rgb(0, 0, 0)')
      for (const sample of [result.quarter, result.middle]) {
        expect(sample.x).toBeGreaterThan(0)
        expect(sample.x).toBeLessThan(16)
        expect(sample.color).not.toBe(result.start.color)
        expect(sample.color).not.toBe(result.end.color)
        expect(sample.opacity).toEqual(['1', '1'])
        expect([sample.width, sample.height]).toEqual([16, 16])
      }
      expect(result.on ? result.middle.x < result.quarter.x : result.middle.x > result.quarter.x).toBe(true)
      expect(await toggle.boundingBox()).toEqual(before)
    }
    for (const key of ['Space', 'Enter']) {
      await toggle.press(key)
      const properties = await toggle.evaluate(node => {
        const animations = node.getAnimations({ subtree: true })
        const properties = animations.map(animation => (animation as CSSTransition).transitionProperty).sort()
        animations.forEach(animation => animation.finish())
        return properties
      })
      expect(properties).toEqual(['background-color', 'transform'])
    }
    // Reverse a running transition repeatedly; the same thumb must remain at its current position.
    const reversal = await toggle.evaluate(async node => {
      const button = node as HTMLButtonElement, thumb = button.firstElementChild!
      const read = () => new DOMMatrixReadOnly(getComputedStyle(thumb).transform).m41
      const jumps = []
      for (let i = 0; i < 10; i++) {
        const before = read()
        button.click()
        jumps.push(Math.abs(read() - before))
        await new Promise(requestAnimationFrame)
      }
      await Promise.all(button.getAnimations({ subtree: true }).map(animation => animation.finished))
      return { jumps, same: thumb === button.firstElementChild && button.childElementCount === 1, x: read() }
    })
    expect(reversal.same).toBe(true)
    expect(Math.max(...reversal.jumps)).toBeLessThan(.1)
    expect(reversal.x).toBe(16)
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const toggle of await switches.all()) {
    for (const checked of [false, true]) {
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-checked', String(checked))
      expect(await toggle.evaluate(node => ({ animations: node.getAnimations({ subtree: true }).length,
        x: new DOMMatrixReadOnly(getComputedStyle(node.firstElementChild!).transform).m41 })))
        .toEqual({ animations: 0, x: checked ? 16 : 0 })
    }
  }
  expect(errors).toEqual([])
})
