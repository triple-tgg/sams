import { redirect } from '@/components/navigation'

const QaPage = () => {
    redirect({ href: '/qa/monitoring', locale: 'en' })
    return null
}

export default QaPage
