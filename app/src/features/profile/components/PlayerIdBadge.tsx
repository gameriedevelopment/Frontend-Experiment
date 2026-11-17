import { Icon } from "@/components/ui/Icon";
import { copyText } from "@/lib/clipboard";
import { toast } from "@/lib/toast";

/** A player's Gamerie ID. One tap copies it, since it's what players share to be found. */
export function PlayerIdBadge({ id }: { id: string }) {
  const copy = async () => {
    try {
      await copyText(id);
      toast.success("Player ID copied", id);
    } catch {
      toast.error("Couldn't copy the player ID", "Select it and copy it instead.");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`Player ID ${id}. Copy`}
      title="Copy player ID"
      className="group/id type-label inline-flex h-8 items-center gap-1.5 rounded-full bg-white/5 px-3 text-mist-200 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/8 hover:text-mist-50"
    >
      <Icon name="identity" weight="duotone" className="size-3.5 text-lavender-300" />
      {id}
      <Icon name="copy" className="size-3 text-mist-500 transition-colors group-hover/id:text-mist-200" />
    </button>
  );
}
