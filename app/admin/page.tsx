import { redirect } from 'next/navigation';
import Image from 'next/image';
import AppImage from '@/components/AppImage';
import Link from 'next/link';
import { auth } from '@/auth';
import { SUPERADMIN_EMAIL } from '@/lib/constants';
import { db } from '@/db';
import { users as usersTable, whitelist as whitelistTable } from '@/db/schema';
import type { DbUser, DbWhitelist } from '@/db/schema';
import Logo from '@/components/Logo';
import AddToWhitelistForm from './AddToWhitelistForm';
import DeleteWhitelistButton from './DeleteWhitelistButton';
import SetTierButton from './SetTierButton';
import SignOutButton from './SignOutButton';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDateTime(date: Date | null) {
  if (!date) return '—';
  return date.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function timeAgo(date: Date | null) {
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-slate-800/60 border ${color} rounded-2xl p-5`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── types ───────────────────────────────────────────────────────────────────

type WhitelistRow =
  | { kind: 'user'; data: DbUser }
  | { kind: 'pending'; email: string; addedAt: Date };

// ─── page ───────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user?.email !== SUPERADMIN_EMAIL) {
    redirect('/');
  }

  const [allUsers, whitelistEntries] = await Promise.all([
    db.select().from(usersTable).orderBy(usersTable.createdAt),
    db.select().from(whitelistTable).orderBy(whitelistTable.addedAt),
  ]);

  const totalUsers      = allUsers.length;
  const whitelistedUsers = allUsers
    .filter((u) => u.isWhitelisted)
    .sort((a, b) => (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0));
  const verifiedCount   = allUsers.filter((u) => u.isWhitelisted && u.tier !== 'premium').length;
  const premiumCount    = allUsers.filter((u) => u.tier === 'premium').length;

  const registeredEmails = new Set(allUsers.map((u) => u.email));
  const pendingEntries: DbWhitelist[] = whitelistEntries.filter((e) => !registeredEmails.has(e.email));

  const whitelistRows: WhitelistRow[] = [
    ...whitelistedUsers.map((u) => ({ kind: 'user' as const, data: u })),
    ...pendingEntries.map((e) => ({ kind: 'pending' as const, email: e.email, addedAt: e.addedAt })),
  ];

  const activeUnwhitelisted = allUsers
    .filter((u) => u.isActive && !u.isWhitelisted)
    .sort((a, b) => (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ─── Top bar ─────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
              Superadmin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Marketplace
            </Link>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
              {session.user?.image ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-700">
                  <AppImage src={session.user.image} alt="avatar" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {session.user?.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
              )}
              <span className="text-sm text-slate-300 font-medium hidden sm:block">
                {session.user?.name?.split(' ')[0]}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage traders, whitelist access, and platform activity on HobbySwap PH.
          </p>
        </div>

        {/* ─── Stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Registered Users" value={totalUsers}          sub="All time"                   color="border-blue-500/20" />
          <StatCard label="Verified Users"   value={verifiedCount}       sub="Standard approved traders"  color="border-emerald-500/20" />
          <StatCard label="Premium Users"    value={premiumCount}        sub="Upgraded traders"           color="border-amber-500/20" />
          <StatCard label="Pending Invites"  value={pendingEntries.length} sub="Invited, not signed up yet" color="border-purple-500/20" />
        </div>

        {/* ─── Whitelisted Users ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-lg font-bold text-white">Whitelisted Users</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {whitelistRows.length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_2fr_1.8fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Trader</span>
              <span>Email</span>
              <span>Status</span>
              <span>Joined</span>
              <span>Tier</span>
              <span></span>
            </div>

            {whitelistRows.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No whitelisted users yet.</div>
            )}

            {whitelistRows.map((row, idx) => (
              <div
                key={row.kind === 'user' ? row.data.id : row.email}
                className={`flex flex-col md:grid md:grid-cols-[2fr_2fr_1.8fr_1fr_auto_auto] gap-2 md:gap-4 px-5 py-4 items-start md:items-center ${
                  idx !== whitelistRows.length - 1 ? 'border-b border-slate-800/60' : ''
                } hover:bg-slate-800/30 transition-colors`}
              >
                {/* Trader */}
                {row.kind === 'user' ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {row.data.avatarUrl ? (
                        <AppImage src={row.data.avatarUrl} alt={row.data.displayName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                          {row.data.displayName[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-white block truncate">{row.data.displayName || row.data.username}</span>
                      <span className="text-xs text-slate-500">@{row.data.username}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-400 truncate block">{row.email}</span>
                      <span className="text-xs text-slate-600">Invited — no account yet</span>
                    </div>
                  </div>
                )}

                {/* Email */}
                <span className="text-xs text-slate-400 truncate">
                  {row.kind === 'user' ? row.data.email : row.email}
                </span>

                {/* Status */}
                {row.kind === 'user' ? (
                  row.data.isActive ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-green-400">Active</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 pl-3">{timeAgo(row.data.lastLoginAt)}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-red-400">Not Active Yet</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                    <span className="text-xs text-slate-500">Pending invite</span>
                  </div>
                )}

                {/* Joined */}
                <span className="text-xs text-slate-400">
                  {row.kind === 'user'
                    ? formatDateTime(row.data.createdAt)
                    : formatDateTime(row.addedAt)}
                </span>

                {/* Tier */}
                <div className="flex items-center">
                  {row.kind === 'user' ? (
                    <SetTierButton userId={row.data.id} currentTier={row.data.tier} />
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </div>

                {/* Delete */}
                <div className="flex items-center">
                  <DeleteWhitelistButton
                    email={row.kind === 'user' ? row.data.email : row.email}
                  />
                </div>
              </div>
            ))}
          </div>

          <AddToWhitelistForm />
        </section>

        {/* ─── Active but not Whitelisted ──────────────────────────────── */}
        {activeUnwhitelisted.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <h2 className="text-lg font-bold text-white">Active — Not Whitelisted</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                {activeUnwhitelisted.length}
              </span>
              <span className="text-xs text-slate-500 ml-1">Signed in but not on the approved whitelist.</span>
            </div>

            <div className="bg-slate-900 border border-red-500/20 rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_2fr_1.8fr_1fr] gap-4 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Trader</span>
                <span>Email</span>
                <span>Last Login</span>
                <span>Joined</span>
              </div>

              {activeUnwhitelisted.map((user, idx) => (
                <div
                  key={user.id}
                  className={`flex flex-col md:grid md:grid-cols-[2fr_2fr_1.8fr_1fr] gap-2 md:gap-4 px-5 py-4 items-start md:items-center ${
                    idx !== activeUnwhitelisted.length - 1 ? 'border-b border-slate-800/60' : ''
                  } hover:bg-slate-800/30 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {user.avatarUrl ? (
                        <AppImage src={user.avatarUrl} alt={user.displayName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                          {user.displayName[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-white block truncate">{user.displayName || user.username}</span>
                      <span className="text-xs text-slate-500">@{user.username}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 truncate">{user.email}</span>
                  <div>
                    <p className="text-xs text-slate-300">{formatDateTime(user.lastLoginAt)}</p>
                    <p className="text-xs text-slate-500">{timeAgo(user.lastLoginAt)}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDateTime(user.createdAt)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
