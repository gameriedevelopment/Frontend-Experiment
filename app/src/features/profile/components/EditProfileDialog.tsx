import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { DateField } from "@/components/ui/DateField";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useUpdatePlayerProfile, useUploadPlayerImage } from "../hooks";
import type { PlayerProfile } from "../types";
import { PROFILE_REGIONS } from "../regions";

export type EditSection = "photos" | "identity" | "personal" | "skills" | "links";

const sections: Array<{ id: EditSection; label: string; icon: IconName }> = [
  { id: "photos", label: "Photos", icon: "camera" },
  { id: "identity", label: "Identity", icon: "identity" },
  { id: "personal", label: "Personal", icon: "user" },
  { id: "skills", label: "Skills and platforms", icon: "spark" },
  { id: "links", label: "Links", icon: "link" },
];

const optionalUrl = z.string().refine((value) => !value || /^https?:\/\//i.test(value), "Start the link with https://");
// Same rules as the revamp's profile editor, so the API accepts exactly what it did before.
const schema = z.object({
  username: z.string().trim().min(3, "At least 3 characters").max(40),
  gamerTitle: z.enum(["Player", "Streamer", "Spectator", "Coach", "Manager", "Trainer", "Analyst"]).or(z.literal("")),
  gameLevel: z.enum(["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"]).or(z.literal("")),
  region: z.string().max(80).optional(),
  bio: z.string().max(500, "500 characters at most").optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const today = new Date();
      const born = new Date(`${value}T00:00:00`);
      let age = today.getFullYear() - born.getFullYear();
      if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age--;
      return age >= 16;
    }, "You must be 16 or older"),
  personalInfo: z.object({
    fullName: z.string().max(100).optional(),
    gender: z.string().max(40).optional(),
    location: z.string().max(120).optional(),
    profession: z.string().max(120).optional(),
  }),
  platforms: z.array(z.enum(["PC", "XBOX", "PS5", "Switch", "Mobile"])),
  skills: z.array(z.object({ name: z.string().trim().min(1, "Enter a skill").max(60) })).max(20),
  socialMedia: z.array(z.object({ platform: z.string(), username: z.string(), url: optionalUrl })),
});
type Values = z.infer<typeof schema>;

const titles = ["Player", "Streamer", "Spectator", "Coach", "Manager", "Trainer", "Analyst"] as const;
const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;
const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"] as const;
const socialPlatforms = ["Twitch", "YouTube", "X", "Instagram", "TikTok", "Discord", "Kick", "Website"];
const imageTypes = ["image/jpeg", "image/png", "image/webp"];

function ImagePicker({
  label,
  hint,
  onPick,
  busy,
}: {
  label: string;
  hint: string;
  onPick: (file: File) => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button tone="outline" size="sm" icon="camera" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? "Uploading…" : label}
      </Button>
      <input
        ref={ref}
        type="file"
        accept={imageTypes.join(",")}
        aria-label={hint}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!imageTypes.includes(file.type)) return toast.error("Use a JPG, PNG or WebP image");
          if (file.size > 5 * 1024 * 1024) return toast.error("Keep images under 5 MB");
          onPick(file);
        }}
      />
    </>
  );
}

