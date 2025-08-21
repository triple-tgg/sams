import React from "react";
import { redirect } from '@/components/navigation'

const page = () => {
  redirect({ href: '/dashboard', locale: 'en' })
  return null
  // return <h1 className=" text-2xl"> Your Content goes here... </h1>;
};
export default page;
