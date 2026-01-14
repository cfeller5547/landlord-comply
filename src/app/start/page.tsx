"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  FlaskConical,
  Sparkles,
  ChevronDown,
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
          <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
            <FlaskConical className="h-3 w-3" />
            Beta: Deadline + Packet
          </Badge>
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
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Results" },
              { num: 3, label: "Access" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      step >= s.num
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    step >= s.num ? "text-primary" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={cn(
                      "w-12 sm:w-16 h-1 mx-2 mb-5",
                      step > s.num ? "bg-primary" : "bg-slate-200"
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
                    <p className="text-xs text-muted-foreground">
                      Street + unit is fine for now
                    </p>
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center gap-2">
                      State <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground font-normal">(required for rules lookup)</span>
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

          {/* Step 2: Results Preview - Restructured for "wow" */}
          {step === 2 && preview && (
            <div className="space-y-4">
              {/* CARD 1: Deadline - Action-focused */}
              <Card className="shadow-lg border-0 overflow-hidden">
                <div className={cn(
                  "p-6",
                  getDeadlineColor(preview.deadline.daysRemaining)
                )}>
                  {/* Coverage badge - prominent */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">
                        {preview.jurisdiction.city
                          ? `${preview.jurisdiction.city}, ${preview.jurisdiction.state}`
                          : preview.jurisdiction.state}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
                        preview.jurisdiction.coverageLevel === "FULL"
                          ? "bg-green-600 text-white"
                          : preview.jurisdiction.coverageLevel === "PARTIAL"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-600 text-white"
                      )}
                    >
                      {preview.jurisdiction.coverageLevel === "FULL" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          State + City Rules
                        </>
                      ) : preview.jurisdiction.coverageLevel === "PARTIAL" ? (
                        <>Partial Coverage</>
                      ) : (
                        <>State Rules Only</>
                      )}
                    </div>
                  </div>

                  {/* Main deadline message */}
                  <p className="text-sm font-medium mb-1 opacity-90">
                    You must send the deposit disposition by:
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold mb-3">
                    {formatDate(preview.deadline.date)}
                  </p>

                  {/* Time remaining - prominent */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">
                        {preview.deadline.daysRemaining < 0 ? (
                          <>{Math.abs(preview.deadline.daysRemaining)} days overdue</>
                        ) : preview.deadline.daysRemaining === 0 ? (
                          <>Due today!</>
                        ) : (
                          <>{preview.deadline.daysRemaining} days left</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Safe mail-by suggestion */}
                  {preview.deadline.daysRemaining > 3 && (
                    <div className="bg-white/10 rounded-lg p-3 text-sm">
                      <span className="font-medium">Tip:</span> To be safe, mail by{" "}
                      <span className="font-semibold">
                        {new Date(new Date(preview.deadline.date).setDate(new Date(preview.deadline.date).getDate() - 3)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      {" "}(3 days buffer for delivery)
                    </div>
                  )}
                </div>
              </Card>

              {/* CARD 2: Your Packet - THE WOW + CONVERSION */}
              <Card className="shadow-lg border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Your Ready-to-Send Packet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Everything you need to return the deposit correctly
                  </p>
                </div>

                <CardContent className="p-5">
                  {/* PDF Previews - Visual "wow" */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Notice Letter Preview */}
                    <div className="relative group">
                      <div className="aspect-[8.5/11] bg-white border-2 border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white p-3">
                          <div className="text-[6px] sm:text-[8px] text-slate-400 space-y-1">
                            <div className="font-bold text-slate-600 text-[8px] sm:text-[10px]">SECURITY DEPOSIT DISPOSITION</div>
                            <div>Date: {new Date().toLocaleDateString()}</div>
                            <div>To: [Tenant Name]</div>
                            <div>Property: {address || "123 Main St"}</div>
                            <div className="border-t border-dashed my-1 pt-1">
                              Pursuant to {preview.jurisdiction.stateCode} law...
                            </div>
                          </div>
                        </div>
                        {/* Lock overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="text-center text-white">
                            <Lock className="h-6 w-6 mx-auto mb-1" />
                            <span className="text-xs font-medium">PDF</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-center mt-2 text-slate-700">Notice Letter</p>
                    </div>

                    {/* Itemized Statement Preview */}
                    <div className="relative group">
                      <div className="aspect-[8.5/11] bg-white border-2 border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white p-3">
                          <div className="text-[6px] sm:text-[8px] text-slate-400 space-y-1">
                            <div className="font-bold text-slate-600 text-[8px] sm:text-[10px]">ITEMIZED STATEMENT</div>
                            <div className="border-b pb-1">Deductions:</div>
                            <div>1. Cleaning - $___</div>
                            <div>2. Repairs - $___</div>
                            <div className="border-t pt-1 font-medium">
                              Total Refund: $___
                            </div>
                          </div>
                        </div>
                        {/* Lock overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="text-center text-white">
                            <Lock className="h-6 w-6 mx-auto mb-1" />
                            <span className="text-xs font-medium">PDF</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-center mt-2 text-slate-700">Itemized Statement</p>
                    </div>
                  </div>

                  {/* Additional features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-full">
                      <Bell className="h-3 w-3" />
                      Deadline reminders
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-full">
                      <Upload className="h-3 w-3" />
                      Proof packet export
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Audit trail
                    </div>
                  </div>

                  {/* Email capture - THE GATE */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <p className="text-sm font-semibold text-slate-900 mb-3 text-center">
                      Enter your email to unlock your packet
                    </p>
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="Email to receive packet link"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 pl-10 text-base"
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
                        className="w-full h-12 text-base bg-primary hover:bg-primary/90 font-semibold"
                        size="lg"
                      >
                        {emailSending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Email My Packet Link
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        No password needed. Free during beta.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: What You Must Do - Condensed */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    What you must do (minimum)
                  </h3>

                  {/* 3 Essential bullets */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                      <div>
                        <span className="font-medium text-slate-900">Prepare itemized statement</span>
                        <span className="text-muted-foreground"> — list every deduction with amounts</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                      <div>
                        <span className="font-medium text-slate-900">Include receipts/estimates</span>
                        <span className="text-muted-foreground"> — required for repairs over $125</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                      <div>
                        <span className="font-medium text-slate-900">Send via approved method + keep proof</span>
                        <span className="text-muted-foreground"> — {preview.rules.allowedDeliveryMethods.slice(0, 2).join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Accordion for full checklist */}
                  <details className="group">
                    <summary className="flex items-center gap-2 text-sm text-primary font-medium cursor-pointer hover:underline">
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      Show full {preview.checklist.length}-step checklist
                    </summary>
                    <div className="mt-4 space-y-2 pl-2 border-l-2 border-slate-200">
                      {preview.checklist.map((item, i) => (
                        <div key={i} className="text-sm py-1">
                          <span className="font-medium text-slate-700">{i + 1}. {item.label}</span>
                          {item.description && (
                            <span className="text-muted-foreground"> — {item.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </CardContent>
              </Card>

              {/* Key Requirements - As chips */}
              <div className="flex flex-wrap gap-2">
                {preview.rules.itemizationRequired && (
                  <div className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Itemization required
                  </div>
                )}
                {preview.rules.interestRequired && (
                  <div className="flex items-center gap-1.5 text-sm bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium">
                    <DollarSign className="h-3.5 w-3.5" />
                    Interest: {preview.rules.interestRate ? `${(preview.rules.interestRate * 100).toFixed(1)}%` : "Required"}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium">
                  <Send className="h-3.5 w-3.5" />
                  Delivery: {preview.rules.allowedDeliveryMethods.slice(0, 2).join(", ")}
                </div>
              </div>

              {/* Citations footer */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {preview.citations.map((citation, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      {citation.code}
                      {citation.url && (
                        <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-primary">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </span>
                  ))}
                </div>
                <p className="mt-2">
                  Rules v{preview.ruleSetVersion} · Verified {new Date(preview.lastVerified).toLocaleDateString()}
                </p>
              </div>

              {/* Back Button */}
              <div className="text-center pb-24">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>

              {/* Sticky Bottom Bar - Benefit-first copy */}
              <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary via-primary to-primary/90 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50">
                <div className="container mx-auto px-4 py-4">
                  <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="hidden sm:flex h-10 w-10 rounded-full bg-white/20 items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm sm:text-base font-semibold text-white">
                          Unlock your ready-to-send packet (PDF)
                        </p>
                        <p className="text-xs text-white/80 hidden sm:block">
                          No password — secure link emailed to you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="Email for packet link"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 pl-9 w-full sm:w-56 bg-white border-0 shadow-md"
                        />
                      </div>
                      <Button
                        onClick={handleSendEmail}
                        disabled={emailSending || !email}
                        className="h-11 px-5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold shadow-md whitespace-nowrap"
                      >
                        {emailSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Email Packet
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
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
