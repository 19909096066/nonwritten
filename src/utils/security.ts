/**
 * 安全相关工具函数
 */

/**
 * 防止 XSS 攻击
 * 清理用户输入的 HTML
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * 转义 CSV 字段
 * 防止 CSV 注入
 */
export function escapeCsvField(value: string): string {
  // 检查是否包含需要转义的字符
  if (/[,"\n\r]/.test(value)) {
    // 用双引号包裹，并转义内部的双引号
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 清理 CSV 数据
 */
export function sanitizeCsvRow(row: string[]): string[] {
  return row.map(escapeCsvField);
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('密码长度至少6位');
  }

  if (password.length > 20) {
    errors.push('密码长度不能超过20位');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检查是否为 HTTPS 环境
 */
export function isSecureContext(): boolean {
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

/**
 * 强制 HTTPS
 */
export function enforceHttps(): void {
  if (!isSecureContext()) {
    const httpsUrl = window.location.href.replace(/^http:/, 'https:');
    window.location.href = httpsUrl;
  }
}

/**
 * 生成 CSRF Token
 */
export function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 验证 CSRF Token
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}
