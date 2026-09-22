import dayjs from "dayjs";

/** Calendar-day thresholds in the user's local timezone, matching date display. */
export const getContractExpiryWarning = (
    expires: string,
    noExpiry: boolean,
    now: Date = new Date(),
): "under-3-months" | "under-6-months" | null => {
    if (noExpiry || !expires) return null;

    const expiry = dayjs(expires).startOf("day");
    const today = dayjs(now).startOf("day");
    if (!expiry.isValid() || expiry.isBefore(today)) return null;
    if (expiry.isBefore(today.add(3, "month"))) return "under-3-months";
    if (expiry.isBefore(today.add(6, "month"))) return "under-6-months";
    return null;
};
