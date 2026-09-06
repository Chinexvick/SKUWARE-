/**
 * Prisma `select` shape for User that is safe to serialize in an API
 * response — never include passwordHash, mfaSecret, or other credential
 * material. Use this anywhere a User is nested under another record
 * (StaffProfile, ParentProfile, etc.) that gets returned to the client.
 */
export const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  mfaEnabled: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
} as const;
