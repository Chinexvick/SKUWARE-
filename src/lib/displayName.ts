const MANAGEMENT_ROLES = new Set(["SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"]);

/**
 * A management-role account (School Owner, Principal, Vice Principal)
 * messages as "School Management", not the individual's personal name — the
 * institution is speaking, not a specific staff member, and it keeps that
 * consistent whoever is logged into the account.
 */
export function displayName(person: { firstName: string; lastName: string; role: string }): string {
  if (MANAGEMENT_ROLES.has(person.role)) return "School Management";
  return `${person.firstName} ${person.lastName}`;
}
