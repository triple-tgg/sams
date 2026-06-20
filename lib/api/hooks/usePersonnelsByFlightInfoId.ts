import { useQuery } from '@tanstack/react-query'
import { getPersonnelsByFlightInfoId, FlightInfoPersonnelsResponse } from '../lineMaintenances/flight/getPersonnelsByFlightInfoId'

export const usePersonnelsByFlightInfoId = (flightInfosId: number | string | null | undefined) => {
  return useQuery<FlightInfoPersonnelsResponse, Error>({
    queryKey: ['personnelsByFlightInfoId', flightInfosId],
    queryFn: () => getPersonnelsByFlightInfoId(flightInfosId!),
    enabled: !!flightInfosId,
  })
}
