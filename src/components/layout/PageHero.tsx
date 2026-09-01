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
    <section className="page-wrap pt-10 pb-8 sm:pt-14 sm:pb-10 lg:pt-16 lg:pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-card px-6 py-10 shadow-[var(--shadow-border)] sm:px-11 sm:py-12 lg:px-14 lg:py-14">
        <DotField />
        <RadialMatrix className="pointer-events-none absolute -right-24 -top-20 size-72 opacity-40 breathe sm:size-96" />
        <div className="relative max-w-3xl">
          <p className="kicker kicker-in">{kicker}</p>
          <h1 className="display reveal reveal-d1 mt-4 text-3xl sm:text-4xl">
            {title}
            {emphasis ? (
              <>
                {" "}
                <em className="font-normal italic text-muted-foreground">{emphasis}</em>
              </>
            ) : null}
          </h1>
          <p className="reveal reveal-d2 mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {copy}
          </p>
          <Rule className="mt-8 max-w-xs" />
        </div>
      </div>
    </section>
  );
}
