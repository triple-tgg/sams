import React from 'react';
import { C } from './types';

interface SignOffProps {
    name: string;
    title: string;
    date: string;
}

export function SignOff({ name, title, date }: SignOffProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '14px 20px', minWidth: 220, boxShadow: '0 2px 8px rgba(0,0,0,.04)',
            }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, fontFamily: 'inherit', marginBottom: 8 }}>
                    CERTIFIED BY
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{title}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.primary, marginTop: 6 }}>{date}</div>
            </div>
        </div>
    );
}
