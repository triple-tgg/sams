import { redirect } from '@/components/navigation'

const RosterPage = () => {
    redirect({ href: '/roster/flight-roster', locale: 'en' })
    return null
}

export default RosterPage
