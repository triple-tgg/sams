import PermissionGuard from "@/components/partials/auth/PermissionGuard";
import RoutePermissionGuard from "@/components/partials/auth/RoutePermissionGuard";

/**
 * Minimal protected layout — authentication + permission checks only.
 * No sidebar, no header, no footer.
 * Used for full-screen pages like Flight Timeline that open in a new tab.
 */
const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <PermissionGuard>
      <RoutePermissionGuard>{children}</RoutePermissionGuard>
    </PermissionGuard>
  );
};

export default layout;
