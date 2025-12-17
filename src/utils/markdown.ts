import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Check if content contains markdown syntax
 */
function hasMarkdownSyntax(content: string): boolean {
  // Check for common markdown patterns
  const mdPatterns = [
    /#{1,6}\s/,           // Headers
    /\*\*.*?\*\*/,        // Bold
    /__.*?__/,            // Bold (alt)
    /\*.*?\*/,            // Italic
    /_.*?_/,              // Italic (alt)
    /\[.*?\]\(.*?\)/,     // Links
    /`.*?`/,              // Inline code
    /```[\s\S]*?```/,     // Code blocks
    /^\s*[-*+]\s/m,       // Unordered lists
    /^\s*\d+\.\s/m,       // Ordered lists
    /^\s*>\s/m,           // Blockquotes
  ];

  return mdPatterns.some(pattern => pattern.test(content));
}

/**
 * Convert markdown to sanitized HTML
 */
export function markdownToHtml(content: string): string {
  // If no markdown syntax detected, return as-is wrapped in paragraph
  if (!hasMarkdownSyntax(content)) {
    return `<p>${DOMPurify.sanitize(content)}</p>`;
  }

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Convert markdown to HTML
  const rawHtml = marked(content) as string;

  // Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

