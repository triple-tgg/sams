'use client'

import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines'
import { useStationsOptions } from '@/lib/api/hooks/useStations'
import { useStatusOptions } from '@/lib/api/hooks/useStatus'
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes'

interface UseCreateThfModalControllerProps {
    flightInfosId: number | null
}

export const useCreateThfModalController = ({ flightInfosId }: UseCreateThfModalControllerProps) => {
    // Flight & THF Data
    const {
        isLoading: loadingFlight,
        error: flightError,
        formData: existingFlightData,
        flightData,
        aircraftData,
        lineMaintenanceData,
        equipmentData,
        data
    } = useLineMaintenancesQueryThfByFlightId({ flightInfosId })

    // Airlines Options
    const {
        options: customerOptions,
        isLoading: loadingAirlines,
        error: airlinesError,
        usingFallback: airlinesUsingFallback
    } = useAirlineOptions()

    // Station Options
    const {
        options: stationOptions,
        isLoading: loadingStations,
        error: stationsError,
        usingFallback: stationsUsingFallback
    } = useStationsOptions()

    // Aircraft Types
    const {
        options: aircraftOptions,
        isLoading: isLoadingAircraft,
        usingFallback: acTypeCodeUsingFallback,
        error: acTypeCodeError
    } = useAircraftTypes()

    // Status Options
    const {
        options: statusOptions,
        isLoading: loadingStatus,
        error: statusError,
        usingFallback: statusUsingFallback
    } = useStatusOptions()

    const isLoadingConfig = loadingStatus || isLoadingAircraft || loadingStations || loadingAirlines

    return {
        flightDataState: {
            loading: loadingFlight,
            error: flightError,
            data: existingFlightData,
            rawFlightData: flightData,
            lineMaintenanceData, // Needed for ID and Number
            equipmentData,
            fullData: data
        },
        options: {
            customers: {
                data: customerOptions || [],
                loading: loadingAirlines,
                error: airlinesError,
                isFallback: !!airlinesUsingFallback
            },
            stations: {
                data: stationOptions || [],
                loading: loadingStations,
                error: stationsError,
                isFallback: !!stationsUsingFallback
            },
            aircraft: {
                data: aircraftOptions || [],
                loading: isLoadingAircraft,
                error: acTypeCodeError,
                isFallback: !!acTypeCodeUsingFallback
            },
            status: {
                data: statusOptions || [],
                loading: loadingStatus,
                error: statusError,
                isFallback: !!statusUsingFallback
            }
        },
        isLoadingConfig
    }
}
