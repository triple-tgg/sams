import React from 'react';
import { C, FlowchartTabProps, FlowStep, FlowStepStatus } from './types';

interface StepStyle {
    bg: string;
    border: string;
    dot: string;
    color: string;
}

const STEP_STYLES: Record<FlowStepStatus, StepStyle> = {
    done: { bg: C.greenL, border: '#86efac', dot: C.green, color: C.green },
    action: { bg: C.redL, border: '#fca5a5', dot: C.red, color: C.red },
    pending: { bg: C.bg, border: C.border, dot: C.mutedL, color: C.muted },
};

export function FlowchartTab({ steps }: FlowchartTabProps) {
    return (
        <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.04)',
        }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Training Management Process Flow
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>
                Current status of Mr. Phaisal&apos;s training renewal process — Ref: SAMS-FM-CM-014 Rev.03
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                {steps.map((s: FlowStep, i: number) => {
                    const cc = STEP_STYLES[s.status];
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                padding: '10px 14px', background: cc.bg,
                                border: `1.5px solid ${cc.border}`, borderRadius: 10, minWidth: 130,
                            }}>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: cc.dot }} />
                                    <div style={{ fontSize: 8, fontWeight: 700, color: cc.color, letterSpacing: 0.5 }}>
                                        {s.status === 'action' ? 'ACTION REQ.' : s.status.toUpperCase()}
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{s.step}</div>
                                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.desc}</div>
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ fontSize: 16, color: C.primary3, fontWeight: 300 }}>→</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: 20, padding: '12px 16px', background: C.primary5,
                border: `1px solid ${C.primary4}`, borderRadius: 10, fontSize: 12, color: C.primary,
            }}>
                💡 Open the <strong>Training Flowchart</strong> component for the full interactive version
                with animated flow, clickable steps & linked training data.
            </div>
        </div>
    );
}
