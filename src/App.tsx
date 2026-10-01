/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TokenCard } from './components/TokenCard';
import { RepoConfigCard } from './components/RepoConfigCard';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { DeploymentModal } from './components/DeploymentModal';
import { TokenGuideModal } from './components/TokenGuideModal';
import { INITIAL_TSLR_FILES } from './data/tslrGuideBundle';
import { ProjectFile, GitHubUser, GitHubOrg, RepoSettings, DeployStep, PushResult } from './types';
import {
  validateGitHubToken,
  fetchUserOrganizations,
  checkRepoExists,
  createRepository,
  pushProjectToGitHub
} from './services/githubApi';
import { parseZipFile, downloadBundleAsZip } from './services/zipService';
import { Info, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';

const LOCAL_STORAGE_TOKEN_KEY = 'gitdeploy_studio_token';

const DEFAULT_STEPS: DeployStep[] = [
  {
    id: 'auth',
    title: 'Authenticate & Verify Scopes',
    description: 'Validating GitHub credentials and write permissions',
    status: 'pending'
  },
  {
    id: 'repo',
    title: 'Setup GitHub Repository',
    description: 'Checking or creating repository on your GitHub account',
    status: 'pending'
  },
  {
    id: 'blobs',
    title: 'Upload Git Blobs',
    description: 'Transforming files into immutable Git blob objects',
    status: 'pending'
  },
  {
    id: 'tree',
    title: 'Build Git Tree Hierarchy',
    description: 'Constructing directory tree with file paths and modes',
    status: 'pending'
  },
  {
    id: 'commit',
    title: 'Create & Sign Commit',
    description: 'Creating commit referencing the root tree',
    status: 'pending'
  },
  {
    id: 'ref',
    title: 'Deploy Branch Reference',
    description: 'Updating or creating the target branch pointer',
    status: 'pending'
  }
];

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_TSLR_FILES);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(INITIAL_TSLR_FILES[0]);

  // Auth state
  const [token, setToken] = useState<string>('');
  const [rememberToken, setRememberToken] = useState<boolean>(true);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Repo Settings
  const [repoSettings, setRepoSettings] = useState<RepoSettings>({
    name: 'tslr-guide',
    owner: '',
    isOrg: false,
    description: 'Tamil Nadu Town Survey Land Register (TSLR) Extraction & Integration Guide and Service',
    isPrivate: false,
    branch: 'main',
    commitMessage: 'Initial commit: Add tslr-guide project files',
    createIfMissing: true
  });

  const [repoAvailability, setRepoAvailability] = useState<{ exists: boolean; defaultBranch?: string; empty?: boolean } | null>(null);
  const [isCheckingRepo, setIsCheckingRepo] = useState<boolean>(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>(DEFAULT_STEPS);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployResult, setDeployResult] = useState<PushResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isTokenGuideOpen, setIsTokenGuideOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('files');

  // Load saved token on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (saved) {
      setToken(saved);
      handleValidate(saved);
    }
  }, []);

  const handleValidate = useCallback(async (tokenToValidate?: string) => {
    const t = tokenToValidate !== undefined ? tokenToValidate : token;
    if (!t.trim()) {
      setValidationError('Please enter a Personal Access Token.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const { user: userData } = await validateGitHubToken(t);
      setUser(userData);
      setSelectedOwner(userData.login);
      setRepoSettings((prev) => ({
        ...prev,
        owner: userData.login,
        isOrg: false
      }));

      // Fetch orgs
      const userOrgs = await fetchUserOrganizations(t);
      setOrgs(userOrgs);

      if (rememberToken) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, t);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      }
    } catch (err: any) {
      setUser(null);
      setValidationError(err.message || 'Token verification failed.');
    } finally {
      setIsValidating(false);
    }
  }, [token, rememberToken]);

  const handleDisconnect = () => {
    setUser(null);
    setToken('');
    setOrgs([]);
    setSelectedOwner('');
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
  };

  // Update repo settings owner when selectedOwner changes
  useEffect(() => {
    if (selectedOwner) {
      const isOrg = orgs.some((o) => o.login === selectedOwner);
      setRepoSettings((prev) => ({
        ...prev,
        owner: selectedOwner,
        isOrg
      }));
    }
  }, [selectedOwner, orgs]);

  // Check repo availability on GitHub debounce
  useEffect(() => {
    if (!token || !user || !repoSettings.name.trim() || !repoSettings.owner) {
      setRepoAvailability(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingRepo(true);
      try {
        const info = await checkRepoExists(token, repoSettings.owner, repoSettings.name);
        setRepoAvailability(info);
      } catch (err) {
        setRepoAvailability(null);
      } finally {
        setIsCheckingRepo(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [token, user, repoSettings.name, repoSettings.owner]);

  // File operations
  const handleUpdateContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent, size: newContent.length } : f))
    );
    if (selectedFile?.path === path) {
      setSelectedFile((prev) => (prev ? { ...prev, content: newContent, size: newContent.length } : null));
    }
  };

  const handleDeleteFile = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path));
    if (selectedFile?.path === path) {
      const remaining = files.filter((f) => f.path !== path);
      setSelectedFile(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleAddFile = (path: string, content: string) => {
    const filename = path.split('/').pop() || path;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const newFile: ProjectFile = {
      path,
      name: filename,
      content,
      isBinary: false,
      size: content.length,
      language: ext,
      category: 'server'
    };
    setFiles((prev) => [...prev, newFile]);
    setSelectedFile(newFile);
  };

  const handleUploadZip = async (file: File) => {
    try {
      const parsed = await parseZipFile(file);
      if (parsed.length > 0) {
        setFiles(parsed);
        setSelectedFile(parsed[0]);
        // Update repo name suggestion from zip filename
        const baseName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9._-]/g, '-');
        setRepoSettings((prev) => ({
          ...prev,
          name: baseName || prev.name
        }));
      }
    } catch (err: any) {
      alert(`Could not read ZIP archive: ${err.message}`);
    }
  };

  const handleResetDefault = () => {
    if (confirm('Reset files to the original Tamil Nadu TSLR Guide bundle?')) {
      setFiles(INITIAL_TSLR_FILES);
      setSelectedFile(INITIAL_TSLR_FILES[0]);
      setRepoSettings((prev) => ({ ...prev, name: 'tslr-guide' }));
    }
  };

  const handleDownloadZip = () => {
    downloadBundleAsZip(files, `${repoSettings.name || 'tslr-guide'}.zip`);
  };

  // Deployment action
  const handleDeploy = async () => {
    if (!token || !user) {
      setIsTokenGuideOpen(true);
      return;
    }

    setIsDeploying(true);
    setIsDeployModalOpen(true);
    setDeployResult(null);
    setDeployError(null);
    setDeployLogs([`Starting deployment of ${files.length} files to ${repoSettings.owner}/${repoSettings.name}...`]);

    const steps = DEFAULT_STEPS.map((s) => ({ ...s, status: 'pending' as const, log: undefined }));
    setDeploySteps(steps);

    const updateStep = (
      stepId: string,
      status: 'pending' | 'in-progress' | 'completed' | 'failed',
      log?: string
    ) => {
      setDeploySteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status, log: log || s.log } : s))
      );
      if (log) {
        setDeployLogs((prev) => [...prev, `[${stepId}] ${log}`]);
      }
    };

    try {
      // Step 1: Auth check
      updateStep('auth', 'in-progress', `Verifying token permissions for ${user.login}...`);
      await validateGitHubToken(token);
      updateStep('auth', 'completed', 'Authorized');

      // Step 2: Check or create repo
      updateStep('repo', 'in-progress', `Checking repository ${repoSettings.owner}/${repoSettings.name}...`);
      const repoInfo = await checkRepoExists(token, repoSettings.owner, repoSettings.name);

      if (!repoInfo.exists) {
        updateStep('repo', 'in-progress', `Creating new ${repoSettings.isPrivate ? 'private' : 'public'} repository...`);
        await createRepository(token, repoSettings.owner, repoSettings.isOrg, {
          name: repoSettings.name,
          description: repoSettings.description,
          isPrivate: repoSettings.isPrivate
        });
        updateStep('repo', 'completed', 'Repository created');
      } else {
        updateStep('repo', 'completed', `Repository exists (${repoInfo.defaultBranch || 'main'})`);
      }

      // Steps 3, 4, 5, 6 via Git Data API
      const result = await pushProjectToGitHub(
        token,
        repoSettings.owner,
        repoSettings.name,
        repoSettings.branch,
        files,
        repoSettings.commitMessage,
        (step, status, msg) => {
          updateStep(step, status, msg);
        }
      );

      setDeployResult(result);
    } catch (err: any) {
      console.error('Deployment error:', err);
      setDeployError(err.message || 'An unknown error occurred during deployment.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleScrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header
        user={user}
        filesCount={files.length}
        onOpenTokenHelp={() => setIsTokenGuideOpen(true)}
        onDownloadZip={handleDownloadZip}
        onScrollToSection={handleScrollToSection}
        activeSection={activeSection}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner: Detected tslr-guide project */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <FolderArchive className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-neutral-100">
                  Detected ZIP Project: <span className="font-mono text-indigo-300">tslr-guide</span>
                </h1>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                  17 Files Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Contains the full Tamil Nadu Town Survey Land Register (TSLR) Python SOAP server, e-District scraping parser, WSDL schema, OpenAPI specification, master taluk data, and client portal UI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (!user) {
                  handleScrollToSection('auth');
                } else {
                  handleDeploy();
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>{user ? 'Push to GitHub' : 'Connect & Push'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Configuration Row: Authentication & Repository Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TokenCard
            token={token}
            setToken={setToken}
            user={user}
            orgs={orgs}
            selectedOwner={selectedOwner}
            setSelectedOwner={setSelectedOwner}
            isValidating={isValidating}
            validationError={validationError}
            onValidate={handleValidate}
            onDisconnect={handleDisconnect}
            onOpenHelp={() => setIsTokenGuideOpen(true)}
            rememberToken={rememberToken}
            setRememberToken={setRememberToken}
          />

          <RepoConfigCard
            settings={repoSettings}
            setSettings={setRepoSettings}
            filesCount={files.length}
            isDeploying={isDeploying}
            onDeploy={handleDeploy}
            isAuthenticated={!!user}
            repoAvailability={repoAvailability}
            isCheckingRepo={isCheckingRepo}
          />
        </div>

        {/* Project Inspector: File Tree & Code Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <FileTree
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onDeleteFile={handleDeleteFile}
              onAddFile={handleAddFile}
              onUploadZip={handleUploadZip}
              onResetDefault={handleResetDefault}
            />
          </div>

          <div className="lg:col-span-8">
            <CodeViewer
              file={selectedFile}
              onUpdateContent={handleUpdateContent}
            />
          </div>
        </div>
      </main>

      {/* Deployment Progress Modal */}
      <DeploymentModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        steps={deploySteps}
        logs={deployLogs}
        isDeploying={isDeploying}
        result={deployResult}
        error={deployError}
        onRetry={handleDeploy}
        repoOwner={repoSettings.owner}
        repoName={repoSettings.name}
      />

      {/* Token Guide Modal */}
      <TokenGuideModal
        isOpen={isTokenGuideOpen}
        onClose={() => setIsTokenGuideOpen(false)}
      />
    </div>
  );
}
