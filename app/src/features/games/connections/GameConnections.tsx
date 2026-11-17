import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import type { GameConnection, GameProviderId } from "../types";
import { startRedirectConnection } from "./api";
import { useConnectProvider, useDisconnectProvider, useGameConnections, useProviderMetrics } from "./hooks";
import { GAME_PROVIDERS, getProvider, riotProduct, type ProviderDefinition } from "./registry";

const riotRegions = ["NA", "EUW", "EUNE", "BR", "LATAM", "KR", "JP", "OCE", "TR"];
const pubgPlatforms = [
  { value: "steam", label: "Steam" },
  { value: "psn", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "kakao", label: "Kakao" },
];
const battlenetRegions = [
  { value: "us", label: "Americas" },
  { value: "eu", label: "Europe" },
  { value: "kr", label: "Korea" },
];

function ProviderMark({ provider, size = "md" }: { provider: ProviderDefinition; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      style={{ color: provider.accent, backgroundColor: `${provider.accent}1f` }}
      className={cn("type-label grid shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-white/10", size === "lg" ? "size-12 text-xs" : "size-10")}
    >
      {provider.initials}
    </span>
  );
}

function ConnectDialog({ provider, onClose }: { provider: ProviderDefinition; onClose: () => void }) {
  const connect = useConnectProvider();
  const kind = provider.connectKind;
  const [primary, setPrimary] = useState("");
  const [region, setRegion] = useState(kind === "battlenet" ? "us" : kind === "pubg" ? "steam" : "NA");
  const [realm, setRealm] = useState("1");
  const payload = useMemo(() => {
    if (kind === "tag") return { tag: primary.trim() };
    if (kind === "riot") return { riotId: primary.trim(), region };
    if (kind === "pubg") return { playerName: primary.trim(), platform: region };
    return { profileId: primary.trim(), realmId: realm.trim(), region };
  }, [kind, primary, realm, region]);
  const valid = primary.trim().length > 1 && (kind !== "riot" || primary.includes("#")) && (kind !== "battlenet" || realm.trim().length > 0);
  const label = kind === "tag" ? "Player tag" : kind === "riot" ? "Riot ID" : kind === "pubg" ? "Player name" : "StarCraft II profile ID";
  const hint =
    kind === "tag"
      ? "Include the # if your profile shows one."
      : kind === "riot"
        ? `The full GameName#TAG shown in ${riotProduct(provider.id).toUpperCase()}.`
        : kind === "pubg"
          ? "Exactly as it appears in game, capitals included."
          : "The last part of your public SC2 profile link.";

  return (
    <Dialog
      open
      title={`Link ${provider.name}`}
      description={provider.description}
      icon="link"
      onClose={onClose}
      dismissible={!connect.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            icon="link"
            disabled={!valid || connect.isPending}
            onClick={() =>
              connect.mutate(
                { provider: provider.id, payload },
                {
                  onSuccess: () => {
                    toast.success(`${provider.name} linked`, "Your verified stats show on your Player Card.");
                    onClose();
                  },
                },
              )
            }
          >
            {connect.isPending ? "Checking…" : "Link account"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <TextField
            id="provider-primary"
            label={label}
            value={primary}
            onChange={(event) => setPrimary(event.target.value)}
            placeholder={kind === "tag" ? "#PLAYER9" : kind === "riot" ? "Nova#DRFT" : kind === "pubg" ? "NovaPlays" : "1234567"}
          />
          <p className="text-xs text-mist-500">{hint}</p>
        </div>
        {kind === "riot" && (
          <ChoiceGroup legend="Region" columns={5}>
            {riotRegions.map((item) => (
              <ChoiceChip key={item} name="riot-region" value={item} checked={region === item} onChange={() => setRegion(item)} label={item} />
            ))}
          </ChoiceGroup>
        )}
        {kind === "pubg" && (
          <ChoiceGroup legend="Platform" columns={2}>
            {pubgPlatforms.map((item) => (
              <ChoiceChip key={item.value} name="pubg-platform" value={item.value} checked={region === item.value} onChange={() => setRegion(item.value)} label={item.label} />
            ))}
          </ChoiceGroup>
        )}
        {kind === "battlenet" && (
          <>
            <ChoiceGroup legend="Region" columns={3}>
              {battlenetRegions.map((item) => (
                <ChoiceChip key={item.value} name="bnet-region" value={item.value} checked={region === item.value} onChange={() => setRegion(item.value)} label={item.label} />
              ))}
            </ChoiceGroup>
            <TextField id="provider-realm" label="Realm" inputMode="numeric" value={realm} onChange={(event) => setRealm(event.target.value.replace(/\D/g, ""))} />
          </>
        )}
        {connect.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(connect.error, `${provider.name} couldn't be linked. Check the details and try again.`)}
          </p>
        )}
      </div>
    </Dialog>
  );
}

