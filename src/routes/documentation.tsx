import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/documentation")({ component: Documentation });

function Documentation() {
  const t = useT();
  const guidance = [
    { id: "01", title: t("docs.s1.title"), copy: t("docs.s1.copy") },
    { id: "02", title: t("docs.s2.title"), copy: t("docs.s2.copy") },
    { id: "03", title: t("docs.s3.title"), copy: t("docs.s3.copy") },
    { id: "04", title: t("docs.s4.title"), copy: t("docs.s4.copy") },
    { id: "05", title: t("docs.s5.title"), copy: t("docs.s5.copy") },
    { id: "06", title: t("docs.s6.title"), copy: t("docs.s6.copy") },
    { id: "07", title: t("docs.s7.title"), copy: t("docs.s7.copy") },
    { id: "08", title: t("docs.s8.title"), copy: t("docs.s8.copy") },
    { id: "09", title: t("docs.s9.title"), copy: t("docs.s9.copy") },
    { id: "10", title: t("docs.s10.title"), copy: t("docs.s10.copy") },
  ];

  return (
    <SiteChrome>
      <PageHero
        kicker={t("docs.kicker")}
        title={t("docs.title")}
        emphasis={t("docs.emphasis")}
        copy={t("docs.copy")}
      />
      <section className="page-wrap pb-16 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="h-fit rounded-xl bg-card p-6 shadow-[var(--shadow-border)]">
            <p className="kicker">{t("docs.contents")}</p>
            <ol className="mt-4 space-y-1 text-sm text-muted-foreground">
              {guidance.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#guide-${item.id}`}
                    className="block py-1.5 transition-colors hover:text-foreground"
                  >
                    <span className="mr-2 font-mono-ui">{item.id}</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
          <div className="space-y-4">
            {guidance.map((item) => (
              <article
                id={`guide-${item.id}`}
                key={item.id}
                className="scroll-mt-28 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-7"
              >
                <p className="kicker">{item.id}</p>
                <h2 className="font-display mt-3 text-3xl tracking-[-0.04em]">{item.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-5 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.04em]">{t("docs.readyTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("docs.readyCopy")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">{t("docs.visit")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/refund-policy">{t("docs.refund")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
