'use client';

import { ChannelBox, ChannelLogo, Channel } from 'planby';
import { AirlineChannel } from './types';

interface FlightChannelProps {
    channel: Channel & AirlineChannel;
}

export function FlightChannel({ channel }: FlightChannelProps) {
    const { position, logo, airlineCode, name } = channel;

    return (
        <ChannelBox {...position}>
            <div
                className="flex h-full w-full items-center gap-3 px-3 py-2 bg-slate-800 border-b border-slate-700"
            >
                {/* Airline Logo */}
                <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
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
                        <span className="text-xs font-bold text-white/60">
                            {airlineCode?.slice(0, 2)}
                        </span>
                    )}
                </div>

                {/* Airline Info */}
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate">
                        {airlineCode}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                        {name || 'Airline'}
                    </span>
                </div>
            </div>
        </ChannelBox>
    );
}
