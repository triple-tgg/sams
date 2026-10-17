import { redirect } from 'next/navigation';

export default function ManpowerRedirectPage({ params }: { params: { locale: string } }) {
    redirect(`/${params.locale}/roster/manpower/planning`);
}
