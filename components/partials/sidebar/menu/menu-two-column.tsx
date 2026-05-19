"use client";

import React from 'react'
import { usePathname } from "@/components/navigation";
import IconNav from './icon-nav';
import SidebarNav from './sideabr-nav';
import { useTranslations } from 'next-intl';
import { useFilteredMenuList } from '@/hooks/use-filtered-menu-list';


export function MenuTwoColumn() {
    // translate
    const t = useTranslations("Menu")
    const pathname = usePathname();
    const menuList = useFilteredMenuList(pathname, t);

    return (
        <>
            <IconNav menuList={menuList} />
            <SidebarNav menuList={menuList} />
        </>
    );
}
