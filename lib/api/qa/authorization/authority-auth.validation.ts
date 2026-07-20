export type AuthorityLicenseDateErrors = Partial<
  Record<"initialIssueDate" | "currentIssueDate" | "expiryDate", string>
>;

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateAuthorityLicenseDates(
  initialIssueDate: string,
  currentIssueDate: string,
  expiryDate: string,
): AuthorityLicenseDateErrors {
  const errors: AuthorityLicenseDateErrors = {};

  if (!initialIssueDate) errors.initialIssueDate = "Date of Initial Issue is required";
  else if (!isValidCalendarDate(initialIssueDate)) errors.initialIssueDate = "Date of Initial Issue is invalid";

  if (!currentIssueDate) errors.currentIssueDate = "Date of Current Issue is required";
  else if (!isValidCalendarDate(currentIssueDate)) errors.currentIssueDate = "Date of Current Issue is invalid";

  if (!expiryDate) errors.expiryDate = "Date of Expire is required";
  else if (!isValidCalendarDate(expiryDate)) errors.expiryDate = "Date of Expire is invalid";

  if (!errors.initialIssueDate && !errors.currentIssueDate && currentIssueDate < initialIssueDate) {
    errors.currentIssueDate = "Current Issue must be on or after Initial Issue";
  }

  if (!errors.currentIssueDate && !errors.expiryDate && expiryDate < currentIssueDate) {
    errors.expiryDate = "Expire must be on or after Current Issue";
  }

  return errors;
}

export function validateAuthorityAircraftSelection(selectedCount: number): string | null {
  return selectedCount > 0 ? null : "Select at least one Aircraft License";
}
