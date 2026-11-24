import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReportContext, getReportHistory, listReports, removeContent, setReportStatus } from "./api";
import type { Report, ReportQuery } from "./types";

const root = ["admin", "reports"] as const;

export const useReports = (query: ReportQuery) => useQuery({ queryKey: [...root, "list", query], queryFn: () => listReports(query), placeholderData: keepPreviousData });
export const useReportContext = (id: string) => useQuery({ queryKey: [...root, "context", id], queryFn: () => getReportContext(id) });
export const useReportHistory = (id: string) => useQuery({ queryKey: [...root, "history", id], queryFn: () => getReportHistory(id) });

/** Close a report, optionally taking the post or comment down first. */
export function useReportDecision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ report, outcome, note, remove }: { report: Report; outcome: "resolved" | "dismissed"; note: string; remove?: boolean }) => {
      if (remove) await removeContent(report.contentType as "post" | "comment", report.contentId, note);
      return setReportStatus(report.id, outcome, note);
    },
    onSuccess: () => {
      for (const key of [root, ["admin", "queue"], ["admin", "flagged"], ["admin", "people"]]) void client.invalidateQueries({ queryKey: key });
    },
  });
}
