import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff } from 'lucide-react';
import './markdown-preview.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, label }) => {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-base font-semibold text-gray-900">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          {showRaw ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              Show Preview
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              Edit Markdown
            </>
          )}
        </button>
      </div>

      {showRaw ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[220px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm leading-relaxed resize-none overflow-y-auto"
          placeholder="Enter markdown text..."
        />
      ) : (
        <div className="w-full h-[220px] px-4 py-3 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto markdown-preview">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic text-sm">No content - click "Edit Markdown" to add content</p>
          )}
        </div>
      )}
    </div>
  );
};
