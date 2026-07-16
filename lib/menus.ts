

export type SubChildren = {
  href: string;
  label: string;
  active: boolean;
  permCode?: string;           // API menuCode for permission check
  children?: SubChildren[];
  badge?: string;
};
export type Submenu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  permCode?: string;           // API menuCode for permission check
  submenus?: Submenu[];
  children?: SubChildren[];
  badge?: string;
  hasDivider?: boolean;        // render a divider line above this item
};

export type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
  id: string;
  permCode?: string;           // API menuCode for permission check
  badge?: string;
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
      groupLabel: "Production Planner",
      id: "production-planner",
      menus: [
        {
          id: "production-planner",
          permCode: "PRODUCTION_PLANNER",
          href: "/production-planner/dashboard",
          label: "Production Planner",
          active: pathname.includes("/production-planner"),
          icon: "heroicons-outline:presentation-chart-line",
          submenus: [
            {
              permCode: "PRODUCTION_DASHBOARD",
              href: "/production-planner/dashboard",
              label: "Dashboard",
              active: pathname.includes("/production-planner/dashboard"),
              icon: "heroicons-outline:squares-2x2",
              badge: "LIVE",
            },

            {
              permCode: "PRODUCTION_PLAN",
              href: "/production-planner/production-plan",
              label: "Production Plan",
              active: pathname.includes("/production-planner/production-plan"),
              icon: "heroicons-outline:paper-airplane",
              badge: "NEW",
            },
            {
              permCode: "REVENUE_PLAN",
              href: "/production-planner/revenue-plan",
              label: "Revenue Plan",
              active: pathname.includes("/production-planner/revenue-plan"),
              icon: "heroicons-outline:currency-dollar",
              badge: "NEW",
            },
            {
              permCode: "MONTHLY_FREQUENCY",
              href: "/production-planner/monthly-frequency",
              label: "Monthly Frequency",
              active: pathname.includes("/production-planner/monthly-frequency"),
              icon: "heroicons-outline:table-cells",
              badge: "NEW",
            },
            {
              permCode: "IMPORT_FLIGHT_DATA",
              hasDivider: true,
              href: "/production-planner/import-flight-data",
              label: "Import Flight Data",
              active: pathname.includes("/production-planner/import-flight-data"),
              icon: "heroicons-outline:arrow-up-tray",
              badge: "PP-01",
            },
          ]
        }
      ]
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
            {
              permCode: "QA_DOCUMENT_GENERATION",
              href: "/qa/document-generation",
              label: t("documentGeneration"),
              active: pathname.includes("/qa/document-generation"),
              icon: "heroicons-outline:document-duplicate",
              children: [],
            },
          ],
        },
      ],
    },

    {
      groupLabel: t("HumanResources"),
      id: "hr",
      menus: [
        {
          id: "hr",
          permCode: "HR",
          href: "/hr/staff",
          label: t("HR"),
          active: pathname.includes("/hr"),
          icon: "heroicons-outline:user-group",
          submenus: [
            {
              permCode: "HR_STAFF",
              href: "/hr/staff",
              label: t("hrStaffList"),
              active: pathname.includes("/hr/staff"),
              icon: "heroicons-outline:users",
              children: [],
            },
            {
              permCode: "HR_STAFF_INCOME",
              href: "/hr/employee-income",
              label: t("hrStaffIncome"),
              active: pathname.includes("/hr/employee-income"),
              icon: "heroicons-outline:banknotes",
              children: [],
            },
            {
              permCode: "HR_DOCUMENT_VERIFICATION",
              href: "/hr/document-verification",
              label: t("hrDocumentVerification"),
              active: pathname.includes("/hr/document-verification"),
              icon: "heroicons-outline:document-check",
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
              href: "/master-data/staff",
              label: t("mdOrganization"),
              active: pathname.includes("/master-data/staff") || pathname.includes("/master-data/department") || pathname.includes("/master-data/manager-mapping"),
              icon: "heroicons-outline:building-office-2",
              children: [
                {
                  permCode: "MASTER_DATA_STAFF",
                  href: "/master-data/staff",
                  label: t("Staff List"),
                  active: pathname.includes("/master-data/staff"),
                },
                {
                  permCode: "MASTER_DATA_DEPARTMENT",
                  href: "/master-data/department",
                  label: t("mdDepartment"),
                  active: pathname.includes("/master-data/department") && !pathname.includes("/master-data/sub-department"),
                },

                {
                  permCode: "MASTER_DATA_MANAGER_MAPPING",
                  href: "/master-data/manager-mapping",
                  label: t("mdManagerMapping"),
                  active: pathname.includes("/master-data/manager-mapping"),
                },
              ]
            },
            {
              href: "/master-data/aircraft-type",
              label: t("mdAircraftManagement"),
              active: pathname.includes("/master-data/aircraft-type") || pathname.includes("/master-data/aircraft-type-license") || pathname.includes("/master-data/aircraft-group"),
              icon: "heroicons-outline:paper-airplane",
              children: [
                {
                  permCode: "MASTER_DATA_AIRCRAFT_TYPE",
                  href: "/master-data/aircraft-type",
                  label: t("mdAircraftType"),
                  active: pathname.includes("/master-data/aircraft-type") && !pathname.includes("/master-data/aircraft-type-license"),
                },
                {
                  permCode: "MASTER_DATA_AIRCRAFT_TYPE_LICENSE",
                  href: "/master-data/aircraft-type-license",
                  label: t("mdAircraftTypeLicense"),
                  active: pathname.includes("/master-data/aircraft-type-license"),
                },
                {
                  permCode: "MASTER_DATA_AIRCRAFT_GROUP",
                  href: "/master-data/aircraft-group",
                  label: t("mdAircraftGroup"),
                  active: pathname.includes("/master-data/aircraft-group"),
                },
              ]
            },
            {
              href: "/master-data/customer-airline",
              label: t("Customer Airline"),
              active: pathname.includes("/master-data/customer-airline"),
              icon: "heroicons-outline:identification",
              children: [
                {
                  permCode: "MASTER_DATA_CUSTOMER_AIRLINE",
                  href: "/master-data/customer-airline",
                  label: t("customer-airline"),
                  active: pathname.includes("/master-data/customer-airline"),
                  children: [],
                },
              ]
            },
            {
              href: "/master-data/role",
              label: t("System Function"),
              active: pathname.includes("/master-data/role") || pathname.includes("/master-data/station") || pathname.includes("/master-data/user-login") || pathname.includes("/master-data/set-permission"),
              icon: "heroicons-outline:cog-6-tooth",
              children: [
                {
                  permCode: "MASTER_DATA_STATION",
                  href: "/master-data/station",
                  label: t("station"),
                  active: pathname.includes("/master-data/station"),
                  children: [],
                },
                {
                  permCode: "MASTER_DATA_USER_LOGIN",
                  href: "/master-data/user-login",
                  label: t("user-login"),
                  active: pathname.includes("/master-data/user-login"),
                },
                {
                  permCode: "MASTER_DATA_ROLE",
                  href: "/master-data/role",
                  label: t("role"),
                  active: pathname.includes("/master-data/role") || pathname.includes("/master-data/set-permission"),
                },
              ]
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