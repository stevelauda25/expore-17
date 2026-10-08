import { useLayoutEffect, useRef } from 'react'
import { mountProductUsage } from './controller.js'
import template from './template.html?raw'
import './product-usage.css'

export default function ProductUsageDemo({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const controller = useRef<ReturnType<typeof mountProductUsage> | null>(null)

  useLayoutEffect(() => {
    const element = root.current!
    // This static, local template and its descendants belong to the original
    // controller. React owns the boundary, visibility and lifecycle only.
    element.innerHTML = template
    const instance = mountProductUsage(element)
    controller.current = instance
    return () => {
      instance.destroy()
      controller.current = null
      element.replaceChildren()
    }
  }, [])

  useLayoutEffect(() => {
    if (active) controller.current?.refresh()
  }, [active])

  return <div ref={root} className="product-usage-demo" data-product-usage-active={active} />
}
