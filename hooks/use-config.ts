import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { layoutType, sidebarType, navBarType } from "@/lib/type";

export type Config = {
  collapsed: boolean;
  theme: string;
  skin: "default" | "bordered";
  layout: layoutType;
  sidebar: sidebarType;
  menuHidden: boolean;
  showSearchBar: boolean;
  showSwitcher: boolean;
  topHeader: "default" | "links";
  contentWidth: "wide" | "boxed";
  navbar: navBarType;
  footer: "sticky" | "default" | "hidden";
  isRtl: boolean;
  subMenu: boolean;
  hasSubMenu: boolean;
  activeMenuGroup?: string;
  sidebarColor: string;
  headerColor: string;
  sidebarBgImage?: string;
  radius: number;
};
export const defaultConfig: Config = {
  "collapsed": true,
  "theme": "zinc",
  "skin": "default",
  "layout": "vertical",
  "sidebar": "two-column",
  "menuHidden": false,
  "showSearchBar": false,
  "topHeader": "default",
  "contentWidth": "boxed",
  "navbar": "sticky",
  "footer": "hidden",
  "isRtl": false,
  "showSwitcher": true,
  "subMenu": false,
  "hasSubMenu": true,
  "activeMenuGroup": undefined,
  "sidebarColor": "ocean-blue",
  "headerColor": "light",
  "radius": 0.5,
  "sidebarBgImage": "/images/all-img/img-2.jpeg"
}

const configAtom = atomWithStorage<Config>("config", defaultConfig);

export function useConfig() {
  return useAtom(configAtom);
}
