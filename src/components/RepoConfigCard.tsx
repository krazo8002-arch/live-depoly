import React from 'react';
import { FolderGit2, Lock, Globe, GitBranch, ArrowRight, Loader2, GitCommit, AlertCircle } from 'lucide-react';
import { RepoSettings } from '../types';

interface RepoConfigCardProps {
  settings: RepoSettings;
  setSettings: React.Dispatch<React.SetStateAction<RepoSettings>>;
  filesCount: number;
  isDeploying: boolean;
  onDeploy: () => void;
  isAuthenticated: boolean;
  repoAvailability: { exists: boolean; defaultBranch?: string; empty?: boolean } | null;
  isCheckingRepo: boolean;
}

export const RepoConfigCard: React.FC<RepoConfigCardProps> = ({
  settings,
  setSettings,
  filesCount,
  isDeploying,
  onDeploy,
  isAuthenticated,
  repoAvailability,
  isCheckingRepo
}) => {
  const handleNameChange = (val: string) => {
    // Sanitize repo name (lowercase/alphanumeric and dashes)
    const clean = val.replace(/[^a-zA-Z0-9._-]/g, '-');
    setSettings((prev) => ({ ...prev, name: clean }));
  };

  const isFormValid = settings.name.trim().length > 0 && isAuthenticated;

  return (
    <div id="config" className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-300">
            <FolderGit2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Repository Setup</h2>
            <p className="text-xs text-neutral-400">Configure target repository name, visibility, and branch details</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="text-xs text-neutral-400 font-mono">
            {settings.owner}/{settings.name || '...'}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Repo Name & Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Repository Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="tslr-guide"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
              />
              {isCheckingRepo && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                </div>
              )}
            </div>

            {repoAvailability && (
              <div className="mt-1.5 text-[11px]">
                {repoAvailability.exists ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Repository already exists. Will commit new files to branch "{repoAvailability.defaultBranch || settings.branch}".
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 shrink-0" />
                    New repository will be created under <strong>{settings.owner}/{settings.name}</strong>.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, isPrivate: false }))}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  !settings.isPrivate
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Public</span>
              </button>
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, isPrivate: true }))}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  settings.isPrivate
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Private</span>
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Repository Description
          </label>
          <input
            type="text"
            value={settings.description}
            onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Official integration guide and Python SOAP/REST bridge service for Tamil Nadu TSLR"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Branch & Commit Message */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-neutral-400" />
              <span>Target Branch</span>
            </label>
            <input
              type="text"
              value={settings.branch}
              onChange={(e) => setSettings((prev) => ({ ...prev, branch: e.target.value }))}
              placeholder="main"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
              <GitCommit className="w-3 h-3 text-neutral-400" />
              <span>Commit Message</span>
            </label>
            <input
              type="text"
              value={settings.commitMessage}
              onChange={(e) => setSettings((prev) => ({ ...prev, commitMessage: e.target.value }))}
              placeholder="Initial commit: Add tslr-guide project files"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Deploy Action Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800/80">
          <div className="text-xs text-neutral-400">
            <span>Ready to push </span>
            <strong className="text-neutral-200">{filesCount} files</strong>
            <span> to </span>
            <code className="text-indigo-300 font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
              {settings.owner || 'user'}/{settings.name || 'repo'}:{settings.branch}
            </code>
          </div>

          <button
            onClick={onDeploy}
            disabled={!isFormValid || isDeploying || filesCount === 0}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying to GitHub...</span>
              </>
            ) : (
              <>
                <span>Create & Push to GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
