export type Runtime = 0 | 0.5 | 1 | 2 | 3 | 4 | 5 | 10

export interface Equipment {
  id: string
  area: string
  dailyRuntime: readonly [Runtime, Runtime, Runtime, Runtime, Runtime, Runtime, Runtime]
  excessKwh: number
  equipmentType: string
  bookedHours: string
  coverage: number
  suspectedIssue: string
  inspectionSummary: string
  prototypeContext?: boolean
  controlLog?: { id: string; override: string; enabled: string; endTimestamp: string; source: string }
}

export const days = ['Mon 28', 'Tue 29', 'Wed 30', 'Thu 01', 'Fri 02', 'Sat 03', 'Sun 04'] as const

// Non-default schedules, types, coverage and inspection context below are local prototype data.
export const equipment: readonly Equipment[] = [
  {
    id: 'AHU-03', area: 'Library East', dailyRuntime: [10, 10, 10, 10, 10, 5, 5], excessKwh: 418,
    equipmentType: 'Supply Fan',
    bookedHours: 'Mon–Fri 07:00–18:00; Sat 09:00–14:00; Sun closed',
    coverage: 100,
    suspectedIssue: 'An old manual override may still be active; cause not yet verified.',
    inspectionSummary: 'Largest campus outlier. Review the override and compare the signal with the booked schedule.',
    controlLog: { id: 'CL-203', override: 'OV-882', enabled: '22 Sep', endTimestamp: 'None', source: 'Manual override' },
  },
  { id: 'AHU-01', area: 'Atrium', dailyRuntime: [4, 4, 4, 4, 4, 1, 1], excessKwh: 154, equipmentType: 'Supply Fan', bookedHours: 'Mon–Fri 07:00–19:00; Sat–Sun 09:00–16:00', coverage: 99,
    suspectedIssue: 'Late shutdown may extend beyond occupancy.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
  { id: 'AHU-07', area: 'Studio Block', dailyRuntime: [3, 3, 3, 3, 3, 2, 2], excessKwh: 132, equipmentType: 'Extract Fan', bookedHours: 'Mon–Fri 08:00–20:00; Sat–Sun 10:00–16:00', coverage: 98,
    suspectedIssue: 'Studio purge may run longer than needed.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
  { id: 'AHU-04', area: 'Administration', dailyRuntime: [2, 2, 2, 2, 2, 1, 1], excessKwh: 88, equipmentType: 'Supply Fan', bookedHours: 'Mon–Fri 08:00–17:00; Sat–Sun closed', coverage: 100,
    suspectedIssue: 'Evening shutdown delay may be too long.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
  { id: 'AHU-05', area: 'Workshop', dailyRuntime: [2, 2, 2, 2, 2, 0, 0], excessKwh: 65, equipmentType: 'Extract Fan', bookedHours: 'Mon–Fri 07:00–17:00; Sat–Sun closed', coverage: 97,
    suspectedIssue: 'Post-work ventilation may exceed the schedule.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
  { id: 'AHU-02', area: 'Library West', dailyRuntime: [1, 1, 1, 1, 1, 1, 0], excessKwh: 41, equipmentType: 'Supply Fan', bookedHours: 'Mon–Fri 08:00–18:00; Sat 10:00–15:00; Sun closed', coverage: 99,
    suspectedIssue: 'A short shutdown delay may explain the runtime.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
  { id: 'AHU-06', area: 'Lecture Hall', dailyRuntime: [0.5, 0.5, 0.5, 0.5, 1, 0, 0], excessKwh: 22, equipmentType: 'Supply Fan', bookedHours: 'Mon–Fri 08:00–18:00; Sat–Sun closed', coverage: 96,
    suspectedIssue: 'Lecture cooldown may continue after occupancy.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
  { id: 'AHU-08', area: 'Archives', dailyRuntime: [0, 0.5, 0.5, 0.5, 0, 0, 0], excessKwh: 12, equipmentType: 'Return Fan', bookedHours: 'Mon–Fri 09:00–17:00; Sat–Sun closed', coverage: 98,
    suspectedIssue: 'Brief archive ventilation cycles need review.', inspectionSummary: 'Compare daily runtime with occupancy before changing controls.', prototypeContext: true },
]

export const defaultEquipment = equipment[0]
