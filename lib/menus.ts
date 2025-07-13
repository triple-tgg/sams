

export type SubChildren = {
  href: string;
  label: string;
  active: boolean;
  children?: SubChildren[];
};
export type Submenu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus?: Submenu[];
  children?: SubChildren[];
};

export type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
  id: string;
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
  id: string;
};

export function getMenuList(pathname: string, t: any): Group[] {

  return [
    // {
    //   groupLabel: t("dashboard"),
    //   id: "dashboard",
    //   menus: [
    //     {
    //       id: "dashboard",
    //       href: "/",
    //       label: t("dashboard"),
    //       active: pathname.includes("/"),
    //       icon: "heroicons-outline:home",
    //       submenus: [],
    //     },
    //   ],
    // },
    {
      groupLabel: t("aircraftMaintenance"),
      id: "aircraft-maintenance",
      menus: [
        {
          id: "dashboard",
          href: "/dashboard",
          label: t("dashboard"),
          active: pathname.includes("/dashboard"),
          icon: "heroicons-outline:home",
          submenus: [],
        },
        {
          id: "flight",
          href: "/flight",
          label: t("flightList"),
          active: pathname.includes("/flight"),
          icon: "heroicons-outline:wrench-screwdriver",
          submenus: [],
        },
      ],
    },
    {
      groupLabel: t("setting"),
      id: "setting",
      menus: [
        {
          id: "master-data",
          href: "/master-data",
          label: t("master-data"),
          active: pathname.includes("/master-data"),
          icon: "heroicons-outline:cog-6-tooth",
          submenus: [],
        },
        {
          id: "customer",
          href: "/customer",
          label: t("customer"),
          active: pathname.includes("/customer"),
          icon: "heroicons-outline:building-storefront",
          submenus: [],
        },
      ],
    },
  ];
}
export function getHorizontalMenuList(pathname: string, t: any): Group[] {
  return [
    {
      groupLabel: t("dashboard"),
      id: "dashboard",
      menus: [
        {
          id: "dashboard",
          href: "/",
          label: t("dashboard"),
          active: pathname.includes("/"),
          icon: "heroicons-outline:home",
          submenus: [],
        },
      ],
    },
    {
      groupLabel: t("dashboard"),
      id: "dashboard",
      menus: [
        {
          id: "dashboard",
          href: "/",
          label: t("dashboard"),
          active: pathname.includes("/"),
          icon: "heroicons-outline:home",
          submenus: [],
        },
      ],
    },
  ];
}