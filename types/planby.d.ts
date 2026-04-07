declare module 'planby' {
    import { FC, ReactNode } from 'react';

    // Channel type used in FlightChannel component
    export interface Channel {
        position: Record<string, unknown>;
        logo?: string;
        uuid: string;
        [key: string]: unknown;
    }

    // Program/EPG item type used in FlightProgram component
    export interface ProgramItem {
        program: {
            data: Record<string, unknown>;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }

    // Planby channel components
    export const ChannelBox: FC<Record<string, unknown>>;
    export const ChannelLogo: FC<Record<string, unknown>>;

    // Planby program components
    export const ProgramBox: FC<Record<string, unknown>>;
    export const ProgramContent: FC<Record<string, unknown>>;
    export const ProgramFlex: FC<Record<string, unknown>>;
    export const ProgramStack: FC<Record<string, unknown>>;
    export const ProgramTitle: FC<Record<string, unknown>>;
    export const ProgramText: FC<Record<string, unknown>>;

    // Planby timeline components
    export const TimelineWrapper: FC<Record<string, unknown>>;
    export const TimelineBox: FC<Record<string, unknown>>;
    export const TimelineTime: FC<Record<string, unknown>>;
    export const TimelineDivider: FC<Record<string, unknown>>;
    export const TimelineDividers: FC<Record<string, unknown>>;

    // Planby layout components
    export const Epg: FC<Record<string, unknown>>;
    export const Layout: FC<Record<string, unknown>>;

    // Planby hooks
    export function useEpg(config: Record<string, unknown>): {
        getEpgProps: () => Record<string, unknown>;
        getLayoutProps: () => Record<string, unknown>;
        onScrollToNow: () => void;
        onScrollLeft: (value?: number) => void;
        onScrollRight: (value?: number) => void;
        [key: string]: unknown;
    };
    export function useProgram(config: Record<string, unknown>): {
        styles: { width: number; position: Record<string, unknown> };
        formatTime: (time: string) => string;
        isLive: boolean;
        isMinWidth: boolean;
        [key: string]: unknown;
    };
    export function useTimeline(
        numberOfHoursInDay: number,
        isBaseTimeFormat: boolean
    ): {
        time: string[];
        dividers: string[];
        formatTime: (index: number) => string;
    };
}
