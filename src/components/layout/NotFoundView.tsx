import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/button";

export function NotFoundView() {
  return (
    <SiteChrome>
      <section className="page-wrap flex min-h-[62vh] items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <TriangleAlert className="mx-auto size-10 text-muted-foreground" />
          <p className="kicker mt-6">404</p>
          <h1 className="display mt-3 text-4xl">Page not found.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The page you are looking for does not exist. It may have been moved or the link
            is incomplete.
          </p>
          <Button asChild className="mt-8">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}
