import React, { useState, useEffect } from 'react';
import { Copy, Check, Edit3, Save, RotateCcw, FileText, Download } from 'lucide-react';
import { ProjectFile } from '../types';

interface CodeViewerProps {
  file: ProjectFile | null;
  onUpdateContent: (path: string, newContent: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ file, onUpdateContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (file) {
      setEditedContent(file.content);
      setIsEditing(false);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl h-[650px] flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <FileText className="w-12 h-12 text-neutral-700 mb-3 stroke-1" />
        <h3 className="text-sm font-medium text-neutral-300">No File Selected</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs">
          Select a file from the project explorer on the left to inspect code, edit contents, or preview details.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSave = () => {
    onUpdateContent(file.path, editedContent);
    setIsEditing(false);
  };

  const handleRevert = () => {
    setEditedContent(file.content);
    setIsEditing(false);
  };

  const handleDownloadBinary = () => {
    if (!file.binaryBase64) return;
    const byteCharacters = atob(file.binaryBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = (isEditing ? editedContent : file.content).split('\n');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl h-[650px] flex flex-col shadow-sm overflow-hidden">
      {/* File Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-mono font-medium text-neutral-200 truncate">{file.path}</span>
          <span className="text-xs text-neutral-500">·</span>
          <span className="text-[11px] text-neutral-400 font-mono uppercase">{file.language}</span>
          <span className="text-xs text-neutral-500">·</span>
          <span className="text-[11px] text-neutral-400 font-mono tabular-nums">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2">
          {!file.isBinary && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleRevert}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded transition-colors cursor-pointer"
                  title="Edit file content before push"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded transition-colors cursor-pointer"
                title="Copy code to clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </>
          )}

          {file.isBinary && (
            <button
              onClick={handleDownloadBinary}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor / Viewer Body */}
      <div className="flex-1 overflow-auto bg-neutral-950 font-mono text-xs text-neutral-200">
        {file.isBinary ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-200">{file.name}</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              Binary asset encoded in Base64 ({(file.size / 1024).toFixed(1)} KB).
              This file will be deployed to GitHub as a binary Git blob with full integrity.
            </p>
            <button
              onClick={handleDownloadBinary}
              className="mt-4 px-3 py-1.5 text-xs text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Preview / Download {file.name}</span>
            </button>
          </div>
        ) : isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full p-4 bg-neutral-950 text-neutral-100 font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-indigo-500/40"
            spellCheck={false}
          />
        ) : (
          <div className="p-4 flex text-xs leading-relaxed">
            {/* Line numbers */}
            <div className="select-none pr-4 text-right text-neutral-600 font-mono tabular-nums border-r border-neutral-850 shrink-0">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code lines */}
            <div className="pl-4 overflow-x-auto flex-1 font-mono text-neutral-200">
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre hover:bg-neutral-900/60 px-1 rounded">
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
