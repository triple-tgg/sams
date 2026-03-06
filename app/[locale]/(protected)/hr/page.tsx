import { redirect } from '@/components/navigation'

const HrPage = () => {
    redirect({ href: '/hr/dashboard', locale: 'en' })
    return null
}

export default HrPage
