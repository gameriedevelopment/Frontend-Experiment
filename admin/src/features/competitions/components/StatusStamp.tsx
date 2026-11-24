import { Stamp } from "@/components/record/Stamp";
import { competitionStatus } from "../status";

export function StatusStamp({ status, removed }: { status: string | null | undefined; removed?: boolean }) {
  if (removed) return <Stamp tone="danger">Removed</Stamp>;
  const { label, tone } = competitionStatus(status);
  return (
    <Stamp tone={tone}>
      {tone === "signal" && <span className="size-1.5 animate-blink rounded-full bg-signal motion-reduce:animate-none" />}
      {label}
    </Stamp>
  );
}
