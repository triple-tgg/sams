import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SAMs Airline",
  description: "SAMs Airline Maintainance",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
