"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Globe,
  FileText,
  Settings,
  Plus,
  Menu,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { useState } from "react";
import { UserMenu } from "./user-menu";
import { config } from "@/lib/config";

// Simplified navigation - users live in Cases
// Documents are accessed in-case, Coverage is reference-only
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Cases", href: "/cases", icon: Briefcase },
  { name: "Coverage", href: "/coverage", icon: Globe },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isBeta = config.features.showBetaBadge;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo iconSize={32} showCheckmark={false} />
          {isBeta && (
            <Badge variant="secondary" className="ml-1 text-[10px] bg-primary/10 text-primary border-primary/20 gap-1">
              <FlaskConical className="h-3 w-3" />
              BETA
            </Badge>
          )}
        </Link>
      </div>

      {/* New Case Button */}
      <div className="px-4 py-4">
        <Button asChild className="w-full" onClick={onNavigate}>
          <Link href="/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Trust Banner */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Educational use only — not legal advice.
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-[260px] flex-shrink-0 border-r border-border bg-sidebar lg:block">
      <NavContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0">
        <NavContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function TopBar({ user }: { user: UserData | null }) {
  const isBeta = config.features.showBetaBadge;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <MobileNav />
        {/* Mobile logo */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <Logo iconSize={32} showCheckmark={false} />
          {isBeta && (
            <Badge variant="secondary" className="ml-1 text-[10px] bg-primary/10 text-primary border-primary/20 gap-1">
              <FlaskConical className="h-3 w-3" />
              BETA
            </Badge>
          )}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
