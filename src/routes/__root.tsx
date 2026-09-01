import { createRootRoute, Outlet } from "@tanstack/react-router";
import { NotFoundView } from "@/components/layout/NotFoundView";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
});

function RootLayout() {
  return <Outlet />;
}
