import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logo from "@/assets/khatiana-logo.png.asset.json";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  UserCog,
  Building2,
  MapPin,
  User as UserIcon,
  LogOut,
  Menu,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "pendingApps" | "myApps";
  exact?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

export function AppShell({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
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

  const { data: roles } = useRoles(userId);
  const isAdmin = roles?.includes("admin");

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name").eq("id", userId!).maybeSingle()).data,
  });

  const { data: badges } = useQuery({
    queryKey: ["sidebar-badges", userId, isAdmin],
    enabled: !!userId && roles !== undefined,
    staleTime: 30_000,
    queryFn: async () => {
      if (isAdmin) {
        const { count } = await supabase
          .from("job_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        return { pendingApps: count ?? 0, myApps: 0 };
      }
      const { count } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", userId!);
      return { pendingApps: 0, myApps: count ?? 0 };
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const groups: NavGroup[] = isAdmin
    ? [
        {
          label: "Main Menu",
          items: [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
            { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
          ],
        },
        {
          label: "Recruitment",
          items: [
            { to: "/admin/jobs", label: "Job Posts", icon: Briefcase },
            { to: "/admin/applications", label: "Applications", icon: FileText, badgeKey: "pendingApps" },
            { to: "/admin/departments", label: "Departments", icon: Building2 },
            { to: "/admin/offices", label: "Offices", icon: MapPin },
          ],
        },
        {
          label: "Settings",
          items: [{ to: "/profile", label: "Profile", icon: UserIcon }],
        },
      ]
    : [
        {
          label: "Main Menu",
          items: [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
            { to: "/jobs", label: "Find Jobs", icon: Briefcase },
          ],
        },
        {
          label: "Recruitment",
          items: [
            { to: "/applications", label: "My Applications", icon: FileText, badgeKey: "myApps" },
          ],
        },
        {
          label: "Settings",
          items: [{ to: "/profile", label: "Profile", icon: UserIcon }],
        },
      ];

  const sidebar = (
    <SidebarInner
      groups={groups}
      email={email}
      fullName={profile?.full_name ?? undefined}
      isAdmin={!!isAdmin}
      badges={badges}
      onNavigate={() => setMobileOpen(false)}
      onSignOut={signOut}
    />
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30 text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border flex-shrink-0 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between gap-3 border-b border-border bg-card px-4 h-14 sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="Khatiana" className="h-7 w-auto" />
            <span className="font-bold tracking-tight">Khatiana</span>
          </Link>
          <div className="w-9" />
        </div>

        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}

function SidebarInner({
  groups,
  email,
  fullName,
  isAdmin,
  badges,
  onNavigate,
  onSignOut,
}: {
  groups: NavGroup[];
  email?: string;
  fullName?: string;
  isAdmin: boolean;
  badges?: { pendingApps: number; myApps: number };
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const initial = (fullName || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Brand */}
      <div className="h-20 flex items-center px-6 gap-3 border-b border-border/60">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Briefcase className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-lg tracking-tight text-foreground leading-none">Khatiana</div>
          <div className="text-[11px] text-muted-foreground mt-1">Recruitment Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mt-4 mb-2 first:mt-0">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                {group.label}
              </p>
            </div>
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + "/");
              const badgeVal = item.badgeKey ? badges?.[item.badgeKey] : undefined;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary-soft text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-primary",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {badgeVal !== undefined && badgeVal > 0 && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary-soft text-primary",
                      )}
                    >
                      {badgeVal}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User mini-profile */}
      <div className="p-3 border-t border-border/60 mt-auto">
        <div className="flex items-center gap-3 p-2 bg-muted/60 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{fullName || "Account"}</p>
            <p className="text-xs text-muted-foreground truncate">{email ?? ""}</p>
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-0.5">
              {isAdmin ? "Admin" : "Applicant"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
