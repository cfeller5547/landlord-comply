import LandingPage from "@/components/landing/landing-page";

// Force beta variant regardless of APP_STAGE
// This allows direct access to beta landing via /beta URL
export default function BetaPage() {
  return <LandingPage variant="beta" />;
}
