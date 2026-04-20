/**
 * 应用错误类
 * 统一的错误处理机制
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message: string = '网络请求失败') {
    super(message, 'NETWORK_ERROR', '网络连接失败，请检查网络设置', 0);
    this.name = 'NetworkError';
  }
}

/**
 * 认证错误
 */
export class AuthError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 'AUTH_ERROR', '登录已过期，请重新登录', 401);
    this.name = 'AuthError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 'PERMISSION_ERROR', '您没有执行此操作的权限', 403);
    this.name = 'PermissionError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      field ? `${field}: ${message}` : message,
      400
    );
    this.name = 'ValidationError';
  }
}

/**
 * 类型守卫：判断是否为 AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 类型守卫：判断是否为网络错误
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
