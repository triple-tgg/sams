export const itemReport = [
  {
    id: '1',
    name: 'Equipment',
    description: 'Equipment Report',
    reportType: 'equipment' as const
  },
  {
    id: '2',
    name: 'Parts & Tools',
    description: 'Parts & Tools Report',
    reportType: 'partstools' as const
  },
  {
    id: '3',
    name: 'THF Document',
    description: 'THF Document Report',
    reportType: 'thf' as const
  },
  {
    id: '4',
    name: 'THF Document V.2',
    description: 'THF Document Calculate Report',
    reportType: 'thf-2' as const
  },
  {
    id: '5',
    name: 'THF Document File',
    description: 'THF Document File Report (file.zip)',
    reportType: 'thf-file' as const
  },
]

export type ReportType = 'equipment' | 'partstools' | 'thf' | 'thf-2' | 'thf-file'