// Types for FlightTimeline with Planby Pro

export interface FlightEpgItem {
    channelUuid: string;
    id: string;
    title: string;
    since: string;
    till: string;
    image?: string;
    // flightType: 'arrival' | 'departure';
    acReg: string;
    bayNo: string;
    status: string;
    flightNo: string;
    arrivalStatime: string;
    departureStdTime: string;
    arrivalDate: string;
    departureDate: string;
    departureFlightNo: string;
    arrivalFlightNo: string;
    color: {
        background: string;
        foreground: string;
    }
    // scheduledTime: string;
    // actualTime: string;
}

export interface AirlineChannel {
    uuid: string;
    logo: string;
    name: string;
    airlineCode: string;
}
export interface AirlineChannelPlanby {
    uuid: string;
    // logo: string;
    // name: string;
    // airlineCode: string;
}

// Planby theme configuration
export const flightTimelineThemeDark = {
    primary: {
        600: '#1e293b', // slate-800
        900: '#0f172a', // slate-900
    },
    grey: {
        300: '#cbd5e1', // slate-300
    },
    white: '#ffffff',
    green: {
        300: '#22c55e', // green-500 for departures
    },
    loader: {
        teal: '#0ea5e9',
        purple: '#6366f1',
        pink: '#ec4899',
        bg: '#0f172adb',
    },
    scrollbar: {
        border: '#334155',
        thumb: {
            bg: '#475569',
        },
    },
    gradient: {
        blue: {
            300: '#0ea5e9',
            600: '#0284c7',
            900: '#0c4a6e',
        },
    },
    text: {
        grey: {
            300: '#94a3b8',
            500: '#64748b',
        },
    },
    timeline: {
        divider: {
            bg: '#334155',
        },
    },
};
export const flightTimelineThemeLight = {
    primary: {
        600: '#f8fafc', // Light gray background (slate-50)
        900: '#ffffff', // White background
    },
    grey: {
        300: '#334155', // Dark text (slate-700)
    },
    white: '#1e293b', // Dark text for contrast (slate-800)
    green: {
        300: '#22c55e', // green-500 for departures
    },
    loader: {
        teal: '#0ea5e9',
        purple: '#6366f1',
        pink: '#ec4899',
        bg: '#ffffffdb', // Light loader background
    },
    scrollbar: {
        border: '#e2e8f0', // Light border (slate-200)
        thumb: {
            bg: '#cbd5e1', // Light thumb (slate-300)
        },
    },
    gradient: {
        blue: {
            300: '#60a5fa', // blue-400
            600: '#3b82f6', // blue-500
            900: '#1d4ed8', // blue-700
        },
        live: {
            300: '#E4F3FF', // blue-400
            600: '#a2ccfd', // blue-500
            900: '#81B9FC', // blue-700
        }
    },
    text: {
        grey: {
            300: '#475569', // slate-600 (darker for light bg)
            500: '#334155', // slate-700
        },
    },
    timeline: {
        divider: {
            bg: '#e2e8f0', // Light divider (slate-200)
        },
    },
};
