import { days, equipment, type Equipment } from '../data/equipment'

export function RuntimeHeatmap({ selected }: { selected: Equipment }) {
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
            <tr key={item.id} className={`runtime-row${item.id === selected.id ? ' is-selected' : ''}`} data-equipment={item.id}>
              <th scope="row" className="equipment-cell">
                {item.id}{item.id === selected.id && <span className="sr-only">, selected</span>}
              </th>
              <td className="area-cell">{item.area}</td>
              {item.dailyRuntime.map((hours, index) => (
                <td className="runtime-cell raised-surface" data-runtime={hours} key={days[index]}>
                  <span>{hours}</span>
                </td>
              ))}
              <td className="total-cell">{item.excessKwh}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
