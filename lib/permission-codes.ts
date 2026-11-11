/**
 * Central list of menu permission codes (the `menuCode` column of the DB
 * `menus` table, returned by GET /permission/menus/{roleId}).
 *
 * Use these constants everywhere a permission is checked — sidebar
 * (lib/menus.ts), route guard (lib/route-permissions.ts) and action buttons —
 * instead of hard-coded strings.
 *
 * Codes are compared through `normalizeMenuCode`, so "FLIGHT ROSTER" and
 * "FLIGHT_ROSTER" are the same code.
 */
export const MENU = {
    // Flight
    FLIGHT: "FLIGHT", // group parent in DB (permission computed from children) — do not check directly
    FLIGHT_LIST: "FLIGHT_LIST", // DB row "Flight_List"
    FLIGHT_TIMELINE: "FLIGHT_TIMELINE",
    THF: "THF",

    CONTRACT: "CONTRACT",
    INVOICE: "INVOICE",
    REPORT: "REPORT",

    // Production Planner
    PRODUCTION_PLANNER: "PRODUCTION_PLANNER",
    PRODUCTION_DASHBOARD: "PRODUCTION_DASHBOARD",
    PRODUCTION_PLAN: "PRODUCTION_PLAN",
    REVENUE_PLAN: "REVENUE_PLAN",
    CUSTOMER_SERVICE_TYPE: "CUSTOMER_SERVICE_TYPE",

    // QA
    QA: "QA",
    QA_TRAINING: "QA_TRAINING", // Training group (parent of the pages below)
    QA_TRAINING_MONITORING: "QA_TRAINING_MONITORING",
    QA_COURSE_MANAGEMENT: "QA_COURSE_MANAGEMENT",
    QA_TRAINING_SCHEDULER: "QA_TRAINING_SCHEDULER",
    QA_INSTRUCTOR: "QA_INSTRUCTOR",
    QA_AUTHORIZATION: "QA_AUTHORIZATION",
    QA_DOC_WORK_EXPERIENCE: "QA_DOC_WORK_EXPERIENCE",
    QA_DOC_EMPLOYEE_HISTORY: "QA_DOC_EMPLOYEE_HISTORY",

    // HR
    HR: "HR",
    HR_STAFF: "HR_STAFF",
    HR_STAFF_INCOME: "HR_STAFF_INCOME",
    HR_DOCUMENT_VERIFICATION: "HR_DOCUMENT_VERIFICATION",
    HR_WORKLOAD: "HR_WORKLOAD",

    // Roster
    ROSTER: "ROSTER",
    FLIGHT_ROSTER: "FLIGHT_ROSTER",
    CERTIFYING_STAFF: "CERTIFYING_STAFF",
    MECH_STAFF: "MECH_STAFF",
    AIRCRAFT_TYPE_SUMMARY: "AIRCRAFT_TYPE_SUMMARY",
    MANPOWER_ANALYSIS: "MANPOWER_ANALYSIS",

    // Master Data
    MASTER_DATA: "MASTER_DATA",
    MASTER_DATA_DEPARTMENT: "MASTER_DATA_DEPARTMENT",
    MASTER_DATA_DEPARTMENT_AMO145: "MASTER_DATA_DEPARTMENT_AMO145",
    MASTER_DATA_MANAGER_MAPPING: "MASTER_DATA_MANAGER_MAPPING",
    MASTER_DATA_AIRCRAFT_ENGINE: "MASTER_DATA_AIRCRAFT_ENGINE",
    MASTER_DATA_CUSTOMER_AIRLINE: "MASTER_DATA_CUSTOMER_AIRLINE",
    MASTER_DATA_AUTHORITY: "MASTER_DATA_AUTHORITY",
    MASTER_DATA_STATION: "MASTER_DATA_STATION",
    MASTER_DATA_USER_LOGIN: "MASTER_DATA_USER_LOGIN",
    MASTER_DATA_ROLE: "MASTER_DATA_ROLE",
} as const;

export type MenuCode = (typeof MENU)[keyof typeof MENU];

/**
 * A permission reference: one code, or an ordered list of codes.
 * With a list, the FIRST code that exists in the user's permission tree
 * decides — later codes are fallbacks used only while the preferred code is
 * not registered in the DB yet. (It is not "any of": a registered code with
 * canView=false still denies.)
 */
export type MenuCodeRef = string | readonly string[];

/**
 * Permission refs for screens whose own code may not be registered in the DB
 * yet. Each falls back to the code the screen used before it got its own.
 * Once the DB is confirmed to have the first code, the fallback can be dropped.
 *
 * Empty since 2026-11-11: every screen's own code is registered in the DB.
 * Add an entry here (e.g. NEW_SCREEN: [MENU.NEW_SCREEN, MENU.OLD_SCREEN]) only
 * while a new code is waiting to be added to the DB.
 */
export const MENU_REF = {} as const satisfies Record<string, readonly string[]>;
