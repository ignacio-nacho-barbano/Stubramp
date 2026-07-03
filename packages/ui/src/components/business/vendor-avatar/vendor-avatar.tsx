import { avatarColor } from "../../../lib/format";
import { Avatar } from "../../data-display/avatar";

/** Avatar with the deterministic name→color background used across Bill Pay. */
export function VendorAvatar({
  name,
  size = 26,
}: {
  name: string;
  size?: number;
}) {
  return (
    <Avatar
      name={name}
      size={size}
      style={{ background: avatarColor(name), color: "var(--paper-0)" }}
    />
  );
}
