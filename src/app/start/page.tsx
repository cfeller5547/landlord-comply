"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Shield,
  Mail,
  Lock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Send,
  Upload,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

// US States for dropdown
const US_STATES = [
  { code: "CA", name: "California" },
  { code: "NY", name: "New York" },
  { code: "TX", name: "Texas" },
  { code: "WA", name: "Washington" },
  { code: "IL", name: "Illinois" },
  { code: "CO", name: "Colorado" },
  { code: "FL", name: "Florida" },
  { code: "MA", name: "Massachusetts" },
  { code: "OR", name: "Oregon" },
  { code: "AZ", name: "Arizona" },
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
];

// Cities with special rules
const CITIES_WITH_RULES: Record<string, string[]> = {
  CA: ["San Francisco", "Los Angeles"],
  WA: ["Seattle"],
  NY: ["New York City"],
  IL: ["Chicago"],
};

interface PreviewData {
  deadline: {
    date: string;
    daysRemaining: number;
    deadlineDays: number;
    description: string | null;
  };
  jurisdiction: {
    state: string;
    stateCode: string;
    city: string | null;
    coverageLevel: string;
  };
  rules: {
    interestRequired: boolean;
    interestRate: number | null;
    itemizationRequired: boolean;
    maxDepositMonths: number | null;
    allowedDeliveryMethods: string[];
  };
  checklist: Array<{
    label: string;
    required: boolean;
    description: string;
  }>;
  citations: Array<{
    code: string;
    title: string | null;
    url: string | null;
  }>;
  penalties: Array<{
    condition: string;
    penalty: string;
    description: string | null;
  }>;
  ruleSetVersion: string;
  lastVerified: string;
}

