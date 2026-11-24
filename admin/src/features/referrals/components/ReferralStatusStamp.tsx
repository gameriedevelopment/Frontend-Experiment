import { Stamp } from "@/components/record/Stamp";
import { statusLabel } from "@/lib/format";
import type { ReferralCode, ReferralStatus } from "../types";

export function referralStatus(record: ReferralCode): ReferralStatus {
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) return "expired";
  return record.isActive ? "active" : "inactive";
}

export function ReferralStatusStamp({ record }: { record: ReferralCode }) {
  const status = referralStatus(record);
  return <Stamp tone={status === "active" ? "signal" : "mist"}>{statusLabel(status)}</Stamp>;
}
