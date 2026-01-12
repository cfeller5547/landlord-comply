"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { TrustBanner } from "@/components/domain";
import {
  User,
  CreditCard,
  Bell,
  Download,
  Shield,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Trust Banner */}
      <TrustBanner />

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Landlord" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <Input id="company" placeholder="Your property management company" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Billing</CardTitle>
          </div>
          <CardDescription>
            Manage your subscription and payment method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-muted-foreground">
                  1 property, 1 active case
                </p>
              </div>
              <Button>Upgrade to Pro</Button>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 font-medium">Pro Plan Benefits</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-success">+</span>
                Unlimited properties and cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">+</span>
                City-level rule coverage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">+</span>
                Email reminders
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">+</span>
                Proof packet exports
              </li>
            </ul>
            <p className="mt-3 text-lg font-semibold">$99/year</p>
          </div>
        </CardContent>
      </Card>

      {/* Reminders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Reminders</CardTitle>
          </div>
          <CardDescription>
            Configure deadline reminder notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Reminders</p>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for upcoming deadlines
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Reminder Schedule</Label>
            <p className="text-sm text-muted-foreground">
              Select when to receive deadline reminders
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="7days" defaultChecked />
                <Label htmlFor="7days" className="font-normal">
                  7 days before deadline
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="3days" defaultChecked />
                <Label htmlFor="3days" className="font-normal">
                  3 days before deadline
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="1day" defaultChecked />
                <Label htmlFor="1day" className="font-normal">
                  1 day before deadline
                </Label>
              </div>
            </div>
          </div>

          <Button>Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Export</CardTitle>
          </div>
          <CardDescription>
            Download your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all your cases, documents, and account data as a ZIP file.
          </p>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline">Change</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-danger">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal Links */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href="#"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Terms of Service
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="#"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="#"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Disclaimers
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
