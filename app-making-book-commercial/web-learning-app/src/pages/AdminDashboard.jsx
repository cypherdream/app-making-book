import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldAlert, Users, BookOpen, Activity, AlertTriangle, Ban, X, Loader2 } from 'lucide-react';
import { getDashboard, getUsers, banUser, unbanUser, getRateLimitHits } from '../services/adminApi';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-4">
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-1">
        <Icon size={12} /> {label}
      </div>
      <div className="text-2xl font-semibold" style={{ color: accent }}>{value}</div>
    </div>
  );
}

/**
 * The visual counterpart to GET /api/admin/dashboard — previously
 * that data only existed as raw JSON with nowhere to actually look at
 * it. Requires an admin JWT; the backend enforces this regardless of
 * what this page does client-side.
 */
export default function AdminDashboard({ onClose }) {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [rateLimitHits, setRateLimitHits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, userList, hits] = await Promise.all([getDashboard(), getUsers(), getRateLimitHits()]);
      setData(dashboard);
      setUsers(userList);
      setRateLimitHits(hits);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleBan = async (user) => {
    try {
      if (user.lockedUntil) await unbanUser(user.id);
      else await banUser(user.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldAlert size={18} /> Admin Dashboard
          </h2>
          <button onClick={onClose} aria-label="Close"><X size={18} className="text-[var(--text-muted)]" /></button>
        </div>

        {loading && <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 className="animate-spin" size={14} /> Loading…</div>}
        {error && <p className="text-sm text-red-400 mb-3">{error} — you likely need an admin account (see backend/prisma/seedAdmin.ts).</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard icon={Users} label="Users" value={data.userCount} accent="#8B7FD6" />
              <StatCard icon={BookOpen} label="Lessons" value={data.lessonCount} accent="#D69A3C" />
              <StatCard icon={Activity} label="Events (7d)" value={data.eventsLast7Days} accent="#7EC1E8" />
              <StatCard icon={AlertTriangle} label="Errors (7d)" value={data.errorsLast7Days} accent="#F27373" />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                <span>Uptime (last 50 self-checks)</span>
                <span>{data.uptimePctLast50Checks != null ? `${data.uptimePctLast50Checks}%` : 'No data yet'}</span>
              </div>
              {data.recentHealthChecks?.length > 0 && (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={[...data.recentHealthChecks].reverse().map((h, i) => ({ i, latency: h.latencyMs }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="i" hide />
                    <YAxis width={30} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="latency" stroke="#8B7FD6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {rateLimitHits.length > 0 && (
              <div className="mb-6">
                <div className="text-xs text-[var(--text-muted)] mb-2">Rate limit hits by route (all time)</div>
                <div className="space-y-1">
                  {rateLimitHits.map((h) => (
                    <div key={h.route} className="flex justify-between text-xs text-[var(--text-secondary)]">
                      <span className="font-mono">{h.route}</span><span>{h.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-[var(--text-muted)] mb-2">Users ({users.length})</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs p-2 rounded border border-[var(--border)]">
                    <div>
                      <div className="text-[var(--text-primary)]">{u.name} {u.isAdmin && <span className="text-amber-400">(admin)</span>}</div>
                      <div className="text-[var(--text-muted)]">{u.email}</div>
                    </div>
                    <button
                      onClick={() => toggleBan(u)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${u.lockedUntil ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                    >
                      <Ban size={10} /> {u.lockedUntil ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
