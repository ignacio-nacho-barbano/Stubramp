import { avatarColor } from "../../../lib/format";
import { Avatar } from "../../data-display/avatar";
import type { PropsWithClass } from "../../../types/props";

/** Avatar with the deterministic name→color background used across Bill Pay. */
export function VendorAvatar({
  name,
  size = 26,
  className,
}: {
  name: string;
  size?: number;
} & PropsWithClass) {
  return (
    <Avatar
      name={name}
      size={size}
      className={className}
      style={{ background: avatarColor(name), color: "var(--paper-0)" }}
    />
  );
}
