import { HeatmapCell } from './HeatmapTooltip'
import { days, equipment, type Equipment } from '../data/equipment'

export function RuntimeHeatmap({ selected, onSelect }: { selected: Equipment; onSelect: (id: string) => void }) {
  return (
    <section className="runtime-card card" data-geometry="table" aria-labelledby="facility-runtime-title">
      <header className="runtime-intro">
        <h2 id="facility-runtime-title">After-hours runtime by day</h2>
        <p className="secondary" id="facility-runtime-description">Cells show hours outside the booked occupancy schedule. Darker cells indicate longer runtime.</p>
      </header>
      <table className="runtime-table" aria-labelledby="facility-runtime-title" aria-describedby="facility-runtime-description">
        <thead>
          <tr className="runtime-row column-headings">
            <th scope="col" className="equipment-cell">Air Handler</th>
            <th scope="col" className="area-cell">Area</th>
            {days.map(day => <th scope="col" className="day-heading" key={day}>{day}</th>)}
            <th scope="col" className="total-heading">Excess kWh/week</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(item => (
            <tr key={item.id} className={`runtime-row${item.id === selected.id ? ' is-selected' : ''}`} data-equipment={item.id} onClick={() => onSelect(item.id)}>
              <th scope="row" className="equipment-cell">
                <button type="button" className="equipment-select" aria-label={`Select ${item.id} · ${item.area}`} aria-pressed={item.id === selected.id} onClick={() => onSelect(item.id)}>{item.id}</button>
              </th>
              <td className="area-cell">{item.area}</td>
              {item.dailyRuntime.map((hours, index) => (
                <HeatmapCell item={item} day={days[index]} hours={hours} key={days[index]} onSelect={() => onSelect(item.id)} />
              ))}
              <td className="total-cell">{item.excessKwh}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
