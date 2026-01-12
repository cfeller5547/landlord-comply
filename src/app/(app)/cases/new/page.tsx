"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CoverageBadge, TrustBanner } from "@/components/domain";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  address: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  jurisdiction: {
    id: string;
    state: string;
    stateCode: string;
    city: string | null;
    coverageLevel: string;
  };
}

interface JurisdictionResult {
  jurisdiction: {
    id: string;
    state: string;
    stateCode: string;
    city: string | null;
    coverageLevel: "FULL" | "PARTIAL" | "STATE_ONLY";
  };
  ruleSet: {
    id: string;
    version: string;
    effectiveDate: string;
    verifiedAt: string | null;
    returnDeadlineDays: number;
    returnDeadlineDescription: string | null;
    interestRequired: boolean;
    interestRate: number | null;
    interestRateSource: string | null;
    itemizationRequired: boolean;
    itemizationRequirements: string | null;
    maxDepositMonths: number | null;
    allowedDeliveryMethods: string[];
    citations: Array<{
      id: string;
      code: string;
      title: string;
      url: string | null;
      excerpt: string | null;
    }>;
    penalties: Array<{
      id: string;
      condition: string;
      penalty: string;
      description: string | null;
    }>;
  } | null;
}

const steps = [
  { id: 1, name: "Property", icon: Building2 },
  { id: 2, name: "Move-out & Deposit", icon: Calendar },
  { id: 3, name: "Rules Summary", icon: FileText },
];

// State name to code mapping
const stateNameToCode: Record<string, string> = {
  california: "CA",
  washington: "WA",
  "new york": "NY",
  texas: "TX",
  illinois: "IL",
  colorado: "CO",
  florida: "FL",
  massachusetts: "MA",
  oregon: "OR",
  arizona: "AZ",
};

function getStateCode(state: string): string {
  const normalized = state.toLowerCase().trim();
  // If already a 2-letter code, return uppercase
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  return stateNameToCode[normalized] || state.toUpperCase();
}

