import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Github,
  Terminal,
  ShieldCheck,
  GitBranch,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DeployStep, PushResult } from '../types';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: DeployStep[];
  logs: string[];
  isDeploying: boolean;
  result: PushResult | null;
  error: string | null;
  onRetry: () => void;
  repoOwner: string;
  repoName: string;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({
  isOpen,
  onClose,
  steps,
  logs,
  isDeploying,
  result,
  error,
  onRetry,
  repoOwner,
  repoName
}) => {
  const [copiedClone, setCopiedClone] = React.useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (result && result.success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result]);

  if (!isOpen) return null;

  const handleCopyClone = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.cloneUrl);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Github className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                {result
                  ? 'Deployment Complete!'
                  : error
                  ? 'Deployment Encountered an Issue'
                  : 'Pushing Project to GitHub...'}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                {repoOwner}/{repoName}
              </p>
            </div>
          </div>

          {!isDeploying && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Success Banner */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-emerald-200">
                    {result.createdNewRepo
                      ? 'Repository created and files pushed successfully!'
                      : 'New commit successfully pushed to existing repository!'}
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-1">
                    Deployed {result.filesPushedCount} files into branch <code>{result.branch}</code> with commit{' '}
                    <span className="font-mono font-medium">{result.commitSha.slice(0, 7)}</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-900/60">
                <a
                  href={result.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={handleCopyClone}
                  className="px-3 py-1.5 text-xs text-emerald-200 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedClone ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedClone ? 'Copied Clone URL' : 'Copy git clone'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-200">Failed to Complete Push</h4>
                <p className="text-xs text-red-300/90 mt-1">{error}</p>
                <button
                  onClick={onRetry}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Retry Deployment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Stepper Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Deployment Pipeline
            </h4>
            <div className="space-y-2">
              {steps.map((step) => {
                const isCurrent = step.status === 'in-progress';
                const isDone = step.status === 'completed';
                const isFail = step.status === 'failed';

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
                      isDone
                        ? 'bg-neutral-950 border-neutral-800/90 text-neutral-200'
                        : isCurrent
                        ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200 shadow-sm'
                        : isFail
                        ? 'bg-red-950/20 border-red-800/50 text-red-200'
                        : 'bg-neutral-950/40 border-neutral-800/40 text-neutral-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {isCurrent && <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />}
                      {isFail && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      {!isDone && !isCurrent && !isFail && (
                        <div className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
                      )}

                      <div>
                        <div className="font-medium text-neutral-100">{step.title}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{step.description}</div>
                      </div>
                    </div>

                    {step.log && (
                      <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline max-w-[200px] truncate">
                        {step.log}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Terminal Log Stream */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                Live Git Log
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">{logs.length} entries</span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-[11px] text-neutral-300 h-36 overflow-y-auto space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-neutral-600 select-none">&gt;</span>
                  <span className="text-neutral-300">{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            {result ? 'Done' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
