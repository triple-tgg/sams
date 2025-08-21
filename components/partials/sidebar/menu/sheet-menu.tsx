'use client'
import { Link } from '@/i18n/routing';
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetHeader,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { MenuClassic } from "./menu-classic";
import DashCodeLogo from "@/components/dascode-logo";
import { useMobileMenuConfig } from "@/hooks/use-mobile-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useConfig } from "@/hooks/use-config";
import Image from "next/image";

export function SheetMenu() {
    const [mobileMenuConfig, setMobileMenuConfig] = useMobileMenuConfig();
    const [config, setConfig] = useConfig()
    const { isOpen } = mobileMenuConfig;

    const isDesktop = useMediaQuery("(min-width: 1280px)");
    if (isDesktop) return null;
    return (
        <Sheet open={isOpen} onOpenChange={() => setMobileMenuConfig({ isOpen: !isOpen })}>
            <SheetTrigger className="xl:hidden" asChild>
                <Button className="h-8" variant="ghost" size="icon" onClick={() => setConfig({
                    ...config, collapsed: false,
                })} >

                    <Icon icon="heroicons:bars-3-bottom-right" className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
                <SheetHeader>
                    <Link href="/dashboard" className="flex gap-2 items-center     ">
                        {/* <DashCodeLogo className="  text-default-900 h-8 w-8 [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background" /> */}
                        <Image
                            src="/images/logo/logo.png"
                            alt="dashcode"
                            width={90}
                            height={48}
                            className="w-[60px] h-auto object-contain  [&>path:nth-child(3)]:text-background [&>path:nth-child(2)]:text-background"
                        />
                    </Link>
                    <div className='px-2'>
                        <h1 className="text-lg font-semibold text-default-900 ">
                            SAM Airline Maintainance
                        </h1>
                    </div>
                </SheetHeader>
                <MenuClassic />
            </SheetContent>
        </Sheet>
    );
}
