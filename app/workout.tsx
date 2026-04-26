import { Colors, labelOnTint } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  completeWorkoutSession,
  fetchWorkoutSession,
  generateWorkoutSession,
  logWorkoutSetPerformance,
  submitExerciseFinalRpe,
} from "@/lib/workouts";
import type {
  WorkoutExerciseDetail,
  WorkoutSessionDetail,
  WorkoutSetDetail,
} from "@/lib/workout-types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type SetDraft = {
  reps: string;
  weight: string;
  rpe: string;
};

function paramToString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(value: string | null | undefined) {
  if (!value?.trim()) return "Unknown";
  return value.replace(/_/g, " ");
}

function formatWeight(value: number | null) {
  return value === null ? "Bodyweight" : `${value} lb`;
}

function numberDraft(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rpeRange(exercise: WorkoutExerciseDetail) {
  if (exercise.targetRpeMin === null && exercise.targetRpeMax === null) {
    return "Not set";
  }

  if (exercise.targetRpeMin === exercise.targetRpeMax) {
    return String(exercise.targetRpeMin);
  }

  return `${exercise.targetRpeMin ?? "?"}-${exercise.targetRpeMax ?? "?"}`;
}

export default function WorkoutScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = (colorScheme ?? "light") === "dark";
  const palette = useMemo(
    () => ({
      background: theme.background,
      card: isDark ? "#1C1F23" : "#F8FAFC",
      pressed: isDark ? "#252A33" : "#EEF2F7",
      border: isDark ? "#31363F" : "#E5E7EB",
      text: theme.text,
      muted: theme.icon,
      accent: theme.tint,
      accentText: labelOnTint(isDark),
      inputBg: isDark ? "#151718" : "#FFFFFF",
      danger: "#EF4444",
      success: "#16A34A",
    }),
    [theme, isDark],
  );

  const { contextId: contextParam, sessionId: sessionParam } =
    useLocalSearchParams<{
      contextId?: string | string[];
      sessionId?: string | string[];
    }>();
  const contextId = paramToString(contextParam);
  const routeSessionId = paramToString(sessionParam);
  const generationGuardRef = useRef<string | null>(null);

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [finalRpeDrafts, setFinalRpeDrafts] = useState<Record<string, string>>({});
  const [savingSetId, setSavingSetId] = useState<string | null>(null);
  const [savingRpeId, setSavingRpeId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const loadWorkout = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!routeSessionId && !contextId) {
        setError("Missing workout context.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      if (mode === "initial") setLoading(true);

      try {
        const loaded = routeSessionId
          ? await fetchWorkoutSession(routeSessionId)
          : await generateWorkoutSession(contextId!);

        setSession(loaded);
      } catch (err: any) {
        if (!routeSessionId) generationGuardRef.current = null;
        setError(err?.message ?? "Could not load workout.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [contextId, routeSessionId],
  );

  useEffect(() => {
    if (routeSessionId) {
      void loadWorkout("initial");
      return;
    }

    if (!contextId) {
      setError("Missing workout context.");
      setLoading(false);
      return;
    }

    if (generationGuardRef.current === contextId) return;
    generationGuardRef.current = contextId;
    void loadWorkout("initial");
  }, [contextId, loadWorkout, routeSessionId]);

  useEffect(() => {
    if (!session) return;

    const nextSetDrafts: Record<string, SetDraft> = {};
    const nextRpeDrafts: Record<string, string> = {};

    session.exercises.forEach((exercise) => {
      nextRpeDrafts[exercise.id] = numberDraft(exercise.actualFinalRpe);
      exercise.sets.forEach((set) => {
        nextSetDrafts[set.id] = {
          reps: numberDraft(set.actualReps),
          weight: numberDraft(set.actualWeight ?? set.prescribedWeight),
          rpe: numberDraft(set.actualRpe),
        };
      });
    });

    setSetDrafts(nextSetDrafts);
    setFinalRpeDrafts(nextRpeDrafts);
  }, [session]);

  const refreshSession = useCallback(async () => {
    if (!session?.id) return;
    setRefreshing(true);
    try {
      const loaded = await fetchWorkoutSession(session.id);
      setSession(loaded);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Could not refresh workout.");
    } finally {
      setRefreshing(false);
    }
  }, [session?.id]);

  const saveSet = async (set: WorkoutSetDetail) => {
    const draft = setDrafts[set.id];
    if (!draft) return;

    const actualReps = parseOptionalNumber(draft.reps);
    const actualWeight = parseOptionalNumber(draft.weight);
    const actualRpe = parseOptionalNumber(draft.rpe);

    setSavingSetId(set.id);
    try {
      await logWorkoutSetPerformance({
        setId: set.id,
        actualReps,
        actualWeight,
        actualRpe,
      });
      await refreshSession();
    } catch (err: any) {
      Alert.alert("Could not save set", err?.message ?? "Please try again.");
    } finally {
      setSavingSetId(null);
    }
  };

  const submitFinalRpe = async (exercise: WorkoutExerciseDetail) => {
    const actualRpe = parseOptionalNumber(finalRpeDrafts[exercise.id] ?? "");
    if (actualRpe === null) {
      Alert.alert("Missing RPE", "Enter a final RPE before applying progression.");
      return;
    }

    setSavingRpeId(exercise.id);
    try {
      const updated = await submitExerciseFinalRpe(exercise.id, actualRpe);
      setSession(updated);
    } catch (err: any) {
      Alert.alert("Could not apply RPE", err?.message ?? "Please try again.");
    } finally {
      setSavingRpeId(null);
    }
  };

  const completeSession = async () => {
    if (!session) return;

    setCompleting(true);
    try {
      const updated = await completeWorkoutSession(session.id);
      setSession(updated);
    } catch (err: any) {
      Alert.alert("Could not complete workout", err?.message ?? "Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[styles.loadingText, { color: palette.muted }]}>
          Building your workout...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "automatic" : undefined
      }
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshSession}
          tintColor={palette.accent}
        />
      }
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: pressed ? palette.pressed : palette.card,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={{ color: palette.text, fontWeight: "700" }}>Back</Text>
        </Pressable>

        {session ? (
          <View style={[styles.statusPill, { backgroundColor: palette.pressed }]}>
            <Text style={[styles.statusText, { color: palette.text }]}>
              {formatStatus(session.status)}
            </Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            Could not load workout
          </Text>
          <Text style={[styles.muted, { color: palette.muted }]}>{error}</Text>
          <Pressable
            onPress={() => void loadWorkout("initial")}
            style={[styles.primaryButton, { backgroundColor: palette.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : null}

      {session ? (
        <>
          <View style={styles.titleBlock}>
            <Text style={[styles.eyebrow, { color: palette.muted }]}>
              {formatDateTime(session.startedAt)}
            </Text>
            <Text style={[styles.title, { color: palette.text }]}>
              {session.contextName}
            </Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              {session.experienceLevelName
                ? `${session.experienceLevelName} plan`
                : "Workout plan"}
            </Text>
          </View>

          {session.exercises.length === 0 ? (
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                Legacy workout
              </Text>
              <Text style={[styles.muted, { color: palette.muted }]}>
                This session was created before planned exercises were added.
                New workouts started from Home will use the generated exercise
                flow.
              </Text>
            </View>
          ) : (
            session.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                palette={palette}
                drafts={setDrafts}
                finalRpeDraft={finalRpeDrafts[exercise.id] ?? ""}
                savingSetId={savingSetId}
                savingRpeId={savingRpeId}
                onChangeSetDraft={(setId, draft) =>
                  setSetDrafts((current) => ({
                    ...current,
                    [setId]: { ...current[setId], ...draft },
                  }))
                }
                onChangeFinalRpe={(value) =>
                  setFinalRpeDrafts((current) => ({
                    ...current,
                    [exercise.id]: value,
                  }))
                }
                onSaveSet={saveSet}
                onSubmitFinalRpe={submitFinalRpe}
              />
            ))
          )}

          {session.legacySets.length > 0 ? (
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                Legacy sets
              </Text>
              {session.legacySets.map((set) => (
                <Text key={set.id} style={[styles.muted, { color: palette.muted }]}>
                  Set {set.setNumber ?? "-"}: {set.actualReps ?? "-"} reps,
                  {" "}
                  {set.actualWeight ?? "-"} lb
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            disabled={session.status === "completed" || completing}
            onPress={completeSession}
            style={({ pressed }) => [
              styles.completeButton,
              {
                backgroundColor:
                  session.status === "completed"
                    ? palette.pressed
                    : pressed
                      ? palette.success
                      : palette.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                {
                  color:
                    session.status === "completed"
                      ? palette.muted
                      : palette.accentText,
                },
              ]}
            >
              {session.status === "completed"
                ? "Workout Complete"
                : completing
                  ? "Completing..."
                  : "Mark Workout Complete"}
            </Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

function ExerciseCard({
  exercise,
  palette,
  drafts,
  finalRpeDraft,
  savingSetId,
  savingRpeId,
  onChangeSetDraft,
  onChangeFinalRpe,
  onSaveSet,
  onSubmitFinalRpe,
}: {
  exercise: WorkoutExerciseDetail;
  palette: {
    card: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    inputBg: string;
    pressed: string;
  };
  drafts: Record<string, SetDraft>;
  finalRpeDraft: string;
  savingSetId: string | null;
  savingRpeId: string | null;
  onChangeSetDraft: (setId: string, draft: Partial<SetDraft>) => void;
  onChangeFinalRpe: (value: string) => void;
  onSaveSet: (set: WorkoutSetDetail) => void;
  onSubmitFinalRpe: (exercise: WorkoutExerciseDetail) => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            {exercise.displayOrder}. {exercise.exerciseName}
          </Text>
          <Text style={[styles.muted, { color: palette.muted }]}>
            {exercise.slotName} · {exercise.variationName}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: palette.pressed }]}>
          <Text style={[styles.statusText, { color: palette.text }]}>
            {formatStatus(exercise.status)}
          </Text>
        </View>
      </View>

      <View style={styles.prescriptionGrid}>
        <InfoCell
          label="Sets"
          value={String(exercise.prescribedSets)}
          palette={palette}
        />
        <InfoCell
          label="Reps"
          value={String(exercise.prescribedReps ?? "-")}
          palette={palette}
        />
        <InfoCell
          label="Load"
          value={formatWeight(exercise.prescribedWeightLbs)}
          palette={palette}
        />
        <InfoCell
          label="Rest"
          value={
            exercise.prescribedRestSeconds === null
              ? "-"
              : `${exercise.prescribedRestSeconds}s`
          }
          palette={palette}
        />
        <InfoCell label="RPE" value={rpeRange(exercise)} palette={palette} />
      </View>

      <View style={styles.setList}>
        {exercise.sets.map((set) => {
          const draft = drafts[set.id] ?? { reps: "", weight: "", rpe: "" };
          const showWeightInput = exercise.isWeighted || set.prescribedWeight !== null;

          return (
            <View key={set.id} style={[styles.setRow, { borderColor: palette.border }]}>
              <Text style={[styles.setTitle, { color: palette.text }]}>
                Set {set.setNumber ?? "-"}
              </Text>

              <TextInput
                value={draft.reps}
                onChangeText={(value) => onChangeSetDraft(set.id, { reps: value })}
                keyboardType="number-pad"
                placeholder="Reps"
                placeholderTextColor={palette.muted}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                  },
                ]}
              />

              {showWeightInput ? (
                <TextInput
                  value={draft.weight}
                  onChangeText={(value) =>
                    onChangeSetDraft(set.id, { weight: value })
                  }
                  keyboardType="decimal-pad"
                  placeholder="Lb"
                  placeholderTextColor={palette.muted}
                  style={[
                    styles.input,
                    {
                      color: palette.text,
                      borderColor: palette.border,
                      backgroundColor: palette.inputBg,
                    },
                  ]}
                />
              ) : (
                <View style={[styles.bodyweightPill, { backgroundColor: palette.pressed }]}>
                  <Text style={[styles.statusText, { color: palette.text }]}>
                    Bodyweight
                  </Text>
                </View>
              )}

              <TextInput
                value={draft.rpe}
                onChangeText={(value) => onChangeSetDraft(set.id, { rpe: value })}
                keyboardType="decimal-pad"
                placeholder="RPE"
                placeholderTextColor={palette.muted}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    borderColor: palette.border,
                    backgroundColor: palette.inputBg,
                  },
                ]}
              />

              <Pressable
                onPress={() => onSaveSet(set)}
                disabled={savingSetId === set.id}
                style={[styles.smallButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.smallButtonText, { color: palette.accentText }]}>
                  {savingSetId === set.id ? "Saving" : "Save"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.finalRpeBox, { borderColor: palette.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.finalRpeTitle, { color: palette.text }]}>
            Final exercise RPE
          </Text>
          <Text style={[styles.muted, { color: palette.muted }]}>
            Updates the next workout from this slot.
          </Text>
          {exercise.adjustmentApplied ? (
            <Text style={[styles.adjustment, { color: palette.text }]}>
              Adjustment: {formatStatus(exercise.adjustmentApplied)}
            </Text>
          ) : null}
        </View>
        <TextInput
          value={finalRpeDraft}
          onChangeText={onChangeFinalRpe}
          keyboardType="decimal-pad"
          placeholder="RPE"
          placeholderTextColor={palette.muted}
          style={[
            styles.finalRpeInput,
            {
              color: palette.text,
              borderColor: palette.border,
              backgroundColor: palette.inputBg,
            },
          ]}
        />
        <Pressable
          onPress={() => onSubmitFinalRpe(exercise)}
          disabled={savingRpeId === exercise.id}
          style={[styles.applyButton, { backgroundColor: palette.accent }]}
        >
          <Text style={[styles.smallButtonText, { color: palette.accentText }]}>
            {savingRpeId === exercise.id ? "Applying" : "Apply"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoCell({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: { text: string; muted: string; pressed: string };
}) {
  return (
    <View style={[styles.infoCell, { backgroundColor: palette.pressed }]}>
      <Text style={[styles.infoLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 14 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  titleBlock: { gap: 4 },
  eyebrow: { fontSize: 13, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 15 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  muted: { fontSize: 14, lineHeight: 20 },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "800" },
  exerciseHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  prescriptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCell: {
    minWidth: 86,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  setList: { gap: 10 },
  setRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  setTitle: { width: 52, fontWeight: "800" },
  input: {
    minWidth: 74,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 15,
  },
  bodyweightPill: {
    minWidth: 98,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  smallButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  smallButtonText: { fontSize: 13, fontWeight: "800" },
  finalRpeBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  finalRpeTitle: { fontSize: 15, fontWeight: "800" },
  adjustment: { marginTop: 4, fontSize: 13, fontWeight: "700" },
  finalRpeInput: {
    width: 78,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 15,
  },
  applyButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  completeButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
});
