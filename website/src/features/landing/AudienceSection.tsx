import { Card } from "../../components/ui/Card";
import { Container, SectionHeading } from "../../components/ui/Section";
import { audiences } from "./landing-content";

const layouts = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
];

export function AudienceSection() {
  return (
    <section
      id="community"
      aria-labelledby="audience-title"
      className="scroll-mt-6 bg-paper py-section text-ink story-scroll:scroll-mt-18"
    >
      <Container>
        <div className="grid items-end gap-6 md:grid-cols-[1.3fr_.7fr] md:gap-12">
          <div>
            <p className="mb-4 text-xs font-bold tracking-[.16em] text-muted uppercase">
              Who it’s for
            </p>
            <SectionHeading id="audience-title" className="max-w-[16ch]">
              Good games take good people.
            </SectionHeading>
          </div>
          <p className="max-w-[24rem] text-base leading-relaxed text-muted md:pb-1 lg:text-lg">
            Whether you’re finding your first regular squad or running the next
            tournament, there’s a place for you on Gamerie.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-12 lg:grid-cols-12">
          {audiences.map((audience, index) => (
            <Card
              key={audience.label}
              variant="image"
              className={`group relative isolate flex min-h-[21rem] flex-col justify-end text-white sm:min-h-[24rem] ${layouts[index]}`}
            >
              <img
                src={audience.image}
                alt=""
                decoding="async"
                loading="lazy"
                className={`absolute inset-0 -z-20 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105 ${audience.position}`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-stage/96 from-3% via-stage/66 via-42% to-stage/4 to-84%"
              />
              <div className="max-w-[31rem] p-5 sm:p-7 lg:p-8">
                <p className="mb-2.5 text-[.69rem] font-bold tracking-[0.15em] text-brand-light uppercase">
                  {audience.label}
                </p>
                <h3 className="font-display text-[clamp(1.8rem,2.7vw,3.25rem)] leading-[.96] font-black tracking-[-.053em]">
                  {audience.title}
                </h3>
                <p className="mt-3 max-w-[29rem] text-base leading-relaxed text-foreground">
                  {audience.copy}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
