import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { getCitationContext } from '../../api/citation';

interface Source {
  document_uuid: string;
  document_title: string;
  chunk_indices: number[];
}

interface CitationViewProps {
  sources: Source[];
}

export function CitationView({ sources }: CitationViewProps) {
  const [loadingUuid, setLoadingUuid] = useState<string | null>(null);

  const handleViewSource = async (source: Source) => {
    setLoadingUuid(source.document_uuid);
    try {
      console.log('Attempting to fetch citation for source:', source);
      console.log('Document UUID:', source.document_uuid);
      console.log('Chunk Indices:', source.chunk_indices);
      
      if (!source.document_uuid || !source.chunk_indices || source.chunk_indices.length === 0) {
        setLoadingUuid(null);
        alert('Invalid source data. UUID or chunk indices are missing.');
        return;
      }
      
      const context = await getCitationContext(source.document_uuid, source.chunk_indices);
      
      console.log('Received context:', context);
      console.log('Content:', context.content);
      
      if (!context || !context.content) {
        setLoadingUuid(null);
        alert('No content available for this source.');
        return;
      }
      
      // Escape HTML to prevent rendering
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      
      // Generate plain text content for new window
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${context.document_title}</title>
          <style>
            body { 
              font-family: monospace;
              font-size: 8px;
              line-height: 1.3;
              white-space: pre-wrap;
              padding: 20px;
              margin: 0;
              max-width: 100%;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>${escapeHtml(context.content)}</body>
        </html>
      `;
      
      // Open in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
      
      setLoadingUuid(null);
    } catch (err) {
      console.error('Failed to load citation context:', err);
      setLoadingUuid(null);
      alert('Failed to load source content. Please try again.');
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
              onClick={() => handleViewSource(source)}
              disabled={isLoading}
              className="w-full text-left px-2 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded flex items-center gap-1 transition-colors group cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
              ) : (
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="truncate">{source.document_title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

