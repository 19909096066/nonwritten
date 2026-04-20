/**
 * 格式化工具函数
 */

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format: 'date' | 'datetime' | 'time' = 'date'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  if (format === 'date') {
    return `${year}-${month}-${day}`;
  }
  if (format === 'time') {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期为相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

/**
 * 格式化数字
 */
export function formatNumber(
  num: number,
  options?: {
    decimals?: number;
    thousandsSeparator?: boolean;
  }
): string {
  const { decimals = 2, thousandsSeparator = true } = options || {};

  const formatted = num.toFixed(decimals);

  if (!thousandsSeparator) return formatted;

  return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化重量
 */
export function formatWeight(weight: number, unit: string = 'kg'): string {
  if (weight >= 1000) {
    return `${formatNumber(weight / 1000)} t`;
  }
  return `${formatNumber(weight)} ${unit}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${formatNumber(bytes / Math.pow(k, i), { decimals: 0, thousandsSeparator: false })} ${sizes[i]}`;
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化金额
 */
export function formatCurrency(amount: number, currency: string = '¥'): string {
  return `${currency}${formatNumber(amount, { decimals: 2 })}`;
}

/**
 * 格式化手机号（隐藏中间4位）
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
