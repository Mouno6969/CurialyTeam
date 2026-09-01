import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Button } from "@/components/ui/button";
import { rememberReferral } from "@/lib/referrals";

export const Route = createFileRoute("/r/$code")({ component: ReferralLanding });

function ReferralLanding() {
  const { code } = Route.useParams();

  useEffect(() => {
    rememberReferral(code);
  }, [code]);

  return (
    <SiteChrome>
      <section className="page-wrap flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <p className="kicker">Referral attributed</p>
        <h1 className="display mt-4 max-w-2xl text-3xl sm:text-4xl">
          You arrived through {code}.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          Browse the shop as usual. If your purchase is later verified and eligible, the
          referring account may receive a campaign reward.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Continue to shop</Link>
        </Button>
      </section>
    </SiteChrome>
  );
}
