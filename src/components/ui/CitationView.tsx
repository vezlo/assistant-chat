import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { getCitationContext } from '../../api/citation';

interface Source {
  document_uuid: string;
  document_title: string;
  chunk_indices: number[];
}

interface CitationViewProps {
  sources: Source[];
}

// MIME type to extension mapping
const mimeToExtension: Record<string, string> = {
  'text/javascript': '.js',
  'application/javascript': '.js',
  'text/jsx': '.jsx',
  'text/typescript': '.ts',
  'application/typescript': '.ts',
  'text/tsx': '.tsx',
  'text/x-python': '.py',
  'text/python': '.py',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
  'application/json': '.json',
  'text/html': '.html',
  'text/css': '.css',
  'text/plain': '.txt',
  'text/xml': '.xml',
};

function getFileExtension(title: string, fileType?: string): string {
  // First try to extract from filename
  const match = title.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    return `.${match[1]}`;
  }
  
  // Fallback to MIME type mapping
  if (fileType && mimeToExtension[fileType]) {
    return mimeToExtension[fileType];
  }
  
  // Default to .txt
  return '.txt';
}

export function CitationView({ sources }: CitationViewProps) {
  const [loadingUuid, setLoadingUuid] = useState<string | null>(null);

  const handleDownloadSource = async (source: Source) => {
    setLoadingUuid(source.document_uuid);
    try {
      if (!source.document_uuid || !source.chunk_indices || source.chunk_indices.length === 0) {
        setLoadingUuid(null);
        alert('Invalid source data. UUID or chunk indices are missing.');
        return;
      }
      
      const context = await getCitationContext(source.document_uuid, source.chunk_indices);
      
      if (!context || !context.content) {
        setLoadingUuid(null);
        alert('No content available for this source.');
        return;
      }
      
      // Determine file extension
      const extension = getFileExtension(context.document_title, context.file_type);
      const filename = context.document_title.endsWith(extension) 
        ? context.document_title 
        : `${context.document_title}${extension}`;
      
      // Create blob and download
      const blob = new Blob([context.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLoadingUuid(null);
    } catch (err) {
      console.error('Failed to download source:', err);
      setLoadingUuid(null);
      alert('Failed to download source content. Please try again.');
    }
  };

  return (
    <div className="mt-2 border-t border-gray-100 pt-2">
      <div className="text-xs text-gray-500 mb-1 font-medium">Sources:</div>
      <div className="space-y-1">
        {sources.map((source, index) => {
          const isLoading = loadingUuid === source.document_uuid;
          return (
            <button
              key={index}
              onClick={() => handleDownloadSource(source)}
              disabled={isLoading}
              className="w-full text-left px-2 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded flex items-center gap-1 transition-colors group cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
              ) : (
                <Download className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="truncate">{source.document_title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

