/**
 * 可取消请求 Hook
 * 自动管理 AbortController，防止内存泄漏
 */
import { useRef, useEffect } from 'react';

export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * 获取 AbortController
   */
  const getAbortController = () => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    return abortControllerRef.current;
  };

  /**
   * 取消当前请求
   */
  const abort = () => {
    abortControllerRef.current?.abort();
  };

  return {
    getAbortController,
    abort,
  };
}
