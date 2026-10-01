import JSZip from 'jszip';
import { ProjectFile } from '../types';

export async function parseZipFile(file: File): Promise<ProjectFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const projectFiles: ProjectFile[] = [];

  const entries = Object.keys(loadedZip.files);
  for (const relativePath of entries) {
    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) {
      continue;
    }

    const filename = relativePath.split('/').pop() || relativePath;
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Check if file is likely binary
    const isBinary = isBinaryExtension(ext);

    if (isBinary) {
      const base64 = await zipEntry.async('base64');
      projectFiles.push({
        path: relativePath,
        name: filename,
        content: `[Binary File: ${filename} (${ext.toUpperCase()})]`,
        isBinary: true,
        binaryBase64: base64,
        size: Math.round((base64.length * 3) / 4),
        language: getLanguageFromExt(ext),
        category: categorizeFile(relativePath, ext)
      });
    } else {
      const text = await zipEntry.async('string');
      projectFiles.push({
        path: relativePath,
        name: filename,
        content: text,
        isBinary: false,
        size: text.length,
        language: getLanguageFromExt(ext),
        category: categorizeFile(relativePath, ext)
      });
    }
  }

  return projectFiles;
}

export async function downloadBundleAsZip(files: ProjectFile[], zipName: string = 'project.zip'): Promise<void> {
  const zip = new JSZip();

  for (const f of files) {
    if (f.isBinary && f.binaryBase64) {
      zip.file(f.path, f.binaryBase64, { base64: true });
    } else {
      zip.file(f.path, f.content);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isBinaryExtension(ext: string): boolean {
  const binaryExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svgz',
    'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
    'exe', 'dll', 'so', 'dylib', 'bin', 'pyc',
    'woff', 'woff2', 'ttf', 'otf', 'eot',
    'mp3', 'mp4', 'wav', 'ogg', 'mov'
  ]);
  return binaryExtensions.has(ext);
}

export function getLanguageFromExt(ext: string): string {
  switch (ext) {
    case 'py': return 'python';
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'xml':
    case 'wsdl': return 'xml';
    case 'txt': return 'text';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'sh': return 'bash';
    case 'pdf': return 'pdf';
    default: return 'text';
  }
}

export function categorizeFile(path: string, ext: string): ProjectFile['category'] {
  if (path.includes('server') || path.endsWith('.py') || path.includes('service')) return 'server';
  if (path.includes('dist') || path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) return 'client';
  if (ext === 'json') return 'data';
  if (ext === 'md' || ext === 'txt') return 'doc';
  if (isBinaryExtension(ext)) return 'asset';
  return 'config';
}
