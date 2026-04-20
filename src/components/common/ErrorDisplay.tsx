/**
 * 错误显示组件
 */

import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning';
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({
  title,
  message,
  type = 'error',
  onRetry,
  onDismiss,
}: ErrorDisplayProps) {
  const Icon = type === 'error' ? AlertCircle : AlertTriangle;
  const bgClass = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const iconClass = type === 'error' ? 'text-red-500' : 'text-yellow-500';
  const titleClass = type === 'error' ? 'text-red-900' : 'text-yellow-900';

  return (
    <div className={`${bgClass} border ${type === 'error' ? 'border-red-200' : 'border-yellow-200'} rounded-lg p-4`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${iconClass} flex-shrink-0 mt-0.5`} />

        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${titleClass} mb-1`}>
              {title}
            </h3>
          )}
          <p className="text-sm text-gray-700">{message}</p>

          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button size="sm" onClick={onRetry} variant="outline">
                重试
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" onClick={onDismiss} variant="ghost">
                关闭
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
