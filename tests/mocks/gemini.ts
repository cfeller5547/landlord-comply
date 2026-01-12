import { vi } from "vitest";

/**
 * Default mock response for AI description improvement
 */
export const mockImproveDescriptionResponse = {
  description:
    "Professional carpet cleaning required to remove tenant-caused stains and restore carpet to move-in condition. Cleaning performed by licensed professional service.",
  reasoning:
    "The description has been improved to be more specific about the cause, the work performed, and the professional nature of the service.",
};

/**
 * Default mock response for AI risk assessment
 */
export const mockRiskAssessmentResponse = {
  riskLevel: "LOW" as const,
  factors: [
    "Well-documented damage with photos",
    "Professional invoice attached",
    "Clear description of work performed",
  ],
  recommendations: [
    "Consider adding before/after photos for stronger documentation",
  ],
};

/**
 * Mock for generateContent function
 */
export const mockGenerateContent = vi.fn().mockResolvedValue({
  response: {
    text: () => JSON.stringify(mockImproveDescriptionResponse),
  },
});

/**
 * Mock for the Gemini model
 */
export const mockGeminiModel = {
  generateContent: mockGenerateContent,
};

/**
 * Mock for GoogleGenerativeAI class
 */
export const mockGoogleGenerativeAI = vi.fn().mockImplementation(() => ({
  getGenerativeModel: vi.fn().mockReturnValue(mockGeminiModel),
}));

// Mock the @google/generative-ai module
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI,
}));

/**
 * Helper functions to customize Gemini mock behavior
 */
export const geminiMockHelpers = {
  /**
   * Mock a successful description improvement
   */
  mockImproveSuccess: (
    response: Partial<typeof mockImproveDescriptionResponse> = {}
  ) => {
    const fullResponse = { ...mockImproveDescriptionResponse, ...response };
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(fullResponse),
      },
    });
    return fullResponse;
  },

  /**
   * Mock a successful risk assessment
   */
  mockRiskAssessmentSuccess: (
    response: Partial<typeof mockRiskAssessmentResponse> = {}
  ) => {
    const fullResponse = { ...mockRiskAssessmentResponse, ...response };
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(fullResponse),
      },
    });
    return fullResponse;
  },

  /**
   * Mock an API error
   */
  mockApiError: (message: string = "API error") => {
    mockGenerateContent.mockRejectedValueOnce(new Error(message));
  },

  /**
   * Mock invalid JSON response (tests fallback behavior)
   */
  mockInvalidJsonResponse: () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "This is not valid JSON",
      },
    });
  },

  /**
   * Mock API key not configured
   */
  mockNoApiKey: () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
  },

  /**
   * Reset mocks to default state
   */
  resetMocks: () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockImproveDescriptionResponse),
      },
    });
    vi.stubEnv("GOOGLE_AI_API_KEY", "test-api-key");
  },
};
