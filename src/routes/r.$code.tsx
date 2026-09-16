import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { rememberReferral } from "@/lib/referrals";

export const Route = createFileRoute("/r/$code")({ component: ReferralLanding });

function ReferralLanding() {
  const { code } = Route.useParams();
  const t = useT();

  useEffect(() => {
    rememberReferral(code);
  }, [code]);

  return (
    <SiteChrome>
      <section className="page-wrap flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <p className="kicker">{t("ref.landKicker")}</p>
        <h1 className="display mt-4 max-w-2xl text-3xl sm:text-4xl">
          {t("ref.landTitle", { code })}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          {t("ref.landCopy")}
        </p>
        <Button asChild className="mt-8">
          <Link to="/">{t("ref.landCta")}</Link>
        </Button>
      </section>
    </SiteChrome>
  );
}
