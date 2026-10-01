export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  isBinary: boolean;
  binaryBase64?: string;
  size: number;
  language: string;
  category?: 'server' | 'client' | 'config' | 'doc' | 'asset' | 'data';
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  public_repos: number;
  total_private_repos?: number;
  bio?: string | null;
}

export interface GitHubOrg {
  login: string;
  id: number;
  avatar_url: string;
  description?: string | null;
}

export interface RepoSettings {
  name: string;
  owner: string;
  isOrg: boolean;
  description: string;
  isPrivate: boolean;
  branch: string;
  commitMessage: string;
  createIfMissing: boolean;
}

export interface DeployStep {
  id: 'auth' | 'repo' | 'blobs' | 'tree' | 'commit' | 'ref' | 'finish';
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  log?: string;
}

export interface PushResult {
  success: boolean;
  repoUrl: string;
  cloneUrl: string;
  commitSha: string;
  branch: string;
  filesPushedCount: number;
  createdNewRepo: boolean;
}
