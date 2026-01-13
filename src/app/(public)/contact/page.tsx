"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  Mail,
} from "lucide-react";

type ContactReason = "general" | "bug" | "feature" | "support" | "partnership";

const reasonLabels: Record<ContactReason, { label: string; icon: React.ReactNode; description: string }> = {
  general: {
    label: "General Inquiry",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Questions about LandlordComply"
  },
  bug: {
    label: "Report a Bug",
    icon: <Bug className="h-4 w-4" />,
    description: "Something isn't working correctly"
  },
  feature: {
    label: "Feature Request",
    icon: <Lightbulb className="h-4 w-4" />,
    description: "Suggest a new feature or improvement"
  },
  support: {
    label: "Support",
    icon: <HelpCircle className="h-4 w-4" />,
    description: "Help with using the product"
  },
  partnership: {
    label: "Partnership",
    icon: <Mail className="h-4 w-4" />,
    description: "Business or partnership inquiries"
  },
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<ContactReason>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          reason,
          message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo iconSize={32} showCheckmark={false} />
            </Link>
          </div>
        </header>

        {/* Success State */}
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Message Sent!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild>
                  <Link href="/">Return Home</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setReason("general");
                    setMessage("");
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo iconSize={32} showCheckmark={false} />
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
            <p className="mt-2 text-muted-foreground">
              Have a question, feedback, or just want to say hi? We&apos;d love to hear from you.
            </p>
          </div>

          {/* Contact Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Email Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name <span className="text-danger">*</span></Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-danger">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                {/* Reason Select */}
                <div className="space-y-2">
                  <Label htmlFor="reason">What can we help you with?</Label>
                  <Select
                    value={reason}
                    onValueChange={(value) => setReason(value as ContactReason)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([key, { label, icon, description }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {icon}
                            <div>
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                - {description}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message <span className="text-danger">*</span></Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us what's on your mind..."
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                    required
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/2000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !name.trim() || !email.trim() || !message.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>

                {/* Privacy Note */}
                <p className="text-xs text-center text-muted-foreground">
                  By submitting this form, you agree to our{" "}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                  . We&apos;ll only use your information to respond to your inquiry.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Alternative Contact Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Prefer email? Reach us at{" "}
              <a
                href="mailto:support@landlordcomply.com"
                className="text-primary hover:underline"
              >
                support@landlordcomply.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          <p>
            Educational tool only. Not legal advice. Always verify with official sources and consult an attorney for specific legal questions.
          </p>
        </div>
      </footer>
    </div>
  );
}
