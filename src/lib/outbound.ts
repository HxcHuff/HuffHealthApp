/**
 * Fail-closed outbound gate for live email and SMS.
 *
 * Live sends require OUTBOUND_NOTIFICATIONS_ENABLED=true AND
 * LEAD_PIPELINE_DRY_RUN !== "true". Anything else is a no-op.
 */

export type OutboundSkipReason =
  | "skipped_outbound_disabled"
  | "skipped_dry_run";

export function isOutboundNotificationsEnabled(): boolean {
  return process.env.OUTBOUND_NOTIFICATIONS_ENABLED === "true";
}

export function isLeadPipelineDryRun(): boolean {
  return process.env.LEAD_PIPELINE_DRY_RUN === "true";
}

/** True only when David has explicitly enabled live outbound and dry-run is off. */
export function shouldSendLiveOutbound(): boolean {
  return isOutboundNotificationsEnabled() && !isLeadPipelineDryRun();
}

/**
 * Why a live send must not happen. Returns null when live send is allowed
 * (credentials are checked separately by each transport).
 */
export function getOutboundSkipReason(): OutboundSkipReason | null {
  if (!isOutboundNotificationsEnabled()) return "skipped_outbound_disabled";
  if (isLeadPipelineDryRun()) return "skipped_dry_run";
  return null;
}
