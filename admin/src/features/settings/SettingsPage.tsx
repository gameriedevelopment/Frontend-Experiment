import { Link } from "react-router-dom";
import { NAV_ITEMS } from "@/app/shell/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Facts } from "@/components/record/Facts";
import { Stamp } from "@/components/record/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/features/auth/session";
import { operatorName } from "@/features/auth/types";
import { API_URL } from "@/lib/api";
import { ENVIRONMENT, PLAYER_APP_URL } from "@/lib/env";
import { statusLabel } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const keyStyle = "rounded-md bg-white/5 px-2 py-1 font-mono text-xs text-mist-200 ring-1 ring-inset ring-white/10";

export function SettingsPage() {
  useDocumentTitle("Settings");
  const user = useSession((state) => state.user);
  const signOut = useSession((state) => state.signOut);
  const name = operatorName(user);
  const shortcuts = NAV_ITEMS.flatMap((item) =>
    item.key && (!item.superAdmin || user?.isSuperAdmin) ? [{ ...item, key: item.key }] : [],
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Settings" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Panel title="Keyboard shortcuts">
          <dl className="divide-y divide-white/6">
            <div className="flex items-center justify-between gap-4 pb-3 text-sm">
              <dt>Search or jump</dt>
              <dd className="flex flex-wrap items-center justify-end gap-2">
                <kbd className={keyStyle}>⌘ K</kbd>
                <kbd className={keyStyle}>Ctrl K</kbd>
                <kbd className={keyStyle}>/</kbd>
              </dd>
            </div>
            {shortcuts.map((item) => (
              <div key={item.to} className="flex items-center justify-between gap-4 py-3 text-sm last:pb-0">
                <dt><Link to={item.to} className="hover:text-lavender-200">{item.label}</Link></dt>
                <dd className="flex items-center gap-2">
                  <kbd className={keyStyle}>g</kbd>
                  <span className="text-xs text-mist-500">then</span>
                  <kbd className={keyStyle}>{item.key}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
        <aside className="grid grid-cols-[minmax(0,1fr)] gap-6">
          <Panel title="Signed-in account" bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={name} src={user?.profileImage} size="md" />
              <div className="min-w-0">
                <p className="wrap-anywhere text-sm font-semibold text-mist-50">{name}</p>
                {user?.email && user.email !== name && <p className="wrap-anywhere text-sm text-mist-400">{user.email}</p>}
              </div>
            </div>
            <Facts items={[
              ["Role", user?.isSuperAdmin ? "Super admin" : "Administrator"],
              ["Access", statusLabel(user?.adminStatus)],
            ]} />
            <Button size="sm" tone="outline" icon="signOut" className="justify-self-start" onClick={() => signOut()}>Sign out</Button>
          </Panel>
          <Panel title="Environment" bodyClassName="grid grid-cols-[minmax(0,1fr)] gap-4">
            <Stamp tone={ENVIRONMENT === "production" ? "danger" : "mist"} className="justify-self-start">{statusLabel(ENVIRONMENT)}</Stamp>
            <Facts className="[&_dd]:font-mono [&_dd]:text-xs" items={[
              ["API", API_URL.startsWith("/") ? `${window.location.host}${API_URL}` : API_URL.replace(/^https?:\/\//, "")],
              ["Player app", PLAYER_APP_URL.replace(/^https?:\/\//, "")],
            ]} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
