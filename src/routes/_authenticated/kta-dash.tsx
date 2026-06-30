import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { useRoles } from "@/hooks/useRoles";
import { Briefcase, Inbox, Building2, MapPin, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kta-dash")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const { data: roles, isLoading } = useRoles(user.id);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && roles && !roles.includes("admin")) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoading, roles, navigate]);

  if (isLoading) return <div />;
  if (!roles?.includes("admin")) return null;

  const tabs = [
    { to: "/kta-dash/jobs", label: "Job posts", icon: Briefcase },
    { to: "/kta-dash/applications", label: "Applications", icon: Inbox },
    { to: "/kta-dash/departments", label: "Departments", icon: Building2 },
    { to: "/kta-dash/offices", label: "Offices", icon: MapPin },
    { to: "/kta-dash/users", label: "Users", icon: UsersIcon },
  ];


  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition whitespace-nowrap",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <Outlet />
    </div>
  );
}

