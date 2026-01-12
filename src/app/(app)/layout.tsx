import { Sidebar, TopBar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";
import { FeedbackButton } from "@/components/feedback";
import { BetaBanner } from "@/components/layout/beta-banner";
import { config } from "@/lib/config";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUser = await getCurrentUser();

  const user = supabaseUser
    ? {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.name as string | null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url as string | null,
      }
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Beta banner at top of app */}
        {config.features.showBetaBadge && <BetaBanner />}
        <TopBar user={user} />
        <main className="flex-1 overflow-auto bg-background">
          <div className="mx-auto max-w-[1120px] p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" />
      {/* Floating feedback button */}
      <FeedbackButton />
    </div>
  );
}
