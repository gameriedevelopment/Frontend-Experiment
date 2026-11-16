import { useId } from "react";
import { GamerieIcon } from "../../../components/ui/GamerieIcon";
import { ActionLink, actionStyles } from "../../../components/ui/ActionLink";
import { links } from "../../../links";
import { StoryNavigation } from "./StoryNavigation";
import { StoryScene } from "./StoryScene";
import { chapters, lastChapter } from "./story-content";
import { useStoryMotion } from "./useStoryMotion";

export function PlayerStory() {
  const id = useId();
  const { sectionRef, stageRef, sceneRef, active, selectChapter } =
    useStoryMotion();

  return (
    <section
      id="platform"
      ref={sectionRef}
      aria-label="The Gamerie platform"
      className="relative bg-stage text-foreground story-scroll:h-[calc(240svh-4.5rem)] story-scroll:scroll-mt-18"
    >
      <div
        ref={stageRef}
        className="mx-auto flex w-full max-w-[110rem] flex-col story-scroll:sticky story-scroll:top-18 story-scroll:h-[calc(100svh-4.5rem)] motion-safe:[--card-y:15%] motion-safe:[--card-rx:16deg] motion-safe:[--card-ry:-52deg] motion-safe:[--card-rz:-16deg] motion-safe:[--card-scale:.78] motion-safe:[--ring-angle:-62deg] motion-safe:[--orbital-light:.26]"
      >
        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] md:items-stretch">
          <div className="relative z-10 flex flex-col justify-center px-gutter pt-9 pb-2 sm:pt-15 md:-mr-12 md:min-h-[32rem] md:pr-0 md:py-10 story-scroll:min-h-0">
            <div className="grid">
              {chapters.map((chapter, index) => {
                const Heading = index === 0 ? "h1" : "h2";
                return (
                  <div
                    key={chapter.id}
                    id={`${id}-panel-${chapter.id}`}
                    role="tabpanel"
                    aria-labelledby={`${id}-tab-${chapter.id}`}
                    aria-hidden={active !== index}
                    className={`col-start-1 row-start-1 ${active === index ? "visible" : "invisible"}`}
                  >
                    <div
                      key={active === index ? "current" : "inactive"}
                      className={
                        active === index ? "motion-safe:animate-copy-in" : ""
                      }
                    >
                      <p className="mb-5 flex items-center gap-2.5 text-[.65rem] font-bold tracking-[.18em] text-brand-light uppercase sm:mb-6 sm:text-[.7rem]">
                        <span
                          className="size-1.5 rotate-45 bg-brand"
                          aria-hidden="true"
                        />
                        {chapter.eyebrow}
                      </p>
                      <Heading className="font-display text-hero font-black max-[349px]:[font-size:2.28rem] md:[font-size:clamp(2.85rem,5.85vw,7.1rem)] tracking-[-.06em]">
                        <span className="block">{chapter.title[0]}</span>{" "}
                        <span className="block text-brand">
                          {chapter.title[1]}
                        </span>
                      </Heading>
                      <p className="mt-6 max-w-[29rem] text-[1rem] leading-[1.55] text-secondary sm:mt-7 sm:text-[1.13rem]">
                        {chapter.copy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 sm:mt-8 sm:gap-x-4">
              <ActionLink
                href={links.register}
                className="max-sm:[font-size:.79rem]"
              >
                Create your identity <GamerieIcon name="external" size={17} />
              </ActionLink>
              {active === lastChapter ? (
                <ActionLink href="#community" variant="subtle">
                  Who it’s for <GamerieIcon name="down" size={17} />
                </ActionLink>
              ) : (
                <button
                  type="button"
                  onClick={() => selectChapter(active + 1)}
                  className={actionStyles(
                    "subtle",
                    "regular",
                    "max-sm:[font-size:.79rem]",
                  )}
                >
                  {active === 0 ? (
                    <>
                      <span className="hidden sm:inline">
                        Explore the platform
                      </span>
                      <span className="sm:hidden">Explore</span>{" "}
                      <GamerieIcon name="down" size={17} />
                    </>
                  ) : (
                    <>
                      Next chapter <GamerieIcon name="forward" size={17} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <StoryScene sceneRef={sceneRef} />
        </div>
        <StoryNavigation id={id} active={active} onSelect={selectChapter} />
      </div>
    </section>
  );
}
