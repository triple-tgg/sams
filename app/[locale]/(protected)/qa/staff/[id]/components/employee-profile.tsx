'use client';

import React, { useState } from 'react';
import { C, TabName } from './types';
import { STAFF_INFO, RATINGS, EMPLOYMENT, MATRIX, CATEGORIES, TRAINING_HIGHLIGHTS, LOGBOOK_ENTRIES, PENDING_LOGBOOK_ENTRIES, TABS } from './data';
import { HeroSection } from './HeroSection';
import { ProfileTab } from './ProfileTab';
import { TrainingMatrixTab } from './TrainingMatrixTab';
import { ExperienceTab } from './ExperienceTab';
import { LogbookTab } from './LogbookTab';

export default function EmployeeProfile() {
  const [tab, setTab] = useState<TabName>('Profile');

  // Compute compliance score for hero metrics
  const valid = MATRIX.filter(m => m.status === 'valid').length;
  const perm = MATRIX.filter(m => m.status === 'perm').length;
  const score = Math.round(((valid + perm) / MATRIX.length) * 100);

  const heroMetrics = [
    { l: 'Compliance', v: `${score}%`, c: '#4ade80' },
    { l: 'Tasks Done', v: '378', c: '#93c5fd' },
    { l: 'Ratings', v: '9', c: '#fde68a' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ── Hero Section ── */}
      <HeroSection
        initials={STAFF_INFO.initials}
        nameEn={STAFF_INFO.nameEn}
        nameTh={STAFF_INFO.nameTh}
        empNo={STAFF_INFO.empNo}
        tags={STAFF_INFO.tags}
        metrics={heroMetrics}
      />

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 20, background: '#fff', borderRadius: 10,
        padding: 4, border: `1px solid ${C.border}`, width: 'fit-content',
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 20px', borderRadius: 8, border: 'none', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
              background: tab === t ? `linear-gradient(135deg,${C.primary},${C.primary2})` : 'transparent',
              color: tab === t ? '#fff' : C.muted,
              boxShadow: tab === t ? `0 2px 8px ${C.primary}44` : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'Profile' && (
        <ProfileTab employment={EMPLOYMENT} ratings={RATINGS} />
      )}
      {tab === 'Training Matrix' && (
        <TrainingMatrixTab matrix={MATRIX} categories={CATEGORIES} />
      )}
      {tab === 'Experience' && (
        <ExperienceTab highlights={TRAINING_HIGHLIGHTS} />
      )}
      {tab === 'Logbook' && (
        <LogbookTab entries={LOGBOOK_ENTRIES} pendingEntries={PENDING_LOGBOOK_ENTRIES} />
      )}
    </div>
  );
}
