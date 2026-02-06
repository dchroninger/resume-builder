import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  mode: 'edit' | 'generate';
  onModeChange: (mode: 'edit' | 'generate') => void;
}

export function Layout({ children, mode, onModeChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Resume Builder</h1>
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('edit')}
              className={`px-4 py-2 rounded transition-colors ${
                mode === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => onModeChange('generate')}
              className={`px-4 py-2 rounded transition-colors ${
                mode === 'generate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Generate
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
