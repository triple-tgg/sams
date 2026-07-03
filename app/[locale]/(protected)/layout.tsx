import LayoutProvider from "@/providers/layout.provider";
import LayoutContentProvider from "@/providers/content.provider";
import DashCodeSidebar from "@/components/partials/sidebar";
import DashCodeFooter from "@/components/partials/footer";
import DashCodeHeader from "@/components/partials/header";
import PermissionGuard from "@/components/partials/auth/PermissionGuard";
import RoutePermissionGuard from "@/components/partials/auth/RoutePermissionGuard";

const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <LayoutProvider>
      <PermissionGuard>
        {/* <ThemeCustomize /> */}
        <DashCodeHeader />
        <DashCodeSidebar />
        <LayoutContentProvider>
          <RoutePermissionGuard>{children}</RoutePermissionGuard>
        </LayoutContentProvider>
        <DashCodeFooter />
      </PermissionGuard>
    </LayoutProvider>
  );
};

export default layout;
