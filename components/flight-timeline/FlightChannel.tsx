'use client';

import { ChannelBox, ChannelLogo, Channel } from 'planby';
import { AirlineChannel } from './types';

interface FlightChannelProps {
    channel: Channel & AirlineChannel;
}

export function FlightChannel({ channel }: FlightChannelProps) {
    const { position, logo, airlineCode, name, uuid } = channel;

    return (
        <ChannelBox {...position}>
            {/* <div
                className="flex h-full w-full items-center gap-3 px-3 py-2 dark:bg-slate-800 bg-slate-100 border-b dark:border-slate-700 border-slate-300"
            > */}
            {/* Airline Logo */}
            {/* <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    {logo ? (
                        <ChannelLogo
                            src={logo}
                            alt={name || airlineCode}
                            className="h-8 w-8 object-contain"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <span className="text-xs font-bold dark:text-white/60 text-slate-900">
                            {airlineCode?.slice(0, 2)}
                        </span>
                    )}
                </div> */}

            {/* Airline Info */}
            {/* <div className="flex flex-col min-w-0"> */}
            {/* <span className="text-sm font-semibold dark:text-white text-slate-900 truncate"> */}
            {/* {airlineCode} */}
            {/* {uuid} */}
            {/* </span> */}
            {/* <span className="text-xs dark:text-slate-400 text-slate-900 truncate">
                        {name || 'Airline'}
                    </span> */}
            {/* </div> */}
            {/* </div> */}
        </ChannelBox>
    );
}
