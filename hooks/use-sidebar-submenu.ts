"use client";
import { useConfig } from "@/hooks/use-config";
import { getMenuList } from "@/lib/menus";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Hook to determine if the current page should show the sidebar submenu panel.
 * Checks both the config state AND whether the current pathname matches
 * a menu group that actually has submenus.
 */
export function useSidebarHasSubmenu(): boolean {
  const [config] = useConfig();
  const pathname = usePathname();
  const t = useTranslations("Menu");

  // If user explicitly toggled submenu off, respect that
  if (config.subMenu) return false;

  // If sidebar is not two-column, this hook is not relevant
  if (config.sidebar !== "two-column") return false;

  // Check if the current page belongs to a menu group with submenus
  const menuList = getMenuList(pathname, t);
  const activeKey = config.activeMenuGroup ?? pathname?.split("/")?.[2];
  const data = menuList.find((item) => item.id === activeKey);

  // Only show submenu panel if a matching group with submenus exists
  if (!data) return false;

  // Verify current page actually belongs to the matched group
  const currentPageBelongsToGroup = data.menus.some((menu) => {
    if (pathname?.includes(menu.href)) return true;
    return menu.submenus?.some((sub) => pathname?.includes(sub.href));
  });
  if (!currentPageBelongsToGroup) return false;

  const hasActualSubmenus = data.menus.some((menu) => menu.submenus.length > 0);
  return hasActualSubmenus;
}
