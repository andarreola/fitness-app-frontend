/** Must match DB / policy expectations for “has accepted current terms”. */
export const TOS_VERSION = "2026-03-10" as const;

export type TosProfileFields = {
  tos_version?: string | null;
  tos_accepted_at?: string | null;
  completed_onboarding?: boolean | null;
};

export function isTosAccepted(profile: TosProfileFields | null | undefined) {
  return profile?.tos_version === TOS_VERSION && !!profile?.tos_accepted_at;
}
