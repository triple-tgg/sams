import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SAMS Engineering Maintenance System",
  description: "SAMS Engineering Maintenance System",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
