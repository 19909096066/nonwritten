/**
 * 验证工具函数
 */

/**
 * 验证手机号
 */
export function isValidPhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} {
  if (password.length < 6) {
    return {
      valid: false,
      strength: 'weak',
      message: '密码长度至少为6位',
    };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) {
    return {
      valid: true,
      strength: 'weak',
      message: '密码强度较弱，建议包含大小写字母和数字',
    };
  }
  if (score <= 3) {
    return {
      valid: true,
      strength: 'medium',
      message: '密码强度中等',
    };
  }
  return {
    valid: true,
    strength: 'strong',
    message: '密码强度较强',
  };
}

/**
 * 验证用户名
 */
export function isValidUsername(username: string): boolean {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
}

/**
 * 验证批次号格式
 */
export function isValidBatchNo(batchNo: string): boolean {
  const regex = /^[A-Z0-9-]{5,20}$/;
  return regex.test(batchNo);
}

/**
 * 验证重量
 */
export function isValidWeight(weight: number): boolean {
  return weight > 0 && weight <= 10000;
}

/**
 * 验证URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证日期范围
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  return start <= end;
}

/**
 * 验证必填字段
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * 验证最小长度
 */
export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * 验证最大长度
 */
export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * 验证数值范围
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
