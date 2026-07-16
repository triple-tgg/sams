/**
 * Route-to-menuCode mapping for permission-based route protection.
 *
 * Each entry maps a pathname segment (after locale, e.g. "/flight")
 * to the menuCode that must have canView === true for access.
 *
 * Routes are matched from most-specific to least-specific.
 * If a route is not listed here, it is accessible to any authenticated user.
 */

export interface RoutePermission {
    /** Pathname segment to match (uses `startsWith` after stripping locale) */
    path: string;
    /** The menuCode(s) — user needs canView on at least ONE of these */
    menuCodes: string[];
}

/**
 * Ordered from most-specific to least-specific so the first match wins.
 * This must stay in sync with the DB `menus` table and menus.ts.
 */
export const ROUTE_PERMISSION_MAP: RoutePermission[] = [
    // ── Flight ──────────────────────────────────────────────
    { path: "/views-flight-timeline",                   menuCodes: ["FLIGHT_TIMELINE"] },
    { path: "/flight",                                  menuCodes: ["FLIGHT"] },

    // ── Contract ────────────────────────────────────────────
    { path: "/contract",                                menuCodes: ["CONTRACT"] },

    // ── Invoice ─────────────────────────────────────────────
    { path: "/invoice",                                 menuCodes: ["INVOICE"] },

    // ── Report ──────────────────────────────────────────────
    { path: "/report",                                  menuCodes: ["REPORT"] },

    // ── Production Planner ──────────────────────────────────
    { path: "/production-planner/dashboard",            menuCodes: ["PRODUCTION_DASHBOARD"] },
    { path: "/production-planner/production-plan",      menuCodes: ["PRODUCTION_PLAN"] },
    { path: "/production-planner/revenue-plan",         menuCodes: ["REVENUE_PLAN"] },
    { path: "/production-planner/monthly-frequency",    menuCodes: ["MONTHLY_FREQUENCY"] },
    { path: "/production-planner/import-flight-data",   menuCodes: ["IMPORT_FLIGHT_DATA"] },
    { path: "/production-planner",                      menuCodes: ["PRODUCTION_PLANNER"] },

    // ── HR ───────────────────────────────────────────────────
    { path: "/hr/employee-income",                      menuCodes: ["HR_STAFF_INCOME"] },
    { path: "/hr/document-verification",                menuCodes: ["HR_DOCUMENT_VERIFICATION"] },
    { path: "/hr/staff",                                menuCodes: ["HR_STAFF"] },
    { path: "/hr",                                      menuCodes: ["HR"] },

    // ── QA ──────────────────────────────────────────────────
    { path: "/qa/monitoring",                           menuCodes: ["QA_MONITORING"] },
    { path: "/qa/course-management",                    menuCodes: ["QA_MONITORING"] },
    { path: "/qa/training-scheduler",                   menuCodes: ["QA_TRAINING_SCHEDULER"] },
    { path: "/qa/authorization",                        menuCodes: ["QA_AUTHORIZATION"] },
    { path: "/qa/document-generation",                  menuCodes: ["QA_DOCUMENT_GENERATION"] },
    { path: "/qa/dashboard",                            menuCodes: ["QA"] },
    { path: "/qa",                                      menuCodes: ["QA"] },

    // ── Master Data ─────────────────────────────────────────
    { path: "/master-data/staff",                       menuCodes: ["MASTER_DATA_STAFF"] },
    { path: "/master-data/department",                  menuCodes: ["MASTER_DATA_DEPARTMENT"] },
    { path: "/master-data/manager-mapping",             menuCodes: ["MASTER_DATA_MANAGER_MAPPING"] },
    { path: "/master-data/aircraft-type-license",       menuCodes: ["MASTER_DATA_AIRCRAFT_TYPE_LICENSE"] },
    { path: "/master-data/aircraft-type",               menuCodes: ["MASTER_DATA_AIRCRAFT_TYPE"] },
    { path: "/master-data/aircraft-group",              menuCodes: ["MASTER_DATA_AIRCRAFT_GROUP"] },
    { path: "/master-data/customer-airline",            menuCodes: ["MASTER_DATA_CUSTOMER_AIRLINE"] },
    { path: "/master-data/station",                     menuCodes: ["MASTER_DATA_STATION"] },
    { path: "/master-data/user-login",                  menuCodes: ["MASTER_DATA_USER_LOGIN"] },
    { path: "/master-data/role",                        menuCodes: ["MASTER_DATA_ROLE"] },
    { path: "/master-data/set-permission",              menuCodes: ["MASTER_DATA_ROLE"] },
    { path: "/master-data",                             menuCodes: ["MASTER_DATA"] },
];

/**
 * Given a pathname (already stripped of locale prefix),
 * find the first matching route and return its required menuCodes.
 * Returns `null` if no route matches → treat as "no restriction".
 */
export function findRoutePermission(pathname: string): RoutePermission | null {
    // Normalise: strip trailing slash
    const normalised = pathname.endsWith("/") && pathname.length > 1
        ? pathname.slice(0, -1)
        : pathname;

    for (const entry of ROUTE_PERMISSION_MAP) {
        if (normalised === entry.path || normalised.startsWith(entry.path + "/")) {
            return entry;
        }
    }
    return null;
}
