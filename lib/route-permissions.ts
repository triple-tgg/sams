/**
 * Route → permission mapping for route protection (RoutePermissionGuard).
 *
 * Each entry maps a pathname (after the locale, e.g. "/flight") to the menu
 * code the user needs, and the action required (canView by default).
 *
 * Routes are matched in order, first match wins — keep more specific paths
 * first. A route not listed here is open to any authenticated user, so every
 * new page must get an entry. Keep in sync with the DB `menus` table and
 * lib/menus.ts.
 */
import { MENU, type MenuCodeRef } from "@/lib/permission-codes";
import { hasPermission, type PermissionAction, type PermissionIndex } from "@/lib/permission-utils";

export interface RoutePermission {
    /** Pathname to match: exact, or as a prefix followed by "/" */
    path: string;
    /** Menu code, or ordered fallback list (first code present in the DB decides) */
    menuCodes: MenuCodeRef;
    /** Required action; a list means "any of them". Defaults to "canView". */
    action?: PermissionAction | readonly PermissionAction[];
}

export const ROUTE_PERMISSION_MAP: RoutePermission[] = [
    // ── Flight ──────────────────────────────────────────────
    { path: "/views-flight-timeline", menuCodes: MENU.FLIGHT_TIMELINE },
    // THF create page is used both to create and to edit a THF
    { path: "/flight/thf/create", menuCodes: MENU.THF, action: ["canCreate", "canEdit"] },
    { path: "/flight", menuCodes: MENU.FLIGHT_LIST },

    // ── Contract / Invoice / Report ─────────────────────────
    { path: "/contract", menuCodes: MENU.CONTRACT },
    { path: "/invoice", menuCodes: MENU.INVOICE },
    { path: "/report", menuCodes: MENU.REPORT },

    // ── Production Planner ──────────────────────────────────
    { path: "/production-planner/dashboard", menuCodes: MENU.PRODUCTION_DASHBOARD },
    { path: "/production-planner/production-plan", menuCodes: MENU.PRODUCTION_PLAN },
    { path: "/production-planner/revenue-plan", menuCodes: MENU.REVENUE_PLAN },
    { path: "/production-planner/customer-service-type", menuCodes: MENU.CUSTOMER_SERVICE_TYPE },
    { path: "/production-planner", menuCodes: MENU.PRODUCTION_PLANNER },

    // ── HR ───────────────────────────────────────────────────
    { path: "/hr/employee-income", menuCodes: MENU.HR_STAFF_INCOME },
    { path: "/hr/document-verification", menuCodes: MENU.HR_DOCUMENT_VERIFICATION },
    { path: "/hr/workload", menuCodes: MENU.HR_WORKLOAD },
    { path: "/hr/staff/new", menuCodes: MENU.HR_STAFF, action: "canCreate" },
    { path: "/hr/staff", menuCodes: MENU.HR_STAFF },
    { path: "/hr", menuCodes: MENU.HR },

    // ── QA ──────────────────────────────────────────────────
    { path: "/qa/monitoring", menuCodes: MENU.QA_TRAINING_MONITORING },
    { path: "/qa/course-management", menuCodes: MENU.QA_COURSE_MANAGEMENT },
    { path: "/qa/training-scheduler", menuCodes: MENU.QA_TRAINING_SCHEDULER },
    { path: "/qa/instructor", menuCodes: MENU.QA_INSTRUCTOR },
    { path: "/qa/authorization", menuCodes: MENU.QA_AUTHORIZATION },
    { path: "/qa/qa-document/work-experience-records", menuCodes: MENU.QA_DOC_WORK_EXPERIENCE },
    { path: "/qa/qa-document/employee-history-training", menuCodes: MENU.QA_DOC_EMPLOYEE_HISTORY },
    { path: "/qa", menuCodes: MENU.QA },

    // ── Roster ──────────────────────────────────────────────
    { path: "/roster/flight-roster", menuCodes: MENU.FLIGHT_ROSTER },
    { path: "/roster/certifying-staff", menuCodes: MENU.CERTIFYING_STAFF },
    { path: "/roster/mech-staff", menuCodes: MENU.MECH_STAFF },
    { path: "/roster/aircraft-type-summary", menuCodes: MENU.AIRCRAFT_TYPE_SUMMARY },
    { path: "/roster/manpower-analysis", menuCodes: MENU.MANPOWER_ANALYSIS },
    { path: "/roster/manpower", menuCodes: MENU.MANPOWER_ANALYSIS },
    { path: "/roster", menuCodes: MENU.ROSTER },

    // ── Master Data ─────────────────────────────────────────
    { path: "/master-data/department-amo145", menuCodes: MENU.MASTER_DATA_DEPARTMENT_AMO145 },
    { path: "/master-data/department", menuCodes: MENU.MASTER_DATA_DEPARTMENT },
    { path: "/master-data/manager-mapping", menuCodes: MENU.MASTER_DATA_MANAGER_MAPPING },
    { path: "/master-data/aircraft-engine", menuCodes: MENU.MASTER_DATA_AIRCRAFT_ENGINE },
    { path: "/master-data/customer-airline/authority", menuCodes: MENU.MASTER_DATA_AUTHORITY },
    { path: "/master-data/customer-airline", menuCodes: MENU.MASTER_DATA_CUSTOMER_AIRLINE },
    { path: "/master-data/station", menuCodes: MENU.MASTER_DATA_STATION },
    { path: "/master-data/user-login", menuCodes: MENU.MASTER_DATA_USER_LOGIN },
    { path: "/master-data/role", menuCodes: MENU.MASTER_DATA_ROLE },
    { path: "/master-data/set-permission", menuCodes: MENU.MASTER_DATA_ROLE },
    { path: "/master-data", menuCodes: MENU.MASTER_DATA },
];

/**
 * Find the first route entry matching a pathname (already stripped of the
 * locale prefix). Returns null if nothing matches → no restriction.
 */
export function findRoutePermission(pathname: string): RoutePermission | null {
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

/** True if the user may open the given (locale-stripped) pathname. */
export function canAccessRoute(index: PermissionIndex, pathname: string): boolean {
    const entry = findRoutePermission(pathname);
    if (!entry) return true;
    return hasPermission(index, entry.menuCodes, entry.action ?? "canView");
}
