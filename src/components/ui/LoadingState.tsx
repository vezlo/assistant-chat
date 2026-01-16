import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
