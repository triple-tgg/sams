// Types for FlightTimeline with Planby Pro

export interface FlightEpgItem {
    channelUuid: string;
    id: string;
    title: string;
    since: string;
    till: string;
    image?: string;
    flightType: 'arrival' | 'departure';
    acReg: string;
    bayNo: string;
    status: string;
    flightNo: string;
    scheduledTime: string;
    actualTime: string;
}

export interface AirlineChannel {
    uuid: string;
    logo: string;
    name: string;
    airlineCode: string;
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
        600: '#B9D8E3', // slate-800
        900: '#E5F2F5', // slate-900
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
