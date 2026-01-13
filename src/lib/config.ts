// App configuration based on NEXT_PUBLIC_APP_STAGE environment variable
// Using NEXT_PUBLIC_ prefix to make it available in client components

export type AppStage = "development" | "beta" | "production";

export const APP_STAGE: AppStage = (process.env.NEXT_PUBLIC_APP_STAGE as AppStage) || "development";

export const config = {
  stage: APP_STAGE,

  // Feature flags based on stage
  features: {
    // Beta-specific features
    showBetaBadge: APP_STAGE === "beta",
    // Feedback features visible in development and beta, hidden in production
    showFeedbackButton: APP_STAGE !== "production",
    showMicroSurveys: APP_STAGE !== "production",

    // Paid features (disabled in beta)
    requirePayment: APP_STAGE === "production",
    showPricing: APP_STAGE === "production",

    // Development features
    showDebugInfo: APP_STAGE === "development",
  },

  // Beta landing page copy
  beta: {
    headline: "Help Us Build the Future of Deposit Compliance",
    subheadline: "Get free access during beta. Your feedback shapes the product.",
    ctaText: "Join the Beta",
    ctaSubtext: "Free during beta • No credit card required",
  },

  // Production landing page copy
  production: {
    headline: "Security Deposit Compliance, Simplified",
    subheadline: "Turn move-out chaos into court-ready packets in 15 minutes",
    ctaText: "Start Free Trial",
    ctaSubtext: "Free plan available • Upgrade anytime",
  },

  // Get the appropriate copy based on stage
  get landingCopy() {
    return APP_STAGE === "beta" ? this.beta : this.production;
  },
};

// Helper to check if user has beta plan
export function isBetaUser(plan: string): boolean {
  return plan === "BETA";
}

// Helper to check if features should be free (beta stage or beta plan)
export function isFreeAccess(plan: string): boolean {
  return APP_STAGE === "beta" || plan === "BETA";
}
