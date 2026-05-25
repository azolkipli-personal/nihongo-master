import { BACKEND_OPTIONS } from '../../services/syncBackend';
import type { AppConfig } from '../../types';

type SyncBackendType = AppConfig['syncBackend'];

interface SyncSectionProps {
  syncBackend: SyncBackendType;
  syncNucUrl: string;
  onSyncBackendChange: (backend: SyncBackendType) => void;
  onSyncNucUrlChange: (url: string) => void;
  onPushSync?: () => void;
  onPullSync?: () => void;
  onForcePushSync?: () => void;
}

export function SyncSection({
  syncBackend,
  syncNucUrl,
  onSyncBackendChange,
  onSyncNucUrlChange,
  onPushSync,
  onPullSync,
  onForcePushSync,
}: SyncSectionProps) {
  const isNuc = syncBackend === 'nuc';

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

      {/* NUC URL Field */}
      {isNuc && (
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

      {/* Sync Controls — only show when NUC backend is selected */}
      {isNuc && (
        <div className="mt-2 pt-4 border-t border-gray-700">
          <p className="text-xs font-medium text-gray-400 mb-3">Sync Controls</p>
          <div className="flex gap-2">
            <button
              onClick={onPullSync}
              disabled={!onPullSync}
              className="flex-1 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              ↓ Pull from Server
            </button>
            <button
              onClick={onPushSync}
              disabled={!onPushSync}
              className="flex-1 px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              ↑ Push to Server
            </button>
            <button
              onClick={onForcePushSync}
              disabled={!onForcePushSync}
              className="flex-1 px-3 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              title="Force push overwrites server data even if it's newer. Use with caution!"
            >
              ↑↑ Force Push
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pull = download server data here. Push = upload your current data to server. Force Push
            = overwrite server data with your current data (ignores timestamps). Data is also synced
            automatically every 30 seconds.
          </p>
        </div>
      )}
    </div>
  );
}
