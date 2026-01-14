import LandingPage from "@/components/landing/landing-page";
import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler";
import { config } from "@/lib/config";

export default function HomePage() {
  // Use beta variant if APP_STAGE is beta, otherwise production
  const variant = config.stage === "beta" ? "beta" : "production";

  return (
    <AuthRedirectHandler>
      <LandingPage variant={variant} />
    </AuthRedirectHandler>
  );
}
