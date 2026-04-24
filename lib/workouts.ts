import { supabase } from "@/lib/supabase";
import {
  effectiveExperienceLevel,
  findById,
  findLookupRow,
  isWeightedExercise,
  rowLabel,
  starterPrescribedWeightLbs,
  toNumberOrNull,
  variationIdForDirection,
  rpeAdjustment,
} from "@/lib/workout-helpers";
import type {
  AdjustmentApplied,
  JsonRecord,
  LogWorkoutSetInput,
  WorkoutExerciseDetail,
  WorkoutSessionDetail,
  WorkoutSessionSummary,
  WorkoutSetDetail,
} from "@/lib/workout-types";

function requireUserId(userId: string | null | undefined) {
  if (!userId) throw new Error("You must be signed in to use workouts.");
  return userId;
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return requireUserId(data.session?.user.id);
}

async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as JsonRecord | null;
}

async function getLookupTables() {
  const [
    experienceLevelsResult,
    variationLevelsResult,
    exerciseSlotsResult,
  ] = await Promise.all([
    supabase.from("experience_levels").select("*"),
    supabase.from("exercise_variation_levels").select("*"),
    supabase.from("exercise_slots").select("*").order("sort_order", { ascending: true }),
  ]);

  if (experienceLevelsResult.error) throw experienceLevelsResult.error;
  if (variationLevelsResult.error) throw variationLevelsResult.error;
  if (exerciseSlotsResult.error) throw exerciseSlotsResult.error;

  return {
    experienceLevels: (experienceLevelsResult.data ?? []) as JsonRecord[],
    variationLevels: (variationLevelsResult.data ?? []) as JsonRecord[],
    exerciseSlots: (exerciseSlotsResult.data ?? []) as JsonRecord[],
  };
}

async function getContext(contextId: string) {
  const { data, error } = await supabase
    .from("workout_contexts")
    .select("*")
    .eq("id", contextId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Workout context was not found.");
  return data as JsonRecord;
}

async function getExercisesByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return new Map<string, JsonRecord>();

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .in("id", uniqueIds);

  if (error) throw error;

  return new Map(((data ?? []) as JsonRecord[]).map((row) => [row.id, row]));
}

function normalizeSet(row: JsonRecord): WorkoutSetDetail {
  return {
    id: row.id,
    workoutSessionExerciseId: row.workout_session_exercise_id ?? null,
    sessionId: row.session_id ?? null,
    exerciseId: row.exercise_id ?? null,
    setNumber: toNumberOrNull(row.set_number),
    targetReps: row.target_reps ?? null,
    targetRpeMin: toNumberOrNull(row.target_rpe_min),
    targetRpeMax: toNumberOrNull(row.target_rpe_max),
    prescribedWeight: toNumberOrNull(row.prescribed_weight),
    restSeconds: toNumberOrNull(row.rest_seconds),
    actualReps: toNumberOrNull(row.actual_reps),
    actualWeight: toNumberOrNull(row.actual_weight),
    actualRpe: toNumberOrNull(row.actual_rpe),
    notes: row.notes ?? null,
  };
}

function normalizeExercise(
  row: JsonRecord,
  exercise: JsonRecord | null,
  slot: JsonRecord | null,
  variation: JsonRecord | null,
  sets: WorkoutSetDetail[],
): WorkoutExerciseDetail {
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    exerciseId: row.exercise_id,
    exerciseName: rowLabel(exercise, "Exercise"),
    exerciseSlotId: row.exercise_slot_id,
    slotName: rowLabel(slot, "Slot"),
    workoutContextId: row.workout_context_id,
    variationLevelId: row.exercise_variation_level_id ?? null,
    variationName: rowLabel(variation, "Base"),
    displayOrder: toNumberOrNull(row.display_order) ?? 0,
    status: row.status ?? null,
    prescribedSets: toNumberOrNull(row.prescribed_sets) ?? sets.length,
    prescribedReps: row.prescribed_reps ?? null,
    prescribedWeightLbs: toNumberOrNull(row.prescribed_weight_lbs),
    prescribedRestSeconds: toNumberOrNull(row.prescribed_rest_seconds),
    targetRpeMin: toNumberOrNull(row.target_rpe_min),
    targetRpeMax: toNumberOrNull(row.target_rpe_max),
    actualFinalRpe: toNumberOrNull(row.actual_final_rpe),
    adjustmentApplied: row.adjustment_applied ?? null,
    notes: row.notes ?? null,
    isWeighted: isWeightedExercise(exercise),
    sets,
  };
}