function Photos({ profile }: { profile: PlayerProfile }) {
  const upload = useUploadPlayerImage(profile.id);
  const [busy, setBusy] = useState<"profileImage" | "backgroundImage" | null>(null);
  const pick = (type: "profileImage" | "backgroundImage") => (file: File) => {
    setBusy(type);
    upload.mutate(
      { file, type },
      {
        onSuccess: () => toast.success(type === "profileImage" ? "Profile photo updated" : "Cover updated"),
        onError: (error) => toast.error("Upload failed", getApiErrorMessage(error, "Try another image.")),
        onSettled: () => setBusy(null),
      },
    );
  };
  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold">Profile photo</h3>
        <div className="flex items-center gap-5">
          <Avatar src={profile.profileImage} name={profile.username} size="xl" className="rounded-full" />
          <div className="grid gap-2">
            <ImagePicker label={profile.profileImage ? "Change photo" : "Upload photo"} hint="Profile photo" busy={busy === "profileImage"} onPick={pick("profileImage")} />
            <p className="text-xs text-mist-500">Square works best. JPG, PNG or WebP, up to 5 MB.</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold">Cover</h3>
        <div className="relative aspect-16/5 overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-inset ring-white/8">
          {profile.backgroundImage ? (
            <img src={profile.backgroundImage} alt="" className="size-full object-cover" />
          ) : (
            <div className="halftone absolute inset-0 text-lavender-400/15 mask-[radial-gradient(70%_80%_at_70%_20%,black,transparent)]" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <ImagePicker label={profile.backgroundImage ? "Change cover" : "Upload cover"} hint="Cover image" busy={busy === "backgroundImage"} onPick={pick("backgroundImage")} />
          <p className="text-xs text-mist-500">Wide images, at least 1600 px across.</p>
        </div>
      </section>
    </div>
  );
}

/** Edit everything on the player ID in one place. Photos upload as soon as they're picked. */
export function EditProfileDialog({ profile, section, onSection, onClose }: { profile: PlayerProfile; section: EditSection; onSection: (section: EditSection) => void; onClose: () => void }) {
  const update = useUpdatePlayerProfile(profile.id);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: profile.username,
      gamerTitle: (titles as readonly string[]).includes(profile.gamerTitle ?? "") ? (profile.gamerTitle as Values["gamerTitle"]) : "",
      gameLevel: (levels as readonly string[]).includes(profile.gameLevel ?? "") ? (profile.gameLevel as Values["gameLevel"]) : "",
      region: profile.region || "",
      bio: profile.bio || "",
      dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
      personalInfo: {
        fullName: profile.personalInfo?.fullName || "",
        gender: profile.personalInfo?.gender || "",
        location: profile.personalInfo?.location || "",
        profession: profile.personalInfo?.profession || "",
      },
      platforms: (profile.platforms ?? []).filter((item): item is Values["platforms"][number] => (platforms as readonly string[]).includes(item)),
      skills: (profile.skills ?? []).map((item) => ({ name: String(item.name ?? "") })).filter((item) => item.name),
      socialMedia: (profile.socialMedia ?? []).map((item) => ({ platform: item.platform || "", username: item.username || "", url: item.url || "" })),
    },
  });
  const skills = useFieldArray({ control: form.control, name: "skills" });
  const socials = useFieldArray({ control: form.control, name: "socialMedia" });
  const [skillDraft, setSkillDraft] = useState("");
  const errors = form.formState.errors;
  const values = form.watch();

  const addSkill = () => {
    const name = skillDraft.trim();
    if (!name || skills.fields.length >= 20) return;
    if (values.skills.some((item) => item.name.toLowerCase() === name.toLowerCase())) return setSkillDraft("");
    skills.append({ name });
    setSkillDraft("");
  };

  const submit = form.handleSubmit(
    async (data) => {
      try {
        await update.mutateAsync({
          ...data,
          gamerTitle: data.gamerTitle || undefined,
          gameLevel: data.gameLevel || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          skills: data.skills.map((item) => ({ name: item.name })),
          socialMedia: data.socialMedia.filter((item) => item.platform && item.username && item.url),
        });
        form.reset(data);
        toast.success("Profile saved");
        onClose();
      } catch {
        // Shown above the footer.
      }
    },
    (invalid) => {
      const first = Object.keys(invalid)[0];
      const target: EditSection =
        first === "personalInfo" || first === "dateOfBirth" ? "personal" : first === "skills" || first === "platforms" ? "skills" : first === "socialMedia" ? "links" : "identity";
      onSection(target);
      toast.error("Check the highlighted fields");
    },
  );

  return (
    <Dialog
      open
      title="Edit profile"
      description="This is how you appear across feeds, teams and competition."
      icon="edit"
      size="xl"
      onClose={onClose}
      dismissible={!update.isPending}
      bodyClassName="p-0"
      footer={
        section === "photos" ? (
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            {form.formState.isDirty && <span className="mr-auto text-xs text-mist-500">Unsaved changes</span>}
            <Button tone="ghost" size="sm" disabled={update.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" icon="check" disabled={update.isPending || !form.formState.isDirty} onClick={() => void submit()}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        )
      }
    >
      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] sm:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Profile sections" className="border-b border-white/6 p-3 sm:border-b-0 sm:border-r">
          <ul className="relative flex gap-1 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-[minmax(0,1fr)]">
            {sections.map((item) => (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={section === item.id ? "page" : undefined}
                  onClick={() => onSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    section === item.id ? "bg-white/7 text-mist-50" : "text-mist-400 hover:bg-white/4 hover:text-mist-100",
                  )}
                >
                  <Icon name={item.icon} weight={section === item.id ? "duotone" : "regular"} className={cn("size-4", section === item.id && "text-lavender-300")} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <form onSubmit={(event) => void submit(event)} className="min-w-0 px-6 py-6" noValidate>
          {section === "photos" && <Photos profile={profile} />}

          {section === "identity" && (
            <div className="grid gap-6">
              <TextField id="edit-username" label="Username" error={errors.username?.message} {...form.register("username")} />
              <Controller
                control={form.control}
                name="gamerTitle"
                render={({ field }) => (
                  <ChoiceGroup legend="Title" columns={4}>
                    {titles.map((title) => (
                      <ChoiceChip key={title} name="edit-title" value={title} checked={field.value === title} onChange={() => field.onChange(title)} label={title} />
                    ))}
                  </ChoiceGroup>
                )}
              />
              <Controller
                control={form.control}
                name="gameLevel"
                render={({ field }) => (
                  <ChoiceGroup legend="Level" columns={5}>
                    {levels.map((level) => (
                      <ChoiceChip key={level} name="edit-level" value={level} checked={field.value === level} onChange={() => field.onChange(level)} label={level} />
                    ))}
                  </ChoiceGroup>
                )}
              />
              <Controller
                control={form.control}
                name="region"
                render={({ field }) => (
                  <ChoiceGroup legend="Region" columns={3}>
                    {PROFILE_REGIONS.map((region) => (
                      <ChoiceChip key={region} name="edit-region" value={region} checked={field.value === region} onChange={() => field.onChange(region)} label={region} />
                    ))}
                  </ChoiceGroup>
                )}
              />
              <TextAreaField id="edit-bio" label="Bio" maxLength={500} value={values.bio ?? ""} error={errors.bio?.message} {...form.register("bio")} placeholder="What you play, how you play it, and what you're after." />
            </div>
          )}

          {section === "personal" && (
            <div className="grid gap-6">
              <TextField id="edit-name" label="Full name" error={errors.personalInfo?.fullName?.message} {...form.register("personalInfo.fullName")} />
              <Controller
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => <DateField id="edit-dob" label="Date of birth" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} error={errors.dateOfBirth?.message} />}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField id="edit-location" label="Location" placeholder="Denver, US" {...form.register("personalInfo.location")} />
                <TextField id="edit-profession" label="Profession" {...form.register("personalInfo.profession")} />
              </div>
              <TextField id="edit-gender" label="Gender (optional)" {...form.register("personalInfo.gender")} />
              <p className="text-xs leading-relaxed text-mist-500">Your date of birth is never shown. Only your age range is used for eligibility.</p>
            </div>
          )}

          {section === "skills" && (
            <div className="grid gap-7">
              <Controller
                control={form.control}
                name="platforms"
                render={({ field }) => (
                  <ChoiceGroup legend="Platforms you play on" columns={5}>
                    {platforms.map((platform) => (
                      <ChoiceChip
                        key={platform}
                        multiple
                        name="edit-platforms"
                        value={platform}
                        checked={field.value.includes(platform)}
                        onChange={() => field.onChange(field.value.includes(platform) ? field.value.filter((item) => item !== platform) : [...field.value, platform])}
                        label={platform}
                      />
                    ))}
                  </ChoiceGroup>
                )}
              />
              <div className="grid gap-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-mist-200">Skills</p>
                  <span className="text-xs tabular-nums text-mist-500">{skills.fields.length} / 20</span>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <span className="sr-only">New skill</span>
                    <input
                      value={skillDraft}
                      maxLength={60}
                      onChange={(event) => setSkillDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Shotcalling, entry fragging, 2v2 rotations…"
                      className="h-11 w-full rounded-2xl bg-white/4 px-4 text-sm outline-none pointer-coarse:text-base ring-1 ring-inset ring-white/10 placeholder:text-mist-500 focus:ring-2 focus:ring-lavender-400"
                    />
                  </label>
                  <Button tone="outline" size="sm" icon="plus" className="h-11" disabled={!skillDraft.trim() || skills.fields.length >= 20} onClick={addSkill}>
                    Add
                  </Button>
                </div>
                {skills.fields.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {skills.fields.map((field, index) => (
                      <li key={field.id} className="flex items-center gap-1 rounded-full bg-lavender-400/10 py-1 pl-3 pr-1 text-sm text-lavender-100 ring-1 ring-inset ring-lavender-400/25">
                        {values.skills[index]?.name}
                        <button type="button" aria-label={`Remove ${values.skills[index]?.name}`} onClick={() => skills.remove(index)} className="grid size-6 place-items-center rounded-full text-lavender-300 hover:bg-white/10">
                          <Icon name="close" className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-mist-500">Other players can endorse your skills. Endorsements earn you GP.</p>
              </div>
            </div>
          )}

          {section === "links" && (
            <div className="grid gap-4">
              <p className="text-sm text-mist-400">Public profiles like Twitch, YouTube or X. They show on your profile.</p>
              {socials.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
                  <Controller
                    control={form.control}
                    name={`socialMedia.${index}.platform`}
                    render={({ field: platform }) => (
                      <div className="flex flex-wrap gap-1.5">
                        {socialPlatforms.map((name) => (
                          <button
                            key={name}
                            type="button"
                            aria-pressed={platform.value === name}
                            onClick={() => platform.onChange(name)}
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                              platform.value === name ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/60" : "text-mist-400 ring-white/10 hover:text-mist-100",
                            )}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end">
                    <TextField id={`social-user-${index}`} label="Handle" {...form.register(`socialMedia.${index}.username`)} />
                    <TextField id={`social-url-${index}`} label="Link" type="url" placeholder="https://" error={errors.socialMedia?.[index]?.url?.message} {...form.register(`socialMedia.${index}.url`)} />
                    <Button tone="ghost" size="sm" icon="trash" className="h-12" onClick={() => socials.remove(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button tone="outline" size="sm" icon="plus" className="w-fit" onClick={() => socials.append({ platform: "Twitch", username: "", url: "" })}>
                Add a link
              </Button>
            </div>
          )}

          {update.isError && (
            <p role="alert" className="mt-6 text-sm text-danger">
              {getApiErrorMessage(update.error, "Your profile couldn't be saved.")}
            </p>
          )}
        </form>
      </div>
    </Dialog>
  );
}
