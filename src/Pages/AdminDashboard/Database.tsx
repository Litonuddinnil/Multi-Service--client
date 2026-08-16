import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Database, Download, HardDrive, RefreshCw, Server } from 'lucide-react';
import type { AdminOutletContext } from './AdminOutletContext';

/**
 * Admin Dashboard → MongoDB & JSON Storage tab.
 *
 * Lets the admin:
 *   - Sync the live JSON files into the MongoDB mirror
 *   - Export a full JSON snapshot for offline backup
 *   - Re-seed the database to a known-good baseline
 *
 * Plus a diagnostics card showing the runtime database type and per-collection
 * document counts (rendered from the loose-typed `dbStatus` payload).
 */
export const DatabaseTab: React.FC = () => {
  const {
    dbStatus,
    loading,
    handleSyncMongo,
    handleExportJsonBackup,
    handleSeedDatabase,
  } = useOutletContext<AdminOutletContext>();

  const [acting, setActing] = useState<'sync' | 'export' | 'seed' | null>(null);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  const databaseType = (dbStatus?.databaseType as string) ?? 'JSON';
  const isMongo = databaseType.toLowerCase().includes('mongo');
  const isHealthy = dbStatus?.isMongoConnected ?? isMongo;

  const collectionsRecord = (dbStatus?.collections ?? {}) as Record<
    string,
    { count: number; sizeBytes: number }
  >;

  const collections = Object.entries(collectionsRecord).map(([name, info]) => ({
    name,
    count: info?.count ?? 0,
    sizeBytes: info?.sizeBytes ?? 0,
  }));

  const totalDocs = collections.reduce((acc, c) => acc + c.count, 0);

  const onSync = async () => {
    setActing('sync');
    try {
      await handleSyncMongo();
    } finally {
      setActing(null);
    }
  };

  const onExport = async () => {
    setActing('export');
    try {
      await handleExportJsonBackup();
    } finally {
      setActing(null);
    }
  };

  const onSeed = async () => {
    setActing('seed');
    try {
      await handleSeedDatabase();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`bg-gradient-to-br ${
          isHealthy ? 'from-emerald-900 to-teal-900' : 'from-slate-800 to-slate-900'
        } rounded-3xl p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center gap-6`}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Server className="w-7 h-7 text-emerald-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-200">
              Infrastructure
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                isHealthy
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
              }`}
            >
              {isHealthy ? 'Online' : 'Fallback Mode'}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold mb-1">
            Database: {databaseType}
          </h3>
          <p className="text-emerald-100 text-sm max-w-3xl">
            The platform supports dual-write to MongoDB and a local JSON fallback. Sync the live
            data into the persistent store, export a backup file for archival, or reseed the
            baseline.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ActionCard
          icon={<RefreshCw className="w-5 h-5" />}
          title="Sync JSON → MongoDB"
          description="Push all current JSON file contents into the MongoDB mirror. Safe to re-run."
          ctaLabel={acting === 'sync' ? 'Syncing...' : 'Run Sync'}
          accent="emerald"
          onClick={onSync}
          disabled={acting !== null}
        />

        <ActionCard
          icon={<Download className="w-5 h-5" />}
          title="Export JSON Backup"
          description="Download a complete snapshot of users, experts, services, bookings and orders."
          ctaLabel={acting === 'export' ? 'Preparing...' : 'Download Backup'}
          accent="blue"
          onClick={onExport}
          disabled={acting !== null}
        />

        <ActionCard
          icon={<Database className="w-5 h-5" />}
          title="Reseed Database"
          description="Reset to the default baseline (expert personas, services, sample bookings)."
          ctaLabel={acting === 'seed' ? 'Seeding...' : 'Seed Database'}
          accent="amber"
          onClick={onSeed}
          disabled={acting !== null}
          destructive
        />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-900">Collection Diagnostics</h3>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {collections.length} collections • {totalDocs.toLocaleString()} documents
          </span>
        </div>

        {collections.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No diagnostics available. Try syncing MongoDB or refreshing the dashboard.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-gray-500 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Collection</th>
                  <th className="p-4">Document Count</th>
                  <th className="p-4">Storage Class</th>
                  <th className="p-4 text-right">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {collections.map((collection) => {
                  const quota = Math.max(collection.count, 1);
                  const pct = Math.min(100, (collection.count / (quota * 1.5)) * 100);

                  return (
                    <tr key={collection.name} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <p className="font-mono font-bold text-gray-900">{collection.name}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-700 text-sm">
                          {collection.count.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          JSON Document
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden ml-auto">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isHealthy && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Running On JSON Fallback</p>
            <p className="text-xs text-amber-700">
              MongoDB is currently unreachable. The platform is reading from local JSON files in
              <code className="font-mono mx-1">/server/data/</code>
              so all features still work, but data is not durably persisted across server restarts.
              Sync once MongoDB is reachable again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* ActionCard                                                          */
/* ------------------------------------------------------------------ */

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  accent: 'emerald' | 'blue' | 'amber';
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  ctaLabel,
  accent,
  onClick,
  disabled,
  destructive,
}) => {
  const accentMap = {
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
    blue: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700',
    amber: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700',
  };

  const ctaMap = {
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-90',
    blue: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90',
    amber: 'bg-gradient-to-r from-amber-600 to-orange-700 hover:opacity-90',
  };

  return (
    <div
      className={`rounded-2xl border p-5 bg-gradient-to-br ${accentMap[accent]} flex flex-col gap-3`}
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shadow-xs">
          {icon}
        </div>
        <h4 className="font-extrabold text-sm">{title}</h4>
      </div>
      <p className="text-xs leading-relaxed opacity-90">{description}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-auto px-4 py-2 rounded-xl font-bold text-xs text-white cursor-pointer inline-flex items-center justify-center gap-1.5 transition-opacity ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${destructive ? 'bg-gradient-to-r from-red-600 to-rose-700' : ctaMap[accent]}`}
      >
        {ctaLabel}
      </button>
    </div>
  );
};

export default DatabaseTab;