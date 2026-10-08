export type Runtime = 0 | 0.5 | 1 | 2 | 3 | 4 | 5 | 10

export interface Equipment {
  id: string
  area: string
  dailyRuntime: readonly [Runtime, Runtime, Runtime, Runtime, Runtime, Runtime, Runtime]
  excessKwh: number
  equipmentType?: string
  bookedHours?: string
  coverage?: number
}

export const days = ['Mon 28', 'Tue 29', 'Wed 30', 'Thu 01', 'Fri 02', 'Sat 03', 'Sun 04'] as const

export const equipment: readonly Equipment[] = [
  {
    id: 'AHU-03', area: 'Library East', dailyRuntime: [10, 10, 10, 10, 10, 5, 5], excessKwh: 418,
    equipmentType: 'Supply Fan',
    bookedHours: 'Mon–Fri 07:00–18:00; Sat 09:00–14:00; Sun closed',
    coverage: 100,
  },
  { id: 'AHU-01', area: 'Atrium', dailyRuntime: [4, 4, 4, 4, 4, 1, 1], excessKwh: 154 },
  { id: 'AHU-07', area: 'Studio Block', dailyRuntime: [3, 3, 3, 3, 3, 2, 2], excessKwh: 132 },
  { id: 'AHU-04', area: 'Administration', dailyRuntime: [2, 2, 2, 2, 2, 1, 1], excessKwh: 88 },
  { id: 'AHU-05', area: 'Workshop', dailyRuntime: [2, 2, 2, 2, 2, 0, 0], excessKwh: 65 },
  { id: 'AHU-02', area: 'Library West', dailyRuntime: [1, 1, 1, 1, 1, 1, 0], excessKwh: 41 },
  { id: 'AHU-06', area: 'Lecture Hall', dailyRuntime: [0.5, 0.5, 0.5, 0.5, 1, 0, 0], excessKwh: 22 },
  { id: 'AHU-08', area: 'Archives', dailyRuntime: [0, 0.5, 0.5, 0.5, 0, 0, 0], excessKwh: 12 },
]

export const defaultEquipment = equipment[0]
