export function withAsyncLock<T extends (...args: any[]) => Promise<any>>(fn: T) {
  let isExecuting = false;
  return async function (...args: Parameters<T>) {
    if (isExecuting) return;
    isExecuting = true;
    try {
      await fn(...args);
    } finally {
      isExecuting = false;
    }
  };
}
