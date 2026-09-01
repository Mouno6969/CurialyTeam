import { DotField, RadialMatrix, Rule } from "@/components/brand/DotField";

export function PageHero({
  kicker,
  title,
  emphasis,
  copy,
}: {
  kicker: string;
  title: string;
  emphasis?: string;
  copy: string;
}) {
  return (
    <section className="page-wrap py-12 sm:py-16 lg:py-20">
      <div className="relative overflow-hidden rounded-2xl bg-card p-7 shadow-[var(--shadow-border)] sm:p-11 lg:p-14">
        <DotField />
        <RadialMatrix className="pointer-events-none absolute -right-20 -top-16 size-72 opacity-45 breathe sm:size-96" />
        <div className="relative max-w-3xl">
          <p className="kicker">{kicker}</p>
          <h1 className="display mt-4 text-3xl sm:text-4xl">
            {title}
            {emphasis ? (
              <>
                {" "}
                <em className="font-normal italic text-muted-foreground">{emphasis}</em>
              </>
            ) : null}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {copy}
          </p>
          <Rule className="mt-8 max-w-xs" />
        </div>
      </div>
    </section>
  );
}
