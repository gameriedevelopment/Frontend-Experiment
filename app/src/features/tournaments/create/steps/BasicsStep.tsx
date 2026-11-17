import { useMemo, useState } from "react";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { OptionCards } from "@/components/ui/OptionCards";
import { useGame, useGameOptions } from "@/features/games/hooks";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { HostingOption } from "../../types";
import { REGIONS } from "../draftForm";
import type { StepProps } from "../stepTypes";
import { LockedNote, StepSection } from "./StepParts";

const bannerTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBannerBytes = 4 * 1024 * 1024;
const hostIcons = { user: "user", team: "team", hub: "hub" } as const;
const hostDescriptions = { user: "Under your name", team: "On behalf of your team", hub: "On behalf of your hub" };

export function BasicsStep({
  form,
  update,
  errors,
  locked,
  hosts,
  banner,
  onBanner,
}: StepProps & {
  hosts: HostingOption[];
  banner: { file: File | null; url: string | null };
  onBanner: (file: File | null) => void;
}) {
  const b = form.basics;
  const [gameQuery, setGameQuery] = useState("");
  const debounced = useDebouncedValue(gameQuery);
  const games = useGameOptions(debounced, true);
  const selected = useGame(b.gameId || undefined);
  const platforms = selected.data?.platforms ?? [];

  const gameValue: ComboboxOption | null = b.gameId
    ? { value: b.gameId, label: selected.data?.name ?? "Selected game", description: selected.data?.gameType }
    : null;
  const gameOptions = useMemo<ComboboxOption[]>(
    () => (games.data?.data ?? []).map((game) => ({ value: game.id, label: game.name, description: game.gameType })),
    [games.data],
  );

  return (
    <div className="grid gap-7">
      <StepSection title="Host" description="Who the tournament is run by. Teams and hubs you lead can host.">
        <OptionCards
          legend="Hosted by"
          value={b.host}
          onChange={(host) => update("basics", { host })}
          disabled={locked.has("host")}
          error={errors.host}
          columns={hosts.length > 2 ? 3 : 2}
          options={hosts.map((host) => ({
            value: `${host.type}:${host.id}`,
            label: host.name,
            description: hostDescriptions[host.type],
            icon: hostIcons[host.type],
          }))}
        />
        {locked.has("host") && <LockedNote>The host is fixed once entrants have registered.</LockedNote>}
      </StepSection>

      <StepSection title="The tournament">
        <TextField
          id="tournament-name"
          label="Name"
          maxLength={80}
          value={b.name}
          onChange={(event) => update("basics", { name: event.target.value })}
          placeholder="Mile High Cup"
          error={errors.name}
        />
        <Combobox
              browse
              browseLabel="Popular games"
          id="tournament-game"
          label="Game"
          placeholder="Search games"
          query={gameQuery}
          onQueryChange={setGameQuery}
          options={gameOptions}
          loading={games.isFetching}
          value={gameValue}
          onChange={(option) => update("basics", { gameId: option?.value ?? "", platform: "" })}
          error={errors.gameId}
          emptyText="No games match that name"
        />
        {locked.has("gameId") && <LockedNote>The game is fixed once entrants have registered.</LockedNote>}
        {b.gameId && (
          <ChoiceGroup legend="Platform" columns={3} error={errors.platform}>
            {(platforms.length ? platforms : [b.platform].filter(Boolean)).map((platform) => (
              <ChoiceChip
                key={platform}
                name="tournament-platform"
                value={platform}
                checked={b.platform === platform}
                disabled={locked.has("platform")}
                onChange={() => update("basics", { platform })}
                label={platform}
              />
            ))}
          </ChoiceGroup>
        )}
        <TextAreaField
          id="tournament-description"
          label="Description"
          maxLength={2000}
          value={b.description}
          onChange={(event) => update("basics", { description: event.target.value })}
          placeholder="What it is, who it's for, and anything that makes it worth entering."
        />
        <FileDrop
          label="Banner"
          hint="16:6, JPG, PNG or WebP, up to 4 MB"
          accept={bannerTypes}
          maxBytes={maxBannerBytes}
          currentUrl={banner.url}
          file={banner.file}
          onFile={onBanner}
        />
      </StepSection>

      <StepSection title="Where it's played">
        <ChoiceGroup legend="Region" columns={4} error={errors.region}>
          {REGIONS.map((region) => (
            <ChoiceChip
              key={region}
              name="tournament-region"
              value={region}
              checked={b.region === region}
              disabled={locked.has("region")}
              onChange={() => update("basics", { region })}
              label={region}
            />
          ))}
        </ChoiceGroup>
        <OptionCards
          legend="Setting"
          value={b.mode}
          onChange={(mode) => update("basics", { mode })}
          disabled={locked.has("mode")}
          options={[
            { value: "online", label: "Online", description: "Players join from anywhere", icon: "globe" },
            { value: "lan", label: "In person", description: "At a venue, on set stations", icon: "mapPin" },
          ]}
        />
        {b.mode === "lan" && (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_7rem]">
            <TextField
              id="venue-name"
              label="Venue"
              maxLength={120}
              disabled={locked.has("venue")}
              value={b.venueName}
              onChange={(event) => update("basics", { venueName: event.target.value })}
              error={errors.venueName}
            />
            <TextField
              id="venue-address"
              label="Address"
              maxLength={240}
              disabled={locked.has("venue")}
              value={b.venueAddress}
              onChange={(event) => update("basics", { venueAddress: event.target.value })}
              error={errors.venueAddress}
            />
            <TextField
              id="venue-stations"
              label="Stations"
              inputMode="numeric"
              disabled={locked.has("venue")}
              value={b.stations}
              onChange={(event) => update("basics", { stations: event.target.value.replace(/\D/g, "") })}
              error={errors.stations}
            />
          </div>
        )}
      </StepSection>
    </div>
  );
}
