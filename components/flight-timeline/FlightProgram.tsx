'use client';

import {
    ProgramBox,
    ProgramContent,
    ProgramFlex,
    ProgramStack,
    ProgramTitle,
    ProgramText,
    useProgram,
    ProgramItem,
} from 'planby';
import { FlightEpgItem } from './types';

interface FlightProgramProps extends Omit<ProgramItem, 'program'> {
    program: ProgramItem['program'] & {
        data: FlightEpgItem;
    };
}

export function FlightProgram({ program, ...rest }: FlightProgramProps) {
    const { styles, formatTime, isLive, isMinWidth } = useProgram({
        program,
        ...rest,
    });

    const { data } = program;
    const { title, since, till, flightType, acReg, bayNo, status, scheduledTime, actualTime } = data;

    const sinceTime = formatTime(since);
    const tillTime = formatTime(till);

    console.log("program data", data);
    // Different colors for arrival (blue) and departure (green)
    const isArrival = flightType === 'arrival';

    return (
        <ProgramBox
            width={styles.width}
            style={styles.position}
        >
            <div
                className={`
          relative flex h-full w-full overflow-hidden rounded-lg
          ${isArrival
                        ? 'bg-linear-to-r from-sky-600 to-sky-500'
                        : 'bg-linear-to-r from-emerald-600 to-emerald-500'
                    }
          ${isLive ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''}
          transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer
        `}
            >
                <ProgramContent
                    width={styles.width}
                    isLive={isLive}
                >
                    <ProgramFlex>
                        <ProgramStack>
                            {/* Flight Type Badge */}
                            <div className="flex items-center gap-2">
                                <span className={`
                  inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase
                  ${isArrival ? 'bg-sky-800 text-sky-100' : 'bg-emerald-800 text-emerald-100'}
                `}>
                                    {isArrival ? 'ARR' : 'DEP'}
                                </span>
                                <ProgramTitle className="text-sm font-bold text-white">
                                    {title}
                                </ProgramTitle>
                            </div>

                            {/* Time and Details */}
                            {isMinWidth && (
                                <div className="mt-1 space-y-0.5">
                                    <ProgramText className="text-xs text-white/80">
                                        {sinceTime} - {tillTime}
                                    </ProgramText>
                                    {scheduledTime && (
                                        <ProgramText className="text-xl text-white/70">
                                            ⏰ STD/STA: {scheduledTime}
                                            {actualTime && ` → ATD/ATA: ${actualTime}`}
                                        </ProgramText>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-white/70">
                                        {acReg && <span>✈ {acReg}</span>}
                                        {bayNo && <span>📍 Bay {bayNo}</span>}
                                        {status && (
                                            <span className={`
                        rounded px-1 py-0.5
                        ${status === 'ACTIVE' ? 'bg-green-700' : ''}
                        ${status === 'DELAYED' ? 'bg-amber-600' : ''}
                        ${status === 'CANCELLED' ? 'bg-red-700' : ''}
                      `}>
                                                {status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </ProgramStack>
                    </ProgramFlex>
                </ProgramContent>
            </div>
        </ProgramBox>
    );
}
