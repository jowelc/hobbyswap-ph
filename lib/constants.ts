export const SUPERADMIN_EMAIL = 'jowelcastaneda6@gmail.com';

// All emails allowed to sign in. Anyone not in this list gets bounced to /access-denied.
export const WHITELISTED_EMAILS = [
  'jowelcastaneda6@gmail.com',
  'pandarunningclub@gmail.com',
  'doubledribblehub@gmail.com',
] as const;

// Mapping from email → platform identity for non-admin whitelisted users
export const WHITELISTED_USERS: Record<string, { username: string; displayName: string }> = {
  'pandarunningclub@gmail.com': {
    username: 'pandarunningclub',
    displayName: 'Panda Running Club',
  },
  'doubledribblehub@gmail.com': {
    username: 'doubledribblehub',
    displayName: 'Double Dribble Hub',
  },
};

export function isWhitelisted(email: string | null | undefined): boolean {
  return WHITELISTED_EMAILS.includes(email as (typeof WHITELISTED_EMAILS)[number]);
}

export function isAdmin(email: string | null | undefined): boolean {
  return email === SUPERADMIN_EMAIL;
}
