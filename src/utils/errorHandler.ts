/**
 * 统一错误处理
 */
import { toast } from 'sonner';
import { AppError, isAppError, NetworkError, AuthError, PermissionError, ValidationError } from './errors';

/**
 * 错误上报接口
 */
interface ErrorReport {
  error: Error;
  context?: string;
  userId?: string;
  timestamp: string;
}

/**
 * 上报错误到监控系统
 */
function reportError(error: Error, context?: string) {
  // TODO: 集成错误监控系统（如 Sentry）
  const report: ErrorReport = {
    error,
    context,
    userId: localStorage.getItem('userId') || undefined,
    timestamp: new Date().toISOString(),
  };

  // 开发环境打印错误
  if (import.meta.env.DEV) {
    console.error('[Error Report]:', report);
  }

  // 生产环境上报
  if (import.meta.env.PROD) {
    // 上报到监控系统
    // sendToMonitoring(report);
  }
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown, context?: string): void {
  // 上报错误
  if (error instanceof Error) {
    reportError(error, context);
  }

  // 处理错误
  if (isAppError(error)) {
    toast.error(error.userMessage);

    // 认证错误，跳转到登录页
    if (error instanceof AuthError) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  } else if (error instanceof Error) {
    // 未知错误
    toast.error('操作失败，请重试');
  } else {
    // 非 Error 对象
    toast.error('发生未知错误');
  }
}

/**
 * 高阶函数：包装异步函数并处理错误
 */
export function withErrorHandler<T extends any[]>(
  fn: (...args: T) => Promise<any>,
  context?: string
) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      throw error;
    }
  };
}

/**
 * 创建带错误处理的异步函数
 */
export function createSafeHandler<T extends any[]>(
  fn: (...args: T) => Promise<any>,
  context?: string
) {
  return withErrorHandler(fn, context);
}
