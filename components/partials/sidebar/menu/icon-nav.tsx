"use client";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Group } from "@/lib/menus";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useConfig } from "@/hooks/use-config";
import ThemeSwitcher from "@/components/partials/header/theme-switcher";

interface IconNavProps {
  menuList: Group[];
}
const IconNav = ({ menuList }: IconNavProps) => {
  const [config, setConfig] = useConfig();
  const router = useRouter();

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-sidebar  border-r border-default-200 dark:border-secondary border-dashed w-[72px]",
        {
          [`dark theme-${config.sidebarColor}`]:
            config.sidebarColor !== "light",
        }
      )}
    >
      <div className="text-center py-4 pt-0">
        <Link href="/flight/list" className="flex justify-center gap-2 items-center  bg-blue-50  p-2 pb-0">
          <Image
            src="/images/logo/logo.png"
            alt="SAMS"
            width={48}
            height={48}
            className="w-[40px] h-auto object-contain"
          />
        </Link>
      </div>
      <ScrollArea className="[&>div>div[style]]:block! flex-1">
        <nav className="mt-8 h-full w-full ">
          <ul className=" h-full flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-2 ">
            {menuList?.map(({ groupLabel, menus, id: groupId }, index) => (
              <li key={index} className=" block w-full">
                {menus?.map(
                  ({ href, label, icon, active, id, submenus }, menuIndex) => (
                    <TooltipProvider disableHoverableContent key={menuIndex}>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          {submenus.length === 0 ? (
                            <Button
                              onClick={() =>
                                setConfig((prevConfig) => ({
                                  ...prevConfig,
                                  hasSubMenu: false,
                                  subMenu: true,
                                  activeMenuGroup: undefined,
                                }))
                              }
                              asChild
                              size="icon"
                              color="secondary"
                              variant={active ? "default" : "ghost"}
                              className={cn(
                                "h-12 w-12 mx-auto mb-2 hover:ring-1 hover:ring-offset-0 hover:ring-default-200 dark:hover:ring-menu-arrow-active  hover:bg-default-100 dark:hover:bg-secondary   ",
                                {
                                  "bg-default-100 dark:bg-secondary  hover:bg-default-200/80 dark:hover:bg-menu-arrow-active ring-1 ring-default-200 dark:ring-menu-arrow-active":
                                    active,
                                }
                              )}
                            >
                              <Link href={href}>
                                <Icon
                                  icon={icon}
                                  className=" w-6 h-6 text-default-500 dark:text-secondary-foreground "
                                />
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                setConfig((prevConfig) => ({
                                  ...prevConfig,
                                  hasSubMenu: true,
                                  subMenu: false,
                                  activeMenuGroup: groupId,
                                }));
                                if (!active) {
                                  router.push(href);
                                }
                              }}
                              size="icon"
                              color="secondary"
                              variant={active ? "default" : "ghost"}
                              className={cn(
                                "h-12 w-12 mx-auto mb-2 hover:ring-1 hover:ring-offset-0 hover:ring-default-200 dark:hover:ring-menu-arrow-active  hover:bg-default-100 dark:hover:bg-secondary cursor-pointer",
                                {
                                  "bg-default-100 dark:bg-secondary  hover:bg-default-200/80 dark:hover:bg-menu-arrow-active ring-1 ring-default-200 dark:ring-menu-arrow-active":
                                    active,
                                }
                              )}
                            >
                              <Icon
                                icon={icon}
                                className=" w-6 h-6 text-default-500 dark:text-secondary-foreground "
                              />
                            </Button>
                          )}
                        </TooltipTrigger>

                        <TooltipContent side="right">{label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                )}
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>
      {/* <div className="mt-auto flex justify-center pb-4 pt-2 border-t border-default-200 dark:border-default-800">
        <ThemeSwitcher />
      </div> */}
    </div>
  );
};

export default IconNav;
