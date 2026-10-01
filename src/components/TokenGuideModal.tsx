import React from 'react';
import { ExternalLink, KeyRound, ShieldAlert, Check, Copy, HelpCircle } from 'lucide-react';

interface TokenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenGuideModal: React.FC<TokenGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen) return null;

  const directUrl = 'https://github.com/settings/tokens/new?scopes=repo&description=GitDeploy+Studio';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              How to Get a GitHub Personal Access Token
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-neutral-300">
          {/* 1-Click Shortcut */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-200">1-Click Preconfigured Token Link</span>
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open GitHub Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-neutral-300 text-[11px]">
              This link opens GitHub Token creation with the <code>repo</code> scope and description already filled in.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
              Manual 3-Step Walkthrough
            </h4>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                1
              </div>
              <div>
                <strong className="text-neutral-100">Go to Developer Settings</strong>
                <p className="text-neutral-400 mt-0.5">
                  Click your GitHub profile icon → <em>Settings</em> → <em>Developer Settings</em> → <em>Personal access tokens</em> → <em>Tokens (classic)</em>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                2
              </div>
              <div>
                <strong className="text-neutral-100">Select the "repo" Scope</strong>
                <p className="text-neutral-400 mt-0.5">
                  Check the top-level <code>repo</code> checkbox (Full control of private repositories). This allows creating repositories, uploading Git blobs, and committing files.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                3
              </div>
              <div>
                <strong className="text-neutral-100">Generate & Copy</strong>
                <p className="text-neutral-400 mt-0.5">
                  Click <em>Generate token</em> at the bottom, copy the <code>ghp_...</code> string, and paste it into GitDeploy Studio.
                </p>
              </div>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-400 leading-relaxed">
              <strong className="text-neutral-300">Client-Side Security Guarantee:</strong> Your token is stored only in your browser's local memory and communicates directly with GitHub's official REST API (<code>api.github.com</code>). It is never sent to any third-party intermediary.
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="text-neutral-400 hover:text-neutral-200 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Link' : 'Copy Direct URL'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
