

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
  permCode?: string;           // API menuCode for permission check
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
  permCode?: string;           // API menuCode for permission check
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
  id: string;
};

export function getMenuList(pathname: string, t: any): Group[] {

  return [
    {
      groupLabel: t("aircraftMaintenance"),
      id: "aircraft-maintenance",
      menus: [
        {
          id: "flight",
          permCode: "FLIGHT",
          href: "/flight",
          label: t("flightList"),
          active: pathname.includes("/flight"),
          icon: "heroicons-outline:document-text",
          submenus: [],
        },
        {
          id: "contract",
          permCode: "CONTRACT",
          href: "/contract",
          label: t("contract"),
          active: pathname.includes("/contract"),
          icon: "heroicons-outline:folder-open",
          submenus: [],
        },
        {
          id: "invoice",
          permCode: "INVOICE",
          href: "/invoice",
          label: t("invoice"),
          active: pathname.includes("/invoice"),
          icon: "heroicons-outline:document-chart-bar",
          submenus: [],
        },
        {
          id: "report",
          permCode: "REPORT",
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
          permCode: "QA",
          href: "/qa/monitoring",
          label: t("QA"),
          active: pathname.includes("/qa"),
          icon: "heroicons-outline:clipboard-document-check",
          submenus: [
            {
              permCode: "QA_STAFF",
              href: "/qa/staff",
              label: t("qaStaffList"),
              active: pathname.includes("/qa/staff"),
              icon: "heroicons-outline:users",
              children: [],
            },
            {
              permCode: "QA_MONITORING",
              href: "/qa/monitoring",
              label: t("training"),
              active: pathname.includes("/qa/monitoring") || pathname.includes("/qa/course-management") || pathname.includes("/qa/training-scheduler"),
              icon: "heroicons-outline:academic-cap",
              children: [
                {
                  href: "/qa/monitoring",
                  label: t("monitoring"),
                  active: pathname.includes("/qa/monitoring"),
                },
                {
                  href: "/qa/course-management",
                  label: t("courseManagement"),
                  active: pathname.includes("/qa/course-management"),
                },
                {
                  href: "/qa/training-scheduler",
                  label: t("trainingScheduler"),
                  active: pathname.includes("/qa/training-scheduler"),
                },
              ],
            },
            {
              permCode: "QA_AUTHORIZATION",
              href: "/qa/authorization",
              label: t("authorization"),
              active: pathname.includes("/qa/authorization"),
              icon: "heroicons-outline:shield-check",
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
          permCode: "MASTER_DATA",
          href: "/master-data/customer-airline",
          label: t("master-data"),
          active: pathname.includes("/master-data"),
          icon: "heroicons-outline:cog-6-tooth",
          submenus: [
            {
              permCode: "MASTER_DATA_CUSTOMER_AIRLINE",
              href: "/master-data/customer-airline",
              label: t("customer-airline"),
              active: pathname.includes("/master-data/customer-airline"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              permCode: "MASTER_DATA_STAFF",
              href: "/master-data/staff",
              label: t("staff"),
              active: pathname.includes("/master-data/staff"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              permCode: "MASTER_DATA_STATION",
              href: "/master-data/station",
              label: t("station"),
              active: pathname.includes("/master-data/station"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              permCode: "MASTER_DATA_USER_LOGIN",
              href: "/master-data/user-login",
              label: t("user-login"),
              active: pathname.includes("/master-data/user-login"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [],
            },
            {
              permCode: "MASTER_DATA_ROLE",
              href: "/master-data/role",
              label: t("role"),
              active: pathname.includes("/master-data/role") || pathname.includes("/master-data/set-permission"),
              icon: "heroicons-outline:shield-check",
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