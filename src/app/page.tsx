import LandingPage from "@/components/landing/landing-page";
import { config } from "@/lib/config";

export default function HomePage() {
  // Use beta variant if APP_STAGE is beta, otherwise production
  const variant = config.stage === "beta" ? "beta" : "production";

  return <LandingPage variant={variant} />;
}
