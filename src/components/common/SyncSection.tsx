import { BACKEND_OPTIONS } from '../../services/syncBackend';
import type { AppConfig } from '../../types';

type SyncBackendType = AppConfig['syncBackend'];

interface SyncSectionProps {
  syncBackend: SyncBackendType;
  syncNucUrl: string;
  onSyncBackendChange: (backend: SyncBackendType) => void;
  onSyncNucUrlChange: (url: string) => void;
}

export function SyncSection({
  syncBackend,
  syncNucUrl,
  onSyncBackendChange,
  onSyncNucUrlChange,
}: SyncSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">
        Data Storage
      </h3>
      <p className="text-xs text-gray-500 mb-4">Sync your learning progress across devices.</p>

      {/* Storage Backend Dropdown */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-1">Storage Backend</label>
        <select
          className="w-full px-3 py-2 text-sm bg-[#131729] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#7C89FF]"
          value={syncBackend}
          onChange={(e) => onSyncBackendChange(e.target.value as SyncBackendType)}
        >
          {BACKEND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === 'gdrive'}>
              {opt.label}
            </option>
          ))}
        </select>
        {syncBackend === 'gdrive' && (
          <p className="text-xs text-amber-400 mt-1">Google Drive sync is coming soon.</p>
        )}
      </div>

      {/* NUC URL Field (only shown when NUC backend selected) */}
      {syncBackend === 'nuc' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">NUC Backend URL</label>
          <input
            type="text"
            className="w-full px-3 py-2 text-sm bg-[#131729] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#7C89FF]"
            placeholder="http://localhost:9001"
            value={syncNucUrl}
            onChange={(e) => onSyncNucUrlChange(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default <code className="text-[#7C89FF]">http://localhost:9001</code>. Use tailnet FQDN
            for remote access.
          </p>
        </div>
      )}
    </div>
  );
}
