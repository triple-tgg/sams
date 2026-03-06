
import { redirect } from '@/components/navigation'

const HrPage = () => {
    redirect({ href: '/training/dashboard', locale: 'en' })
    return null
}

export default HrPage
