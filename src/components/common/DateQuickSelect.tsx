import { Button } from '@/components/ui/button';

interface DateQuickSelectProps {
  onSelect: (startDate: string, endDate: string) => void;
  activeKey?: string;
}

// 格式化日期为 YYYY-MM-DD（使用本地时间，避免时区问题）
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取今天的日期字符串
const today = () => formatDate(new Date());

// 获取指定偏移天数的日期
const offsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

// 获取本月第一天
const firstDayOfMonth = () => {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

// 获取上月第一天和最后一天
const lastMonthRange = () => {
  const d = new Date();
  const firstDay = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth(), 0);
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay),
  };
};

// 获取今年第一天
const firstDayOfYear = () => {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), 0, 1));
};

const quickOptions = [
  { key: 'today', label: '今天', getRange: () => ({ start: today(), end: today() }) },
  { key: 'yesterday', label: '昨天', getRange: () => ({ start: offsetDate(-1), end: offsetDate(-1) }) },
  { key: 'last3days', label: '近三天', getRange: () => ({ start: offsetDate(-2), end: today() }) },
  { key: 'last7days', label: '近七天', getRange: () => ({ start: offsetDate(-6), end: today() }) },
  { key: 'thisMonth', label: '本月', getRange: () => ({ start: firstDayOfMonth(), end: today() }) },
  { key: 'lastMonth', label: '上月', getRange: () => lastMonthRange() },
  { key: 'thisYear', label: '今年', getRange: () => ({ start: firstDayOfYear(), end: today() }) },
];

export default function DateQuickSelect({ onSelect, activeKey }: DateQuickSelectProps) {
  const handleClick = (option: typeof quickOptions[0]) => {
    const range = option.getRange();
    onSelect(range.start, range.end);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {quickOptions.map((option) => (
        <Button
          key={option.key}
          variant={activeKey === option.key ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() => handleClick(option)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
