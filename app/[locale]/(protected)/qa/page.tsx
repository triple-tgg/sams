import { redirect } from '@/components/navigation'

const QaPage = () => {
    redirect({ href: '/qa/training', locale: 'en' })
    return null
}

export default QaPage
