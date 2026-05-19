import { redirect } from "next/navigation";

// Redirect old /master-data/set-permission to unified Role & Permission page
export default function SetPermissionPage() {
    redirect("/master-data/role");
}
