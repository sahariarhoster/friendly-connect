import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
const logo = { url: "/khatiana-logo.png" };
import { useRoles } from "@/hooks/useRoles";

export function AppHeader() {
  const [userId, setUserId] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: roles } = useRoles(userId);
  const isAdmin = roles?.includes("admin");

  useEffect(() => {
    // getSession() reads from localStorage — instant, no network round-trip
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id);
      setEmail(data.session?.user?.email ?? undefined);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id);
      setEmail(s?.user?.email ?? undefined);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-1.5 ring-1 ring-primary/20">
            <img src={logo.url} alt="Khatiana" className="h-8 w-auto" />
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold">Khatiana</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Recruitment Suite</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/jobs" activeProps={{ className: "bg-primary/10 text-primary" }} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Browse jobs
          </Link>
          {userId ? (
            <>
              <Link to="/dashboard" activeProps={{ className: "bg-primary/10 text-primary" }} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Dashboard
              </Link>
              {!isAdmin && (
                <Link to="/applications" activeProps={{ className: "bg-primary/10 text-primary" }} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  My applications
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/jobs" activeProps={{ className: "bg-primary/10 text-primary" }} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  Admin
                </Link>
              )}
              <div className="mx-2 hidden h-6 w-px bg-border md:block" />
              <Badge variant="secondary" className="hidden md:inline-flex">
                {isAdmin ? "Admin" : "Applicant"}
              </Badge>
              <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground md:inline">{email}</span>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="ml-1">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth" className="ml-1">
              <Button size="sm" className="shadow-sm">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
