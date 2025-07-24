// Performance monitoring utility
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number; minTime: number; maxTime: number }> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    if (!this.enabled) return () => {};
    
    const startTime = performance.now();
    return () => this.endTimer(label, startTime);
  }

  private endTimer(label: string, startTime: number): void {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.metrics.has(label)) {
      this.metrics.set(label, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }

    const metric = this.metrics.get(label)!;
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);

    // Log slow operations
    if (duration > 100) {
      console.warn(`🚨 Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [label, metric] of this.metrics.entries()) {
      result[label] = {
        ...metric,
        avgTime: metric.avgTime.toFixed(2)
      };
    }
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  logMetrics(): void {
    if (!this.enabled) return;
    
    console.group('📊 Performance Metrics');
    for (const [label, metric] of this.metrics.entries()) {
      console.log(`${label}:`, {
        count: metric.count,
        avgTime: `${metric.avgTime.toFixed(2)}ms`,
        minTime: `${metric.minTime.toFixed(2)}ms`,
        maxTime: `${metric.maxTime.toFixed(2)}ms`,
        totalTime: `${metric.totalTime.toFixed(2)}ms`
      });
    }
    console.groupEnd();
  }
}

// Decorator for measuring function performance
export function measurePerformance(label?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const timerLabel = label || `${target.constructor?.name || 'Unknown'}.${propertyName}`;

    descriptor.value = function (...args: unknown[]) {
      const monitor = PerformanceMonitor.getInstance();
      const endTimer = monitor.startTimer(timerLabel);
      
      try {
        const result = method.apply(this, args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result.finally(endTimer);
        }
        
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    };
  };
}

// Hook for measuring React component performance
export function usePerformanceMeasure(label: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measure: <T>(fn: () => T): T => {
      const endTimer = monitor.startTimer(label);
      try {
        const result = fn();
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    },
    
    measureAsync: async <T>(fn: () => Promise<T>): Promise<T> => {
      const endTimer = monitor.startTimer(label);
      try {
        const result = await fn();
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    }
  };
}

// Utility for measuring data processing operations
export function measureDataProcessing<T>(
  label: string,
  data: unknown[],
  processor: (data: unknown[]) => T
): T {
  const monitor = PerformanceMonitor.getInstance();
  const endTimer = monitor.startTimer(`${label} (${data.length} items)`);
  
  try {
    const result = processor(data);
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

// Debounce utility for expensive operations
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for frequent operations
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility with size limit
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, unknown>();
  
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args) || '';
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    
    // Implement LRU eviction
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, result);
    return result;
  }) as T;
}

// Batch processing utility
export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 50
): R[] {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);
  }
  
  return results;
}

// Export the monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-log metrics on page unload in development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.logMetrics();
  });
} 
