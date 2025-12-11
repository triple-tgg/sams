// Utility functions for transforming flight data to Planby format
import dayjs from 'dayjs';
import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { FlightEpgItem, AirlineChannel } from './types';
import { unknown } from 'zod';

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
            arrivalStatime: f.arrivalStatime,
            departureFlightNo: f.departureFlightNo,
            departureStdTime: f.departureStdTime,
        });
    });
    const epgItems: FlightEpgItem[] = [];

    flights.forEach((flight: FlightItem, index: number) => {
        // Create arrival EPG item if arrival flight number exists
        if (flight.arrivalFlightNo && flight.arrivalDate) {
            const arrivalSince = combineDateAndTime(flight.arrivalDate, flight.arrivalStatime);
            // Arrival duration: from STA to ATA, or default 1 hour if ATA not available or is "00:00"
            const hasValidAta = flight.arrivalAtaTime && flight.arrivalAtaTime !== '00:00' && flight.arrivalAtaTime !== '00:00:00';
            const arrivalTill = hasValidAta
                ? combineDateAndTime(flight.arrivalDate, flight.arrivalAtaTime)
                : addMinutes(arrivalSince, 60);

            epgItems.push({
                channelUuid: flight?.airlineObj?.code || "unknown",
                id: `${flight.flightInfosId}-arrival`,
                title: flight.arrivalFlightNo,
                since: arrivalSince,
                till: arrivalTill,
                flightType: 'arrival',
                acReg: flight.acReg,
                bayNo: flight.bayNo,
                status: flight.statusObj?.code,
                flightNo: flight.arrivalFlightNo,
                scheduledTime: flight.arrivalStatime,
                actualTime: flight.arrivalAtaTime,
            });
        }

        // Create departure EPG item if departure flight number exists
        if (flight.departureFlightNo && flight.departureDate) {
            const departureSince = combineDateAndTime(flight.departureDate, flight.departureStdTime);
            // Departure duration: from STD to ATD, or default 1 hour if ATD not available or is "00:00"
            const hasValidAtd = flight.departureAtdtime && flight.departureAtdtime !== '00:00' && flight.departureAtdtime !== '00:00:00';
            const departureTill = hasValidAtd
                ? combineDateAndTime(flight.departureDate, flight.departureAtdtime)
                : addMinutes(departureSince, 60);

            epgItems.push({
                channelUuid: flight?.airlineObj?.code || "unknown",
                id: `${flight.flightInfosId}-departure`,
                title: flight.departureFlightNo,
                since: departureSince,
                till: departureTill,
                flightType: 'departure',
                acReg: flight.acReg,
                bayNo: flight.bayNo,
                status: flight.statusObj?.code,
                flightNo: flight.departureFlightNo,
                scheduledTime: flight.departureStdTime ?? '',
                actualTime: flight.departureAtdtime ?? '',
            });
        }
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
        if (!uniqueAirlines.has(flight?.airlineObj?.code)) {
            uniqueAirlines.set(flight?.airlineObj?.code, {
                uuid: flight?.airlineObj?.code || "unknown",
                logo: getAirlineLogo(flight?.airlineObj?.code),
                name: flight?.airlineObj?.name,
                airlineCode: flight?.airlineObj?.code || "unknown",
            });
        }
    });
    return Array.from(uniqueAirlines.values());
}

/**
 * Get airline logo URL based on airline code
 */
function getAirlineLogo(airlineCode: string): string {
    // You can replace this with actual airline logo URLs or a CDN
    return `https://content.airhex.com/content/logos/airlines_${airlineCode}_50_50_s.png`;
}

/**
 * Combine date and time strings into ISO datetime format
 */
function combineDateAndTime(dateStr: string, timeStr: string | null): string {
    if (!dateStr) return new Date().toISOString();
    if (!timeStr) timeStr = '00:00:00';

    // Handle different date formats
    const date = new Date(dateStr);
    const [hours, minutes, seconds = '00'] = timeStr.split(':');

    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));

    return date.toISOString();
}

/**
 * Add minutes to a datetime string
 */
function addMinutes(isoString: string, minutes: number): string {
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}

/**
 * Get today's date range for timeline
 */
export function getTodayDateRange(): { startDate: string; endDate: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
    };
}

/**
 * Format date to YYYY-MM-DD for API calls
 */
export function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}