function ConnectedCard({ connection }: { connection: GameConnection }) {
  const provider = getProvider(connection.provider);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const metrics = useProviderMetrics(connection, open);
  const disconnect = useDisconnectProvider();
  if (!provider) return null;

  return (
    <li className="rounded-2xl bg-white/3 ring-1 ring-inset ring-white/8">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 p-3.5 text-left">
        <ProviderMark provider={provider} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold">
            {provider.name}
            <Icon name="verified" weight="fill" className="size-3.5 text-signal" />
          </span>
          <span className="mt-0.5 block truncate text-xs text-mist-400">
            {connection.handle || connection.providerAccountId}
            {connection.lastSyncedAt ? ` · synced ${timeAgo(connection.lastSyncedAt)}` : ""}
          </span>
        </span>
        <Icon name="chevronDown" className={cn("size-4 text-mist-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-4 border-t border-white/6 px-3.5 py-4">
          {metrics.isLoading ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : metrics.data?.length ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metrics.data.map((metric) => (
                <div key={metric.label}>
                  <dt className="type-label text-mist-500">{metric.label}</dt>
                  <dd className="mt-1 text-sm font-semibold">{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-mist-400">{metrics.isError ? "Stats couldn't be fetched right now." : "No public stats yet."}</p>
          )}
          <button type="button" onClick={() => setConfirming(true)} className="w-fit text-sm font-medium text-mist-400 transition-colors hover:text-danger">
            Unlink {provider.name}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title={`Unlink ${provider.name}?`}
        description="Its verified stats come off your Player Card. You can link it again any time."
        confirmLabel="Unlink"
        icon="link"
        pending={disconnect.isPending}
        error={disconnect.isError ? getApiErrorMessage(disconnect.error, "It couldn't be unlinked.") : undefined}
        onConfirm={() =>
          disconnect.mutate(provider.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.info(`${provider.name} unlinked`);
            },
          })
        }
        onClose={() => setConfirming(false)}
      />
    </li>
  );
}

/** Official game accounts: linked ones with live stats, and everything that can be linked. */
export function GameConnections() {
  const location = useLocation();
  const query = useGameConnections();
  const [dialog, setDialog] = useState<GameProviderId | null>(null);
  const [showAll, setShowAll] = useState(false);
  const connections = query.data ?? [];
  const linked = new Set(connections.map((connection) => connection.provider));
  const available = GAME_PROVIDERS.filter((provider) => !linked.has(provider.id));
  const visible = showAll || !connections.length ? available : available.slice(0, 4);

  const link = (provider: ProviderDefinition) => {
    if (provider.connectKind === "steam" || provider.connectKind === "lichess") {
      void startRedirectConnection(provider.id as "steam" | "dota-2" | "cs2" | "lichess", `${location.pathname}${location.search}`);
    } else setDialog(provider.id);
  };

  return (
    <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
      <header className="mb-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          Linked accounts
          {connections.length > 0 && <span className="type-label rounded-full bg-signal/12 px-2 py-0.5 text-signal">{connections.length} verified</span>}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-mist-400">Link an official account and its ranks and stats show on your Player Card as verified.</p>
      </header>
      {query.isLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : (
        <div className="grid gap-5">
          {connections.length > 0 && (
            <ul className="grid gap-2">
              {connections.map((connection) => (
                <ConnectedCard key={connection.id} connection={connection} />
              ))}
            </ul>
          )}
          {available.length > 0 && (
            <div className="grid gap-3">
              {connections.length > 0 && <p className="type-label text-mist-500">Link another</p>}
              <ul className="grid gap-2 sm:grid-cols-2">
                {visible.map((provider) => (
                  <li key={provider.id}>
                    <button
                      type="button"
                      onClick={() => link(provider)}
                      className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/4 hover:ring-lavender-400/30"
                    >
                      <ProviderMark provider={provider} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{provider.name}</span>
                        <span className="block truncate text-xs text-mist-500">{provider.family}</span>
                      </span>
                      <Icon
                        name={provider.connectKind === "steam" || provider.connectKind === "lichess" ? "arrowUpRight" : "plus"}
                        className="size-4 text-mist-500 group-hover:text-lavender-300"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              {!showAll && connections.length > 0 && available.length > 4 && (
                <button type="button" onClick={() => setShowAll(true)} className="w-fit text-sm font-medium text-lavender-300 hover:text-lavender-200">
                  Show all {available.length}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {dialog && getProvider(dialog) && <ConnectDialog provider={getProvider(dialog)!} onClose={() => setDialog(null)} />}
    </section>
  );
}
