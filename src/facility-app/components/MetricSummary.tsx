import { equipment, defaultEquipment } from '../data/equipment'
import { Icon, type IconName } from './Icon'

export function MetricSummary() {
  const total = equipment.reduce((sum, item) => sum + item.excessKwh, 0)
  const runtime = defaultEquipment.dailyRuntime.reduce<number>((sum, hours) => sum + hours, 0)
  const metrics: { icon: IconName; title: string; value: string; detail: string }[] = [
    { icon: 'metric-energy', title: 'Modeled excess use', value: `${total} kWh`, detail: `Across ${equipment.length} monitored air handlers` },
    { icon: 'metric-anomaly', title: 'Largest anomaly', value: defaultEquipment.id, detail: `${defaultEquipment.excessKwh} kWh · ${Math.round(defaultEquipment.excessKwh / total * 100)}% of excess use` },
    { icon: 'metric-clock', title: 'Out-of-schedule runtime', value: `${runtime} hours`, detail: `${defaultEquipment.id} · matched to calendar` },
  ]

  return (
    <section className="metric-summary card" data-geometry="metrics" aria-label="Weekly summary">
      {metrics.map(metric => (
        <div className="metric" key={metric.title}>
          <h2 className="icon-label"><Icon name={metric.icon} />{metric.title}</h2>
          <p className="metric-value">{metric.value}</p>
          <p className="secondary">{metric.detail}</p>
        </div>
      ))}
    </section>
  )
}
