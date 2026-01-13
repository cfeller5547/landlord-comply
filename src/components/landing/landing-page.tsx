"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import {
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  MapPin,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Package,
  FileCheck,
  CalendarClock,
  DollarSign,
  BadgeCheck,
  Loader2,
  Play,
  Download,
  AlertTriangle,
  Calculator,
  ChevronDown,
  Truck,
  Receipt,
  Scale,
  Timer,
  Sparkles,
  FlaskConical,
} from "lucide-react";

export type LandingVariant = "beta" | "production";

interface LandingPageProps {
  variant: LandingVariant;
}

// Mock address suggestions for demo
const mockAddresses = [
  { address: "123 Market St, San Francisco, CA 94102", state: "CA", city: "San Francisco" },
  { address: "456 Broadway, Seattle, WA 98101", state: "WA", city: "Seattle" },
  { address: "789 5th Ave, New York, NY 10022", state: "NY", city: "New York City" },
  { address: "321 Congress Ave, Austin, TX 78701", state: "TX", city: "Austin" },
  { address: "555 N Michigan Ave, Chicago, IL 60611", state: "IL", city: "Chicago" },
  { address: "100 Wilshire Blvd, Los Angeles, CA 90024", state: "CA", city: "Los Angeles" },
];

const rulesData: Record<string, { deadline: number; interest: boolean; interestRate?: string; receipts: string; citation: string; citationUrl: string; maxDeposit?: string; deliveryMethods: string[] }> = {
  "CA-San Francisco": { deadline: 21, interest: true, interestRate: "5.0%", receipts: "Required over $125", citation: "Cal. Civ. Code § 1950.5", citationUrl: "#", maxDeposit: "1 month", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "CA-Los Angeles": { deadline: 21, interest: false, receipts: "Required over $125", citation: "Cal. Civ. Code § 1950.5", citationUrl: "#", maxDeposit: "1 month", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "CA": { deadline: 21, interest: false, receipts: "Required over $125", citation: "Cal. Civ. Code § 1950.5", citationUrl: "#", maxDeposit: "1 month", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "NY-New York City": { deadline: 14, interest: true, interestRate: "Prevailing rate", receipts: "Required", citation: "NY Gen. Oblig. Law § 7-108", citationUrl: "#", maxDeposit: "1 month", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "NY": { deadline: 14, interest: true, interestRate: "Prevailing rate", receipts: "Required", citation: "NY Gen. Oblig. Law § 7-108", citationUrl: "#", maxDeposit: "1 month", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "TX-Austin": { deadline: 30, interest: false, receipts: "Required", citation: "Tex. Prop. Code § 92.103", citationUrl: "#", deliveryMethods: ["Mail", "Personal delivery"] },
  "TX": { deadline: 30, interest: false, receipts: "Required", citation: "Tex. Prop. Code § 92.103", citationUrl: "#", deliveryMethods: ["Mail", "Personal delivery"] },
  "WA-Seattle": { deadline: 21, interest: false, receipts: "Required", citation: "RCW 59.18.280", citationUrl: "#", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "WA": { deadline: 21, interest: false, receipts: "Required", citation: "RCW 59.18.280", citationUrl: "#", deliveryMethods: ["First-class mail", "Personal delivery"] },
  "IL-Chicago": { deadline: 30, interest: true, interestRate: "City rate", receipts: "Required", citation: "765 ILCS 710/1", citationUrl: "#", deliveryMethods: ["Mail", "Personal delivery"] },
  "IL": { deadline: 30, interest: false, receipts: "Required", citation: "765 ILCS 710/1", citationUrl: "#", deliveryMethods: ["Mail", "Personal delivery"] },
};

// Variant-specific content
const variantContent = {
  beta: {
    headline: "Help Us Build the Future of Deposit Compliance",
    subheadline: "Get free Pro access during beta. Your feedback shapes the product.",
    ctaText: "Join the Beta",
    ctaSubtext: "Free during beta",
    badge: "BETA",
    showPricing: false,
  },
  production: {
    headline: "Don't lose your right to deduct.",
    subheadline: "Get a dispute-ready deposit packet in 15 minutes.",
    ctaText: "Get Started Free",
    ctaSubtext: "Free plan available",
    badge: null,
    showPricing: true,
  },
};

export default function LandingPage({ variant }: LandingPageProps) {
  const content = variantContent[variant];
  const [addressInput, setAddressInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<typeof mockAddresses[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sampleTab, setSampleTab] = useState<"notice" | "itemized" | "packet">("notice");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = addressInput.length > 2
    ? mockAddresses.filter(a =>
        a.address.toLowerCase().includes(addressInput.toLowerCase())
      )
    : [];

  const handleAddressSelect = (addr: typeof mockAddresses[0]) => {
    setAddressInput(addr.address);
    setSelectedAddress(addr);
    setShowSuggestions(false);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowPreview(true);
    }, 600);
  };

  const handleTryDemo = () => {
    const demoAddress = mockAddresses[0]; // San Francisco
    setAddressInput(demoAddress.address);
    setSelectedAddress(demoAddress);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowPreview(true);
    }, 800);
  };

  const handleGeneratePacket = () => {
    if (addressInput.length > 5 && !selectedAddress) {
      setIsLoading(true);
      setTimeout(() => {
        setSelectedAddress(mockAddresses[0]);
        setIsLoading(false);
        setShowPreview(true);
      }, 800);
    }
  };

  const getRules = () => {
    if (!selectedAddress) return null;
    const cityKey = `${selectedAddress.state}-${selectedAddress.city}`;
    return rulesData[cityKey] || rulesData[selectedAddress.state] || null;
  };

  const rules = getRules();

  const getDueDate = () => {
    if (!rules) return "";
    const date = new Date();
    date.setDate(date.getDate() + rules.deadline);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Beta Banner */}
      {variant === "beta" && (
        <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
          <FlaskConical className="inline-block h-4 w-4 mr-2" />
          <span className="font-medium">Beta Access:</span> Free Pro features while we gather feedback. Help us improve!
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo iconSize={32} showCheckmark={false} />
            {variant === "beta" && (
              <Badge variant="secondary" className="ml-1 text-[10px] bg-primary/10 text-primary border-primary/20">
                BETA
              </Badge>
            )}
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              How It Works
            </Link>
            <Link href="#see-what-you-get" className="text-sm text-muted-foreground hover:text-foreground">
              Sample Output
            </Link>
            <Link href="/coverage" className="text-sm text-muted-foreground hover:text-foreground">
              Coverage
            </Link>
            {content.showPricing && (
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-cta hover:bg-cta/90 text-cta-foreground" asChild>
              <Link href="/signup">{content.ctaText}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero with Address Input + Live Preview */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
            {/* Left: Copy + Input */}
            <div className="lg:pt-2">
              {/* Variant-specific headline */}
              {variant === "beta" ? (
                <>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    <FlaskConical className="h-4 w-4" />
                    Beta Access - Free Pro Features
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                    {content.headline}
                  </h1>
                  <p className="mt-3 text-xl sm:text-2xl text-primary font-semibold">
                    {content.subheadline}
                  </p>
                  <p className="mt-4 text-base text-muted-foreground">
                    We&apos;re building the compliance tool landlords deserve. Join the beta to get{" "}
                    <span className="text-success font-semibold">free unlimited access</span> and help us get it right.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                    {content.headline}
                  </h1>
                  <p className="mt-3 text-xl sm:text-2xl text-primary font-semibold">
                    {content.subheadline}
                  </p>
                  <p className="mt-4 text-base text-muted-foreground">
                    Miss the deadline or skip itemization? You could owe{" "}
                    <span className="text-danger font-semibold">2-3× the deposit plus attorney fees</span>.
                    Get the exact deadline, required language, and proof packet—with statute citations.
                  </p>
                </>
              )}

              {/* Address Input */}
              <div className="mt-6">
                <div className="rounded-xl border-2 border-primary/20 bg-card p-4 sm:p-5 shadow-lg">
                  <div className="relative">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter your rental property address..."
                        className="pl-10 pr-4 h-12 text-base border-2 focus:border-primary"
                        value={addressInput}
                        onChange={(e) => {
                          setAddressInput(e.target.value);
                          setShowSuggestions(true);
                          setShowPreview(false);
                          setSelectedAddress(null);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                      />
                      {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
                      )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && !selectedAddress && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg">
                        {filteredSuggestions.map((addr, i) => (
                          <button
                            key={i}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                            onClick={() => handleAddressSelect(addr)}
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{addr.address}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    className="mt-4 w-full h-12 text-base font-semibold bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                    size="lg"
                    onClick={handleGeneratePacket}
                    disabled={addressInput.length < 5 || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-5 w-5" />
                    )}
                    See My Deadline & Rules Instantly
                  </Button>

                  <div className="mt-3 flex items-center justify-center">
                    <button
                      onClick={handleTryDemo}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Try demo: San Francisco, CA
                    </button>
                  </div>
                </div>
              </div>

              {/* What You Get Strip */}
              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">What you&apos;ll get:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Notice letter PDF</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Itemized statement</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Rules + citations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Deadline tracker</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Delivery proof</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>ZIP proof packet</span>
                  </div>
                </div>
              </div>

              {/* Trust Anchors + Beta badge */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {variant === "beta" && (
                  <Badge className="gap-1.5 py-1 px-2.5 bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Free during beta
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                  <BookOpen className="h-3 w-3" />
                  Primary sources only
                </Badge>
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                  <Scale className="h-3 w-3" />
                  Statute citations
                </Badge>
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
                  <BadgeCheck className="h-3 w-3" />
                  Verified Jan 2026
                </Badge>
              </div>

              {/* Social proof */}
              <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-medium">{variant === "beta" ? "Early beta users" : "500+ packets generated"}</span>
                </div>
                <span className="text-border">•</span>
                <span>12 states, 15+ cities</span>
              </div>
            </div>

            {/* Right: Live Rules Preview Card */}
            <div className="lg:pt-2">
              {showPreview && selectedAddress && rules ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="rounded-xl border-2 border-success bg-card shadow-xl overflow-hidden">
                    {/* Header with success state */}
                    <div className="bg-success/10 border-b border-success/30 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="font-bold text-success">{selectedAddress.city}, {selectedAddress.state}</span>
                      </div>
                      <Badge className="bg-success/20 text-success border-success/30 font-semibold">
                        Rules Found
                      </Badge>
                    </div>

                    {/* PUNCHY Deadline */}
                    <div className="p-5 bg-gradient-to-b from-primary/5 to-transparent">
                      <div className="rounded-xl border-2 border-primary/30 bg-card p-5 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Your deadline to return deposit:</p>
                        <p className="text-5xl sm:text-6xl lg:text-7xl font-black text-primary mt-2 tracking-tight">{rules.deadline} DAYS</p>
                        <div className="mt-3 inline-flex items-center gap-2 bg-danger/10 text-danger px-4 py-2 rounded-full">
                          <Clock className="h-4 w-4" />
                          <span className="font-bold text-sm">Due by {getDueDate()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rules Grid */}
                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground font-medium">Interest required</p>
                          <p className="text-xl font-bold mt-0.5">{rules.interest ? "Yes" : "No"}</p>
                          {rules.interest && rules.interestRate && (
                            <p className="text-xs text-primary font-medium">{rules.interestRate} annually</p>
                          )}
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground font-medium">Itemization</p>
                          <p className="text-xl font-bold mt-0.5">Required</p>
                          <p className="text-xs text-muted-foreground">{rules.receipts}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground font-medium">Max deposit</p>
                          <p className="text-xl font-bold mt-0.5">{rules.maxDeposit || "No limit"}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="text-xs text-muted-foreground font-medium">Delivery methods</p>
                          <p className="text-sm font-semibold mt-0.5">{rules.deliveryMethods[0]}</p>
                          {rules.deliveryMethods.length > 1 && (
                            <p className="text-xs text-muted-foreground">+{rules.deliveryMethods.length - 1} more</p>
                          )}
                        </div>
                      </div>

                      {/* Citation */}
                      <div className="mt-4 rounded-lg bg-muted/50 p-3 flex items-start gap-3">
                        <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <a href={rules.citationUrl} className="text-primary hover:underline font-semibold inline-flex items-center gap-1">
                            {rules.citation}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {selectedAddress.city === "San Francisco" && (
                            <span className="text-muted-foreground"> + SF Admin. Code § 49.2</span>
                          )}
                          <p className="text-muted-foreground mt-0.5">Version 2025.1 · Verified Jan 2026</p>
                        </div>
                      </div>

                      <Button className="mt-4 w-full h-12 text-base font-semibold bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg transition-all hover:shadow-xl" size="lg" asChild>
                        <Link href="/signup">
                          {variant === "beta" ? "Join Beta - Get This Free" : "Create My Full Packet"}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        {variant === "beta" ? "No credit card required • Free during beta" : "Free to start • No credit card required"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Static Preview Card - Teaser */
                <div className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden shadow-lg relative">
                  {/* Blurred teaser preview in background */}
                  <div className="absolute inset-0 opacity-40 blur-[2px] pointer-events-none">
                    <div className="bg-success/10 border-b border-success/30 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-success/50" />
                        <span className="font-bold text-success/80">San Francisco, CA</span>
                      </div>
                    </div>
                    <div className="p-5 bg-gradient-to-b from-primary/5 to-transparent">
                      <div className="rounded-xl border-2 border-primary/20 bg-card p-4 text-center">
                        <p className="text-xs text-muted-foreground">Your deadline:</p>
                        <p className="text-4xl font-black text-primary/70">21 DAYS</p>
                      </div>
                    </div>
                    <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Interest</p>
                        <p className="text-lg font-bold">Yes</p>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">Itemization</p>
                        <p className="text-lg font-bold">Required</p>
                      </div>
                    </div>
                  </div>

                  {/* Overlay with CTA */}
                  <div className="relative z-10 p-8 sm:p-10 text-center bg-gradient-to-b from-card/95 via-card/90 to-card/95">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
                      <MapPin className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">See your rules instantly</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                      Enter any rental address to see the exact deadline, interest requirements, and what you need to include.
                    </p>
                    <Button className="mt-5 bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg" size="lg" onClick={handleTryDemo}>
                      <Play className="mr-2 h-4 w-4" />
                      Try San Francisco Demo
                    </Button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      See real rules in 2 seconds
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="border-t border-border bg-danger/5 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-danger/10 text-danger px-3 py-1 rounded-full text-sm font-semibold mb-4">
              <AlertTriangle className="h-4 w-4" />
              Security deposit mistakes are expensive
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">The rules vary wildly. One mistake can cost thousands.</h2>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
            <Card className="border-danger/30 bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger/10">
                  <DollarSign className="h-6 w-6 text-danger" />
                </div>
                <h3 className="mt-4 font-bold text-lg">2-3× penalty + fees</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bad faith retention or missed deadlines can mean owing double or triple the deposit, plus the tenant&apos;s attorney fees.
                </p>
              </CardContent>
            </Card>
            <Card className="border-warning/30 bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="mt-4 font-bold text-lg">14-30 day deadlines</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  NYC gives 14 days. Texas gives 30. Miss it by one day and you may forfeit the right to deduct anything.
                </p>
              </CardContent>
            </Card>
            <Card className="border-info/30 bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <MapPin className="h-6 w-6 text-info" />
                </div>
                <h3 className="mt-4 font-bold text-lg">City overrides state</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  SF requires interest. Chicago has receipt rules. NYC caps deposits at 1 month. State law alone isn&apos;t enough.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-12 border-t border-border">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">The math is simple</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Typical security deposit</span>
                  <span className="text-xl font-bold">$3,200</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Potential penalty (2-3×)</span>
                  <span className="text-xl font-bold text-danger">$6,400 – $9,600</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Add attorney fees</span>
                  <span className="text-xl font-bold text-danger">+ $2,000+</span>
                </div>
                <div className="flex items-center justify-between py-3 bg-success/10 rounded-lg px-4 -mx-4">
                  <span className="font-semibold">LandlordComply</span>
                  <span className="text-xl font-bold text-success">
                    {variant === "beta" ? "Free during beta" : "$29 – $99"}
                  </span>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                One avoided dispute pays for <span className="font-semibold text-foreground">decades</span> of compliance packets.
              </p>

              <Button className="mt-6 w-full" size="lg" asChild>
                <Link href="/signup">
                  {variant === "beta" ? "Join the Beta - It's Free" : "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 5 Steps */}
      <section id="how-it-works" className="py-16 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">From address to court-ready packet</h2>
            <p className="mt-4 text-muted-foreground">
              Complete a security deposit disposition in under 15 minutes.
            </p>
          </div>

          {/* Steps */}
          <div className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-5">
            <StepItem number="1" title="Enter address" description="We resolve jurisdiction instantly" />
            <StepItem number="2" title="See rules" description="Deadline, interest, requirements" />
            <StepItem number="3" title="Add deductions" description="With risk guidance" />
            <StepItem number="4" title="Generate notice" description="Compliant PDF" />
            <StepItem number="5" title="Export packet" description="Full audit trail" />
          </div>

          {/* 3 Screenshot Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Rules Snapshot Card */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 border-b px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">RULES SNAPSHOT</span>
                <Badge variant="secondary" className="text-[10px]">San Francisco, CA</Badge>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Return deadline</span>
                  <span className="font-semibold">21 days</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Interest required</span>
                  <span className="font-semibold">Yes (5.0%)</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Itemization</span>
                  <span className="font-semibold">Required</span>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <BookOpen className="h-3 w-3" />
                    <span>Cal. Civ. Code § 1950.5</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Verified Jan 2026</p>
                </div>
              </div>
              <div className="bg-success/5 border-t border-success/20 px-4 py-2">
                <p className="text-xs text-success font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Citations on every rule
                </p>
              </div>
            </div>

            {/* Notice Preview Card */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 border-b px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">NOTICE PREVIEW</span>
                <Badge variant="secondary" className="text-[10px]">PDF</Badge>
              </div>
              <div className="p-4">
                <div className="rounded border bg-white p-3 text-xs font-mono leading-relaxed text-muted-foreground shadow-sm">
                  <p className="font-sans text-foreground font-semibold text-sm mb-2">SECURITY DEPOSIT DISPOSITION</p>
                  <p>Date: January 11, 2026</p>
                  <p>To: Sarah Johnson</p>
                  <p>Property: 123 Market St, SF</p>
                  <div className="my-2 border-t border-dashed pt-2">
                    <p>Pursuant to Cal. Civ. Code</p>
                    <p>Section 1950.5...</p>
                  </div>
                  <p className="border-t pt-2 mt-2">Deposit: $3,200.00</p>
                  <p>Interest: +$160.00</p>
                  <p>Deductions: -$525.00</p>
                  <p className="font-semibold text-foreground">Refund: $2,835.00</p>
                </div>
              </div>
              <div className="bg-primary/5 border-t border-primary/20 px-4 py-2">
                <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Jurisdiction-specific language
                </p>
              </div>
            </div>

            {/* Proof Packet Card */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 border-b px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">PROOF PACKET</span>
                <Badge variant="secondary" className="text-[10px]">ZIP</Badge>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { name: "notice_letter.pdf", size: "124 KB" },
                  { name: "itemized_statement.pdf", size: "89 KB" },
                  { name: "rules_snapshot.pdf", size: "156 KB" },
                  { name: "audit_log.pdf", size: "45 KB" },
                  { name: "photos/", size: "3 files" },
                ].map((file) => (
                  <div key={file.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </div>
                ))}
              </div>
              <div className="bg-info/5 border-t border-info/20 px-4 py-2">
                <p className="text-xs text-info font-medium flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Complete audit trail
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* See a Real Sample Packet - Tabbed Proof Visuals */}
      <section id="sample-packet" className="border-t border-border py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">Sample Output</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">See exactly what you&apos;ll get</h2>
            <p className="mt-4 text-muted-foreground">
              Real examples of the documents landlords use to prove compliance in court.
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-lg border bg-muted/50 p-1">
              <button
                onClick={() => setSampleTab("notice")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  sampleTab === "notice"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="inline-block h-4 w-4 mr-2" />
                Notice Letter
              </button>
              <button
                onClick={() => setSampleTab("itemized")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  sampleTab === "itemized"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Receipt className="inline-block h-4 w-4 mr-2" />
                Itemized Statement
              </button>
              <button
                onClick={() => setSampleTab("packet")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  sampleTab === "packet"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Package className="inline-block h-4 w-4 mr-2" />
                Proof Packet
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8 mx-auto max-w-4xl">
            {sampleTab === "notice" && (
              <div className="animate-in fade-in duration-300">
                <div className="rounded-xl border-2 border-primary/20 bg-card shadow-lg overflow-hidden">
                  {/* PDF Header Bar */}
                  <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">notice_letter_johnson_123market.pdf</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/30 text-[10px]">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Rules Verified Jan 2026
                      </Badge>
                    </div>
                  </div>

                  {/* PDF Content Preview */}
                  <div className="p-6 sm:p-8 bg-white">
                    <div className="max-w-xl mx-auto space-y-6 font-serif text-sm leading-relaxed">
                      {/* Letterhead */}
                      <div className="text-center border-b pb-4">
                        <p className="text-lg font-bold text-foreground">SECURITY DEPOSIT DISPOSITION NOTICE</p>
                        <p className="text-xs text-muted-foreground mt-1">Pursuant to California Civil Code § 1950.5</p>
                      </div>

                      {/* Date and Address */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-semibold">Date: January 11, 2026</p>
                          <p className="mt-2">To: Sarah Johnson</p>
                          <p>456 Oak Avenue, Apt 2B</p>
                          <p>San Francisco, CA 94110</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">RE: Security Deposit</p>
                          <p className="font-semibold">123 Market St, Unit 4A</p>
                          <p>San Francisco, CA 94102</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="space-y-3 text-xs">
                        <p>Dear Ms. Johnson,</p>
                        <p>
                          This letter serves as formal notice regarding the disposition of your security deposit
                          for the above-referenced property. Your tenancy ended on <strong>December 31, 2025</strong>.
                        </p>
                        <p>
                          Pursuant to <span className="text-primary font-medium">California Civil Code § 1950.5</span> and
                          <span className="text-primary font-medium"> San Francisco Administrative Code § 49.2</span>,
                          I am required to return your security deposit or provide an itemized statement of deductions
                          within <strong>21 days</strong> of your move-out date.
                        </p>
                      </div>

                      {/* Summary Box */}
                      <div className="rounded-lg border bg-muted/30 p-4 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between">
                            <span>Original Deposit:</span>
                            <span className="font-semibold">$3,200.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interest (5.0%):</span>
                            <span className="font-semibold text-success">+$160.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Deductions:</span>
                            <span className="font-semibold text-danger">-$525.00</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-bold">
                            <span>Refund Amount:</span>
                            <span className="text-primary">$2,835.00</span>
                          </div>
                        </div>
                      </div>

                      {/* Citation Footer */}
                      <div className="rounded bg-primary/5 border border-primary/20 p-3 text-[10px]">
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-primary">Legal Citations</p>
                            <p className="text-muted-foreground mt-1">
                              Cal. Civ. Code § 1950.5 • SF Admin. Code § 49.2 • Rules Version 2026.1
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  ↑ Actual notice letter with jurisdiction-specific language and required citations
                </p>
              </div>
            )}

            {sampleTab === "itemized" && (
              <div className="animate-in fade-in duration-300">
                <div className="rounded-xl border-2 border-success/20 bg-card shadow-lg overflow-hidden">
                  {/* PDF Header Bar */}
                  <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">itemized_statement_johnson.pdf</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      <Calculator className="h-3 w-3 mr-1" />
                      Math Verified
                    </Badge>
                  </div>

                  {/* Statement Content */}
                  <div className="p-6 sm:p-8 bg-white">
                    <div className="max-w-xl mx-auto">
                      <h3 className="text-center font-bold text-lg mb-6">Itemized Statement of Deductions</h3>

                      {/* Deductions Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-4 py-2 font-semibold">Description</th>
                              <th className="text-left px-4 py-2 font-semibold">Category</th>
                              <th className="text-right px-4 py-2 font-semibold">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-3">
                                <p className="font-medium">Carpet cleaning - pet odor treatment</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Professional deep clean required due to pet stains in master bedroom. Invoice #4521 from CleanPro Services attached.</p>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">Cleaning</td>
                              <td className="px-4 py-3 text-right font-medium">$185.00</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <p className="font-medium">Repair holes in living room wall (3)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Three holes larger than standard picture hanging. Patching and repainting required. Photos attached.</p>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">Repairs</td>
                              <td className="px-4 py-3 text-right font-medium">$140.00</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <p className="font-medium">Replace damaged blinds - kitchen window</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Blinds broken beyond repair. <span className="text-primary font-medium">Prorated: 3 yrs of 7 yr lifespan = 57% deducted.</span>
                                </p>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">Damages</td>
                              <td className="px-4 py-3 text-right">
                                <p className="font-medium">$200.00</p>
                                <p className="text-xs text-success">(-$114 proration)</p>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot className="bg-muted/30">
                            <tr className="font-bold">
                              <td colSpan={2} className="px-4 py-3 text-right">Total Deductions:</td>
                              <td className="px-4 py-3 text-right text-danger">$525.00</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Interest Calculation */}
                      <div className="mt-4 rounded-lg border bg-success/5 p-4">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-success" />
                          Interest Calculation (SF Rent Board Rate)
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                          <span>Deposit held:</span><span>$3,200.00 × 12 months</span>
                          <span>Annual rate:</span><span>5.0% (SF 2025 rate)</span>
                          <span className="font-semibold text-foreground">Interest owed:</span>
                          <span className="font-semibold text-success">$160.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  ↑ Clear itemization with proration calculations and evidence references
                </p>
              </div>
            )}

            {sampleTab === "packet" && (
              <div className="animate-in fade-in duration-300">
                <div className="rounded-xl border-2 border-info/20 bg-card shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-info" />
                      <span className="text-sm font-medium">proof_packet_johnson_123market_2026-01-11.zip</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      <Download className="h-3 w-3 mr-1" />
                      2.4 MB
                    </Badge>
                  </div>

                  {/* File Tree */}
                  <div className="p-6 sm:p-8">
                    <div className="max-w-xl mx-auto space-y-1">
                      {[
                        { name: "📄 notice_letter.pdf", size: "124 KB", desc: "Compliant disposition notice" },
                        { name: "📄 itemized_statement.pdf", size: "89 KB", desc: "Deductions with evidence links" },
                        { name: "📄 rules_snapshot.pdf", size: "156 KB", desc: "Jurisdiction rules at case creation" },
                        { name: "📄 audit_log.pdf", size: "45 KB", desc: "Timestamped action history" },
                        { name: "📄 delivery_checklist.pdf", size: "23 KB", desc: "Allowed methods + tracking" },
                        { name: "📁 evidence/", size: "", desc: "" },
                        { name: "    📷 photo_carpet_stain.jpg", size: "1.2 MB", desc: "Move-out condition" },
                        { name: "    📷 photo_wall_holes.jpg", size: "890 KB", desc: "Living room damage" },
                        { name: "    📄 invoice_cleanpro_4521.pdf", size: "67 KB", desc: "Cleaning receipt" },
                        { name: "    📄 receipt_blinds_homedepot.pdf", size: "34 KB", desc: "Replacement cost" },
                      ].map((file, i) => (
                        <div key={i} className={`flex items-center justify-between py-2 ${file.name.startsWith("    ") ? "pl-4" : ""} ${!file.name.startsWith("📁") ? "hover:bg-muted/50 rounded px-2 -mx-2" : ""}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono">{file.name}</span>
                            {file.desc && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">— {file.desc}</span>
                            )}
                          </div>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Audit Log Preview */}
                    <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                      <p className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-info" />
                        Audit Log Preview
                      </p>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex gap-4">
                          <span className="text-muted-foreground w-36">2026-01-02 09:14:22</span>
                          <span>Case created for 123 Market St</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground w-36">2026-01-02 09:15:01</span>
                          <span>Rules loaded: CA + San Francisco (v2026.1)</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground w-36">2026-01-05 14:32:18</span>
                          <span>Deduction added: Carpet cleaning ($185)</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground w-36">2026-01-11 10:45:33</span>
                          <span>Notice letter generated</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground w-36">2026-01-11 10:47:12</span>
                          <span className="text-success">Proof packet exported</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  ↑ Everything you need if a tenant disputes—timestamped and organized
                </p>
              </div>
            )}
          </div>

          {/* CTA after tabs */}
          <div className="mt-10 text-center">
            <Button className="bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg" size="lg" asChild>
              <Link href="/signup">
                {variant === "beta" ? "Join Beta - Get This Free" : "Generate My Packet"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* See What You Get - Summary */}
      <section id="see-what-you-get" className="border-t border-border py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Everything you need if it goes to court</h2>
            <p className="mt-4 text-muted-foreground">
              A complete, dispute-ready documentation packet for every move-out.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Left: Stacked Document Previews */}
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4 flex gap-4 hover:border-primary/50 transition-colors">
                <div className="w-16 h-20 rounded border bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Notice Letter</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compliant disposition notice with jurisdiction-specific language and required disclosures.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Includes statutory references</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 flex gap-4 hover:border-primary/50 transition-colors">
                <div className="w-16 h-20 rounded border bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  <Receipt className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Itemized Statement</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Line-by-line breakdown of deductions with categories and linked evidence.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Math validated automatically</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 flex gap-4 hover:border-primary/50 transition-colors">
                <div className="w-16 h-20 rounded border bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  <BookOpen className="h-6 w-6 text-info" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Rules Snapshot</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The exact rules applied, with statute citations, version number, and verification date.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Locked to case creation date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary + CTA */}
            <div>
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
                <h3 className="font-bold text-lg">Your proof packet includes:</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Compliant notice letter (PDF)",
                    "Itemized statement with all deductions",
                    "Rules snapshot with statute citations",
                    "Audit log with timestamps",
                    "Delivery method checklist",
                    "Attached photos and receipts",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Everything you need if a tenant disputes your deductions or you need to prove compliance in small claims court.
                  </p>
                </div>

                <Button className="mt-6 w-full bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg transition-all hover:shadow-xl" size="lg" asChild>
                  <Link href="/signup">
                    {variant === "beta" ? "Join Beta - Get This Free" : "Generate My Packet"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Methodology */}
      <section id="methodology" className="py-16 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">How we maintain accuracy</h2>
            <p className="mt-4 text-muted-foreground">
              Legal-adjacent tools require transparency. Here&apos;s how we earn your trust.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <BookOpen className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">Primary sources only</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every rule links directly to state statutes and city ordinances. No interpretations from blogs or forums.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CalendarClock className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">Version-controlled rules</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each rule set has a version number and &quot;last verified&quot; date. When you generate a notice, the version is locked.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">Clear boundaries</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We explicitly state which jurisdictions are covered. No implied completeness. You always know what you&apos;re getting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Supported jurisdictions</h2>
          <p className="mt-4 text-muted-foreground">
            State-level coverage plus city-specific rules for major metros.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {[
              "California",
              "New York",
              "Texas",
              "Washington",
              "Illinois",
              "Colorado",
              "Florida",
              "Massachusetts",
            ].map((state) => (
              <div
                key={state}
                className="flex items-center justify-center gap-2 rounded-lg border bg-card p-3"
              >
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">{state}</span>
              </div>
            ))}
            <Link
              href="/coverage"
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
            >
              View all + cities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            City-level: San Francisco, Los Angeles, Seattle, NYC, Chicago, and more.
          </p>
        </div>
      </section>

      {/* Pricing - Only show in production variant */}
      {content.showPricing && (
        <section id="pricing" className="border-t border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Simple pricing</h2>
              <p className="mt-4 text-muted-foreground">
                Start free. Pay only when you need more.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3 mx-auto max-w-5xl">
              {/* Free Plan */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold">Free</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Try it out</p>
                  <p className="mt-4">
                    <span className="text-3xl font-bold">$0</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    <PricingFeature>1 property</PricingFeature>
                    <PricingFeature>1 active case</PricingFeature>
                    <PricingFeature>State-level rules</PricingFeature>
                    <PricingFeature>PDF notice generation</PricingFeature>
                  </ul>
                  <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href="/signup">Start Free</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Single Packet */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold">Single Packet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">One move-out</p>
                  <p className="mt-4">
                    <span className="text-3xl font-bold">$29</span>
                    <span className="text-muted-foreground text-sm ml-1">one-time</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    <PricingFeature>1 complete case</PricingFeature>
                    <PricingFeature>City + state rules</PricingFeature>
                    <PricingFeature>PDF notice + itemization</PricingFeature>
                    <PricingFeature>Proof packet export</PricingFeature>
                  </ul>
                  <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href="/signup">Buy Packet</Link>
                  </Button>
                  <p className="mt-3 text-xs text-center text-muted-foreground">
                    Apply $29 toward Pro within 7 days
                  </p>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="border-primary relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Best Value</Badge>
                </div>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold">Pro</h3>
                  <p className="mt-1 text-sm text-muted-foreground">For active landlords</p>
                  <p className="mt-4">
                    <span className="text-3xl font-bold">$99</span>
                    <span className="text-muted-foreground text-sm ml-1">/year</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    <PricingFeature>Unlimited properties</PricingFeature>
                    <PricingFeature>Unlimited cases</PricingFeature>
                    <PricingFeature>City + state rules</PricingFeature>
                    <PricingFeature>Email deadline reminders</PricingFeature>
                    <PricingFeature>Proof packet exports</PricingFeature>
                    <PricingFeature>Priority support</PricingFeature>
                  </ul>
                  <Button className="mt-6 w-full" asChild>
                    <Link href="/signup">Start Pro</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-16 border-t border-border">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Frequently asked questions</h2>

          <div className="mt-10 space-y-2">
            {[
              {
                q: "Is this legal advice?",
                a: "No. LandlordComply is an educational compliance tool that helps you understand and apply the rules in your jurisdiction. We provide statute citations and official sources, but we are not attorneys and this is not legal advice. For specific legal questions, consult a licensed attorney in your state."
              },
              {
                q: "What states and cities are covered?",
                a: "We currently cover 12 states (CA, NY, TX, WA, IL, CO, FL, MA, AZ, OR, GA, NC) with state-level rules, plus city-specific rules for major metros including San Francisco, Los Angeles, Seattle, NYC, and Chicago. Check our coverage page for the full list."
              },
              ...(variant === "beta" ? [
                {
                  q: "Is this really free during beta?",
                  a: "Yes! During the beta period, you get full Pro access at no cost. We're focused on gathering feedback and validating the product. When we launch, beta users will get special pricing as a thank-you for helping us build a better product."
                },
                {
                  q: "What happens when beta ends?",
                  a: "We'll give you plenty of notice before the beta period ends. Your data and cases will remain accessible, and you'll have the option to continue with a paid plan or export your data. Beta participants will receive special launch pricing."
                }
              ] : []),
              {
                q: "What if the law changes after I create a case?",
                a: "When you create a case, we lock the rule set version to that moment. Your case will always show the rules that were in effect when you started it, with the verification date clearly displayed. This protects you if there's ever a dispute about which rules applied."
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-lg border bg-card">
                <button
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground">
            {variant === "beta" ? "Join the beta today" : "Don't risk a $5,000+ mistake"}
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            {variant === "beta"
              ? "Get free Pro access and help us build the compliance tool landlords deserve."
              : "Get your deadline, rules, and proof packet in 15 minutes. Free to start."}
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link href="/signup">
              {variant === "beta" ? "Join the Beta" : "Generate My First Packet"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-primary-foreground/60">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo iconSize={32} showCheckmark={false} />
              {variant === "beta" && (
                <Badge variant="secondary" className="ml-1 text-[10px]">BETA</Badge>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/coverage" className="hover:text-foreground">Coverage</Link>
              <Link href="#methodology" className="hover:text-foreground">Methodology</Link>
              <Link href="#faq" className="hover:text-foreground">FAQ</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Privacy</Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Educational tool only. Not legal advice. Always verify with official sources and consult an attorney for specific legal questions.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepItem({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mt-3 font-semibold text-sm">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
