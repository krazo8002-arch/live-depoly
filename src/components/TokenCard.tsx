import React, { useState } from 'react';
import { KeyRound, ExternalLink, CheckCircle2, AlertTriangle, Eye, EyeOff, Building, User, LogOut, Loader2 } from 'lucide-react';
import { GitHubUser, GitHubOrg } from '../types';

interface TokenCardProps {
  token: string;
  setToken: (val: string) => void;
  user: GitHubUser | null;
  orgs: GitHubOrg[];
  selectedOwner: string;
  setSelectedOwner: (val: string) => void;
  isValidating: boolean;
  validationError: string | null;
  onValidate: (t?: string) => void;
  onDisconnect: () => void;
  onOpenHelp: () => void;
  rememberToken: boolean;
  setRememberToken: (val: boolean) => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  setToken,
  user,
  orgs,
  selectedOwner,
  setSelectedOwner,
  isValidating,
  validationError,
  onValidate,
  onDisconnect,
  onOpenHelp,
  rememberToken,
  setRememberToken
}) => {
  const [showToken, setShowToken] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onValidate(token);
    }
  };

  return (
    <div id="auth" className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-300">
            <KeyRound className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">GitHub Authentication</h2>
            <p className="text-xs text-neutral-400">Connect using a Personal Access Token (Classic or Fine-grained) with repo permissions</p>
          </div>
        </div>

        <button
          onClick={onOpenHelp}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Need a token?</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {!user ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxxxxxx"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => onValidate(token)}
                  disabled={!token.trim() || isValidating}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Verifying</span>
                    </>
                  ) : (
                    <span>Connect</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberToken}
                onChange={(e) => setRememberToken(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-950 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Remember token in this browser</span>
            </label>

            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=GitDeploy+Studio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1 underline underline-offset-2"
            >
              <span>Generate pre-configured token on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {validationError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-200">Connection Failed</p>
                <p className="text-red-300/90 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-10 h-10 rounded-full ring-2 ring-emerald-500/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-neutral-100">{user.name || user.login}</span>
                  <span className="text-xs text-neutral-400 font-mono">@{user.login}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authenticated
                  </span>
                  <span>·</span>
                  <span>{user.public_repos} public repos</span>
                  {user.total_private_repos !== undefined && (
                    <>
                      <span>·</span>
                      <span>{user.total_private_repos} private</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnect}
              className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-900 border border-neutral-800 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Disconnect GitHub Token"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>

          {/* Owner selector: Personal vs Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Target GitHub Account / Organization
              </label>
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={user.login}>Personal ({user.login})</option>
                {orgs.map((org) => (
                  <option key={org.login} value={org.login}>
                    Organization ({org.login})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full text-xs text-neutral-400 bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-2.5 flex items-center gap-2">
                {selectedOwner === user.login ? (
                  <>
                    <User className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Deploying to personal repo under <strong>github.com/{user.login}</strong></span>
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Deploying to organization repo under <strong>github.com/{selectedOwner}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
