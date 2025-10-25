'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ResultDisplayProps {
  content: string;
  isLoading?: boolean;
  title?: string;
  type?: 'analysis' | 'chat' | 'error';
}

export default function ResultDisplay({ content, isLoading = false, title, type = 'analysis' }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50/50';
      case 'chat':
        return 'border-blue-200 bg-blue-50/50';
      default:
        return 'border-gray-200 bg-white/80';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'chat':
        return '💬';
      default:
        return '📊';
    }
  };

  if (isLoading) {
    return (
      <div className={`glass-effect rounded-xl p-6 border ${getTypeStyles()} fade-in`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold">
            {getTypeIcon()}
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title || 'Processing...'}</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded shimmer"></div>
          <div className="h-4 bg-gray-200 rounded shimmer w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded shimmer w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border border-gray-600 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h3 className="text-sm font-bold text-green-400">{title || 'OUTPUT'}</h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="text-xs text-gray-400 hover:text-green-400 transition-colors"
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = !match;
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg !mt-4 !mb-4"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            },
            h1: ({ children }) => (
              <h1 className="text-green-400 font-bold text-lg mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-green-400 font-bold text-base mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-green-400 font-bold text-sm mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 text-sm mb-2 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-gray-300 text-sm mb-2 ml-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="text-gray-300 text-sm mb-2 ml-4">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-300 text-sm mb-1">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-600 my-4">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-700 rounded-lg text-gray-300">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-gray-800 px-4 py-2 text-left text-sm font-semibold text-green-400 border-b border-gray-700">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                {children}
              </td>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-green-400">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-400">{children}</em>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
