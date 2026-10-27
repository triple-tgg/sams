'use client';

import CertifyingStaffView from '../certifying-staff/CertifyingStaffView';

/** Roster > Mech Staff — AMEL matrix only (no Aircraft Licence tab). */
export default function MechStaffPage() {
    return <CertifyingStaffView variant="mech" />;
}
