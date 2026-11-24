import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Panel } from "@/components/layout/Panel";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { RichText } from "@/components/record/RichText";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { analyticsKey } from "@/features/analytics/api";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { communicationsKey, publishAnnouncement } from "./api";
import { AnnouncementHistory } from "./components/AnnouncementHistory";
import { BrevoPanel } from "./components/BrevoPanel";

export function CommunicationsPage() {
  useDocumentTitle("Communications");
  const [content, setContent] = useState("");
  const [confirming, setConfirming] = useState(false);
  const client = useQueryClient();
  const draft = content.trim();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Communications" refresh={[communicationsKey]} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Panel title="Write an announcement" bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-5">
          <TextAreaField id="announcement-content" label="Announcement" rows={6} maxLength={5000} value={content} onChange={(event) => setContent(event.target.value)} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-2xl bg-ink-900 px-4 py-3 ring-1 ring-inset ring-white/6">
            <p className="text-sm font-medium text-mist-300">Preview</p>
            <RichText content={draft} className="overflow-x-auto" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" icon="megaphone" disabled={!draft} onClick={() => setConfirming(true)}>Publish announcement</Button>
          </div>
        </Panel>
        <BrevoPanel />
      </div>
      <AnnouncementHistory />
      {confirming && (
        <ReasonDialog
          title="Publish this announcement?"
          description="Publishes a feed post under your admin account."
          icon="megaphone"
          tone="brand"
          confirmLabel="Publish"
          onClose={() => setConfirming(false)}
          onConfirm={async (reason) => {
            await publishAnnouncement(draft, reason);
            setContent("");
            toast.success("Announcement published");
            void client.invalidateQueries({ queryKey: communicationsKey });
            void client.invalidateQueries({ queryKey: analyticsKey });
          }}
        />
      )}
    </div>
  );
}
