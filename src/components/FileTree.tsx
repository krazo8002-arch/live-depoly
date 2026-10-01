import React, { useState, useRef } from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  File,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Search,
  CheckCircle,
  FolderOpen
} from 'lucide-react';
import { ProjectFile } from '../types';

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  onDeleteFile: (path: string) => void;
  onAddFile: (path: string, content: string) => void;
  onUploadZip: (file: File) => void;
  onResetDefault: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onDeleteFile,
  onAddFile,
  onUploadZip,
  onResetDefault
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'server' | 'client' | 'doc' | 'data'>('all');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.path.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'server') return f.category === 'server' || f.path.endsWith('.py');
    if (categoryFilter === 'client') return f.category === 'client' || f.path.includes('dist');
    if (categoryFilter === 'doc') return f.category === 'doc' || f.path.endsWith('.md') || f.path.endsWith('.html');
    if (categoryFilter === 'data') return f.category === 'data' || f.path.endsWith('.json') || f.path.endsWith('.wsdl');
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    const cleanPath = newFilePath.trim().startsWith('tslr-guide/') ? newFilePath.trim() : `tslr-guide/${newFilePath.trim()}`;
    onAddFile(cleanPath, '# New file content\n');
    setNewFilePath('');
    setIsCreatingFile(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        onUploadZip(file);
      }
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: ProjectFile) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'json':
        return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'html':
        return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'css':
        return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'js':
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'md':
      case 'txt':
        return <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'pdf':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'wsdl':
      case 'xml':
        return <FileCode className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
      default:
        return <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    }
  };

  return (
    <div
      id="files"
      className={`bg-neutral-900 border rounded-xl flex flex-col h-[650px] shadow-sm transition-all ${
        isDragging ? 'border-indigo-500 bg-indigo-950/20' : 'border-neutral-800'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Project Explorer
            </h3>
            <span className="text-xs text-neutral-400 font-mono">({files.length} files · {formatSize(totalSize)})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCreatingFile(true)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              title="Add new file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              title="Upload another ZIP file"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetDefault}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              title="Reset to default tslr-guide files"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onUploadZip(e.target.files[0]);
                }
              }}
              accept=".zip"
              className="hidden"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter files by name..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-md border border-neutral-800/80 text-[11px]">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'all' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({files.length})
          </button>
          <button
            onClick={() => setCategoryFilter('server')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'server' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Backend
          </button>
          <button
            onClick={() => setCategoryFilter('client')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'client' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Dist/UI
          </button>
          <button
            onClick={() => setCategoryFilter('data')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'data' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Data
          </button>
          <button
            onClick={() => setCategoryFilter('doc')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'doc' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Docs
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 bg-neutral-950 border-b border-neutral-800 flex gap-2">
          <input
            type="text"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            placeholder="tslr-guide/new-file.py"
            autoFocus
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingFile(false)}
            className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40 p-1">
        {filteredFiles.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            No files match "{searchTerm}"
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            const dirPart = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/') + 1) : '';

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(file)}
                  <div className="truncate min-w-0">
                    {dirPart && (
                      <span className="text-neutral-500 text-[11px] font-mono">{dirPart}</span>
                    )}
                    <span className="font-mono text-neutral-200">{file.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2 shrink-0">
                  <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-700/50 rounded transition-all cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drag & Drop Prompt footer */}
      <div className="p-2.5 border-t border-neutral-800/80 bg-neutral-950/40 text-[11px] text-neutral-500 flex items-center justify-between">
        <span>Drop any <strong>.ZIP</strong> file here to load</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
        >
          Browse file
        </button>
      </div>
    </div>
  );
};
