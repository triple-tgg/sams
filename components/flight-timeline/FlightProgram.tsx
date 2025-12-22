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
          bg-linear-to-r from-emerald-600 to-emerald-500
          ${isLive ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''}
          transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer
        `}
            >
                <ProgramContent
                    width={styles.width}
                    isLive={isLive}
                    className={`w-[98%] border !p-2`}
                >
                    <ProgramFlex>
                        <ProgramStack>
                            <ProgramTitle className="!text-[4px]  font-bold text-white !p-0">
                                {title}
                            </ProgramTitle>
                        </ProgramStack>
                    </ProgramFlex>
                </ProgramContent>
            </div>
        </ProgramBox>
    );
}
