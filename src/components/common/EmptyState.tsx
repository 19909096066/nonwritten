/**
 * 空状态组件
 */

import { FileX, Search, Inbox } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'no-items';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  type = 'no-data',
  title,
  description,
  action,
}: EmptyStateProps) {
  const icons = {
    'no-data': Inbox,
    'no-results': Search,
    'no-items': FileX,
  };

  const defaultTitles = {
    'no-data': '暂无数据',
    'no-results': '未找到结果',
    'no-items': '没有项目',
  };

  const defaultDescriptions = {
    'no-data': '当前没有可显示的数据',
    'no-results': '尝试调整筛选条件或搜索关键词',
    'no-items': '该列表中没有任何项目',
  };

  const Icon = icons[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || defaultTitles[type]}
      </h3>

      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        {description || defaultDescriptions[type]}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
