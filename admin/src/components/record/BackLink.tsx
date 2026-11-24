import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="type-label flex w-fit items-center gap-2 text-mist-500 transition-colors hover:text-mist-100">
      <Icon name="arrowLeft" className="size-3.5" />
      {label}
    </Link>
  );
}
