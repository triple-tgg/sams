'use client';

import {
    TimelineWrapper,
    TimelineBox,
    TimelineTime,
    TimelineDivider,
    TimelineDividers,
    useTimeline,
} from "planby";

interface TimelineProps {
    isBaseTimeFormat: boolean;
    isSidebar: boolean;
    dayWidth: number;
    hourWidth: number;
    numberOfHoursInDay: number;
    offsetStartHoursRange: number;
    sidebarWidth: number;
}

export function FlightTimeline({
    isBaseTimeFormat,
    isSidebar,
    dayWidth,
    hourWidth,
    numberOfHoursInDay,
    offsetStartHoursRange,
    sidebarWidth,
}: TimelineProps) {
    const { time, dividers, formatTime } = useTimeline(
        numberOfHoursInDay,
        isBaseTimeFormat
    );

    const renderDividers = () =>
        dividers.map((_, index: number) => (
            <TimelineDivider key={index} width={hourWidth} />
        ));

    const renderTime = (index: number) => (
        <TimelineBox key={index} width={hourWidth} >
            <TimelineTime>
                {formatTime(index + offsetStartHoursRange).toLowerCase()}
            </TimelineTime>
            <TimelineDividers >{renderDividers()}</TimelineDividers>
        </TimelineBox>
    );

    return (
        <TimelineWrapper
            dayWidth={dayWidth}
            sidebarWidth={sidebarWidth}
            isSidebar={isSidebar}

        >
            {time.map((_, index: number) => renderTime(index))}
        </TimelineWrapper>
    );
}
