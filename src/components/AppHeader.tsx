import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import logo from "@/assets/khatiana-logo.png.asset.json";
import { useRoles } from "@/hooks/useRoles";

export function AppHeader() {
  const [userId, setUserId] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: roles } = useRoles(userId);
  const isAdmin = roles?.includes("admin");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      setEmail(data.user?.email ?? undefined);
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
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="Khatiana" className="h-9 w-auto" />
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/jobs">
            <Button variant="ghost" size="sm">Jobs</Button>
          </Link>
          {userId ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              {!isAdmin && (
                <Link to="/applications">
                  <Button variant="ghost" size="sm">My applications</Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/jobs">
                  <Button variant="ghost" size="sm">Admin</Button>
                </Link>
              )}
              <Badge variant="secondary" className="hidden md:inline-flex">
                {isAdmin ? "Admin" : "Applicant"}
              </Badge>
              <span className="hidden text-xs text-muted-foreground md:inline">{email}</span>
              <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
