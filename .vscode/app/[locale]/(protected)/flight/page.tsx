
import { redirect } from '@/components/navigation'

const ProjectPage = () => {
  redirect({ href: '/flight/list', locale: 'en' })
  return null
}

export default ProjectPage