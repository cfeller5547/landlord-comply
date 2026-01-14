"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

function CompletePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  useEffect(() => {
    async function finalizeDraft() {
      if (!draftId) {
        setError("No draft ID provided");
        setStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/start/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to complete setup");
          setStatus("error");
          return;
        }

        setCaseId(data.caseId);
        setStatus("success");

        // Auto-redirect after a moment
        setTimeout(() => {
          router.push(`/cases/${data.caseId}`);
        }, 2000);
      } catch (err) {
        setError("Something went wrong. Please try again.");
        setStatus("error");
      }
    }

    finalizeDraft();
  }, [draftId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              {status === "loading" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Setting Up Your Case
                  </h2>
                  <p className="text-muted-foreground">
                    Please wait while we create your case...
                  </p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Your Case is Ready!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Redirecting you to your case workspace...
                  </p>
                  <Button
                    onClick={() => router.push(`/cases/${caseId}`)}
                    className="w-full"
                  >
                    Go to My Case
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Something Went Wrong
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {error || "We couldn't complete your setup."}
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={() => router.push("/start")}
                      variant="ghost"
                      className="w-full"
                    >
                      Start Over
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Logo */}
          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Shield className="h-5 w-5" />
              <span className="font-medium">LandlordComply</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CompletePageContent />
    </Suspense>
  );
}
