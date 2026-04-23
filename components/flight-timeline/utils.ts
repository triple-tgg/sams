// Utility functions for transforming flight data to Planby format
import dayjs from 'dayjs';
import '@/lib/dayjs'; // ensure utc plugin is registered
import { splitUtcDateTimeToLocal } from '@/lib/utils/flightDatetime';
import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { FlightEpgItem, AirlineChannel, AirlineChannelPlanby } from './types';
import { FlightPlanbyItem } from '@/lib/api/flight/getFlightListPlanby';

/**
 * Sanitize flight planby items: fix cases where till <= since
 * (e.g. when departure date is invalid or in the past).
 * Planby silently skips items where till < since.
 */
export function sanitizeFlightsPlanby(flights: FlightPlanbyItem[]): FlightPlanbyItem[] {
    return flights.map(flight => {
        const since = dayjs(flight.since);
        const till = dayjs(flight.till);

        if (till.isBefore(since) || till.isSame(since)) {
            // Fix: set till to since + 1 hour
            const fixedTill = since.add(1, 'hour');
            return { ...flight, till: fixedTill.toISOString() };
        }
        return flight;
    });
}


/**
 * Transform FlightItem array to Planby EPG format
 * Each flight creates both an arrival and departure EPG item
 */
export function transformFlightsToEpg(flights: FlightItem[]): FlightEpgItem[] {
    console.log("transformFlightsToEpg", flights);
    // Debug: Check scheduledTime related fields
    flights.forEach((f, i) => {
        console.log(`Flight ${i}:`, {
            arrivalFlightNo: f.arrivalFlightNo,
            arrivalStaDate: f.arrivalStaDate,
            departureFlightNo: f.departureFlightNo,
            departureStdDate: f.departureStdDate,
        });
    });
    const epgItems: FlightEpgItem[] = [];

    flights.forEach((flight: FlightItem, index: number) => {
        // Create arrival EPG item if arrival flight number exists
        if (flight.arrivalFlightNo && flight.arrivalStaDate) {
            // arrivalSince: use arrivalStaDate (UTC datetime)
            const arrivalSince = utcDatetimeToIso(flight.arrivalStaDate);
            // arrivalTill: use departureStdDate or default 60 min
            const hasValidDeparture = flight.departureStdDate && !flight.departureStdDate.endsWith('00:00');
            const arrivalTill = hasValidDeparture
                ? utcDatetimeToIso(flight.departureStdDate!)
                : addMinutes(arrivalSince, 60);

            const arrivalLocal = splitUtcDateTimeToLocal(flight.arrivalStaDate);
            const departureLocal = splitUtcDateTimeToLocal(flight.departureStdDate);

            epgItems.push({
                channelUuid: flight?.airlineObj?.code || "unknown",
                id: `${flight.flightInfosId}-arrival`,
                title: flight.arrivalFlightNo,
                since: arrivalSince,
                till: arrivalTill,
                acReg: flight.acReg,
                bayNo: flight.bayNo,
                status: flight.statusObj?.code ?? '',
                flightNo: flight.arrivalFlightNo,
                arrivalDate: arrivalLocal.date,
                departureDate: departureLocal.date,
                arrivalStatime: arrivalLocal.time,
                departureStdTime: departureLocal.time,
                departureFlightNo: flight.departureFlightNo ?? '',
                arrivalFlightNo: flight.arrivalFlightNo ?? '',
                color: {
                    background: '#3b82f6',
                    foreground: '#ffffff',
                },
            });
        }
        // // Create arrival EPG item if arrival flight number exists
        // if (flight.arrivalFlightNo && flight.arrivalDate) {
        //     const arrivalSince = combineDateAndTime(flight.arrivalDate, flight.arrivalStatime);
        //     // Arrival duration: from STA to ATA, or default 1 hour if ATA not available or is "00:00"
        //     const hasValidAta = flight.arrivalAtaTime && flight.arrivalAtaTime !== '00:00' && flight.arrivalAtaTime !== '00:00:00';
        //     const arrivalTill = hasValidAta
        //         ? combineDateAndTime(flight.arrivalDate, flight.arrivalAtaTime)
        //         : addMinutes(arrivalSince, 60);

        //     epgItems.push({
        //         channelUuid: flight?.airlineObj?.code || "unknown",
        //         id: `${flight.flightInfosId}-arrival`,
        //         title: flight.arrivalFlightNo,
        //         since: arrivalSince,
        //         till: arrivalTill,
        //         flightType: 'arrival',
        //         acReg: flight.acReg,
        //         bayNo: flight.bayNo,
        //         status: flight.statusObj?.code,
        //         flightNo: flight.arrivalFlightNo,
        //         scheduledTime: flight.arrivalStatime,
        //         actualTime: flight.arrivalAtaTime,
        //     });
        // }

        // // Create departure EPG item if departure flight number exists
        // if (flight.departureFlightNo && flight.departureDate) {
        //     const departureSince = combineDateAndTime(flight.departureDate, flight.departureStdTime);
        //     // Departure duration: from STD to ATD, or default 1 hour if ATD not available or is "00:00"
        //     const hasValidAtd = flight.departureAtdtime && flight.departureAtdtime !== '00:00' && flight.departureAtdtime !== '00:00:00';
        //     const departureTill = hasValidAtd
        //         ? combineDateAndTime(flight.departureDate, flight.departureAtdtime)
        //         : addMinutes(departureSince, 60);

        //     epgItems.push({
        //         channelUuid: flight?.airlineObj?.code || "unknown",
        //         id: `${flight.flightInfosId}-departure`,
        //         title: flight.departureFlightNo,
        //         since: departureSince,
        //         till: departureTill,
        //         flightType: 'departure',
        //         acReg: flight.acReg,
        //         bayNo: flight.bayNo,
        //         status: flight.statusObj?.code,
        //         flightNo: flight.departureFlightNo,
        //         scheduledTime: flight.departureStdTime ?? '',
        //         actualTime: flight.departureAtdtime ?? '',
        //     });
        // }
    });
    console.log("epgItems", epgItems);
    return epgItems;
}

