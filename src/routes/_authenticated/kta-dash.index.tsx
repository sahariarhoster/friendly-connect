import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/kta-dash/")({
  beforeLoad: () => {
    throw redirect({ to: "/kta-dash/jobs" });
  },
});
