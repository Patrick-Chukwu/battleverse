import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { isSupabaseConfigured } from "@/lib/flags";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { ImportPanel } from "@/components/admin/ImportPanel";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { TestBuilder } from "@/components/admin/TestBuilder";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "questions", label: "Questions" },
  { id: "import", label: "Import" },
  { id: "tests", label: "Tests" },
  { id: "analytics", label: "Analytics" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AdminPage = () => {
  const configured = isSupabaseConfigured();
  const { data: session, isLoading: sessionLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [tab, setTab] = useState<TabId>("questions");

  if (!configured) {
    return (
      <Gate title="Admin needs Supabase">
        Add <code>VITE_SUPABASE_URL</code> and the anon key, then run{" "}
        <code>supabase/migrations/0005_admin_rpcs.sql</code>.
      </Gate>
    );
  }

  if (sessionLoading || (session && profileLoading)) {
    return (
      <Gate title="Checking admin access">
        Confirming your account role…
      </Gate>
    );
  }

  if (!session) {
    return (
      <Gate title="Sign in to open Admin">
        <Link to="/login" className="font-black text-primary underline">
          Sign in
        </Link>{" "}
        with an account whose <code>role</code> is admin.
      </Gate>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <Gate title="Admins only">
        This route is gated by <code>profiles.role = admin</code>, not by a hidden URL. Ask a
        founder to promote your username, then reload.
      </Gate>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-6xl px-4">
        <h1 className="mb-2 text-4xl font-black tracking-tight text-primary">Admin CMS</h1>
        <p className="mb-8 font-bold text-muted-foreground">
          Publish questions into the same catalog Practice already syncs. Learner screens stay as
          they are.
        </p>
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-black",
                tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === "questions" && <QuestionManager />}
        {tab === "import" && <ImportPanel />}
        {tab === "tests" && <TestBuilder />}
        {tab === "analytics" && <AnalyticsPanel />}
      </div>
    </div>
  );
};

function Gate({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="mb-3 text-3xl font-black">{title}</h1>
      <p className="max-w-md font-bold text-muted-foreground">{children}</p>
    </div>
  );
}

export default AdminPage;
