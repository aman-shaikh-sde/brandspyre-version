/**
 * Centralized Email Normalization Utility
 * Ensures consistent email formatting across registration, login, forgot password,
 * reset password, and user lookups.
 */
export const normalizeEmail = (email: string | null | undefined): string => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};
