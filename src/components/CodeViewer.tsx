
import React from 'react';
import { cn } from '@/lib/utils';

interface CodeViewerProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeViewer({ code, language = 'typescript', className }: CodeViewerProps) {
  return (
    <div className={cn('relative rounded-md bg-slate-950', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <div className="text-sm text-slate-400">{language}</div>
      </div>
      <pre className="p-4 text-sm text-slate-50 overflow-auto max-h-[500px]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
