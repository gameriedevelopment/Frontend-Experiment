import { MotionConfig } from "motion/react";
import { LandingPage } from "@/features/landing/LandingPage";
import { SmoothScroll } from "./SmoothScroll";

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <LandingPage />
      </SmoothScroll>
    </MotionConfig>
  );
}
