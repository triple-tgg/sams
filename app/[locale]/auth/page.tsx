import React from 'react'
import { redirect } from 'next/navigation'
const page = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  redirect(`/${locale}/auth/login`)
}

export default page