function StartPageContent() {
  const searchParams = useSearchParams();

  // Track UTM params
  const [utmParams] = useState({
    utmSource: searchParams.get("utm_source") || undefined,
    utmCampaign: searchParams.get("utm_campaign") || undefined,
    utmMedium: searchParams.get("utm_medium") || undefined,
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // Results state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Email state
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  // Get available cities for selected state
  const availableCities = state ? CITIES_WITH_RULES[state] || [] : [];

  // Handle form submission to get preview
  async function handleGetPreview() {
    if (!address || !state || !moveOutDate) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/start/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressRaw: address,
          city: city || null,
          state,
          moveOutDate,
          depositAmount: depositAmount || null,
          ...utmParams,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Failed to get results");
        return;
      }

      setDraftId(data.draftId);
      setPreview(data.preview);
      setStep(2);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle email submission
  async function handleSendEmail() {
    if (!email || !draftId) {
      setError("Please enter your email");
      return;
    }

    setEmailSending(true);
    setError(null);

    try {
      const response = await fetch("/api/start/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send email");
        return;
      }

      setMaskedEmail(data.email);
      setEmailSent(true);
      setStep(3);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setEmailSending(false);
    }
  }

  // Format date for display
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Get deadline urgency color
  function getDeadlineColor(daysRemaining: number) {
    if (daysRemaining < 0) return "text-red-600 bg-red-50 border-red-200";
    if (daysRemaining <= 3) return "text-red-600 bg-red-50 border-red-200";
    if (daysRemaining <= 7) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LandlordComply</span>
          </Link>
          <div className="text-sm text-muted-foreground">
            Free deadline calculator
          </div>
        </div>
      </header>

      {/* Trust Banner */}
      <div className="bg-slate-100 border-b py-2">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <Scale className="h-3 w-3 inline mr-1" />
          Educational tool only. Not legal advice. Always consult an attorney for legal questions.
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step >= s
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-16 h-1 mx-2",
                      step > s ? "bg-primary" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Property Details */}
          {step === 1 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Get Your Deadline + Requirements
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your property details to see exactly when you need to return the deposit
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Property Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, Apt 4B"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select value={state} onValueChange={(v) => { setState(v); setCity(""); }}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City (optional, only if state has city rules) */}
                  {availableCities.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="city" className="flex items-center gap-2">
                        City with Special Rules
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Select value={city || "none"} onValueChange={(v) => setCity(v === "none" ? "" : v)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select if applicable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None / Other city</SelectItem>
                          {availableCities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        These cities have additional local requirements
                      </p>
                    </div>
                  )}

                  {/* Move-out Date */}
                  <div className="space-y-2">
                    <Label htmlFor="moveOutDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Tenant Move-out Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="moveOutDate"
                      type="date"
                      value={moveOutDate}
                      onChange={(e) => setMoveOutDate(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  {/* Deposit Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Security Deposit Amount
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      placeholder="2000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleGetPreview}
                    disabled={loading || !address || !state || !moveOutDate}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        Calculate Deadline + Requirements
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Results Preview */}
          {step === 2 && preview && (
            <div className="space-y-6">
              {/* Deadline Card */}
              <Card className="shadow-lg border-0 overflow-hidden">
                <div className={cn(
                  "p-6 border-b",
                  getDeadlineColor(preview.deadline.daysRemaining)
                )}>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-6 w-6" />
                    <span className="text-sm font-medium uppercase tracking-wide">
                      Your Deadline
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {formatDate(preview.deadline.date)}
                  </div>
                  <div className="text-sm">
                    {preview.deadline.daysRemaining < 0 ? (
                      <span className="font-medium">
                        {Math.abs(preview.deadline.daysRemaining)} days overdue
                      </span>
                    ) : preview.deadline.daysRemaining === 0 ? (
                      <span className="font-medium">Due today</span>
                    ) : (
                      <span>
                        <span className="font-medium">{preview.deadline.daysRemaining} days</span> remaining
                      </span>
                    )}
                    <span className="mx-2">|</span>
                    {preview.deadline.deadlineDays} days from move-out
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Jurisdiction Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {preview.jurisdiction.city
                        ? `${preview.jurisdiction.city}, ${preview.jurisdiction.state}`
                        : preview.jurisdiction.state}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        preview.jurisdiction.coverageLevel === "FULL"
                          ? "bg-green-100 text-green-700"
                          : preview.jurisdiction.coverageLevel === "PARTIAL"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {preview.jurisdiction.coverageLevel.replace("_", " ")} coverage
                    </span>
                  </div>

                  {/* Required Steps Checklist */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Required Steps
                    </h3>
                    <div className="space-y-3">
                      {preview.checklist.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {item.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Rules */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      Key Requirements
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {preview.rules.interestRequired && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="text-sm font-medium text-amber-800">
                            Interest Required
                          </div>
                          <div className="text-xs text-amber-600">
                            {preview.rules.interestRate
                              ? `${(preview.rules.interestRate * 100).toFixed(2)}% annually`
                              : "Rate varies"}
                          </div>
                        </div>
                      )}
                      {preview.rules.itemizationRequired && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800">
                            Itemization Required
                          </div>
                          <div className="text-xs text-blue-600">
                            List each deduction
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                        <div className="text-sm font-medium text-slate-800">
                          Allowed Delivery Methods
                        </div>
                        <div className="text-xs text-slate-600">
                          {preview.rules.allowedDeliveryMethods.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Citations */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Legal Citations
                    </h3>
                    <div className="space-y-2">
                      {preview.citations.map((citation, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-slate-700">
                            {citation.code}
                          </span>
                          {citation.title && (
                            <span className="text-muted-foreground ml-1">
                              — {citation.title}
                            </span>
                          )}
                          {citation.url && (
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:underline inline-flex items-center"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Version {preview.ruleSetVersion} | Last verified{" "}
                      {new Date(preview.lastVerified).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gated Features - Save Your Case */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 text-center">
                    Save Your Case + Get Full Access
                  </h3>

                  {/* Locked Features */}
                  <div className="grid gap-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg opacity-75">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Generate Notice PDF</div>
                        <div className="text-xs text-muted-foreground">
                          Compliant letter with required language
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg opacity-75">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Itemized Statement</div>
                        <div className="text-xs text-muted-foreground">
                          Professional deduction breakdown
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg opacity-75">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Deadline Reminders</div>
                        <div className="text-xs text-muted-foreground">
                          Email alerts at 7, 3, and 1 day before
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg opacity-75">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Proof Packet Export</div>
                        <div className="text-xs text-muted-foreground">
                          Complete audit trail for disputes
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Capture */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Your Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        {error}
                      </div>
                    )}

                    <Button
                      onClick={handleSendEmail}
                      disabled={emailSending || !email}
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      {emailSending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Me My Secure Access Link
                        </>
                      )}
                    </Button>

                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">
                        No password required. We'll send a secure link.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        We only email you about this case + reminders you request.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Email Sent Confirmation */}
          {step === 3 && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground mb-6">
                  We sent a secure access link to{" "}
                  <span className="font-medium text-slate-900">{maskedEmail}</span>
                </p>

                <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium text-slate-900 mb-2">
                    What happens next:
                  </h3>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0">
                        1
                      </span>
                      Click the link in your email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0">
                        2
                      </span>
                      Your case is automatically saved
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0">
                        3
                      </span>
                      Generate your compliant documents
                    </li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSendEmail()}
                    disabled={emailSending}
                    className="w-full"
                  >
                    {emailSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Resend Email
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep(2);
                      setEmailSent(false);
                    }}
                    className="w-full text-muted-foreground"
                  >
                    Wrong email? Go back
                  </Button>
                </div>

                {/* Keep results visible */}
                {preview && (
                  <div className="mt-8 pt-6 border-t text-left">
                    <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Your Results (saved)
                    </h3>
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        getDeadlineColor(preview.deadline.daysRemaining)
                      )}
                    >
                      <div className="font-bold">
                        Deadline: {formatDate(preview.deadline.date)}
                      </div>
                      <div className="text-sm">
                        {preview.deadline.daysRemaining} days remaining
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 bg-slate-50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} LandlordComply. Educational tool only, not legal advice.
          </p>
          <div className="mt-2 space-x-4">
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <StartPageContent />
    </Suspense>
  );
}
