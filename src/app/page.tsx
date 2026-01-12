"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Info,
  Loader2,
  Play,
  Eye,
  Download,
} from "lucide-react";

// Mock address suggestions for demo
const mockAddresses = [
  { address: "123 Market St, San Francisco, CA 94102", state: "CA", city: "San Francisco" },
  { address: "456 Broadway, Seattle, WA 98101", state: "WA", city: "Seattle" },
  { address: "789 5th Ave, New York, NY 10022", state: "NY", city: "New York City" },
  { address: "321 Congress Ave, Austin, TX 78701", state: "TX", city: "Austin" },
  { address: "555 N Michigan Ave, Chicago, IL 60611", state: "IL", city: "Chicago" },
  { address: "100 Wilshire Blvd, Los Angeles, CA 90024", state: "CA", city: "Los Angeles" },
];

const rulesData: Record<string, { deadline: number; interest: boolean; interestRate?: string; receipts: string; citation: string; citationUrl: string; maxDeposit?: string }> = {
  "CA-San Francisco": { deadline: 21, interest: true, interestRate: "0.1%", receipts: "Required over $125", citation: "Cal. Civ. Code § 1950.5", citationUrl: "#", maxDeposit: "2 months" },
  "CA-Los Angeles": { deadline: 21, interest: false, receipts: "Required over $125", citation: "Cal. Civ. Code § 1950.5", citationUrl: "#", maxDeposit: "2 months" },
  "CA": { deadline: 21, interest: false, receipts: "Required over $125", citation: "Cal. Civ. Code § 1950.5", citationUrl: "#", maxDeposit: "2 months" },
  "NY-New York City": { deadline: 14, interest: true, interestRate: "Prevailing rate", receipts: "Required", citation: "NY Gen. Oblig. Law § 7-108", citationUrl: "#", maxDeposit: "1 month" },
  "NY": { deadline: 14, interest: true, interestRate: "Prevailing rate", receipts: "Required", citation: "NY Gen. Oblig. Law § 7-108", citationUrl: "#", maxDeposit: "1 month" },
  "TX-Austin": { deadline: 30, interest: false, receipts: "Required", citation: "Tex. Prop. Code § 92.103", citationUrl: "#" },
  "TX": { deadline: 30, interest: false, receipts: "Required", citation: "Tex. Prop. Code § 92.103", citationUrl: "#" },
  "WA-Seattle": { deadline: 21, interest: false, receipts: "Required", citation: "RCW 59.18.280", citationUrl: "#" },
  "WA": { deadline: 21, interest: false, receipts: "Required", citation: "RCW 59.18.280", citationUrl: "#" },
  "IL-Chicago": { deadline: 30, interest: true, interestRate: "City rate", receipts: "Required", citation: "765 ILCS 710/1", citationUrl: "#" },
  "IL": { deadline: 30, interest: false, receipts: "Required", citation: "765 ILCS 710/1", citationUrl: "#" },
};

