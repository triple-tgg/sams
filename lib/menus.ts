

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
          icon: "heroicons-outline:rectangle-group",
          submenus: [],
        },
        {
          id: "flight",
          href: "/flight",
          label: t("flightList"),
          active: pathname.includes("/flight"),
          icon: "heroicons-outline:clipboard-document-list",
          submenus: [],
        },
        {
          id: "report",
          href: "/report",
          label: t("report"),
          active: pathname.includes("/report"),
          icon: "heroicons-outline:cog-6-tooth",
          submenus: [],
        },
      ],
    },
    // {
    //   groupLabel: t("report"),
    //   id: "report",
    //   menus: [
    //     {
    //       id: "report",
    //       href: "/report",
    //       label: t("report"),
    //       active: pathname.includes("/report"),
    //       icon: "heroicons-outline:cog-6-tooth",
    //       submenus: [
    //         {
    //           // id: "equipment-report",
    //           href: "/report/equipment",
    //           label: t("equipment-report"),
    //           active: pathname.includes("/report/equipment"),
    //           icon: "heroicons-outline:cog-6-tooth",
    //           submenus: [],
    //         },
    //         {
    //           // id: "parts-tool-report",
    //           href: "/report/parts-tool",
    //           label: t("parts-tool-report"),
    //           active: pathname.includes("/report/parts-tool"),
    //           icon: "heroicons-outline:cog-6-tooth",
    //           submenus: [],
    //         },
    //       ],
    //     },
    //   ],
    // },
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
          icon: "heroicons-outline:identification",
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
          icon: "heroicons-outline:rectangle-group",
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
          icon: "heroicons-outline:rectangle-group",
          submenus: [],
        },
      ],
    },
  ];
}