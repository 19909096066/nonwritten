/**
 * 加载状态组件
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 24,
  className = '',
  text
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${size > 24 ? 'h-12 w-12' : 'h-6 w-6'}`} style={{ width: size, height: size }} />
      {text && <span className="ml-2 text-gray-500">{text}</span>}
    </div>
  );
}

interface FullPageLoadingProps {
  text?: string;
}

export function FullPageLoading({ text = '加载中...' }: FullPageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size={32} text={text} />
    </div>
  );
}
