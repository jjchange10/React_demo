import { DatabaseError } from '../types/common';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export class RetryService {
  private static instance: RetryService;

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      retryCondition = this.defaultRetryCondition,
      onRetry
    } = options;

    let lastError: unknown;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!retryCondition(error)) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.delay(currentDelay);
        
        // Increase delay for next attempt (exponential backoff)
        currentDelay *= backoffMultiplier;
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError;
  }

  private defaultRetryCondition(error: unknown): boolean {
    // Retry database connection errors and temporary failures
    if (error instanceof DatabaseError) {
      // Retry connection errors
      if (error.message.includes('connection') || error.message.includes('接続')) {
        return true;
      }
      
      // Retry lock errors (database busy)
      if (error.message.includes('busy') || error.message.includes('lock')) {
        return true;
      }
      
      // Retry timeout errors
      if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
        return true;
      }
      
      // Don't retry validation errors or not found errors
      if (error.message.includes('not found') || error.message.includes('見つかりません')) {
        return false;
      }
    }

    // Retry network-related errors
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('ネットワーク')) {
        return true;
      }
      
      if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
        return true;
      }
      
      // Don't retry validation errors
      if (error.name === 'ValidationError') {
        return false;
      }
    }

    // Default: retry unknown errors (might be temporary)
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience method for database operations
  async executeDbOperation<T>(
    operation: () => Promise<T>,
    operationName: string = 'Database operation'
  ): Promise<T> {
    return this.executeWithRetry(operation, {
      maxAttempts: 3,
      delayMs: 500,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        console.warn(`${operationName} failed (attempt ${attempt}):`, error);
      }
    });
  }

  // Convenience method for image operations
  async executeImageOperation<T>(
    operation: () => Promise<T>,
    operationName: string = 'Image operation'
  ): Promise<T> {
    return this.executeWithRetry(operation, {
      maxAttempts: 2,
      delayMs: 1000,
      backoffMultiplier: 1.5,
      retryCondition: (error) => {
        // Only retry certain image errors
        if (error instanceof Error) {
          return error.message.includes('timeout') || 
                 error.message.includes('network') ||
                 error.message.includes('temporary');
        }
        return false;
      },
      onRetry: (attempt, error) => {
        console.warn(`${operationName} failed (attempt ${attempt}):`, error);
      }
    });
  }
}

// Export singleton instance
export const retryService = RetryService.getInstance();