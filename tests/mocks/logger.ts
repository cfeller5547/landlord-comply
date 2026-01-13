import { vi } from "vitest";

/**
 * Mock logger for testing
 * Silences log output during tests but still allows verification of log calls
 */
export const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  http: vi.fn(),
  debug: vi.fn(),
};

// Mock the logger module
vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
  sanitize: (data: unknown) => data,
}));

/**
 * Helper functions for logger assertions
 */
export const loggerHelpers = {
  /**
   * Assert that an error was logged
   */
  expectErrorLogged: (message?: string | RegExp) => {
    expect(mockLogger.error).toHaveBeenCalled();
    if (message) {
      const calls = mockLogger.error.mock.calls;
      const matched = calls.some((call: unknown[]) => {
        const logMessage = call[0];
        if (typeof message === "string") {
          return logMessage === message || (typeof logMessage === "string" && logMessage.includes(message));
        }
        return message.test(logMessage as string);
      });
      expect(matched).toBe(true);
    }
  },

  /**
   * Assert that a warning was logged
   */
  expectWarnLogged: (message?: string | RegExp) => {
    expect(mockLogger.warn).toHaveBeenCalled();
    if (message) {
      const calls = mockLogger.warn.mock.calls;
      const matched = calls.some((call: unknown[]) => {
        const logMessage = call[0];
        if (typeof message === "string") {
          return logMessage === message || (typeof logMessage === "string" && logMessage.includes(message));
        }
        return message.test(logMessage as string);
      });
      expect(matched).toBe(true);
    }
  },

  /**
   * Assert that info was logged
   */
  expectInfoLogged: (message?: string | RegExp) => {
    expect(mockLogger.info).toHaveBeenCalled();
    if (message) {
      const calls = mockLogger.info.mock.calls;
      const matched = calls.some((call: unknown[]) => {
        const logMessage = call[0];
        if (typeof message === "string") {
          return logMessage === message || (typeof logMessage === "string" && logMessage.includes(message));
        }
        return message.test(logMessage as string);
      });
      expect(matched).toBe(true);
    }
  },

  /**
   * Assert no errors were logged
   */
  expectNoErrors: () => {
    expect(mockLogger.error).not.toHaveBeenCalled();
  },

  /**
   * Reset all logger mocks
   */
  reset: () => {
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.http.mockClear();
    mockLogger.debug.mockClear();
  },
};
