'use client'

import { useParams } from 'next/navigation'
import { StaffProfileView } from './components/StaffProfileView'

export default function StaffProfilePage() {
    const params = useParams()
    return <StaffProfileView staffId={Number(params.id)} />
}
