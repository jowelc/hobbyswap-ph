export const SUPERADMIN_EMAIL = 'jowelcastaneda6@gmail.com';

export function isAdmin(email: string | null | undefined): boolean {
  return email === SUPERADMIN_EMAIL;
}
