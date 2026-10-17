import { redirect } from 'next/navigation';

export default function LegacyManpowerAnalysisRedirectPage({ params }: { params: { locale: string } }) {
    redirect(`/${params.locale}/roster/manpower/planning`);
}
