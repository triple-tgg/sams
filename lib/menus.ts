

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
          id: "flight",
          href: "/flight",
          label: t("flightList"),
          active: pathname.includes("/flight"),
          icon: "heroicons-outline:document-text",
          submenus: [],
        },
        {
          id: "contract",
          href: "/contract",
          label: t("contract"),
          active: pathname.includes("/contract"),
          icon: "heroicons-outline:folder-open",
          submenus: [],
        },
        {
          id: "invoice",
          href: "/invoice",
          label: t("invoice"),
          active: pathname.includes("/invoice"),
          icon: "heroicons-outline:document-chart-bar",
          submenus: [],
        },
        {
          id: "report",
          href: "/report",
          label: t("report"),
          active: pathname.includes("/report"),
          icon: "heroicons-outline:chart-pie",
          submenus: [],
        },
      ],
    },

    {
      groupLabel: t("QualityAssurance"),
      id: "qa",
      menus: [
        {
          id: "qa",
          href: "/qa/training",
          label: t("QA"),
          active: pathname.includes("/qa"),
          icon: "heroicons-outline:clipboard-document-check",
          submenus: [
            {
              href: "/qa/monitoring",
              label: t("monitoring"),
              active: pathname.includes("/qa/monitoring"),
              icon: "heroicons-outline:chart-bar-square",
              children: [],
            },
            {
              href: "/qa/staff",
              label: t("qaStaffList"),
              active: pathname.includes("/qa/staff"),
              icon: "heroicons-outline:users",
              children: [],
            },
            // {
            //   href: "/qa/training",
            //   label: t("training"),
            //   active: pathname.includes("/qa/training") && !pathname.includes("/qa/training-scheduler"),
            //   icon: "heroicons-outline:academic-cap",
            //   children: [],
            // },
            {
              href: "/qa/course-management",
              label: t("courseManagement"),
              active: pathname.includes("/qa/course-management"),
              icon: "heroicons-outline:book-open",
              children: [],
            },
            {
              href: "/qa/training-scheduler",
              label: t("trainingScheduler"),
              active: pathname.includes("/qa/training-scheduler"),
              icon: "heroicons-outline:calendar-days",
              children: [],
            },


          ],
        },
      ],
    },

    {
      groupLabel: t("masterData"),
      id: "master-data",
      menus: [
        {
          id: "master-data",
          href: "/master-data/customer-airline",
          label: t("master-data"),
          active: pathname.includes("/master-data"),
          icon: "heroicons-outline:cog-6-tooth",
          submenus: [
            {
              href: "/master-data/customer-airline",
              label: t("customer-airline"),
              active: pathname.includes("/master-data/customer-airline"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              href: "/master-data/staff",
              label: t("staff"),
              active: pathname.includes("/master-data/staff"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              href: "/master-data/station",
              label: t("station"),
              active: pathname.includes("/master-data/station"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              href: "/master-data/user-login",
              label: t("user-login"),
              active: pathname.includes("/master-data/user-login"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              href: "/master-data/role",
              label: t("role"),
              active: pathname.includes("/master-data/role"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              href: "/master-data/set-permission",
              label: t("set-permission"),
              active: pathname.includes("/master-data/set-permission"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
          ],
        },
      ],
    },
  ];
}
export function getHorizontalMenuList(pathname: string, t: any): Group[] {
  return [];
}