export default function LandingPage() {
  const [addressInput, setAddressInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<typeof mockAddresses[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">LC</span>
            </div>
            <span className="font-semibold text-foreground">LandlordComply</span>
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
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/dashboard">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Softer Trust Note */}
      <section className="border-b border-border/50 bg-muted/30 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 text-xs sm:text-sm text-muted-foreground">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Educational compliance tool — not legal advice. Always verify with official sources.
          </span>
        </div>
      </section>

      {/* Hero with Address Input + Live Preview */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
            {/* Left: Copy + Input */}
            <div className="lg:pt-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Generate a compliant security deposit packet from an address
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                Deadlines, interest calculations, itemization rules, and a printable notice —
                with statute citations and a saved audit trail.
              </p>
              <p className="mt-3 text-sm font-medium text-foreground/80">
                Avoid penalties up to 2-3x the deposit and missed 14-30 day deadlines.
              </p>

              {/* Address Input */}
              <div className="mt-8">
                <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
                  <div className="relative">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter rental property address..."
                        className="pl-10 pr-4 h-12 text-base"
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
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
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

                  <div className="mt-4 flex gap-3">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleGeneratePacket}
                      disabled={addressInput.length < 5 || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Package className="mr-2 h-4 w-4" />
                      )}
                      Generate My Packet
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={handleTryDemo}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Try demo: 123 Market St, San Francisco
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="mt-6 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>Official statutes (no blogs)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>Citations on every rule</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>Proof packet export</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span>500+ packets generated</span>
                  </div>
                  <span className="text-border">|</span>
                  <span>10 states, 15+ cities</span>
                </div>
              </div>
            </div>

            {/* Right: Live Rules Preview Card */}
            <div className="lg:pt-4">
              {showPreview && selectedAddress && rules ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="rounded-xl border-2 border-primary/40 bg-card shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary/5 border-b border-primary/20 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="font-semibold">{selectedAddress.city}, {selectedAddress.state}</span>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        City + State Rules
                      </Badge>
                    </div>

                    {/* Rules Grid */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Return deadline</p>
                          <p className="text-2xl font-bold text-primary">{rules.deadline} days</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Due {getDueDate()}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Interest required</p>
                          <p className="text-2xl font-bold">{rules.interest ? "Yes" : "No"}</p>
                          {rules.interest && rules.interestRate && (
                            <p className="text-xs text-muted-foreground mt-0.5">{rules.interestRate} annually</p>
                          )}
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Itemization</p>
                          <p className="text-lg font-bold">Required</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rules.receipts}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Max deposit</p>
                          <p className="text-lg font-bold">{rules.maxDeposit || "No limit"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">State law</p>
                        </div>
                      </div>

                      {/* Citation */}
                      <div className="mt-4 rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-xs">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span className="text-muted-foreground">Source:</span>
                          <a href={rules.citationUrl} className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
                            {rules.citation}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {selectedAddress.city === "San Francisco" && (
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="ml-5 text-muted-foreground">+ </span>
                            <a href="#" className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
                              SF Admin. Code § 49.2
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 ml-5">
                          Version 2026.1 · Last verified Jan 2026
                        </p>
                      </div>

                      <Button className="mt-4 w-full" size="lg" asChild>
                        <Link href="/dashboard">
                          Create Full Packet
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Static Preview Card (before interaction) */
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden opacity-60">
                  <div className="bg-muted/30 border-b px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-muted" />
                      <span className="text-muted-foreground">Enter an address to see rules</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg border bg-muted/20 p-3">
                          <div className="h-3 w-16 bg-muted rounded mb-2" />
                          <div className="h-6 w-12 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg bg-muted/30 p-3">
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                    <div className="mt-4 h-10 w-full bg-muted rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">Why this matters</h2>
            <p className="mt-4 text-muted-foreground">
              Security deposit mistakes are expensive. The rules vary wildly by location.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
            <Card className="border-danger/30">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger/10">
                  <DollarSign className="h-6 w-6 text-danger" />
                </div>
                <h3 className="mt-4 font-semibold">Penalties up to 2-3x deposit</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bad faith retention or missed deadlines can mean owing the tenant double or triple
                  the original deposit, plus attorney fees.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="mt-4 font-semibold">14-30 day deadlines</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deadlines vary by state (and some cities override). Miss it by one day
                  and you may forfeit the right to deduct anything.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <MapPin className="h-6 w-6 text-info" />
                </div>
                <h3 className="mt-4 font-semibold">City ordinances override state</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  SF requires interest. Chicago has specific receipt rules.
                  NYC limits deposits to 1 month. State law alone isn't enough.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Annotated Cards */}
      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">From address to dispute-ready packet</h2>
            <p className="mt-4 text-muted-foreground">
              Complete a security deposit disposition in under 15 minutes.
            </p>
          </div>

          {/* Steps */}
          <div className="mt-12 grid gap-6 md:grid-cols-5">
            <StepItem number="1" title="Enter address" description="We resolve jurisdiction instantly" />
            <StepItem number="2" title="See rules" description="With statute citations" />
            <StepItem number="3" title="Add amounts" description="Deposit, interest, deductions" />
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
                  <span className="font-semibold">Yes (0.1%)</span>
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
                  Citations included on every rule
                </p>
              </div>
            </div>

            {/* Notice Preview Card */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/30 border-b px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">NOTICE PREVIEW</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>
              <div className="p-4">
                <div className="rounded border bg-muted/20 p-3 text-xs font-mono leading-relaxed text-muted-foreground">
                  <p className="font-sans text-foreground font-semibold text-sm mb-2">SECURITY DEPOSIT DISPOSITION</p>
                  <p>Date: January 11, 2026</p>
                  <p>To: Sarah Johnson</p>
                  <p>Property: 123 Market St, SF</p>
                  <div className="my-2 border-t border-dashed pt-2">
                    <p>Pursuant to Cal. Civ. Code</p>
                    <p>Section 1950.5...</p>
                  </div>
                  <p className="border-t pt-2 mt-2">Deposit: $3,200.00</p>
                  <p>Interest: +$3.20</p>
                  <p>Deductions: -$525.00</p>
                  <p className="font-semibold text-foreground">Refund: $2,678.20</p>
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
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
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
                  Complete audit trail + timestamps
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* See What You Get - Product Proof Section */}
      <section id="see-what-you-get" className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">See what you get</h2>
            <p className="mt-4 text-muted-foreground">
              A complete, dispute-ready documentation packet for every move-out.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Left: Stacked Document Previews */}
            <div className="space-y-4">
              {/* Notice Document */}
              <div className="rounded-lg border bg-card p-4 flex gap-4">
                <div className="w-20 h-28 rounded border bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-primary mx-auto" />
                    <p className="text-[8px] text-muted-foreground mt-1">PDF</p>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Notice Letter</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compliant disposition notice with jurisdiction-specific language,
                    required disclosures, and proper formatting.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>Includes statutory references</span>
                  </div>
                </div>
              </div>

              {/* Itemized Statement */}
              <div className="rounded-lg border bg-card p-4 flex gap-4">
                <div className="w-20 h-28 rounded border bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 text-success mx-auto" />
                    <p className="text-[8px] text-muted-foreground mt-1">PDF</p>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Itemized Statement</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Line-by-line breakdown of deductions with categories,
                    amounts, and linked evidence references.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>Math validated automatically</span>
                  </div>
                </div>
              </div>

              {/* Rules Snapshot */}
              <div className="rounded-lg border bg-card p-4 flex gap-4">
                <div className="w-20 h-28 rounded border bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 text-info mx-auto" />
                    <p className="text-[8px] text-muted-foreground mt-1">PDF</p>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Rules Snapshot</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The exact rules applied to your case, with statute citations,
                    version number, and verification date.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>Locked to case creation date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary + CTA */}
            <div className="lg:pl-8">
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
                <h3 className="font-semibold text-lg">Your proof packet includes:</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Compliant notice letter (PDF)",
                    "Itemized statement with all deductions",
                    "Rules snapshot with citations",
                    "Audit log with timestamps",
                    "Checklist completion record",
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
                    Everything you need if a tenant disputes your deductions
                    or you need to document your compliance.
                  </p>
                </div>

                <Button className="mt-6 w-full" size="lg" asChild>
                  <Link href="/dashboard">
                    Generate My Packet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Testimonial */}
              <div className="mt-6 rounded-lg border bg-card p-4">
                <p className="text-sm italic text-foreground">
                  "Finally, something that actually calculates the deadline and tells me what I need to include.
                  Saved me hours of Googling."
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  — Beta user, self-managing landlord (SF Bay Area)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Methodology */}
      <section id="methodology" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">How we maintain accuracy</h2>
            <p className="mt-4 text-muted-foreground">
              Legal compliance tools require transparency.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <BookOpen className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">Primary sources only</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every rule links directly to state statutes and city ordinances.
                  No interpretations from blogs or forums.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <CalendarClock className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">Version-controlled rules</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each rule set has a version number and "last verified" date.
                  When you generate a notice, the version is locked to your case.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">Clear coverage boundaries</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We explicitly state which jurisdictions are covered and what's not.
                  No implied completeness.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 border-t border-border bg-muted/30">
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

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-16">
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
                  <Link href="/dashboard">Start Free</Link>
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
                  <Link href="/dashboard">Buy Packet</Link>
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
                  <Link href="/dashboard">Start Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Generate your first packet</h2>
          <p className="mt-4 text-muted-foreground">
            Free to start. No credit card required.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">LC</span>
              </div>
              <span className="font-semibold text-foreground">LandlordComply</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/coverage" className="hover:text-foreground">Coverage</Link>
              <Link href="#methodology" className="hover:text-foreground">Methodology</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Disclaimers</Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Educational tool only. Not legal advice. Always verify with official sources.
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
