/**
 * Tests for structured logging utility
 *
 * Verifies safe JSON serialization and error handling for:
 * - Circular references
 * - Non-serializable values (functions, symbols)
 * - Normal logging operations
 */

import { logger, logInfo, logError, logWarn, logDebug } from '@/lib/logger';

describe('logger', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('logInfo', () => {
    it('should log a simple message', () => {
      logInfo('Test message');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('Test message');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should log a message with context', () => {
      logInfo('Test message', { userId: '123', action: 'create' });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.userId).toBe('123');
      expect(parsed.action).toBe('create');
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular; // Create circular reference

      logInfo('Test with circular reference', circular);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      // Should fall back to safe serialization
      expect(parsed.serializationError).toBe('Failed to serialize log context');
      expect(parsed.message).toBe('Test with circular reference');
      expect(parsed.level).toBe('INFO');
    });

    it('should handle non-serializable values (functions)', () => {
      const withFunction = {
        name: 'test',
        callback: () => console.log('test'),
      };

      logInfo('Test with function', withFunction);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      // Should fall back to safe serialization
      expect(parsed.serializationError).toBe('Failed to serialize log context');
      expect(parsed.message).toBe('Test with function');
    });

    it('should handle non-serializable values (symbols)', () => {
      const withSymbol = {
        name: 'test',
        id: Symbol('unique'),
      };

      logInfo('Test with symbol', withSymbol);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      // Should fall back to safe serialization
      expect(parsed.serializationError).toBe('Failed to serialize log context');
      expect(parsed.message).toBe('Test with symbol');
    });
  });

  describe('logWarn', () => {
    it('should log a warning message', () => {
      logWarn('Warning message', { reason: 'timeout' });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleWarnSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('WARN');
      expect(parsed.message).toBe('Warning message');
      expect(parsed.reason).toBe('timeout');
    });
  });

  describe('logError', () => {
    it('should log an error with Error object', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';

      logError('Error occurred', error, { userId: '123' });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('ERROR');
      expect(parsed.message).toBe('Error occurred');
      expect(parsed.userId).toBe('123');
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.stack).toBeDefined();
    });

    it('should log an error with unknown error type', () => {
      const unknownError = { code: 'UNKNOWN', details: 'Something went wrong' };

      logError('Unknown error', unknownError, { userId: '123' });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('ERROR');
      expect(parsed.error.code).toBe('UNKNOWN');
      expect(parsed.error.details).toBe('Something went wrong');
    });

    it('should handle circular references in error context', () => {
      const error = new Error('Test error');
      const circularContext: any = { userId: '123' };
      circularContext.self = circularContext;

      logError('Error with circular context', error, circularContext);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      // Should fall back to safe serialization
      expect(parsed.serializationError).toBe('Failed to serialize log context');
      expect(parsed.message).toBe('Error with circular context');
    });
  });

  describe('logDebug', () => {
    it('should log in non-production environments', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logDebug('Debug message', { details: 'test' });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('DEBUG');
      expect(parsed.message).toBe('Debug message');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logDebug('Debug message', { details: 'test' });

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logger instance', () => {
    it('should expose all logging methods', () => {
      expect(logger.debug).toBe(logDebug);
      expect(logger.info).toBe(logInfo);
      expect(logger.warn).toBe(logWarn);
      expect(logger.error).toBe(logError);
    });

    it('should work through logger instance', () => {
      logger.info('Test via logger instance');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.message).toBe('Test via logger instance');
    });
  });
});
