import { GamerieIcon } from "../../components/ui/GamerieIcon";
import { Container, SectionHeading } from "../../components/ui/Section";
import { faqs } from "./landing-content";

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-6 border-t border-line bg-paper py-section text-ink story-scroll:scroll-mt-18"
    >
      <Container className="grid gap-8 md:grid-cols-[0.75fr_1.25fr] md:gap-12">
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.16em] text-muted uppercase">
            FAQ
          </p>
          <SectionHeading id="faq-title" className="max-w-[10ch]">
            Start where you are.
          </SectionHeading>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="group">
              <summary className="flex min-h-17 cursor-pointer list-none items-center justify-between gap-4 rounded-control py-3 text-lg font-black hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-violet-ink [&::-webkit-details-marker]:hidden">
                {question}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-violet-ink group-open:bg-brand group-open:text-stage">
                  <GamerieIcon
                    name="expand"
                    size={16}
                    className="group-open:rotate-45 motion-safe:transition-transform"
                  />
                </span>
              </summary>
              <p className="max-w-2xl pr-7 pb-6 text-base leading-relaxed text-muted">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
