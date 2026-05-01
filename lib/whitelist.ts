import fs from 'fs';
import path from 'path';

const WHITELIST_PATH = path.join(process.cwd(), 'data', 'whitelist.json');

export interface WhitelistEntry {
  email: string;
  addedAt: string;
}

export function readWhitelistEntries(): WhitelistEntry[] {
  try {
    const data = JSON.parse(fs.readFileSync(WHITELIST_PATH, 'utf-8'));
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

export function writeWhitelistEntries(entries: WhitelistEntry[]) {
  fs.writeFileSync(WHITELIST_PATH, JSON.stringify({ entries }, null, 2));
}