export async function fetchWorkoutSession(
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const { data: sessionRow, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!sessionRow) throw new Error("Workout session was not found.");

  const session = sessionRow as JsonRecord;
  const { variationLevels, exerciseSlots, experienceLevels } =
    await getLookupTables();

  const [contextResult, sessionExercisesResult, setsResult] = await Promise.all([
    session.workout_context_id
      ? supabase
          .from("workout_contexts")
          .select("*")
          .eq("id", session.workout_context_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("workout_session_exercises")
      .select("*")
      .eq("workout_session_id", sessionId)
      .order("display_order", { ascending: true }),
    supabase
      .from("workout_sets")
      .select("*")
      .eq("session_id", sessionId)
      .order("set_number", { ascending: true }),
  ]);

  if (contextResult.error) throw contextResult.error;
  if (sessionExercisesResult.error) throw sessionExercisesResult.error;
  if (setsResult.error) throw setsResult.error;

  const sessionExerciseRows = (sessionExercisesResult.data ?? []) as JsonRecord[];
  const setRows = ((setsResult.data ?? []) as JsonRecord[]).map(normalizeSet);
  const exerciseIds = Array.from(
    new Set([
      ...sessionExerciseRows.map((row) => row.exercise_id).filter(Boolean),
      ...setRows.map((row) => row.exerciseId).filter(Boolean),
    ]),
  ) as string[];
  const exerciseMap = await getExercisesByIds(exerciseIds);

  const setsBySessionExerciseId = new Map<string, WorkoutSetDetail[]>();
  const legacySets: WorkoutSetDetail[] = [];
  setRows.forEach((set) => {
    if (set.workoutSessionExerciseId) {
      const current = setsBySessionExerciseId.get(set.workoutSessionExerciseId) ?? [];
      current.push(set);
      setsBySessionExerciseId.set(set.workoutSessionExerciseId, current);
    } else {
      legacySets.push(set);
    }
  });

  const exercises = sessionExerciseRows
    .map((row) =>
      normalizeExercise(
        row,
        exerciseMap.get(row.exercise_id) ?? null,
        findById(exerciseSlots, row.exercise_slot_id),
        findById(variationLevels, row.exercise_variation_level_id),
        setsBySessionExerciseId.get(row.id) ?? [],
      ),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const experience = findById(experienceLevels, session.experience_level_id);
  const context = (contextResult.data ?? null) as JsonRecord | null;

  return {
    id: session.id,
    userId: session.user_id ?? null,
    workoutContextId: session.workout_context_id ?? null,
    contextName: rowLabel(context, "Workout"),
    status: session.status ?? null,
    startedAt: session.started_at ?? null,
    completedAt: session.completed_at ?? null,
    experienceLevelId: session.experience_level_id ?? null,
    experienceLevelName: experience ? rowLabel(experience) : null,
    notes: session.notes ?? null,
    exercises,
    legacySets,
  };
}

export async function generateWorkoutSession(contextId: string) {
  const userId = await getAuthenticatedUserId();
  const profile = await getProfile(userId);
  await getContext(contextId);
  const { experienceLevels, variationLevels, exerciseSlots } = await getLookupTables();
  const effectiveLevel = effectiveExperienceLevel(profile, experienceLevels);
  if (!effectiveLevel?.id) {
    throw new Error("No experience level rows are available for workout generation.");
  }

  const baseVariation = findLookupRow(variationLevels, "base");
  if (!baseVariation?.id) {
    throw new Error("Base exercise variation level is missing.");
  }

  const [statesResult, recommendationsResult] = await Promise.all([
    supabase
      .from("user_exercise_states")
      .select("*")
      .eq("user_id", userId)
      .eq("workout_context_id", contextId),
    supabase
      .from("exercise_recommendations")
      .select("*")
      .eq("experience_level_id", effectiveLevel.id)
      .eq("workout_context_id", contextId)
      .eq("exercise_variation_level_id", baseVariation.id),
  ]);

  if (statesResult.error) throw statesResult.error;
  if (recommendationsResult.error) throw recommendationsResult.error;

  const states = (statesResult.data ?? []) as JsonRecord[];
  const recommendations = (recommendationsResult.data ?? []) as JsonRecord[];
  const stateBySlot = new Map(states.map((row) => [row.exercise_slot_id, row]));
  const recommendationBySlot = new Map(
    recommendations.map((row) => [row.exercise_slot_id, row]),
  );

  const plannedRows = exerciseSlots
    .map((slot, index) => {
      const state = stateBySlot.get(slot.id);
      const recommendation = recommendationBySlot.get(slot.id);
      if (!state && !recommendation) return null;

      return {
        slot,
        state,
        recommendation,
        displayOrder: toNumberOrNull(slot.sort_order) ?? index + 1,
        exerciseId: state?.current_exercise_id ?? recommendation?.exercise_id,
        variationLevelId:
          state?.current_variation_level_id ??
          recommendation?.exercise_variation_level_id ??
          baseVariation.id,
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row?.exerciseId);

  if (!plannedRows.length) {
    throw new Error("No exercise recommendations were found for this context.");
  }

  const exerciseMap = await getExercisesByIds(plannedRows.map((row) => row.exerciseId));

  const now = new Date().toISOString();
  const { data: insertedSession, error: sessionInsertError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      workout_context_id: contextId,
      started_at: now,
      status: "in_progress",
      completed_at: null,
      experience_level_id: effectiveLevel.id,
      notes: null,
    })
    .select("*")
    .single();

  if (sessionInsertError) throw sessionInsertError;
  const session = insertedSession as JsonRecord;

  const sessionExerciseInserts = plannedRows.map((planned) => {
    const exercise = exerciseMap.get(planned.exerciseId) ?? null;
    const recommendation = planned.recommendation;
    const weighted = isWeightedExercise(exercise);
    const prescribedWeight = weighted
      ? toNumberOrNull(planned.state?.current_prescribed_weight_lbs) ??
        toNumberOrNull(recommendation?.prescribed_weight_lbs) ??
        starterPrescribedWeightLbs(exercise, profile)
      : null;

    return {
      workout_session_id: session.id,
      exercise_id: planned.exerciseId,
      exercise_slot_id: planned.slot.id,
      workout_context_id: contextId,
      exercise_variation_level_id: planned.variationLevelId,
      display_order: planned.displayOrder,
      status: "planned",
      prescribed_sets: toNumberOrNull(recommendation?.target_sets) ?? 1,
      prescribed_reps: recommendation?.target_reps ?? null,
      prescribed_weight_lbs: prescribedWeight,
      prescribed_rest_seconds: toNumberOrNull(recommendation?.rest_seconds),
      target_rpe_min: toNumberOrNull(recommendation?.target_rpe_min),
      target_rpe_max: toNumberOrNull(recommendation?.target_rpe_max),
      actual_final_rpe: null,
      adjustment_applied: null,
      notes: null,
    };
  });

  const { data: insertedSessionExercises, error: exercisesInsertError } =
    await supabase
      .from("workout_session_exercises")
      .insert(sessionExerciseInserts)
      .select("*");

  if (exercisesInsertError) throw exercisesInsertError;

  const setInserts = ((insertedSessionExercises ?? []) as JsonRecord[]).flatMap(
    (sessionExercise) => {
      const setCount = toNumberOrNull(sessionExercise.prescribed_sets) ?? 1;
      return Array.from({ length: Math.max(1, setCount) }, (_, index) => ({
        workout_session_exercise_id: sessionExercise.id,
        session_id: session.id,
        exercise_id: sessionExercise.exercise_id,
        set_number: index + 1,
        target_reps: sessionExercise.prescribed_reps,
        target_rpe_min: sessionExercise.target_rpe_min,
        target_rpe_max: sessionExercise.target_rpe_max,
        prescribed_weight: sessionExercise.prescribed_weight_lbs,
        rest_seconds: sessionExercise.prescribed_rest_seconds,
      }));
    },
  );

  if (setInserts.length) {
    const { error: setsInsertError } = await supabase
      .from("workout_sets")
      .insert(setInserts);
    if (setsInsertError) throw setsInsertError;
  }

  return fetchWorkoutSession(session.id);
}

export async function fetchRecentWorkoutSessions(limit = 50) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const sessions = (data ?? []) as JsonRecord[];
  const contextIds = Array.from(
    new Set(sessions.map((row) => row.workout_context_id).filter(Boolean)),
  ) as string[];
  const experienceIds = Array.from(
    new Set(sessions.map((row) => row.experience_level_id).filter(Boolean)),
  ) as string[];
  const sessionIds = sessions.map((row) => row.id);

  const [contextsResult, experiencesResult, exerciseCountsResult] = await Promise.all([
    contextIds.length
      ? supabase.from("workout_contexts").select("*").in("id", contextIds)
      : Promise.resolve({ data: [], error: null }),
    experienceIds.length
      ? supabase.from("experience_levels").select("*").in("id", experienceIds)
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? supabase
          .from("workout_session_exercises")
          .select("workout_session_id")
          .in("workout_session_id", sessionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (contextsResult.error) throw contextsResult.error;
  if (experiencesResult.error) throw experiencesResult.error;
  if (exerciseCountsResult.error) throw exerciseCountsResult.error;

  const contextMap = new Map(
    ((contextsResult.data ?? []) as JsonRecord[]).map((row) => [row.id, row]),
  );
  const experienceMap = new Map(
    ((experiencesResult.data ?? []) as JsonRecord[]).map((row) => [row.id, row]),
  );
  const countMap = new Map<string, number>();
  ((exerciseCountsResult.data ?? []) as JsonRecord[]).forEach((row) => {
    const sessionId = row.workout_session_id;
    countMap.set(sessionId, (countMap.get(sessionId) ?? 0) + 1);
  });

  const summaries: WorkoutSessionSummary[] = sessions.map((session) => {
    const plannedExerciseCount = countMap.get(session.id) ?? 0;
    const context = contextMap.get(session.workout_context_id);
    const experience = experienceMap.get(session.experience_level_id);

    return {
      id: session.id,
      startedAt: session.started_at ?? null,
      completedAt: session.completed_at ?? null,
      status: session.status ?? null,
      workoutContextId: session.workout_context_id ?? null,
      contextName: rowLabel(context, "Workout session"),
      experienceLevelName: experience ? rowLabel(experience) : null,
      plannedExerciseCount,
      isLegacy: plannedExerciseCount === 0,
    };
  });

  return summaries.sort((a, b) => {
    const aCompleted = a.status === "completed" ? 0 : 1;
    const bCompleted = b.status === "completed" ? 0 : 1;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;
    return (
      new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime()
    );
  });
}

export async function logWorkoutSetPerformance(input: LogWorkoutSetInput) {
  const payload: JsonRecord = {
    actual_reps: input.actualReps ?? null,
    actual_weight: input.actualWeight ?? null,
    actual_rpe: input.actualRpe ?? null,
  };
  if (input.notes !== undefined) payload.notes = input.notes;

  const { error } = await supabase
    .from("workout_sets")
    .update(payload)
    .eq("id", input.setId);

  if (!error) return;

  if (error.message.toLowerCase().includes("actual_rpe")) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.actual_rpe;
    const { error: fallbackError } = await supabase
      .from("workout_sets")
      .update(fallbackPayload)
      .eq("id", input.setId);
    if (fallbackError) throw fallbackError;
    return;
  }

  throw error;
}

async function upsertUserExerciseState(payload: JsonRecord) {
  const { data: existing, error: existingError } = await supabase
    .from("user_exercise_states")
    .select("id")
    .eq("user_id", payload.user_id)
    .eq("exercise_slot_id", payload.exercise_slot_id)
    .eq("workout_context_id", payload.workout_context_id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase
      .from("user_exercise_states")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("user_exercise_states").insert(payload);
  if (error) throw error;
}


export async function submitExerciseFinalRpe(
  sessionExerciseId: string,
  actualRpe: number,
) {
  const { data: sessionExerciseRow, error: exerciseError } = await supabase
    .from("workout_session_exercises")
    .select("*")
    .eq("id", sessionExerciseId)
    .maybeSingle();

  if (exerciseError) throw exerciseError;
  if (!sessionExerciseRow) throw new Error("Session exercise was not found.");

  const sessionExercise = sessionExerciseRow as JsonRecord;
  const { data: sessionRow, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionExercise.workout_session_id)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!sessionRow) throw new Error("Workout session was not found.");

  const session = sessionRow as JsonRecord;
  const userId = requireUserId(session.user_id);
  const profile = await getProfile(userId);
  const { variationLevels } = await getLookupTables();
  const exerciseMap = await getExercisesByIds([sessionExercise.exercise_id]);
  const exercise = exerciseMap.get(sessionExercise.exercise_id) ?? null;
  const weighted = isWeightedExercise(exercise);
  const targetMin = toNumberOrNull(sessionExercise.target_rpe_min);
  const targetMax = toNumberOrNull(sessionExercise.target_rpe_max);
  const adjustment = rpeAdjustment(actualRpe, targetMin, targetMax);

  let adjustmentApplied: AdjustmentApplied = "none";
  let nextExerciseId = sessionExercise.exercise_id;
  let nextVariationLevelId = sessionExercise.exercise_variation_level_id ?? null;
  let nextPrescribedWeight = toNumberOrNull(sessionExercise.prescribed_weight_lbs);

  if (adjustment.direction !== "within") {
    if (weighted) {
      const currentWeight =
        nextPrescribedWeight ?? starterPrescribedWeightLbs(exercise, profile);
      const delta = adjustment.steps * 5;
      if (adjustment.direction === "above") {
        adjustmentApplied = "decrease_weight";
        nextPrescribedWeight = Math.max(0, currentWeight - delta);
      } else {
        adjustmentApplied = "increase_weight";
        nextPrescribedWeight = currentWeight + delta;
      }
    } else {
      const { data: maps, error: mapsError } = await supabase
        .from("exercise_progression_maps")
        .select("*");

      if (mapsError) throw mapsError;

      const map = ((maps ?? []) as JsonRecord[]).find((row) => {
        const currentId =
          row.exercise_id ??
          row.current_exercise_id ??
          row.base_exercise_id ??
          row.from_exercise_id;
        return currentId === sessionExercise.exercise_id;
      });

      if (adjustment.direction === "above" && map?.easier_exercise_id) {
        adjustmentApplied = "regress_exercise";
        nextExerciseId = map.easier_exercise_id;
        nextVariationLevelId = variationIdForDirection(
          variationLevels,
          "regression",
          nextVariationLevelId,
        );
      } else if (adjustment.direction === "below" && map?.harder_exercise_id) {
        adjustmentApplied = "progress_exercise";
        nextExerciseId = map.harder_exercise_id;
        nextVariationLevelId = variationIdForDirection(
          variationLevels,
          "progression",
          nextVariationLevelId,
        );
      }
    }
  }

  const now = new Date().toISOString();

  await upsertUserExerciseState({
    user_id: userId,
    exercise_slot_id: sessionExercise.exercise_slot_id,
    workout_context_id: sessionExercise.workout_context_id,
    current_exercise_id: nextExerciseId,
    current_variation_level_id: nextVariationLevelId,
    current_prescribed_weight_lbs: weighted ? nextPrescribedWeight : null,
    last_actual_rpe: actualRpe,
    last_session_exercise_id: sessionExerciseId,
    updated_at: now,
  });

  const { error: updateError } = await supabase
    .from("workout_session_exercises")
    .update({
      actual_final_rpe: actualRpe,
      adjustment_applied: adjustmentApplied,
      status: "completed",
    })
    .eq("id", sessionExerciseId);

  if (updateError) throw updateError;

  return fetchWorkoutSession(sessionExercise.workout_session_id);
}

export async function completeWorkoutSession(sessionId: string) {
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw error;
  return fetchWorkoutSession(sessionId);
}
