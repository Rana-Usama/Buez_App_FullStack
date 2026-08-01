import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import FounderBadge from "./FounderBadge";
import { useFounderStatus } from "../../hooks/useFounderStatus";

interface FounderBadgeByIdProps {
  /** The user whose badge to show. */
  userId?: string | null;
  /**
   * Optional user object already in hand. If it carries `isFounder` we use it
   * directly and skip the lookup entirely (e.g. rows built from a full `users`
   * doc); otherwise it's ignored and the id is resolved instead.
   */
  user?: any;
  variant?: "avatar" | "pill";
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Founder Badge for OTHER users, resolved by `userId`.
 *
 * Most screens only hold a denormalized snapshot of the user (task cards,
 * applicant lists, helper rows…) which has no `isFounder` field, so the plain
 * <FounderBadge user={...} /> would never render for them. This variant looks
 * the flag up by id through the shared session cache instead.
 *
 * Renders nothing at all unless the resolved user is genuinely a founder, so
 * regular users are never badged.
 */
const FounderBadgeById: React.FC<FounderBadgeByIdProps> = ({
  userId,
  user,
  variant = "avatar",
  size,
  style,
}) => {
  // Snapshot already carries the flag → no read needed.
  const hasInlineFlag = typeof user?.isFounder === "boolean";
  const resolvedId = userId ?? user?.userId ?? user?.id ?? null;
  const looked = useFounderStatus(hasInlineFlag ? null : resolvedId);

  const target = hasInlineFlag
    ? user
    : looked?.isFounder
      ? { isFounder: true, founderNumber: looked.founderNumber }
      : null;

  if (!target) return null;

  return (
    <FounderBadge variant={variant} size={size} user={target} style={style} />
  );
};

export default FounderBadgeById;
