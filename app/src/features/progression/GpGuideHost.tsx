import { useEffect } from "react";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { GpGuideDialog } from "./GpGuideDialog";
import { useGpGuide } from "./guideStore";
import { useProgressionGuide } from "./hooks";

export function GpGuideHost() {
  const open = useGpGuide((state) => state.open);
  const closeGuide = useGpGuide((state) => state.closeGuide);
  const guide = useProgressionGuide(open);

  useEffect(() => {
    if (!open || !guide.isError || guide.data) return;
    toast.error("The GP guide didn't load", getApiErrorMessage(guide.error, "Try again in a moment."));
    closeGuide();
  }, [closeGuide, guide.data, guide.error, guide.isError, open]);

  if (!guide.data) return null;
  return <GpGuideDialog guide={guide.data} open={open} onClose={closeGuide} />;
}
