import { DatePicker } from './DatePicker'
import './date-picker.css'

export function DatePickerDemo({ active }: { active: boolean }) {
  return (
    <section
      id="exploration-panel-date-picker"
      className="exploration-panel date-picker-demo"
      role="tabpanel"
      aria-labelledby="exploration-tab-date-picker"
      hidden={!active}
      tabIndex={0}
    >
      <DatePicker active={active} />
    </section>
  )
}
