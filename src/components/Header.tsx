import React from 'react';
import { Download, Github, HelpCircle, ShieldCheck } from 'lucide-react';
import { GitHubUser } from '../types';

interface HeaderProps {
  user: GitHubUser | null;
  filesCount: number;
  onOpenTokenHelp: () => void;
  onDownloadZip: () => void;
  onScrollToSection: (sectionId: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  filesCount,
  onOpenTokenHelp,
  onDownloadZip,
  onScrollToSection,
  activeSection
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-inner">
          <Github className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white">GitDeploy Studio</span>
          <span className="hidden sm:inline text-xs text-neutral-500">·</span>
          <span className="hidden sm:inline text-xs text-neutral-400 font-mono">tslr-guide</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onScrollToSection('files')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeSection === 'files' ? 'text-white font-semibold' : ''
          }`}
        >
          Files ({filesCount})
        </button>
        <button
          onClick={() => onScrollToSection('auth')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeSection === 'auth' ? 'text-white font-semibold' : ''
          }`}
        >
          GitHub Account
        </button>
        <button
          onClick={() => onScrollToSection('config')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeSection === 'config' ? 'text-white font-semibold' : ''
          }`}
        >
          Repository Setup
        </button>
        <button
          onClick={onOpenTokenHelp}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
          <span>Token Guide</span>
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700/60 text-xs">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-5 h-5 rounded-full ring-1 ring-emerald-500/50"
              referrerPolicy="no-referrer"
            />
            <span className="font-medium text-neutral-200">{user.login}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ) : null}

        <button
          onClick={onDownloadZip}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-md transition-colors whitespace-nowrap cursor-pointer hover:text-white"
          title="Download the current files as a clean .ZIP archive"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export ZIP</span>
        </button>
      </div>
    </header>
  );
};
