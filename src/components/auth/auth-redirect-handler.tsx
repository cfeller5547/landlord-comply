"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Shield } from "lucide-react";

/**
 * AuthRedirectHandler
 *
 * This component handles the case where Supabase redirects to the homepage (/)
 * with an access_token hash fragment instead of to /start/complete.
 *
 * This happens when the redirectTo URL isn't in Supabase's allowed Redirect URLs list.
 *
 * Flow:
 * 1. Detect access_token in URL hash
 * 2. Establish the Supabase session
 * 3. Check localStorage for pending draftId
 * 4. Redirect to /start/complete?draftId=xxx or /dashboard
 */
export function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isHandlingAuth, setIsHandlingAuth] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    async function handleAuthRedirect() {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;

      // Check if we have an access_token in the hash (from Supabase magic link)
      if (!hash.includes("access_token=")) return;

      setIsHandlingAuth(true);
      setAuthMessage("Signing you in...");

      try {
        // Parse the hash to get the token
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          throw new Error("No access token found");
        }

        // Create Supabase client and set the session
        const supabase = createClient();

        // Set the session using the tokens from the hash
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          console.error("Error setting session:", sessionError);
          throw sessionError;
        }

        setAuthMessage("Session established, redirecting...");

        // Clean up the URL hash
        window.history.replaceState(null, "", window.location.pathname);

        // Check for pending draft in localStorage
        const pendingDraftId = localStorage.getItem("landlordcomply_pending_draft");

        if (pendingDraftId) {
          // Clear the stored draft
          localStorage.removeItem("landlordcomply_pending_draft");
          // Redirect to complete page with draftId
          router.push(`/start/complete?draftId=${pendingDraftId}`);
        } else {
          // No pending draft, redirect to dashboard
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
        setIsHandlingAuth(false);
        // Clean up the URL hash even on error
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    handleAuthRedirect();
  }, [router]);

  // Show loading state while handling auth
  if (isHandlingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {authMessage || "Setting up your account..."}
          </h2>
          <p className="text-muted-foreground">
            Please wait while we prepare your case workspace
          </p>
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-sm">LandlordComply</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