export default function NewCasePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    address: "",
    unit: "",
    city: "",
    state: "",
    zipCode: "",
    selectedPropertyId: "",
    moveOutDate: "",
    leaseStartDate: "",
    leaseEndDate: "",
    depositAmount: "",
    tenantName: "",
    tenantEmail: "",
    forwardingAddress: "",
  });

  const [jurisdictionResult, setJurisdictionResult] = useState<JurisdictionResult | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Fetch user's properties on load
  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch("/api/properties");
        if (response.ok) {
          const data = await response.json();
          setProperties(data);
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const handleAddressCheck = async () => {
    if (!formData.state || !formData.city) return;

    setChecking(true);
    setError(null);

    try {
      const stateCode = getStateCode(formData.state);
      const response = await fetch(
        `/api/jurisdictions/lookup?state=${encodeURIComponent(stateCode)}&city=${encodeURIComponent(formData.city)}`
      );

      if (response.ok) {
        const data = await response.json();
        setJurisdictionResult(data);
        setSelectedProperty(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Jurisdiction not found");
        setJurisdictionResult(null);
      }
    } catch (err) {
      setError("Failed to check coverage. Please try again.");
      setJurisdictionResult(null);
    } finally {
      setChecking(false);
    }
  };

  const handleSelectProperty = async (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property) {
      setFormData((prev) => ({
        ...prev,
        selectedPropertyId: propertyId,
        address: property.address,
        unit: property.unit || "",
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
      }));
      setSelectedProperty(property);

      // Fetch rules for this property's jurisdiction
      setChecking(true);
      try {
        const response = await fetch(
          `/api/jurisdictions/lookup?state=${property.jurisdiction.stateCode}&city=${property.jurisdiction.city || ""}`
        );
        if (response.ok) {
          const data = await response.json();
          setJurisdictionResult(data);
        }
      } catch (err) {
        console.error("Error fetching jurisdiction rules:", err);
      } finally {
        setChecking(false);
      }
    }
  };

  const canProceedStep1 = jurisdictionResult !== null && formData.address;
  const canProceedStep2 = formData.moveOutDate && formData.depositAmount && formData.tenantName;

  const handleCreateCase = async () => {
    setCreating(true);
    setError(null);

    try {
      let propertyId = formData.selectedPropertyId;

      // If no property selected, create a new one
      if (!propertyId) {
        const propertyResponse = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: formData.address,
            unit: formData.unit || undefined,
            city: formData.city,
            state: getStateCode(formData.state),
            zipCode: formData.zipCode,
          }),
        });

        if (!propertyResponse.ok) {
          const errorData = await propertyResponse.json();
          throw new Error(errorData.error || "Failed to create property");
        }

        const newProperty = await propertyResponse.json();
        propertyId = newProperty.id;
      }

      // Calculate reasonable lease dates if not provided
      const moveOutDate = new Date(formData.moveOutDate);
      const leaseEndDate = formData.leaseEndDate
        ? new Date(formData.leaseEndDate)
        : moveOutDate;
      const leaseStartDate = formData.leaseStartDate
        ? new Date(formData.leaseStartDate)
        : new Date(leaseEndDate.getTime() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year prior

      // Create the case
      const caseResponse = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          leaseStartDate: leaseStartDate.toISOString(),
          leaseEndDate: leaseEndDate.toISOString(),
          moveOutDate: moveOutDate.toISOString(),
          depositAmount: parseFloat(formData.depositAmount),
          tenants: [
            {
              name: formData.tenantName,
              email: formData.tenantEmail || undefined,
              forwardingAddress: formData.forwardingAddress || undefined,
            },
          ],
        }),
      });

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json();
        throw new Error(errorData.error || "Failed to create case");
      }

      const newCase = await caseResponse.json();
      router.push(`/cases/${newCase.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create case. Please try again.");
      setCreating(false);
    }
  };

  const rules = jurisdictionResult?.ruleSet;

  const calculateDueDate = () => {
    if (!formData.moveOutDate || !rules) return null;
    const moveOut = new Date(formData.moveOutDate);
    const dueDate = new Date(moveOut);
    dueDate.setDate(dueDate.getDate() + rules.returnDeadlineDays);
    return dueDate;
  };

  const dueDate = calculateDueDate();

  const getCoverageMessage = () => {
    if (!jurisdictionResult) return "";
    const level = jurisdictionResult.jurisdiction.coverageLevel;
    const hasCity = jurisdictionResult.jurisdiction.city;

    if (level === "FULL" && hasCity) {
      return "Full city and state coverage included";
    } else if (level === "PARTIAL") {
      return "Partial coverage - verify specific rules";
    } else {
      return "State rules only - city ordinances not included for this address";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Case</h1>
          <p className="text-sm text-muted-foreground">
            Create a security deposit disposition case
          </p>
        </div>
      </div>

      {/* Trust Banner */}
      <TrustBanner />

      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <nav className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 h-px w-8 bg-border" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <Card className="mx-auto max-w-2xl">
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Select Property</CardTitle>
              <CardDescription>
                Choose an existing property or enter a new address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Existing Properties */}
                  {properties.length > 0 && (
                    <div className="space-y-3">
                      <Label>Your Properties</Label>
                      <div className="grid gap-3">
                        {properties.map((property) => (
                          <button
                            key={property.id}
                            onClick={() => handleSelectProperty(property.id)}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted",
                              formData.selectedPropertyId === property.id &&
                                "border-primary bg-primary/5"
                            )}
                          >
                            <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium">
                                {property.address}
                                {property.unit && `, ${property.unit}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {property.city}, {property.state} {property.zipCode}
                              </p>
                            </div>
                            {formData.selectedPropertyId === property.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or enter new address
                      </span>
                    </div>
                  </div>

                  {/* New Address Form */}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                            selectedPropertyId: "",
                          }));
                          setJurisdictionResult(null);
                          setSelectedProperty(null);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit/Apt (optional)</Label>
                      <Input
                        id="unit"
                        placeholder="Apt 4B"
                        value={formData.unit}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            unit: e.target.value,
                            selectedPropertyId: "",
                          }));
                        }}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="San Francisco"
                          value={formData.city}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              city: e.target.value,
                              selectedPropertyId: "",
                            }));
                            setJurisdictionResult(null);
                            setSelectedProperty(null);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="CA"
                          value={formData.state}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              state: e.target.value,
                              selectedPropertyId: "",
                            }));
                            setJurisdictionResult(null);
                            setSelectedProperty(null);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          placeholder="94102"
                          value={formData.zipCode}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              zipCode: e.target.value,
                              selectedPropertyId: "",
                            }));
                          }}
                        />
                      </div>
                    </div>
                    {!formData.selectedPropertyId && (
                      <Button
                        variant="secondary"
                        onClick={handleAddressCheck}
                        disabled={!formData.state || !formData.city || checking}
                      >
                        {checking ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Check Coverage
                      </Button>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                      <div className="flex items-center gap-2 text-danger">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Jurisdiction Result */}
                  {jurisdictionResult && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Jurisdiction Resolved</span>
                            <CoverageBadge
                              level={jurisdictionResult.jurisdiction.coverageLevel.toLowerCase() as "full" | "partial" | "state_only"}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {jurisdictionResult.jurisdiction.city
                              ? `${jurisdictionResult.jurisdiction.city}, ${jurisdictionResult.jurisdiction.state}`
                              : jurisdictionResult.jurisdiction.state}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getCoverageMessage()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Move-out & Deposit Details</CardTitle>
              <CardDescription>
                Enter the move-out date and security deposit information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="moveOutDate">Move-out Date *</Label>
                  <Input
                    id="moveOutDate"
                    type="date"
                    value={formData.moveOutDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, moveOutDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="depositAmount"
                      type="number"
                      placeholder="3000"
                      className="pl-9"
                      value={formData.depositAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, depositAmount: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leaseStartDate">Lease Start Date (optional)</Label>
                  <Input
                    id="leaseStartDate"
                    type="date"
                    value={formData.leaseStartDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, leaseStartDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaseEndDate">Lease End Date (optional)</Label>
                  <Input
                    id="leaseEndDate"
                    type="date"
                    value={formData.leaseEndDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, leaseEndDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Tenant Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tenantName">Tenant Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="tenantName"
                        placeholder="John Smith"
                        className="pl-9"
                        value={formData.tenantName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, tenantName: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenantEmail">Email (optional)</Label>
                    <Input
                      id="tenantEmail"
                      type="email"
                      placeholder="tenant@email.com"
                      value={formData.tenantEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, tenantEmail: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forwardingAddress">Forwarding Address (optional)</Label>
                  <Input
                    id="forwardingAddress"
                    placeholder="Enter forwarding address if known"
                    value={formData.forwardingAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, forwardingAddress: e.target.value }))
                    }
                  />
                  {!formData.forwardingAddress && (
                    <p className="text-xs text-warning">
                      <AlertCircle className="mr-1 inline h-3 w-3" />
                      Missing forwarding address may affect delivery requirements
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 3 && rules && (
          <>
            <CardHeader>
              <CardTitle>Rules Summary & Checklist</CardTitle>
              <CardDescription>
                Review the applicable rules for this jurisdiction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deadline Banner */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">
                      Due Date:{" "}
                      {dueDate?.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rules.returnDeadlineDays} days from move-out
                      {rules.returnDeadlineDescription && ` (${rules.returnDeadlineDescription})`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rules Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Return Deadline</p>
                  <p className="text-lg font-semibold">{rules.returnDeadlineDays} days</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Interest Required</p>
                  <p className="text-lg font-semibold">
                    {rules.interestRequired ? "Yes" : "No"}
                    {rules.interestRequired && rules.interestRate && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        ({(rules.interestRate * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Itemization Required</p>
                  <p className="text-lg font-semibold">
                    {rules.itemizationRequired ? "Yes" : "No"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Max Deposit</p>
                  <p className="text-lg font-semibold">
                    {rules.maxDepositMonths
                      ? `${rules.maxDepositMonths} months rent`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {/* Allowed Delivery Methods */}
              {rules.allowedDeliveryMethods.length > 0 && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Allowed Delivery Methods
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {rules.allowedDeliveryMethods.map((method, i) => (
                      <li key={i}>{method}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checklist Preview */}
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">Case Checklist</p>
                <div className="space-y-2">
                  {[
                    { label: "Add deductions (optional)", required: false },
                    { label: "Upload evidence (recommended)", required: false },
                    { label: "Generate notice PDF", required: true },
                    { label: "Select delivery method", required: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded border border-border" />
                      <span>{item.label}</span>
                      {item.required && (
                        <span className="text-xs text-muted-foreground">(required)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Citations */}
              {rules.citations.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-2 text-sm font-medium">Sources</p>
                  {rules.citations.map((citation) => (
                    <div key={citation.id} className="text-sm">
                      {citation.url ? (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {citation.code}
                        </a>
                      ) : (
                        <span className="text-primary">{citation.code}</span>
                      )}
                      <span className="text-muted-foreground"> - {citation.title}</span>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last verified:{" "}
                    {rules.verifiedAt
                      ? new Date(rules.verifiedAt).toLocaleDateString()
                      : new Date(rules.effectiveDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                  <div className="flex items-center gap-2 text-danger">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < 3 ? (
            <div className="flex items-center gap-3">
              {currentStep === 2 && !canProceedStep2 && (
                <span className="text-sm text-muted-foreground">
                  {!formData.moveOutDate && "Move-out date required"}
                  {formData.moveOutDate && !formData.depositAmount && "Deposit amount required"}
                  {formData.moveOutDate && formData.depositAmount && !formData.tenantName && "Tenant name required"}
                </span>
              )}
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleCreateCase} disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Open Case Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
