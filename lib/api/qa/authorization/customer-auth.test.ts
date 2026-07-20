import { beforeEach, describe, expect, it, vi } from 'vitest'

const axiosMock = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('@/lib/axios.config', () => ({ default: axiosMock }))

import { getCustomerAuthList, getCustomerAuthRecords, updateCustomerAuth } from './customer-auth'
import { buildCustomerAuthRecordIdMap, formatCustomerAuthDate, getCustomerAuthCellData, getCustomerAuthCellKey, getCustomerAuthDateValue, getCustomerAuthPageItems, mapCustomerAuthStatus, resolveCustomerAuthAircrafts, resolveCustomerAuthCell, shouldShowCustomerAuthDates } from './customer-auth.utils'

describe('Customer Authorization API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts null when the All status filter is selected', async () => {
    const request = {
      searchKeyword: '',
      status: null,
      airlineId: null,
      page: 1,
      perPage: 20,
    }
    const response = {
      message: 'success',
      responseData: [],
      page: 1,
      perPage: 20,
      total: 134,
      totalAll: 134,
      error: '',
    }
    axiosMock.post.mockResolvedValue({ data: response })

    await expect(getCustomerAuthList(request)).resolves.toEqual(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/authorization/customer-auth/listdata', request)
  })

  it('posts the selected authorization status ID and preserves the new response fields', async () => {
    const request = {
      searchKeyword: 'Aleks',
      status: 2,
      airlineId: null,
      page: 1,
      perPage: 20,
    }
    const response = {
      message: 'success',
      responseData: [
        {
          id: 2,
          staffId: 163,
          employeeName: 'Aleks Reymer',
          employeeId: 'EMP-0163',
          staff: {
            id: 163,
            code: 'EMP-0163',
            name: 'Aleks Reymer',
            title: 'Mr.',
            jobTitle: 'Commercial Manager',
            email: 'Aleks@sams.aero',
            startDate: '2026-05-19',
          },
          airlineStatuses: [
            {
              airlineId: 2,
              airlineCode: 'KZR',
              status: 'NAP',
              airlineStatus: { id: 2, code: 'NAP', name: 'Not Approved' },
              airline: {
                id: 2,
                code: 'KZR',
                name: 'Air Astana',
                colorForeground: '#ffffff',
                colorBackground: '#baa65e',
              },
              color: null,
              initialIssueDate: '2026-05-19T00:00:00',
              currentIssueDate: '2026-05-19T00:00:00',
              expiryDate: '2027-05-19T00:00:00',
              aircrafts: [
                { id: 6, aircraftTypeLicensId: 1, code: 'A319', name: 'A319' },
              ],
            },
          ],
        },
      ],
      page: 1,
      perPage: 20,
      total: 1,
      totalAll: 134,
      error: '',
    }
    axiosMock.post.mockResolvedValue({ data: response })

    await expect(getCustomerAuthList(request)).resolves.toEqual(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/authorization/customer-auth/listdata', request)
    expect(response.responseData[0].airlineStatuses[0]).toMatchObject({
      currentIssueDate: '2026-05-19T00:00:00',
      expiryDate: '2027-05-19T00:00:00',
    })
  })

  it('maps record IDs from /list to the matching staff and airline matrix cells', async () => {
    const request = { searchKeyword: '', status: null, airlineId: null }
    const records = [
      { authorizationCustomerId: 2, staffId: 163, airlineId: 3 },
      { authorizationCustomerId: 1, staffId: 163, airlineId: 8 },
    ]
    const response = {
      message: 'success',
      responseData: records.map(authorizationCustomer => ({ authorizationCustomer })),
      error: '',
    }
    axiosMock.post.mockResolvedValue({ data: response })

    await expect(getCustomerAuthRecords(request)).resolves.toEqual(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/authorization/customer-auth/list', request)

    const recordIds = buildCustomerAuthRecordIdMap(records)
    expect(recordIds.get(getCustomerAuthCellKey(163, 3))).toBe(2)
    expect(recordIds.get(getCustomerAuthCellKey(163, 8))).toBe(1)
    expect(recordIds.get(getCustomerAuthCellKey(163, 48))).toBeUndefined()
  })

  it('paginates defensively when /listdata returns more than the requested perPage', () => {
    const records = Array.from({ length: 134 }, (_, index) => index + 1)

    expect(getCustomerAuthPageItems(records, 1, 20)).toEqual(records.slice(0, 20))
    expect(getCustomerAuthPageItems(records, 2, 20)).toEqual(records.slice(20, 40))
    expect(getCustomerAuthPageItems(records.slice(20, 40), 2, 20)).toEqual(records.slice(20, 40))
  })

  it('uses the /list record status when /listdata has dates but an empty status', () => {
    expect(resolveCustomerAuthCell({
      status: '',
      initialIssueDate: '2026-05-18T00:00:00',
      currentIssueDate: '2026-07-19T00:00:00',
      expiryDate: '2026-07-19T00:00:00',
      aircrafts: [{ code: 'A319', name: 'A319' }],
    }, {
      authorizationCustomerId: 2,
      staffId: 163,
      airlineId: 48,
      authorizationStatus: { code: 'VAL' },
      initialIssueDate: '2026-05-19T00:00:00',
      currentIssueDate: '2026-07-01T00:00:00',
    })).toEqual({
      status: 'VAL',
      initialIssueDate: '2026-05-19T00:00:00',
      currentIssueDate: '2026-07-01T00:00:00',
      expiryDate: '',
    })
  })

  it('uses /list aircraft IDs with master labels instead of conflicting /listdata labels', () => {
    expect(resolveCustomerAuthAircrafts(
      [{ code: 'A319', name: 'A319' }],
      [{ id: 46, aircraftTypeLicensId: 1, isdelete: false }],
      [{ id: 1, code: 'B737-600/700/800/900', name: 'B737-600/700/800/900' }],
    )).toEqual([{
      id: 46,
      aircraftTypeLicensId: 1,
      code: 'B737-600/700/800/900',
      name: 'B737-600/700/800/900',
    }])
  })

  it('does not hide dates when an inconsistent API cell is still pending', () => {
    expect(shouldShowCustomerAuthDates('pending', {
      currentIssueDate: '2026-07-19T00:00:00',
      expiryDate: '2026-07-19T00:00:00',
    })).toBe(true)
    expect(shouldShowCustomerAuthDates('pending', {
      currentIssueDate: '',
      expiryDate: '',
    })).toBe(false)
  })

  it('treats authorization dates as calendar dates without UTC conversion', () => {
    const bangkokMidnight = '2026-07-20T00:00:00+07:00'

    expect(getCustomerAuthDateValue(bangkokMidnight)).toBe('2026-07-20')
    expect(formatCustomerAuthDate(bangkokMidnight)).toBe('20/07/26')
    expect(formatCustomerAuthDate('2026-07-20T00:00:00Z')).toBe('20/07/26')
  })

  it('posts the upsert payload with authorizationStatusId', async () => {
    const request = {
      id: 1,
      staffId: 163,
      airlineId: 48,
      authorizationStatusId: 1,
      initialIssueDate: '2026-05-19',
      currentIssueDate: '2026-05-19',
      expiryDate: '2027-05-19',
      aircraftTypeIds: [1, 2],
    }
    const response = {
      message: 'success',
      responseData: 'Saved successfully.',
      error: '',
    }
    axiosMock.post.mockResolvedValue({ data: response })

    await expect(updateCustomerAuth(request)).resolves.toEqual(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/authorization/customer-auth/upsert', request)
    expect(request).not.toHaveProperty('staffAuthorizationAirlineStatusId')
  })

  it('maps every API status and exposes aircraft labels for a valid matrix cell', () => {
    expect(mapCustomerAuthStatus('VAL')).toBe('valid')
    expect(mapCustomerAuthStatus('NAP')).toBe('not_approve')
    expect(mapCustomerAuthStatus('NCP')).toBe('not_complete')
    expect(mapCustomerAuthStatus('SUS')).toBe('suspended')
    expect(mapCustomerAuthStatus('PEN')).toBe('pending')
    expect(mapCustomerAuthStatus('')).toBe('pending')

    expect(getCustomerAuthCellData({
      status: 'VAL',
      aircrafts: [
        { code: 'A319', name: 'A319' },
        { code: 'A19N', name: 'A19N' },
      ],
    })).toEqual({
      status: 'valid',
      aircraftLabels: ['A319', 'A19N'],
      initialIssueDate: '',
      currentIssueDate: '',
      expiryDate: '',
    })
  })

  it('exposes airline-specific dates used by the matrix and tooltip', () => {
    expect(getCustomerAuthCellData({
      status: 'VAL',
      initialIssueDate: '2026-07-01T00:00:00',
      currentIssueDate: '2026-07-19T00:00:00',
      expiryDate: '2027-07-19T00:00:00',
      aircrafts: [{ code: 'A319', name: 'A319' }],
    })).toMatchObject({
      initialIssueDate: '2026-07-01T00:00:00',
      currentIssueDate: '2026-07-19T00:00:00',
      expiryDate: '2027-07-19T00:00:00',
      aircraftLabels: ['A319'],
    })
  })
})
