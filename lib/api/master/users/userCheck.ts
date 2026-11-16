import type { UserItem } from "./users.interface";

/**
 * Outcome of checking an email before creating a login for a staff member.
 * - `available`    no account uses this email → create a new account
 * - `unlinked`     an account exists but is not linked to any staff → link it to this staff
 * - `linked-self`  the account is already linked to this staff (staff record is stale)
 * - `linked-other` the account belongs to another staff member → ask the user to check the email
 */
export type UserCheckStatus = "available" | "unlinked" | "linked-self" | "linked-other";

export interface UserCheckResult {
    status: UserCheckStatus;
    user: UserItem | null;
}

const norm = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

/** Pick the account whose email matches exactly (case-insensitive) from any list. */
export function findUserByEmail(users: UserItem[] | null | undefined, email: string): UserItem | null {
    const target = norm(email);
    if (!target) return null;
    return users?.find((u) => norm(u.email) === target) ?? null;
}

/** Classify a matched account against the staff member the login is for. */
export function resolveUserCheck(user: UserItem | null, employeeId: string): UserCheckResult {
    if (!user) return { status: "available", user: null };
    const linkedTo = norm(user.staffEmployeeId);
    if (!linkedTo) return { status: "unlinked", user };
    return { status: linkedTo === norm(employeeId) ? "linked-self" : "linked-other", user };
}
