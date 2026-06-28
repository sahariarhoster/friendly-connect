import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
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

  if (isLoading) return <div className="min-h-screen bg-background"><AppHeader /></div>;
  if (!roles?.includes("admin")) return null;

  const tabs = [
    { to: "/admin/jobs", label: "Job posts" },
    { to: "/admin/applications", label: "Applications" },
    { to: "/admin/departments", label: "Departments" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl gap-1 px-6">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to}>
                <Button variant="ghost" size="sm" className={active ? "border-b-2 border-primary rounded-none" : "rounded-none"}>
                  {t.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
