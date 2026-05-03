import type { JsonRecord } from "@/lib/workout-types";

export function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function roundToNearestFive(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

export function rowLabel(row: JsonRecord | null | undefined, fallback = "Unknown") {
  if (!row) return fallback;
  const raw =
    row.display_name ??
    row.name ??
    row.label ??
    row.title ??
    row.slug ??
    row.key ??
    row.code;

  if (!raw) return fallback;
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function rowLookupKey(row: JsonRecord | null | undefined) {
  if (!row) return "";
  return normalizeKey(
    row.slug ?? row.key ?? row.code ?? row.name ?? row.display_name ?? row.label,
  );
}

export function findById<T extends JsonRecord>(
  rows: T[],
  id: string | number | null | undefined,
) {
  if (id === null || id === undefined || id === "") return null;
  const key = String(id);
  return (
    rows.find((row) => row.id !== undefined && row.id !== null && String(row.id) === key) ??
    null
  );
}

export function findLookupRow<T extends JsonRecord>(
  rows: T[],
  wantedKey: string,
) {
  const normalized = normalizeKey(wantedKey);
  return rows.find((row) => rowLookupKey(row) === normalized) ?? null;
}

export function effectiveExperienceLevel(
  profile: JsonRecord | null | undefined,
  experienceLevels: JsonRecord[],
) {
  const novice =
    findLookupRow(experienceLevels, "novice") ?? experienceLevels[0] ?? null;
  const advanced = findLookupRow(experienceLevels, "advanced") ?? novice;

  const profileLevelId =
    profile?.experience_level_id ??
    profile?.current_experience_level_id ??
    profile?.lifting_experience_level_id;
  const byId = findById(experienceLevels, profileLevelId);

  const textLevel =
    profile?.experience_level ??
    profile?.current_experience_level ??
    profile?.lifting_experience_level ??
    profile?.training_experience;
  const byText = findLookupRow(experienceLevels, String(textLevel ?? ""));

  const selected = byId ?? byText ?? novice;

  if (rowLookupKey(selected) === "expert") return advanced;

  return selected;
}

export function profileWeightLbs(profile: JsonRecord | null | undefined) {
  const direct =
    toNumberOrNull(profile?.weight_lbs) ??
    toNumberOrNull(profile?.body_weight_lbs) ??
    toNumberOrNull(profile?.current_weight_lbs) ??
    toNumberOrNull(profile?.current_body_weight_lbs);

  if (direct !== null) return direct;

  const kg =
    toNumberOrNull(profile?.weight_kg) ??
    toNumberOrNull(profile?.body_weight_kg) ??
    toNumberOrNull(profile?.current_weight_kg) ??
    toNumberOrNull(profile?.current_body_weight_kg);

  return kg === null ? null : kg * 2.20462;
}

export function isWeightedExercise(exercise: JsonRecord | null | undefined) {
  if (!exercise) return false;

  const explicit =
    exercise.is_weighted ??
    exercise.weighted ??
    exercise.uses_weight ??
    exercise.requires_weight ??
    exercise.external_load_required;
  if (typeof explicit === "boolean") return explicit;

  const values = Object.entries(exercise)
    .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
    .map(([, value]) =>
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value ?? ""),
    )
    .join(" ")
    .toLowerCase();

  if (/\b(bodyweight|body weight|calisthenic|no equipment|none)\b/.test(values)) {
    return false;
  }

  return /\b(machine|dumbbell|db|barbell|goblet|cable|kettlebell|weighted|plate|leg press|bench press)\b/.test(
    values,
  );
}

export function starterPrescribedWeightLbs(
  exercise: JsonRecord | null | undefined,
  profile: JsonRecord | null | undefined,
) {
  const name = String(exercise?.name ?? exercise?.display_name ?? "").toLowerCase();
  const bodyWeight = profileWeightLbs(profile);

  // This is intentionally simple while the app runs direct client-side
  // generation. A future Edge Function should own individualized loading.
  if (name.includes("leg press")) {
    return bodyWeight ? roundToNearestFive(Math.max(40, bodyWeight * 0.25)) : 40;
  }
  if (name.includes("goblet")) return 20;
  if (name.includes("dumbbell") || /\bdb\b/.test(name)) return 10;
  if (name.includes("barbell")) return 45;
  if (
    name.includes("leg curl") ||
    name.includes("leg extension") ||
    name.includes("machine squat")
  ) {
    return 40;
  }
  if (name.includes("machine")) return 20;

  return 10;
}

export function rpeAdjustment(
  actualRpe: number,
  targetMin: number | null,
  targetMax: number | null,
) {
  if (targetMin !== null && actualRpe < targetMin) {
    return { direction: "below" as const, steps: Math.max(1, Math.ceil(targetMin - actualRpe)) };
  }

  if (targetMax !== null && actualRpe > targetMax) {
    return { direction: "above" as const, steps: Math.max(1, Math.ceil(actualRpe - targetMax)) };
  }

  return { direction: "within" as const, steps: 0 };
}

export function variationIdForDirection(
  variationLevels: JsonRecord[],
  direction: "regression" | "base" | "progression",
  fallbackId: string | null,
) {
  return findLookupRow(variationLevels, direction)?.id ?? fallbackId;
}