/**
 * Extract unique airlines from flights and transform to Planby Channels format
 */
export function transformAirlinesToChannels(flights: FlightItem[]): AirlineChannel[] {
    const uniqueAirlines = new Map<string, AirlineChannel>();

    flights.forEach((flight, index) => {
        const airlineCode = flight?.airlineObj?.code ?? "unknown";
        if (!uniqueAirlines.has(airlineCode)) {
            uniqueAirlines.set(airlineCode, {
                uuid: airlineCode,
                logo: getAirlineLogo(airlineCode),
                name: flight?.airlineObj?.name ?? '',
                airlineCode: airlineCode,
            });
        }
    });
    return Array.from(uniqueAirlines.values());
}
export function transformAirlinesToChannelsPlanby(flights: FlightPlanbyItem[]): AirlineChannelPlanby[] {
    const uniqueChannels = new Map<string, AirlineChannelPlanby>();

    flights.forEach((flight) => {
        const channelId = flight?.channelUuid ?? "unknown";

        // Group by channelUuid - only add if not already in the map
        if (!uniqueChannels.has(channelId)) {
            uniqueChannels.set(channelId, {
                uuid: channelId,
            });
        }
    });

    // Sort channels by uuid for consistent ordering
    const sortedChannels = Array.from(uniqueChannels.values()).sort((a, b) =>
        a.uuid.localeCompare(b.uuid, undefined, { numeric: true })
    );

    return sortedChannels;
}

/**
 * Get airline logo URL based on airline code
 */
function getAirlineLogo(airlineCode: string): string {
    // You can replace this with actual airline logo URLs or a CDN
    return `https://content.airhex.com/content/logos/airlines_${airlineCode}_50_50_s.png`;
}

/**
 * Convert UTC datetime string "YYYY-MM-DD HH:mm" to ISO string
 */
function utcDatetimeToIso(utcDatetime: string): string {
    if (!utcDatetime) return dayjs().toISOString();
    const d = dayjs.utc(utcDatetime);
    return d.isValid() ? d.toISOString() : dayjs().toISOString();
}

/**
 * Combine date and time strings into ISO datetime format
 * Uses local timezone for display — date/time from API are date-only strings
 */
function combineDateAndTime(dateStr: string, timeStr: string | null): string {
    if (!dateStr) return dayjs().toISOString();
    if (!timeStr) timeStr = '00:00:00';

    const [hours, minutes, seconds = '00'] = timeStr.split(':');

    // Parse the date string locally, then set time components
    const dateOnly = dateStr.split('T')[0]; // Handle both ISO and plain date strings
    const combined = dayjs(`${dateOnly} ${hours}:${minutes}:${seconds}`);

    return combined.toISOString();
}

/**
 * Add minutes to a datetime string
 */
function addMinutes(isoString: string, minutes: number): string {
    return dayjs(isoString).add(minutes, 'minute').toISOString();
}

/**
 * Get today's date range for timeline (in user's local timezone)
 */
export function getTodayDateRange(): { startDate: string; endDate: string } {
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');

    return {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
    };
}

/**
 * Format date to YYYY-MM-DD for API calls
 * Uses user's local timezone — date user sees = date sent to API
 */
export function formatDateForApi(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD');
}

