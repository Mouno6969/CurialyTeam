import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function NotFoundView() {
  const t = useT();
  return (
    <SiteChrome>
      <section className="page-wrap flex min-h-[62vh] items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <TriangleAlert className="mx-auto size-10 text-muted-foreground" />
          <p className="kicker mt-6">{t("notfound.kicker")}</p>
          <h1 className="display mt-3 text-4xl">{t("notfound.title")}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{t("notfound.copy")}</p>
          <Button asChild className="mt-8">
            <Link to="/">{t("notfound.home")}</Link>
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}
