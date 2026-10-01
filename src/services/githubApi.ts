import { GitHubUser, GitHubOrg, ProjectFile, PushResult } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

export async function validateGitHubToken(token: string): Promise<{ user: GitHubUser; scopes: string[] }> {
  if (!token || !token.trim()) {
    throw new Error('Please enter a GitHub Personal Access Token.');
  }

  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(token)
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid GitHub token. Please verify that your token is active and not expired.');
    }
    if (res.status === 403) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'GitHub API rate limit exceeded or access forbidden.');
    }
    throw new Error(`GitHub authentication failed with status ${res.status}`);
  }

  const scopesHeader = res.headers.get('x-oauth-scopes') || '';
  const scopes = scopesHeader.split(',').map(s => s.trim()).filter(Boolean);

  const userData: GitHubUser = await res.json();
  return { user: userData, scopes };
}

export async function fetchUserOrganizations(token: string): Promise<GitHubOrg[]> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/user/orgs?per_page=50`, {
      headers: getHeaders(token)
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch organizations:', err);
    return [];
  }
}

export async function checkRepoExists(token: string, owner: string, repo: string): Promise<{ exists: boolean; defaultBranch?: string; empty?: boolean; htmlUrl?: string }> {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: getHeaders(token)
  });

  if (res.status === 404) {
    return { exists: false };
  }

  if (res.ok) {
    const data = await res.json();
    return {
      exists: true,
      defaultBranch: data.default_branch || 'main',
      empty: data.size === 0,
      htmlUrl: data.html_url
    };
  }

  return { exists: false };
}

export async function createRepository(
  token: string,
  owner: string,
  isOrg: boolean,
  config: { name: string; description: string; isPrivate: boolean }
): Promise<any> {
  const url = isOrg ? `${GITHUB_API_BASE}/orgs/${owner}/repos` : `${GITHUB_API_BASE}/user/repos`;

  const payload = {
    name: config.name.trim(),
    description: config.description.trim(),
    private: config.isPrivate,
    auto_init: false, // We will push our own initial tree
    has_issues: true,
    has_projects: true,
    has_wiki: false
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 422) {
      throw new Error(`Repository "${config.name}" already exists on ${owner}'s account or name is invalid.`);
    }
    throw new Error(errorData.message || `Failed to create repository: ${res.statusText}`);
  }

  return await res.json();
}

export interface ProgressCallback {
  (step: 'auth' | 'repo' | 'blobs' | 'tree' | 'commit' | 'ref' | 'finish', status: 'in-progress' | 'completed' | 'failed', message: string): void;
}

export async function pushProjectToGitHub(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  files: ProjectFile[],
  commitMessage: string,
  onProgress: ProgressCallback
): Promise<PushResult> {
  const headers = getHeaders(token);

  // Step 1: Check ref status (existing branch & commit)
  onProgress('ref', 'in-progress', `Inspecting branch "${branch}" on ${owner}/${repo}...`);
  let parentCommitSha: string | null = null;
  let baseTreeSha: string | null = null;
  let branchRefExists = false;

  try {
    const refRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    if (refRes.ok) {
      branchRefExists = true;
      const refData = await refRes.json();
      parentCommitSha = refData.object.sha;

      // Get tree sha of this parent commit
      const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits/${parentCommitSha}`, { headers });
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        baseTreeSha = commitData.tree.sha;
      }
      onProgress('ref', 'completed', `Found existing branch "${branch}" (HEAD: ${(parentCommitSha || '').slice(0, 7)})`);
    } else {
      onProgress('ref', 'completed', `Branch "${branch}" is fresh; initializing root branch`);
    }
  } catch (err) {
    onProgress('ref', 'completed', `Fresh branch creation prepared`);
  }

  // Step 2: Create Blobs
  onProgress('blobs', 'in-progress', `Uploading ${files.length} file blobs to Git database...`);
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress('blobs', 'in-progress', `Uploading [${i + 1}/${files.length}]: ${file.path}`);

    const isBinary = file.isBinary && !!file.binaryBase64;
    const blobPayload = isBinary
      ? { content: file.binaryBase64, encoding: 'base64' }
      : { content: file.content, encoding: 'utf-8' };

    const blobRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(blobPayload)
    });

    if (!blobRes.ok) {
      const err = await blobRes.json().catch(() => ({}));
      throw new Error(`Failed to upload blob for "${file.path}": ${err.message || blobRes.statusText}`);
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha
    });
  }
  onProgress('blobs', 'completed', `Successfully created ${files.length} Git blobs`);

  // Step 3: Create Git Tree
  onProgress('tree', 'in-progress', 'Constructing Git Tree object hierarchy...');
  const treePayload: Record<string, any> = { tree: treeItems };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treePayload)
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git tree: ${err.message || treeRes.statusText}`);
  }

  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;
  onProgress('tree', 'completed', `Git Tree created: ${newTreeSha.slice(0, 7)}`);

  // Step 4: Create Commit
  onProgress('commit', 'in-progress', `Creating commit: "${commitMessage}"...`);
  const commitPayload = {
    message: commitMessage || 'Initial commit via GitDeploy Studio',
    tree: newTreeSha,
    parents: parentCommitSha ? [parentCommitSha] : []
  };

  const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(commitPayload)
  });

  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git commit: ${err.message || commitRes.statusText}`);
  }

  const commitData = await commitRes.json();
  const newCommitSha = commitData.sha;
  onProgress('commit', 'completed', `Commit sealed: ${newCommitSha.slice(0, 7)}`);

  // Step 5: Update or Create Ref
  onProgress('ref', 'in-progress', `Pointing refs/heads/${branch} to commit ${newCommitSha.slice(0, 7)}...`);
  if (branchRefExists) {
    const updateRefRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitSha, force: true })
    });
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      throw new Error(`Failed to update ref heads/${branch}: ${err.message || updateRefRes.statusText}`);
    }
  } else {
    const createRefRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommitSha })
    });
    if (!createRefRes.ok) {
      const err = await createRefRes.json().catch(() => ({}));
      throw new Error(`Failed to create branch reference: ${err.message || createRefRes.statusText}`);
    }
  }
  onProgress('ref', 'completed', `Branch "${branch}" is live!`);

  onProgress('finish', 'completed', `All ${files.length} files successfully deployed to GitHub!`);

  return {
    success: true,
    repoUrl: `https://github.com/${owner}/${repo}`,
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
    commitSha: newCommitSha,
    branch,
    filesPushedCount: files.length,
    createdNewRepo: !branchRefExists
  };
}
